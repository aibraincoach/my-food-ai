#!/usr/bin/env node
/**
 * PPLX review via Firefox WebDriver BiDi. Ported from naval-association-calgary on 2026-10-14 with a Vercel status gate,
 * a memory guard, a tab cap (PPLX_MAX_TABS, default 29) and PR receipt comments.
 * Single: PPLX_BIDI_WS=ws://127.0.0.1:9223/session node tools/pplx-review.mjs <GitHub PR URL> <head sha> <capture file>
 * Batch:  PPLX_BIDI_WS=ws://127.0.0.1:9223/session node tools/pplx-review.mjs --tabs <N> <PR URL>… --out <dir outside the repo>
 * Prerequisite: Firefox headless listening on PPLX_BIDI_WS with signed-in Perplexity profile.
 * Exit 0: success. Exit 2: timeout or error. Exit 3: DEVIATION (Searching the web). Exit 4: the request did not carry gemini38flash. Exit 5: the model could not be selected. Exit 6: head has no successful Vercel status. Exit 7: memory guard refused. Exit 8: the PR already carries a fresh "Review in progress" claim or a receipt for this head (set PPLX_FORCE=1 to override).
 * On every exit (success, error, timeout) it closes its tab(s) and ends the BiDi session (session.end), so the next run
 * can open a new session on the same Firefox. After the capture is written a 10-second hard-exit timer guards the
 * close, so a hung browsingContext.close or session.end cannot hold the process.
 * One deadline: 120 seconds from the moment each tab opens (RT, 2026-10-11: no PPLX review lasts more than 2 minutes).
 * The ask-box wait and the answer polling both use the time left; "Elapsed since Enter" is a diagnostic.
 * Batch mode serializes typing and Enter under a foreground lock so background tabs do not drop keystrokes.
 */
import { execFileSync } from "node:child_process";
import { fetchGithubCommitStatus } from "../scripts/github-checks.mjs";
import { assertMemory } from "./mem-guard.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";

const LIMIT_MS = 120_000;
const WS_URL = process.env.PPLX_BIDI_WS || "ws://127.0.0.1:9222/session";
const CLOSE_TIMEOUT_MS = 5_000;
const HARD_EXIT_MS = 10_000;
const MAX_TABS = Number.parseInt(process.env.PPLX_MAX_TABS || "29", 10);
const CLAIM_FRESH_MS = 30 * 60_000;

const USAGE = `Usage:
  node tools/pplx-review.mjs <PR_URL> <head_sha> <capture_out>
  node tools/pplx-review.mjs --tabs <N> <PR URL>… --out <dir>`;

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    return { mode: "help" };
  }
  if (args[0] !== "--tabs") {
    const [prUrl, headAt, out] = args;
    if (prUrl && headAt && out) return { mode: "single", prUrl, headAt, out };
    return { mode: "help" };
  }
  const tabs = Number.parseInt(args[1], 10);
  if (!Number.isFinite(tabs) || tabs < 1) return { mode: "help" };
  if (tabs > MAX_TABS) {
    console.error(`--tabs ${tabs} exceeds PPLX_MAX_TABS=${MAX_TABS}; split the batch`);
    process.exit(2);
  }
  const urls = [];
  let i = 2;
  while (i < args.length && args[i] !== "--out") {
    urls.push(args[i]);
    i += 1;
  }
  const outDir = args[i + 1];
  if (args[i] !== "--out" || !outDir || urls.length === 0) return { mode: "help" };
  if (urls.length !== tabs) {
    console.error(`--tabs ${tabs} requires exactly ${tabs} PR URL(s), got ${urls.length}`);
    process.exit(2);
  }
  return { mode: "batch", tabs, urls, outDir };
}

function parsePrUrl(url) {
  const m = String(url).match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: m[3] };
}

function prNumberFromUrl(url) {
  return parsePrUrl(url)?.number ?? null;
}

function captureBasename(prUrl, headAt) {
  return `mfa-pplx-pr${prNumberFromUrl(prUrl)}-${String(headAt).slice(0, 7)}`;
}

