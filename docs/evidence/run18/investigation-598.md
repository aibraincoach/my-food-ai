# Fleet 18 item 13 — #598 investigation (read-only)

**Scope:** Investigation only. No changes to `public/sw.js` or `src/components/ServiceWorkerRegistration.tsx`.  
**Repo baseline:** `origin/main` at investigation time (Fleet 18 on `7d2cbd37` per backlog).  
**Date:** 2026-11-04 (UTC).

## Problem statement

After a deploy, a returning browser can keep showing UI and copy from the previous build until the user hard-refreshes. Fleet 16 merged import-based worker updates (#605), explicit `registration.update()` on each load, and per-deploy build markers (#616), but production acceptance **did not** prove that the **new worker replaces the old one** on one normal reload. Issue [#598](https://github.com/aibraincoach/my-food-ai/issues/598) stays open.

## What we tried locally (A → B, one port, Chromium CDP)

**Intent:** Build production **A**, start `next start` on `127.0.0.1:60498`, load A in a persistent profile so the service worker installs; rebuild **B**, restart the same port; one normal reload; record worker registration states, navigation responses for `/` / `/shell` / `/sign-in`, Cache API vs network, and whether `data-build` matches B.

**Environment:** Linux aarch64, Chromium `151.0.7922.173` headless, CDP `:9245`, Node 24.

**Outcome:** **Not completed.** CDP attached to a page target and `Page.enable` succeeded, but **`Page.navigate` repeatedly timed out** (60s) to `http://127.0.0.1:60498/sign-in` even while `curl` returned HTTP 200 for the same URL. `Browser.getVersion` over the page WebSocket worked; navigation commands did not return. Chrome 151 also rejects `GET /json/new` (requires `PUT`), and targets opened via `PUT /json/new` stayed on `about:blank` without a reliable navigation hook in this headless profile.

**Implication:** This session does **not** add a fresh local A→B trace JSON. Findings below combine **static code review** and **Fleet 16 production captures** already in `docs/evidence/run16/`.

## Production evidence already on record (Fleet 16)

Primary artifacts:

| Artifact | What it shows |
| --- | --- |
| [worker-activation-unfinished.json](../run16/worker-activation-unfinished.json) | After redeploy **Y**, one normal reload at **2 500 ms** page+worker latency: first document **`data-build` = Y** (~1.56 s, `shell: false`); **active worker remained X** for the observation window; a **new worker was `installing`** while X stayed **activated**. Owner stopped extended verification — **no pass claimed**. |
| [worker-update-activation-failure.json](../run16/worker-update-activation-failure.json) | Earlier deploy: document advanced to **Y** via existing shell refresh path; **no activated worker with Y’s `self.BUILD` within 180 s**; only worker **X** observed activated. |
| [worker-update-investigation.md](../run16/worker-update-investigation.md) | Read-only Chromium source review: update scheduling tied to network quiet / client lifetime; DevTools attachment affects worker lifetime — **inference only**, not measured here. |
| [#598 comment 2026-11-04](https://github.com/aibraincoach/my-food-ai/issues/598#issuecomment-6634149453) | Confirms `updateViaCache: none`, no manual `update()` in the driver, document can reach new build while **old worker stays active**. |

**Consistent production pattern:** The **HTML document can show the new build** (often within ~1.5 s on `/`) while the **controlling service worker remains the previous build** for a long time (minutes in traces). That split explains “new text sometimes / old layout sometimes” and why a **hard refresh** (drop SW + HTTP cache) fixes the owner desktop case.

## How the current worker and registration behave (code)

### Build identity and update check

- `public/sw.js` line 1: `importScripts("/build.js")` — byte change on `/build.js` triggers a new worker install when the browser runs an update check.
- `src/app/build.js/route.ts`: `self.BUILD=…` with `Cache-Control: no-store`.
- `next.config.ts`: `NEXT_PUBLIC_BUILD` is `local-<timestamp>` or `VERCEL_GIT_COMMIT_SHA-<timestamp>` so redeploys differ even on the same commit (#616).
- `ServiceWorkerRegistration.tsx`: `register("/sw.js", { updateViaCache: "none" })` then **`registration.update()`** on each normal page load.

### Install / activate

```85:127:public/sw.js
self.addEventListener("install", event => {
  const updating = Boolean(self.registration.active);
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // … fetch /, /shell, /manifest with cache: "reload"; stamp x-mfa-update-build on manifest when updating
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    // … delete foreign cache names; clients.claim()
    const manifest = await (await caches.open(SHELL_CACHE)).match("/manifest.webmanifest");
    if (manifest?.headers.get("x-mfa-update-build") === self.BUILD) for (const client of await self.clients.matchAll({type: "window"})) {
      if (new URL(client.url).origin === self.location.origin) await client.navigate(client.url).catch(() => {});
    }
  })());
});
```

- **`skipWaiting()`** is called on install, but the **old worker keeps controlling clients** until the browser activates the new version (subject to Chromium’s “no active fetch handlers” / client rules).
- **Activate-time `client.navigate`** only runs when the cached manifest header matches **`self.BUILD`** for **this** worker — it does not by itself retire the **previous** worker’s control.

### What serves `/` (old layout mechanism — Fleet 14)

```278:294:public/sw.js
  if (event.request.mode === "navigate" && navUrl.origin === self.location.origin && navUrl.pathname === "/" && !navUrl.searchParams.has("_")) {
    event.respondWith((async () => {
      const network = fetch(event.request).then(/* … */);
      const timer = new Promise(resolve => setTimeout(() => resolve(null), 1500));
      const first = await Promise.race([network.catch(() => null), timer]);
      if (first) return first;
      const state = await control;
      const shell = !disabledImmediately && !state.locked && state.mode === "active" ? await (await caches.open(SHELL_CACHE)).match("/shell") : null;
      if (shell && !disabledImmediately && state.mode === "active") { event.waitUntil(network.catch(() => {})); return shell; }
      // …
    })());
```

For a **signed-in user with an active media session**, if the **network answer to `/` takes longer than 1.5 s**, the **cached `/shell` document** is returned (`data-shell` on main via `DesktopHomeFrame` / shell route). That shell is the **old full-width feed layout** Fleet 14 documented — independent of whether a **new** worker is installing in the background.

Cached shell lives in **`my-food-ai-shell-v4`** (fixed name). A new worker’s install **rewrites** that cache, but **whichever worker is active** serves navigations and **`/_next/static` cache-first** until activation swaps control.

### Document refresh without worker swap

`PostReadinessListener` calls `router.refresh()` when not on shell, or dispatches `feed-revalidate` on shell — and shell refresh URLs can use cache-bypass query params from readiness logic. That path can deliver **new `data-build` on the document** while **`navigator.serviceWorker.controller` still points at the old worker** — matching Fleet 16 traces.

## Hypothesized causes (ranked, for fix fleet)

1. **Stale `/shell` in `SHELL_CACHE` + 1.5 s `/` race (proven mechanism for old *layout*, conditional on signed-in + slow `/`)**  
   Returning users with an active media session can get **`/shell` from cache** when middleware/auth makes `/` slow (cold start, latency). That is **old UI** even when production serves a new desktop shell on a fast network path. Hard refresh or a reload that wins the network race shows the new layout. **Does not require** worker update failure.

2. **New worker installed but old worker remains *activated* (proven on production traces; root cause inside Chromium lifecycle + in-flight fetch)**  
   #616’s `update()` and new `/build.js` bytes **do** produce an **installing/waiting** worker with the new marker, but traces show **worker X still activated** for ≥180 s while the document already shows **Y**. Hypothesis: **ongoing or long-lived `fetch` handlers** (navigation `waitUntil`, media `feedImage` persistence, shell install I/O) and/or **DevTools-attached observation** delay activation handoff — aligned with Fleet 16 Chromium source notes, **not re-measured in Run 18**.

3. **Shared cache name + cache-first static assets**  
   Until the new worker activates, **old worker** continues **cache-first** for `/_next/static/…` from the same `SHELL_CACHE`. Even after HTML shows Y, **JS/CSS chunks** can remain **old hashed files** cached under keys from the previous shell parse — visible as mixed old/new behavior until activation or hard refresh.

4. **Activate `client.navigate` is insufficient as sole “swap” signal**  
   It reloads windows when **this** worker activates with a matching manifest stamp; it does **not** force immediate takeover when the old worker still owns `fetch` events. Production showed document Y **without** proven activation-driven navigation.

5. **Not the primary story: missing `registration.update()`**  
   Current registration **does** call `update()`; Fleet 16 driver deliberately did not double-call it. Stale builds are **not** explained by absent update checks alone post-#616.

## Which cache serves “old” for `/`

| Condition | Likely document source on normal reload |
| --- | --- |
| Anonymous / no active media session | Network `/` if ≤1.5 s; else cached `/` in `SHELL_CACHE` (fallback) |
| Signed in, active media, slow `/` | Cached **`/shell`** in **`my-food-ai-shell-v4`** (old layout) |
| After network wins race | Fresh `/` from origin (new `data-build`) |
| Hard refresh | Bypasses SW strategy for navigation; re-fetches shell assets |

Worker script and `/build.js` use **`updateViaCache: "none"`** on registration; **`SHELL_CACHE`** still holds prior HTML until overwritten by a **new worker’s install** or manual cache clear.

## Done condition vs current state

**Backlog done when:** a browser holding the previous build shows the **new build on the next normal load**, with the check recorded.

**Run 18 investigation conclusion:**  
- **Cause is not fully isolated** to a single line; at least **two mechanisms** are supported by evidence: **(A)** shell cache + timed navigation race for **old layout**, **(B)** **delayed worker activation** with **old worker still controlling** fetches after deploy.  
- **Fix belongs in a later fleet** (not Run 18). Candidates to evaluate in implementation: shorten or remove shell fallback race for `/`, ensure activate + controller change reliably swaps before paint, `controllerchange` reload policy, or versioned `SHELL_CACHE` name per build — **each with blast-radius review**.

## GitHub comment draft for #598

```markdown
Fleet 18 item 13 — investigation only (#598). No product code changes in this item.

**Local A→B simulation (loopback production builds, Chromium CDP):** Not completed in the Run 18 environment. CDP attached, but `Page.navigate` to the local server timed out repeatedly in HeadlessChrome 151 on aarch64 while curl returned 200. No new local trace JSON is claimed.

**Read-only synthesis (code + Fleet 16 production artifacts):**

1. **Old layout without hard refresh** — For signed-in users with an active media session, `public/sw.js` races `/` against 1.5s and can return cached **`/shell`** from `my-food-ai-shell-v4` when `/` is slow (Fleet 14 mechanism). That is old full-width shell UI even when main has moved on.

2. **Document vs worker mismatch after deploy** — Production traces (`docs/evidence/run16/worker-activation-unfinished.json`, earlier activation-failure capture) show a normal reload can reach the **new `data-build` on the document** while the **previous worker stays activated** and a newer worker sits **installing/waiting** for extended periods. `#616`’s `registration.update()` and unique `/build.js` markers are not sufficient alone for takeover.

3. **Hypothesis for fix fleet:** Combine (A) navigation/shell cache policy on `/` with (B) Chromium activation handoff while fetch handlers/media writes are in flight; optional per-build cache partition. DevTools/network-quiet scheduling remains an inference from Run 16 source review, not re-proven here.

**Recommendation:** Keep #598 open; implement and accept in a dedicated fix fleet with a recorded A→B check (production or local when CDP navigation works), including worker `self.BUILD`, registration states, navigation `fromServiceWorker`, and first/last `data-build` on one normal reload.

Full write-up: `docs/evidence/run18/investigation-598.md` (branch `run18/investigate-598`).
```
