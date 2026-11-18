# Fleet 36 — the Next.js security upgrade, 16.4.3 to 16.4.5 (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack, Vercel and production read access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new, priority plan from the PM's packet of 2026-11-18 02:42Z, for the item titled "The production build warns that Next.js 16.4.3 has a known security vulnerability". **Its issue number comes from Fleet 35's part A; put that number in the PR title and body** (written below as `#<issue>`). It has one code PR and one docs PR, one stop before the merges, and a read-only production check after the PM's merge order. Planned from main `550b01f6`. Fleets 34 and 35 are with the builder: this PR touches only `package.json` and `package-lock.json`, none of their files. If either fleet changes `package-lock.json` before this merges, regenerate the lockfile as in section 5 on the new main.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes.

## 1. The upgrade

| | |
|---|---|
| From | `next` 16.4.3 and `eslint-config-next` 16.4.3 (so `@next/env`, `@next/eslint-plugin-next` and the `@next/swc-*` binaries follow) |
| To | **16.4.5**, the patched release. No major version is needed |
| Why 16.4.5, not 16.4.6 | 16.4.5 is the security release. 16.4.6 adds no security fix, and its change "Automatically compress route handler responses if not already compressed" (#101280) would change response headers on the app's route handlers, the `/p/` photo route among them. It is left for a later, separate step |
| One PR or two | One. Only the `next` family changes in the lockfile; no other dependency moves, no config, source or deprecated-API change is needed |

## 2. Facts the planner checked on 2026-11-18, and premises

- **The advisories** (`npm audit` on main and the GitHub advisory database):
  - GHSA-mfr8-8qww-v76h, moderate: information disclosure across root params when a `'use cache'` function is called through `unstable_cache()`. Affects `next` 16.3.0 to 16.4.4; first patched 16.4.5.
  - GHSA-vc7v-qv4w-wrv8, moderate: cache leak across root param values in nested `'use cache'` functions. Affects 16.2.0 to 16.4.4; first patched 16.4.5.

  The build's own check reads the registry's bulk advisories for the installed `next`. That is why every first build of 16.4.3 stopped with `SecurityFatalError`.
- **The release notes** (`vercel/next.js`):
  - **v16.4.4** (2026-11-02) backports bug fixes, among them "Use fast-jwt instead of jsonwebtoken", a Turbopack CSS reload, a PPR resume nonce and a reverted chunk optimization.
  - **v16.4.5** (2026-11-03) is the security release, with seven moderate advisories. Besides the two above, it fixes:
    - fallback-shell cache poisoning in Cache Components;
    - `use cache` with binary arguments;
    - response injection in self-hosted apps;
    - an SVG bypass in image optimization;
    - an HttpOnly cookie exposed through an internal header on Edge-runtime routes.
  - **v16.4.6** (2026-11-09): Tailwind pinning in create-next-app, automatic compression of route handler responses, Turbopack dev GC fixes.
- **What the app uses.** No `'use cache'`, `unstable_cache`, `cacheLife` or `cacheTag` in `src`; no `next/image`; no route with `runtime = 'edge'`. `next.config.ts` turns on `cacheComponents` and `partialPrefetching`. `src/middleware.ts` has no runtime setting, so it runs on Next's default middleware runtime. The build notes that the `middleware` file name is deprecated in favour of `proxy`; it still works in 16.4.5.
- **On the planner's stack, with 16.4.5 from main `550b01f6`:**
  - **Install and audit:** `npm install --save-exact` changed only the `next` family (96 lockfile lines). `npm audit` no longer lists `next`, and 15 lint-only findings remain.
  - **Static checks:** `npx tsc --noEmit` is clean. `npx eslint .` gives the same 3 errors and 14 warnings as main with 16.4.3, differing only in column padding.
  - **The build:** `next build` **exited 0 the first time**, printed `Next.js 16.4.5`, and showed no advisory line.
  - **Suites:** the database suite 51 of 51; the application suite 793 of 799 (6 skips, 0 failures).
  - **The smoke check** (section 6, step 7) passed:
    - the capture sheet posted a meal, ready in 3.3 seconds;
    - its photo answered 200 `image/webp` with `public, max-age=31536000, s-maxage=86400, immutable`, decoded at 640 by 498 (the smoke check runs at DPR 1);
    - the meal page was ready;
    - the service worker controlled Home with `my-food-ai-shell-v4` and `mfa-media-control-v1`, and the capture sheet opened offline;
    - the meal was removed.
  - **Signed out:** `/`, `/days`, `/profile` and `/posts/<uuid>` answered 307 to `/sign-in`; `/p/bad.webp` 404; `/sign-in` and `/shell` 200.

## 3. Not in this run, and why

- **`picomatch` (GHSA-fc5q-39xc-vjpf, high, ReDoS):** no patched release exists (every version up to 4.0.7, the latest, is affected). It reaches the app only through lint tooling (`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch`, and `eslint-import-resolver-typescript` → `tinyglobby`), so it never ships to production. The other `npm audit` findings (`@typescript-eslint/*`, `minimatch`, `fdir`, `tinyglobby`) are the same lint-only chain. Revisit when a patched `picomatch` exists.
- **Next.js 16.4.6** and the `middleware` to `proxy` rename (the build's deprecation note): separate later steps, neither needed for the advisory.
- **The three lint errors** (`DesktopToday.tsx` line 16, `OutlineOverlay.tsx` line 74, `PostOpenTransition.tsx` line 47): they are on main with 16.4.3 too. `npx eslint .` gives the same 3 errors and 14 warnings before and after the upgrade. They are not this item.

## 4. How it runs

1. **Worktree.** A fresh worktree from `origin/main` under `/tmp/mfa-f36`. Never run `npm` in the original checkout.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f36/stack TEST_ENV_FILE=.env.test.fleet36`.
3. **The change** (section 5), then the checks of section 6 in order.
4. **Review.** One PPLX review of the PR on its final head; AGY when PPLX is unavailable.
5. **Docs PR.** Branch `docs/fleet36`, with this plan unchanged as `docs/plan-fleet36.md`.
6. **Stop** (section 7).

## 5. The code PR — branch `fix36/next-16-4-5` — #<issue>

In the worktree, after `npm ci`:

```
npm install --save-exact next@16.4.5 eslint-config-next@16.4.5
```

This must change exactly these two lines of `package.json`:

File `package.json`.

Find:
```
    "chrono-node": "^2.10.3",
    "next": "16.4.3",
    "openai": "^7.45.0",
```
Replace:
```
    "chrono-node": "^2.10.3",
    "next": "16.4.5",
    "openai": "^7.45.0",
```

Find:
```
    "eslint-config-next": "16.4.3",
```
Replace:
```
    "eslint-config-next": "16.4.5",
```


In `package-lock.json` it must change only the `next` family's entries, their `version`, `resolved` and `integrity`, plus the two dependency lines: `next`, `eslint-config-next`, `@next/env`, `@next/eslint-plugin-next` and the eight `@next/swc-*` binaries, 96 changed lines in all. Check with `git diff --stat` (two files) and `git diff package-lock.json | grep '^[-+] ' | grep -v '"version"\|"resolved"\|"integrity"'`, which must show only those package names. From main `550b01f6`, the planner's result was `package.json` sha256 `44ddb9697be6952c680998194507ddadbd40fb7ae1ac88e14e1eaf53d58e907b` and `package-lock.json` sha256 `9e5713f671c6f67ecefcb330a369814214c7b9d71a4fafe855b07213f6184b00`. If yours differs, compare the `git diff` against this description before going on, and report the difference.

## 6. The checks (local, on your own stack)

1. `npm ci` from the new lockfile, then `node -e "console.log(require('next/package.json').version)"` must print `16.4.5`.
2. `npm audit --json`: `next` must not be listed. Report the remaining findings (section 3 expects only the lint-only chain).
3. `npx tsc --noEmit`: clean.
4. `npx eslint .`: the same 3 errors and 14 warnings as main (run it on main too, and diff the two outputs ignoring whitespace).
5. **The build, once, from an empty `.next`:** `node scripts/test-app.mjs build` must exit 0 **the first time**, print `Next.js 16.4.5`, and print neither "security vulnerability" nor `SecurityFatalError`.
6. **Both suites,** with the built app started: `npm run test:db` and `npm test` (10 minutes each). Report the counts against main's. On main `550b01f6`, Fleet 34's tests included, the planner's 16.4.5 run gave application 793 of 799 with 6 skips and database 51 of 51.
7. **A local run of the app.** Copy `/home/opc/.claude/plans/fleet36-smoke.mjs` (sha256 `8b1e5267e91a0bb1b2ada75e516cdc079eada40211ea53971665a7cf3a9c2499`) outside Git and run it once: `MFA_TEST_DISPOSABLE=1 K3_OUT=<private folder with an empty private/> timeout 600 node fleet36-smoke.mjs K3 <worktree> <env file> <build marker>`. It does the following:
   - posts a meal through the capture sheet and waits for it to be ready;
   - opens Home and reads that meal's photo from the `/p/` route: status, type, `cache-control`, bytes and decoded size;
   - opens the meal's page;
   - waits for the service worker to control Home, lists its caches, goes offline, and opens the capture sheet;
   - removes the meal.

   Met when the photo answers 200 `image/webp` with `public, max-age=31536000, s-maxage=86400, immutable`, the meal page shows `[data-post-detail-ready]`, the shell cache is listed, and the capture sheet opens offline.
8. **Signed-out answers:** with `curl`, `/`, `/days`, `/profile` and `/posts/<any uuid>` must answer 307 to `/sign-in`; `/p/bad.webp` 404; `/sign-in` and `/shell` 200.

## 7. The stop

Stop when the code PR and the docs PR are open and the code PR is reviewed or reported "written, not reviewed". Report to the PM, in one message: the PR's number, branch, final head (40 characters), the two file hashes, and checks 1 to 8 with their results; the review's result; and the merge order this plan expects: the code PR, then the docs PR. Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. After the PM's merge order: a read-only production check

**What could go wrong in production, and what the check reads:**

| Risk | Why | What the check reads |
|---|---|---|
| The deployment's build | The advisory check runs at build time | The Vercel build log shows `Next.js 16.4.5` and no "security vulnerability" |
| The middleware (`src/middleware.ts`, matcher `/`, `/search`, `/days`, `/profile`, `/posts`, `/admin`) | 16.4.4 changed the framework's internal JWT library (#100885), and 16.4.5 changed a response header on Edge-runtime routes; the middleware is the app's one Edge-runtime piece | Signed-out pages still redirect to `/sign-in`, and signed-in pages still open |
| Cache Components and partial prerendering (`cacheComponents`, `partialPrefetching` in `next.config.ts`) | 16.4.5 changes how fallback shells and `use cache` entries are keyed. The app has no `'use cache'` of its own, but `/posts/[id]` and Home use the shells | Home, Days, Profile and a meal open signed in, and each shows its own data |
| The `/p/` photo route | A route handler, and the CDN keeps its answers | A known test-account-2 photo answers 200 `image/webp` with the same `cache-control` |
| The service worker | The shell and its chunk list change with every build | The worker takes control and the capture sheet opens offline |
| Image handling | 16.4.5 fixes SVG handling in `next/image`; the app does not use `next/image` | Nothing to read |

**The check**, once, after production serves the merge commit (wait for READY, at most 10 minutes):
1. **The build log.** `vercel inspect <deployment URL> --logs`: look for `Next.js 16.4.5`, and for no "security vulnerability" line.
2. **Signed out**, with `curl` against the production URL: `/`, `/days`, `/profile` must answer 307 to `/sign-in`; `/sign-in` and `/shell` 200.
3. **Signed in**, in fresh native Chromium at 390 by 844, DPR 3, as test account 2, under Fleet 31's read-only guard but with the service worker **not** bypassed:
   - Home, Days, Profile and the newest ready meal open and show the served build's marker.
   - That meal's photo URL answers 200 `image/webp` with `public, max-age=31536000, s-maxage=86400, immutable`.
   - Then wait for the service worker to control Home (at most 60 seconds), go offline, and open the capture sheet (at most 10 seconds).

   This writes nothing.

**How a bad deploy is undone.** Vercel keeps the previous production deployment. Promote it back with `vercel rollback <previous deployment URL>`, or the dashboard's "Promote to Production" on that deployment. That restores the old build at once, with no rebuild. Record which deployment you promoted. Then open a revert PR of the merge for the PM's order. The rollback needs no data change: the upgrade has no migration and changes no stored data.

**What section 8 reports.** Each of steps 1 to 3, met or not, with its readings. A failure is reported with the rollback you made, if you made one.