function headShaForUrl(prUrl) {
  if (!parsePrUrl(prUrl)) throw new Error(`not a GitHub PR URL: ${prUrl}`);
  return execFileSync("gh", ["pr", "view", prUrl, "--json", "headRefOid", "-q", ".headRefOid"], {
    encoding: "utf8",
    timeout: 15_000,
  }).trim();
}

const VERCEL_CONTEXT = "Vercel";

function assessVercelStatus(status) {
  const vercel = (status?.statuses ?? []).filter((s) => s.context === VERCEL_CONTEXT);
  if (!vercel.length) return { pass: false, reason: "no Vercel status on head SHA" };
  for (const s of vercel) {
    if (s.state !== "success") return { pass: false, reason: `${s.context} is ${s.state}` };
  }
  return { pass: true };
}

class ReviewPreflightError extends Error {
  constructor(message, exitCode) {
    super(message);
    this.exitCode = exitCode;
  }
}

/** Reject undeployed or moved heads without bypassing the caller's browser cleanup. */
function requireVercelSuccess(prUrl, expectedSha) {
  const parsed = parsePrUrl(prUrl);
  if (!parsed) throw new ReviewPreflightError(`not a GitHub PR URL: ${prUrl}`, 2);
  const headNow = headShaForUrl(prUrl);
  const sha = (expectedSha ?? headNow).trim().toLowerCase();
  if (headNow.toLowerCase() !== sha) {
    throw new ReviewPreflightError("head moved since it was read; re-run on the current head", 6);
  }
  let assessment;
  try {
    assessment = assessVercelStatus(fetchGithubCommitStatus(`${parsed.owner}/${parsed.repo}`, headNow));
  } catch (e) {
    throw new ReviewPreflightError(`gh status failed: ${e.message ?? e}`, 2);
  }
  if (!assessment.pass) {
    throw new ReviewPreflightError(`head not deployed (${assessment.reason}); review when Vercel is green`, 6);
  }
}

function ghJson(args) {
  const out = execFileSync("gh", args, { encoding: "utf8", timeout: 20_000, maxBuffer: 5 * 1024 * 1024 }).trim();
  return out ? JSON.parse(out) : [];
}

/** Cross-machine lock: refuse a PR that already has a fresh claim or a receipt for this head, then post a claim. */
function claimReview(prUrl, headAt) {
  const parsed = parsePrUrl(prUrl);
  const force = process.env.PPLX_FORCE === "1";
  const pages = ghJson(["api", `repos/${parsed.owner}/${parsed.repo}/issues/${parsed.number}/comments`, "--paginate", "--slurp"]);
  const comments = Array.isArray(pages) ? pages.flat() : [];
  const now = Date.now();
  for (const c of comments) {
    const first = String(c.body ?? "").split("\n")[0];
    if (first.startsWith("Review in progress: PPLX") && now - Date.parse(c.created_at) < CLAIM_FRESH_MS && !force) {
      throw new ReviewPreflightError(`already claimed: ${first} (${c.created_at})`, 8);
    }
    if (/^Reviewer: .* version reviewed: /.test(first) && first.includes(headAt) && !force) {
      throw new ReviewPreflightError(`already reviewed on this head: ${first}`, 8);
    }
  }
  const claim = `Review in progress: PPLX ${hostname()} ${new Date().toISOString()} head ${headAt}`;
  execFileSync("gh", ["pr", "comment", prUrl, "--body", claim], { encoding: "utf8", timeout: 20_000 });
}

/** Post the capture as the PR receipt. The first line is the signature the review index reads. */
function postReceipt(tab, header, text) {
  const headNow = headShaForUrl(tab.prUrl);
  const modelProof = (header.match(/Model proof: .*/) || ["Model proof: MISSING"])[0];
  const body = [
    `Reviewer: Gemini 3.8 Flash via Perplexity (PPLX); version reviewed: ${tab.headAt}`,
    `Head reviewed: ${tab.headAt}`,
    `Head after answer: ${headNow}`,
    modelProof,
    "",
    header,
    "",
    text,
  ].join("\n");
  const file = join(tmpdir(), `mfa-pplx-receipt-${process.pid}-${prNumberFromUrl(tab.prUrl)}.md`);
  writeFileSync(file, body);
  execFileSync("gh", ["pr", "comment", tab.prUrl, "--body-file", file], { encoding: "utf8", timeout: 20_000 });
}

