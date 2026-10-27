#!/usr/bin/env node
/**
 * AGY review invocation with enforced complete-coverage delivery and check.
 *
 * Why this exists (imported finding from aibraintrust-io
 * docs/evidence/agy-coverage-root-cause-2026-09-12.md and
 * docs/evidence/agy-input-delivery-test-2026-09-12.md, adopted into this repo
 * 2026-09-18; lifted into burn-centre-translator from
 * ~/Projects/loadedbakedpotato/scripts/review/agy-review.mjs on 2026-10-06):
 * AGY's run_command tool clips output to an 8,192-byte tail, so diffs piped
 * through `cat`/`git diff` in the reviewer's shell silently lose content.
 * Its native file viewer delivers complete content (within a separate ~46 KB
 * single-read window — hence PART_BYTES). This tool therefore:
 *   1. builds the exact base..head manifest from git (every path, including
 *      docs and deletions with their full removed content);
 *   2. writes every patch to disk in parts no larger than PART_BYTES so one
 *      native file read returns the whole part;
 *   3. invokes agy with a short --print prompt that permits only the native
 *      file viewer (view_file) for reading and demands a structured per-part
 *      manifest (enforced with --json-schema). The diff itself is NEVER
 *      injected on the command line;
 *   4. independently checks the returned manifest against git: set equality,
 *      statuses, every part complete, byte counts equal, read method
 *      view_file only. Any gap exits non-zero and the receipt says so.
 *
 * Usage:
 *   node scripts/review/agy-review.mjs --base <sha> --head <sha> --model <id> [--pr N]
 *        [--effort high] [--timeout 20m] [--out DIR] [--dry-run] [--check-only FILE]
 *
 * --model has no default on purpose: the approved model is chosen per
 * docs/agy-review-procedure.md and recorded in the receipt.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const PART_BYTES = 40_000; // below the observed 46,080-byte single view_file delivery
export const READ_METHOD = "view_file";

export function parseArgs(argv) {
  const out = { effort: "high", timeout: "20m", context: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--base") out.base = next();
    else if (a === "--head") out.head = next();
    else if (a === "--model") out.model = next();
    else if (a === "--effort") out.effort = next();
    else if (a === "--timeout") out.timeout = next();
    else if (a === "--out") out.out = next();
    else if (a === "--pr") out.pr = next();
    else if (a === "--repo") out.repo = next();
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--no-context") out.context = false;
    else if (a === "--check-only") out.checkOnly = next();
    else throw new Error(`unknown argument ${a}`);
  }
  return out;
}

function git(args, cwd) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  return r.stdout;
}

export function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Every changed path with its status, from git, no renames, no filters. */
export function buildManifest(cwd, base, head) {
  const raw = git(["diff", "--no-renames", "--name-status", base, head], cwd);
  const files = raw.split("\n").filter(Boolean).map((line) => {
    const [status, ...rest] = line.split("\t");
    return { status: status.trim(), path: rest.join("\t") };
  });
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

/** Split text into parts of at most `limit` bytes on line boundaries; over-long lines are sliced. */
export function splitParts(text, limit = PART_BYTES) {
  const parts = [];
  let current = "";
  for (const line of text.split(/(?<=\n)/)) {
    if (Buffer.byteLength(line) > limit) {
      if (current) { parts.push(current); current = ""; }
      // Slice on code-point boundaries so a multi-byte character is never
      // bisected into replacement characters (PPLX finding, PR #66).
      let chunk = "";
      for (const ch of line) {
        if (chunk && Buffer.byteLength(chunk + ch) > limit) { parts.push(chunk); chunk = ""; }
        chunk += ch;
      }
      if (chunk) parts.push(chunk);
      continue;
    }
    if (current && Buffer.byteLength(current + line) > limit) {
      parts.push(current);
      current = "";
    }
    current += line;
  }
  if (current) parts.push(current);
  return parts;
}

function slug(path) {
  return path.replace(/[^A-Za-z0-9._-]+/g, "__");
}

/** Write patches (and optional head-file context) to disk; return the manifest record. */
export function writePacket(cwd, base, head, outDir, { context = true } = {}) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(join(outDir, "patches"), { recursive: true });
  if (context) mkdirSync(join(outDir, "context"), { recursive: true });
  const files = buildManifest(cwd, base, head);
  const manifest = { base, head, part_bytes: PART_BYTES, files: [] };
  files.forEach((file, index) => {
    const patch = git(["diff", "--no-ext-diff", "--no-renames", base, head, "--", file.path], cwd);
    const parts = splitParts(patch).map((content, n) => {
      const name = `patches/${String(index + 1).padStart(3, "0")}-${slug(file.path)}.part${n + 1}.patch`;
      writeFileSync(join(outDir, name), content);
      return { name, bytes: Buffer.byteLength(content), sha256: sha256(content) };
    });
    const record = { index: index + 1, path: file.path, status: file.status, parts };
    if (context && file.status !== "D") {
      const headText = git(["show", `${head}:${file.path}`], cwd);
      record.context = splitParts(headText).map((content, n) => {
        const name = `context/${String(index + 1).padStart(3, "0")}-${slug(file.path)}.part${n + 1}.txt`;
        writeFileSync(join(outDir, name), content);
        return { name, bytes: Buffer.byteLength(content) };
      });
    }
    manifest.files.push(record);
  });
  writeFileSync(join(outDir, "MANIFEST.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(outDir, "MANIFEST.md"), renderManifestMd(manifest));
  writeFileSync(join(outDir, "schema.json"), JSON.stringify(responseSchema(), null, 2));
  return manifest;
}

export function renderManifestMd(m) {
  const lines = [
    `# Review packet`, ``,
    `BASE=${m.base}`, `HEAD=${m.head}`, `FILES=${m.files.length}`, ``,
    `Every changed path is listed. Each patch is stored in parts of at most ${m.part_bytes} bytes.`,
    `Read every part with the native file viewer (view_file). Never use run_command, cat, sed, head, tail or git to read review content.`, ``,
    `| # | path | status | parts (name: bytes) |`, `| --- | --- | --- | --- |`,
  ];
  for (const f of m.files) {
    lines.push(`| ${f.index} | ${f.path} | ${f.status} | ${f.parts.map((p) => `${p.name}: ${p.bytes}`).join("; ")} |`);
  }
  lines.push("", "Optional surrounding context for added/modified files is under context/ (same reading rule).");
  return lines.join("\n") + "\n";
}

export function responseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["head", "base", "verdict", "files", "blockers", "summary"],
    properties: {
      head: { type: "string" },
      base: { type: "string" },
      verdict: { type: "string", enum: ["BLOCKERS: NONE", "BLOCKERS: FOUND", "REVIEW INCOMPLETE"] },
      summary: { type: "string" },
      blockers: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["path", "summary", "evidence"],
          properties: { path: { type: "string" }, line: { type: "integer" }, summary: { type: "string" }, evidence: { type: "string" } },
        },
      },
      files: {
        type: "array",
        items: {
          type: "object", additionalProperties: false,
          required: ["path", "status", "parts", "findings"],
          properties: {
            path: { type: "string" },
            status: { type: "string" },
            parts: {
              type: "array",
              items: {
                type: "object", additionalProperties: false,
                required: ["name", "read_method", "bytes_read", "complete"],
                properties: {
                  name: { type: "string" },
                  read_method: { type: "string" },
                  bytes_read: { type: "integer" },
                  complete: { type: "boolean" },
                },
              },
            },
            findings: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
  };
}

export function buildPrompt(manifest, { pr, repo }) {
  const url = pr && repo ? `https://github.com/${repo}/pull/${pr}` : '(no PR URL supplied)';
  return [
    `Independent code-quality review (NOT a security review). Pull request: ${url}`,
    `EXACT_REVIEW_HEAD=${manifest.head}`,
    `BASE=${manifest.base}`,
    ``,
    `The working directory contains only this review packet. Start by reading MANIFEST.md with the native file viewer (view_file).`,
    `Then read EVERY part listed under patches/ with view_file, one part per call, in full. There are ${manifest.files.length} changed paths and ${manifest.files.reduce((n, f) => n + f.parts.length, 0)} patch parts.`,
    `Deleted files carry their complete removed content in the patch; read them too.`,
    `Files under context/ hold the complete head version of added or modified files for surrounding context; read them with view_file when you need them.`,
    ``,
    `READING RULE, NOT NEGOTIABLE: use only the native file viewer for review content. Do not use run_command, cat, sed, head, tail, grep -A, git show, git diff or any shell output capture to read review content; shell output is clipped to an 8,192-byte tail and previous reviews lost content that way. If the viewer ever returns a partial read, read the remainder with the offset it reports before continuing.`,
    ``,
    `Assess through three lenses, in order: (1) runtime correctness (crashes, hangs, wrong output on real conditions); (2) data and privacy rules of this repo (no conversation content — audio, transcript, translation — logged or persisted anywhere, including analytics, error reports and feedback storage; analytics tables carry metadata only; server-side role checks on every API; every OpenAI call goes through lib/openai.js; secrets only in server env; Feedback and Shut-off controls always visible in-session); (3) cross-PR integration with the rest of the merged stack. Ground every finding in a quoted line from the packet. Do not edit, post, browse, run tests or delegate.`,
    ``,
    `Your final answer must be JSON matching the supplied schema and nothing else. In files[], list every path from MANIFEST.md with the same status, and for each part record read_method ("${READ_METHOD}"), bytes_read exactly as delivered, and complete=true only when the whole part was read. If any part could not be read completely, set verdict "REVIEW INCOMPLETE" and say which. Use "BLOCKERS: FOUND" when any grounded blocker exists, otherwise "BLOCKERS: NONE".`,
  ].join('\n');
}

/** Deterministic completeness check: returns {ok, problems[]}. */
export function checkCoverage(manifest, response) {
  const problems = [];
  if (!response || typeof response !== "object") return { ok: false, problems: ["response is not a JSON object"] };
  if (response.head !== manifest.head) problems.push(`head mismatch: response ${response.head} vs packet ${manifest.head}`);
  if (response.base !== manifest.base) problems.push(`base mismatch: response ${response.base} vs packet ${manifest.base}`);
  const byPath = new Map((response.files ?? []).map((f) => [f.path, f]));
  const seen = new Set();
  for (const f of response.files ?? []) {
    if (seen.has(f.path)) problems.push(`duplicate path in response: ${f.path}`);
    seen.add(f.path);
    if (!manifest.files.some((m) => m.path === f.path)) problems.push(`response lists a path not in the diff: ${f.path}`);
  }
  for (const m of manifest.files) {
    const r = byPath.get(m.path);
    if (!r) { problems.push(`missing from response: ${m.path}`); continue; }
    if (r.status !== m.status) problems.push(`status mismatch for ${m.path}: response ${r.status} vs git ${m.status}`);
    const rParts = new Map((r.parts ?? []).map((p) => [p.name, p]));
    for (const part of m.parts) {
      const rp = rParts.get(part.name);
      if (!rp) { problems.push(`part not reported: ${part.name}`); continue; }
      if (rp.read_method !== READ_METHOD) problems.push(`${part.name} read via ${rp.read_method}, not ${READ_METHOD}`);
      if (rp.complete !== true) problems.push(`${part.name} reported incomplete`);
      if (rp.bytes_read !== part.bytes) problems.push(`${part.name} bytes_read ${rp.bytes_read} vs ${part.bytes} on disk`);
    }
  }
  if (!["BLOCKERS: NONE", "BLOCKERS: FOUND", "REVIEW INCOMPLETE"].includes(response.verdict)) problems.push(`invalid verdict: ${response.verdict}`);
  if (response.verdict === "REVIEW INCOMPLETE") problems.push("reviewer declared REVIEW INCOMPLETE");
  return { ok: problems.length === 0, problems };
}

/** Unwrap agy --output-format json; the structured answer is the response string. */
export function extractResponse(stdout) {
  let envelope;
  try { envelope = JSON.parse(stdout); } catch { return { error: "stdout is not JSON", raw: stdout }; }
  const text = typeof envelope === "string" ? envelope : envelope.response ?? envelope.result ?? envelope.output ?? null;
  if (text == null) return { error: "no response field in envelope", envelope };
  if (typeof text === "object") return { response: text, envelope };
  const cleaned = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return { response: JSON.parse(cleaned), envelope }; } catch { return { error: "response is not JSON", raw: text, envelope }; }
}

export function renderReceipt({ manifest, args, invocation, check, response, exitCode }) {
  const partsTotal = manifest.files.reduce((n, f) => n + f.parts.length, 0);
  const lines = [
    `AGY receipt — head \`${manifest.head}\`, base \`${manifest.base}\`${args.pr ? `, PR #${args.pr}` : ""}.`,
    ``,
    `Invocation: \`${invocation.argv.join(" ")}\` (prompt omitted), cwd \`${invocation.cwd}\`, started ${invocation.started}, finished ${invocation.finished}, agy exit ${invocation.exit}.`,
    `Delivery: ${manifest.files.length} changed paths as ${partsTotal} on-disk patch parts (≤ ${PART_BYTES} bytes each), read via ${READ_METHOD} only; deletions carry full removed content.`,
    ``,
    `Completeness check: ${check.ok ? `PASS — ${manifest.files.length}/${manifest.files.length} paths, ${partsTotal}/${partsTotal} parts complete, all via ${READ_METHOD}.` : `FAIL — ${check.problems.length} problem(s):`}`,
    ...(check.ok ? [] : check.problems.map((p) => `- ${p}`)),
    ``,
    `Verdict: **${response?.verdict ?? "(no verdict)"}**${check.ok ? "" : " — NOT A GATE PASS: coverage incomplete"}`,
    `Tool exit code: ${exitCode} (0 clean, 2 coverage gap, 3 blockers found, 4 agy failure).`,
    ``,
    `| # | path | status | parts | reported bytes | complete |`, `| --- | --- | --- | --- | --- | --- |`,
  ];
  const byPath = new Map((response?.files ?? []).map((f) => [f.path, f]));
  for (const m of manifest.files) {
    const r = byPath.get(m.path);
    const bytes = r ? (r.parts ?? []).map((p) => p.bytes_read).join("+") : "—";
    const complete = r ? (r.parts ?? []).every((p) => p.complete && p.read_method === READ_METHOD) : false;
    lines.push(`| ${m.index} | ${m.path} | ${m.status} | ${m.parts.length} | ${bytes} | ${complete ? "yes" : "NO"} |`);
  }
  if (response?.blockers?.length) {
    lines.push("", "Blockers:");
    for (const b of response.blockers) lines.push(`- ${b.path}${b.line ? `:${b.line}` : ""} — ${b.summary} (${b.evidence})`);
  }
  lines.push("", "Raw reviewer response follows unchanged.", "", "```json", JSON.stringify(response ?? null, null, 2), "```", "");
  return lines.join("\n");
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (!args.base || !args.head) throw new Error("--base and --head are required");
  const cwd = process.cwd();
  const shortHead = args.head.slice(0, 7);
  const outDir = resolve(args.out ?? join(git(["rev-parse", "--absolute-git-dir"], cwd).trim(), "review-state", `agy-${shortHead}`));
  // Capture check-only input before rebuilding a packet that may contain it.
  const checkOnlyInput = args.checkOnly ? readFileSync(args.checkOnly, "utf8") : null;
  const manifest = writePacket(cwd, args.base, args.head, outDir, { context: args.context });
  const repo = args.repo ?? git(["remote", "get-url", "origin"], cwd).trim().replace(/^.*github\.com[:/]/, "").replace(/\.git$/, "");
  const prompt = buildPrompt(manifest, { pr: args.pr, repo });
  writeFileSync(join(outDir, "prompt.txt"), prompt);
  console.log(`packet: ${outDir} (${manifest.files.length} paths, ${manifest.files.reduce((n, f) => n + f.parts.length, 0)} parts)`);
  if (args.dryRun) return 0;

  let stdout;
  let invocation;
  if (args.checkOnly) {
    stdout = checkOnlyInput;
    invocation = { argv: ["(check-only)"], cwd: outDir, started: "", finished: "", exit: 0 };
  } else {
    if (!args.model) throw new Error("--model is required (approved model per the central runbook); it is recorded in the receipt");
    const argvNoPrompt = [
      "agy", "--model", args.model, "--effort", args.effort, "--sandbox", "--dangerously-skip-permissions",
      "--disable-slash-commands", "--output-format", "json", "--json-schema", join(outDir, "schema.json"),
      "--print-timeout", args.timeout, "--print",
    ];
    const started = new Date().toISOString();
    const r = spawnSync(argvNoPrompt[0], [...argvNoPrompt.slice(1), prompt], { cwd: outDir, encoding: "utf8", maxBuffer: 1 << 28 });
    const finished = new Date().toISOString();
    invocation = { argv: argvNoPrompt, cwd: outDir, started, finished, exit: r.status };
    writeFileSync(join(outDir, "agy.stdout.json"), r.stdout ?? "");
    writeFileSync(join(outDir, "agy.stderr.txt"), r.stderr ?? "");
    writeFileSync(join(outDir, "invocation.json"), JSON.stringify(invocation, null, 2));
    stdout = r.stdout ?? "";
    if (r.status !== 0) {
      const receipt = renderReceipt({ manifest, args, invocation, check: { ok: false, problems: [`agy exited ${r.status}: ${(r.stderr ?? "").slice(-500)}`] }, response: null, exitCode: 4 });
      writeFileSync(join(outDir, "receipt.md"), receipt);
      console.log(receipt);
      return 4;
    }
  }
  const extracted = extractResponse(stdout);
  const response = extracted.response ?? null;
  const check = response ? checkCoverage(manifest, response) : { ok: false, problems: [extracted.error ?? "unparseable response"] };
  const exitCode = !check.ok ? 2 : response.verdict === "BLOCKERS: NONE" ? 0 : 3;
  const receipt = renderReceipt({ manifest, args, invocation, check, response, exitCode });
  writeFileSync(join(outDir, "receipt.md"), receipt);
  console.log(receipt);
  return exitCode;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().then((code) => process.exit(code)).catch((e) => { console.error(e.message); process.exit(1); });
}