const parsed = parseArgs(process.argv);
if (parsed.mode === "help") {
  console.error(USAGE);
  const isHelpFlag = process.argv.includes("--help") || process.argv.includes("-h");
  process.exit(isHelpFlag ? 0 : 2);
}

let id = 0;
const pending = new Map();
let ws;
let sessionOpen = false;
const openTabContexts = new Set();

function send(method, params = {}, timeoutMs = 120_000) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(msgId, { resolve, reject });
    setTimeout(() => {
      if (pending.has(msgId)) {
        pending.delete(msgId);
        reject(new Error(`timeout ${method}`));
      }
    }, timeoutMs);
  });
}

function onMessage(raw) {
  const msg = JSON.parse(raw.toString());
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.type === "error") reject(new Error(JSON.stringify(msg)));
    else resolve(msg.result);
  }
}

async function evalScript(context, expression) {
  const r = await send("script.callFunction", {
    functionDeclaration: `function() { return (${expression}); }`,
    target: { context },
    awaitPromise: true,
    arguments: [],
  });
  return r?.result?.value ?? r?.value;
}

async function pointerClick(context, elementExpression) {
  const raw = await evalScript(
    context,
    `(function(){const e=(${elementExpression});if(!e)return '';const r=e.getBoundingClientRect();return JSON.stringify({x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)})})()`,
  );
  if (!raw) return false;
  const p = JSON.parse(raw);
  await send("input.performActions", {
    context,
    actions: [
      {
        type: "pointer",
        id: "mouse1",
        parameters: { pointerType: "mouse" },
        actions: [
          { type: "pointerMove", x: p.x, y: p.y },
          { type: "pointerDown", button: 0 },
          { type: "pointerUp", button: 0 },
        ],
      },
    ],
  });
  return true;
}

async function closeTabContext(context) {
  if (!context || !ws || ws.readyState !== 1) return;
  openTabContexts.delete(context);
  try {
    await send("browsingContext.close", { context }, CLOSE_TIMEOUT_MS);
  } catch {
    /* ignore */
  }
}

async function endSession() {
  if (!sessionOpen || !ws || ws.readyState !== 1) return;
  sessionOpen = false;
  try {
    await send("session.end", {}, CLOSE_TIMEOUT_MS);
  } catch {
    /* ignore */
  }
}

async function shutdownAll(code) {
  const hardExit = setTimeout(() => {
    console.error(`hard exit after ${HARD_EXIT_MS / 1000}s: tab close or session end hung`);
    process.exit(code);
  }, HARD_EXIT_MS);
  for (const context of [...openTabContexts]) {
    await closeTabContext(context);
  }
  await endSession();
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  clearTimeout(hardExit);
  process.exit(code);
}

function writeCapture(outPath, header, body) {
  writeFileSync(outPath, `${header}\n\n${body}`);
}

function makeTabState({ context, prUrl, headAt, outPath }) {
  const prompt = `code review ${prUrl}`;
  const tab = {
    context,
    tabOpenedAt: Date.now(),
    prUrl,
    headAt,
    outPath,
    prompt,
    enterAt: 0,
    timeLeft() {
      return LIMIT_MS - (Date.now() - this.tabOpenedAt);
    },
    sinceTabOpen() {
      return ((Date.now() - this.tabOpenedAt) / 1000).toFixed(1);
    },
  };
  return tab;
}

function submissionExpired(tab) {
  if (tab.timeLeft() > 0) return false;
  recordFailure(tab, {
    code: 2,
    message: `PPLX timeout before submission: ${tab.sinceTabOpen()}s since tab open`,
    header: `Head at submission: ${tab.headAt}\nElapsed since tab open: ${tab.sinceTabOpen()}s\n`,
    text: "",
  });
  tab.resultCode = 2;
  return true;
}

async function waitAskInput(tab) {
  let askReady = false;
  while (!askReady && tab.timeLeft() > 0) {
    await new Promise((r) => setTimeout(r, 2000));
    askReady = await evalScript(tab.context, `!!document.querySelector('#ask-input')`);
  }
  return askReady;
}

async function ensureModel(tab) {
  const incLabel = await evalScript(
    tab.context,
    `(document.querySelector('[aria-label*="ncognito"]')||{}).getAttribute?.('aria-label')||''`,
  );
  if (String(incLabel).startsWith("Use")) {
    await evalScript(tab.context, `document.querySelector('[aria-label*="ncognito"]').click()`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  const WANT = "Gemini 3.8 Flash";
  const MODEL_BUTTON = `(document.querySelector('button[aria-label="Model"]') || [...document.querySelectorAll('button')].find((b) => /^(Gemini|GPT|Claude|Kimi|GLM|Grok|Nemotron|Best)/.test(b.getAttribute('aria-label') || '')))`;
  const modelLabel = () =>
    evalScript(tab.context, `((${MODEL_BUTTON}) || { getAttribute: () => '' }).getAttribute('aria-label')`);
  if ((await modelLabel()) !== WANT) {
    const opened = await pointerClick(tab.context, MODEL_BUTTON);
    await new Promise((r) => setTimeout(r, 1500));
    const itemByRole = `[...document.querySelectorAll('[role="menuitemradio"]')].find((e) => (e.innerText || '').trim().split('\\n')[0] === ${JSON.stringify(WANT)})`;
    const itemAny = `[...document.querySelectorAll('div,button,li,span')].filter((e) => (e.innerText || '').trim().split('\\n')[0] === ${JSON.stringify(WANT)} && e.getBoundingClientRect().width > 0).pop()`;
    const picked =
      opened && ((await pointerClick(tab.context, itemByRole)) || (await pointerClick(tab.context, itemAny)));
    await new Promise((r) => setTimeout(r, 1500));
    if (!picked || (await modelLabel()) !== WANT) {
      return { ok: false, code: 5, message: "MODEL NOT SELECTED" };
    }
  }
  return { ok: true };
}

async function installFetchHook(tab) {
  await evalScript(
    tab.context,
    `(function(){
      window.__asks = window.__asks || [];
      const orig = window.fetch;
      if (!window.__fetchWrapped) {
        window.__fetchWrapped = true;
        window.fetch = function(...args) {
          const p = orig.apply(this, args);
          try {
            const u = String(args[0]);
            if (u.includes('perplexity_ask') && args[1]?.body) window.__asks.push(String(args[1].body));
          } catch(e) {}
          return p;
        };
      }
      return true;
    })()`,
  );
}

async function typePrompt(tab) {
  await evalScript(
    tab.context,
    `(function(){
      const el = document.querySelector('#ask-input');
      el.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, ${JSON.stringify(tab.prompt)});
      return true;
    })()`,
  );
  const boxText = await evalScript(
    tab.context,
    `(document.querySelector('#ask-input').innerText || document.querySelector('#ask-input').textContent || '').trim()`,
  );
  if (boxText !== tab.prompt) {
    return { ok: false, code: 2, message: `box mismatch: ${JSON.stringify(boxText)}` };
  }
  return { ok: true };
}

async function pressEnter(tab) {
  if (submissionExpired(tab)) return false;
  await send("browsingContext.activate", { context: tab.context });
  // Activation is asynchronous: recheck immediately before dispatching the Enter action.
  if (submissionExpired(tab)) return false;
  tab.enterAt = Date.now();
  await send("input.performActions", {
    context: tab.context,
    actions: [
      {
        type: "key",
        id: "k1",
        actions: [
          { type: "keyDown", value: "\uE007" },
          { type: "keyUp", value: "\uE007" },
        ],
      },
    ],
  });
  tab.submitted = true;
  return true;
}

async function pollAnswer(tab) {
  let text = "";
  let stable = 0;
  let lastLen = 0;
  let timedOut = false;
  while (true) {
    if (tab.timeLeft() <= 0) {
      timedOut = true;
      break;
    }
    await new Promise((r) => setTimeout(r, Math.max(500, Math.min(4000, tab.timeLeft()))));
    text = await evalScript(tab.context, `(document.querySelector('main')||{}).innerText||''`);
    if (text.includes("Searching the web")) {
      const elapsed = ((Date.now() - tab.enterAt) / 1000).toFixed(1);
      const header = `Head at submission: ${tab.headAt}\nModel proof: model_preference = MISSING\nElapsed since Enter: ${elapsed}s\nElapsed since tab open: ${tab.sinceTabOpen()}s\nPrompt submitted: ${tab.prompt}`;
      return { ok: false, code: 3, message: "DEVIATION: Searching the web", header, text };
    }
    const len = text.length;
    const researched = text.includes("Researched") || text.includes("Reviewed");
    if (len >= 400 && researched && len === lastLen) stable++;
    else stable = 0;
    lastLen = len;
    if (stable >= 4) break;
  }

  const elapsedSinceEnter = ((Date.now() - tab.enterAt) / 1000).toFixed(1);
  const asks = await evalScript(tab.context, `JSON.stringify(window.__asks||[])`);
  let modelPref = "";
  try {
    for (const body of JSON.parse(asks || "[]")) {
      const m = body.match(/"model_preference":"([^"]+)"/);
      if (m) modelPref = m[1];
    }
  } catch {
    /* ignore */
  }

  const header = `Head at submission: ${tab.headAt}\nModel proof: model_preference = ${modelPref || "MISSING"}\nElapsed since Enter: ${elapsedSinceEnter}s\nElapsed since tab open: ${tab.sinceTabOpen()}s\nPrompt submitted: ${tab.prompt}`;

  if (timedOut) {
    return {
      ok: false,
      code: 2,
      message: `PPLX timeout: ${tab.sinceTabOpen()}s since tab open (limit ${LIMIT_MS / 1000}s), ${elapsedSinceEnter}s since Enter`,
      header,
      text,
    };
  }
  if (modelPref !== "gemini38flash") {
    return { ok: false, code: 4, message: "WRONG MODEL", header, text };
  }
  return { ok: true, header, text };
}

function recordFailure(tab, result) {
  const header = result.header || `Head at submission: ${tab.headAt}\n`;
  writeCapture(tab.outPath, header, result.text || result.message || "");
  console.error(`${tab.prUrl}: ${result.message}`);
}

async function connectBiDi() {
  ws = new WebSocket(WS_URL);
  await new Promise((res, rej) => {
    ws.addEventListener("open", () => res(), { once: true });
    ws.addEventListener("error", (e) => rej(e), { once: true });
  });
  ws.addEventListener("message", (ev) => onMessage(ev.data));
  await send("session.new", { capabilities: { alwaysMatch: { acceptInsecureCerts: true } } });
  sessionOpen = true;
}

async function openTab() {
  const { context } = await send("browsingContext.create", { type: "tab" });
  openTabContexts.add(context);
  send("browsingContext.navigate", { context, url: "https://www.perplexity.ai/", wait: "none" }).catch(() => {});
  return context;
}

async function runSingleReview(tab) {
  await send("browsingContext.activate", { context: tab.context });
  if (!(await waitAskInput(tab))) {
    recordFailure(tab, {
      code: 2,
      message: `no #ask-input within ${tab.sinceTabOpen()}s of tab open`,
      header: `Head at submission: ${tab.headAt}\n`,
      text: "",
    });
    return 2;
  }

  let model = await ensureModel(tab);
  if (!model.ok) {
    recordFailure(tab, { ...model, header: `Head at submission: ${tab.headAt}\n`, text: "" });
    return model.code;
  }

  await installFetchHook(tab);
  const typed = await typePrompt(tab);
  if (!typed.ok) {
    recordFailure(tab, { ...typed, header: `Head at submission: ${tab.headAt}\n`, text: "" });
    return typed.code;
  }

  if (!(await pressEnter(tab))) return 2;
  const answer = await pollAnswer(tab);
  if (!answer.ok) {
    recordFailure(tab, answer);
    return answer.code;
  }

  writeCapture(tab.outPath, answer.header, answer.text);
  postReceipt(tab, answer.header, answer.text);
  console.log(answer.header);
  return 0;
}

async function runSingleMode({ prUrl, headAt, out }) {
  try {
    requireVercelSuccess(prUrl, headAt);
    claimReview(prUrl, headAt);
    assertMemory({ tabs: 1 });
    await connectBiDi();
    const context = await openTab();
    const tab = makeTabState({ context, prUrl, headAt, outPath: out });
    const code = await runSingleReview(tab);
    await closeTabContext(context);
    await shutdownAll(code);
  } catch (e) {
    const code = e.exitCode ?? 2;
    console.error(String(e));
    try {
      const header = `Head at submission: ${headAt || "unknown"}\n`;
      writeCapture(out, header, String(e));
    } catch (captureError) {
      console.error(`capture write failed: ${captureError}`);
    } finally {
      await shutdownAll(code);
    }
  }
}

async function runBatchMode({ urls, outDir }) {
  mkdirSync(outDir, { recursive: true });
  const tabs = [];
  let typingLock = Promise.resolve();

  const withTypingLock = (fn) => {
    const run = typingLock.then(fn);
    typingLock = run.catch(() => {});
    return run;
  };

  try {
    for (const prUrl of urls) {
      const num = prNumberFromUrl(prUrl);
      if (!num) {
        console.error(`not a GitHub PR URL: ${prUrl}`);
        await shutdownAll(2);
        return;
      }
      const headAt = headShaForUrl(prUrl);
      requireVercelSuccess(prUrl, headAt);
      claimReview(prUrl, headAt);
    }
    assertMemory({ tabs: urls.length });
    await connectBiDi();
    for (const prUrl of urls) {
      const headAt = headShaForUrl(prUrl);
      requireVercelSuccess(prUrl, headAt);
      const outPath = join(outDir, `${captureBasename(prUrl, headAt)}.md`);
      assertMemory({ tabs: 1 });
      const context = await openTab();
      tabs.push(makeTabState({ context, prUrl, headAt, outPath }));
    }

    await Promise.all(
      tabs.map(async (tab) => {
        if (!(await waitAskInput(tab))) {
          recordFailure(tab, {
            code: 2,
            message: `no #ask-input within ${tab.sinceTabOpen()}s of tab open`,
            header: `Head at submission: ${tab.headAt}\n`,
            text: "",
          });
          tab.resultCode = 2;
        }
      }),
    );

    for (const tab of tabs) {
      if (tab.resultCode != null) continue;
      await withTypingLock(async () => {
        if (tab.resultCode != null) return;
        if (submissionExpired(tab)) return;
        await send("browsingContext.activate", { context: tab.context });
        let model = await ensureModel(tab);
        if (!model.ok) {
          recordFailure(tab, { ...model, header: `Head at submission: ${tab.headAt}\n`, text: "" });
          tab.resultCode = model.code;
          return;
        }
        await installFetchHook(tab);
        const typed = await typePrompt(tab);
        if (!typed.ok) {
          recordFailure(tab, { ...typed, header: `Head at submission: ${tab.headAt}\n`, text: "" });
          tab.resultCode = typed.code;
          return;
        }
        if (submissionExpired(tab)) return;
        await pressEnter(tab);
      });
    }

    await Promise.all(
      tabs.map(async (tab) => {
        if (tab.resultCode != null || !tab.submitted) return;
        const answer = await pollAnswer(tab);
        if (!answer.ok) {
          recordFailure(tab, answer);
          tab.resultCode = answer.code;
          return;
        }
        writeCapture(tab.outPath, answer.header, answer.text);
        postReceipt(tab, answer.header, answer.text);
        console.log(`${tab.prUrl}:\n${answer.header}`);
        tab.resultCode = 0;
      }),
    );

    for (const tab of tabs) {
      if (tab.resultCode == null) {
        recordFailure(tab, {
          code: 2,
          message: "review not submitted",
          header: `Head at submission: ${tab.headAt}\n`,
          text: "",
        });
        tab.resultCode = 2;
      }
    }

    const exitCode = tabs.reduce((worst, tab) => Math.max(worst, tab.resultCode ?? 2), 0);
    await shutdownAll(exitCode);
  } catch (e) {
    console.error(String(e));
    await shutdownAll(e.exitCode ?? 2);
  }
}

if (parsed.mode === "single") {
  runSingleMode(parsed);
} else {
  runBatchMode(parsed);
}
