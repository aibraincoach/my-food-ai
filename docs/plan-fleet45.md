# Fleet 45 — #222: the first feed photo at 2 seconds on the slow profile: what reaches it, measured (2026-11-18)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. **Nothing here touches production before the PM's merge order**, and after it only one open. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The PM's request of 2026-11-18 10:30Z: for #222, either reach the first feed photo at 2.0 s or less on the slow-network profile, or prove it cannot with numbers. The candidates the PM named are each measured below, and the planner says which to choose.
- **Order:** after Fleets 43 and 44.
- **Base:** main `b4cdaa4f08451851ee7f7f12139beb7ddd61f8cf` (Fleet 38 merged: lazy desktop photos).
- **Rule 4:** every measurement is local. Production gets one open after the merge.

## 1. What the planner measured (local, the frozen instrument)

- **Instrument:** Fleet 38's frozen script `measure-adapted.mjs`, sha256 `b21d477bf09dabb772fb6f2f398b1a4be63ea99bf6fe0c57edcc35a3abef7ffa`, unchanged. It is in `state/build/fleet38/operator/`.
- **Profile:** fresh cold open, 1.6 Mbit/s down, 150 ms latency, 390 × 844 at DPR 3, cache off, service worker bypassed.
- **Build and data:** a local build of `b4cdaa4f` on a throwaway stack, with six seeded meals.
- **The real photo:** a seventh, newest meal uses the busiest real photo, `eval/photos/10.jpg` (1280 × 1280). The noise fixture shrinks unnaturally at small widths (11.5 KB at 640 px), so it cannot judge a smaller file. `fleet45-measurements/p222-seed-real.mjs` is the seed.
- **Raw runs:** `/home/opc/.claude/plans/fleet45-measurements/*.json`.

**Where the time goes** (noise fixture, main, run `base-3`):
- The line carries about 200 KB/s.
- Before the 1200 px photo (170 KB) finishes at 3,242 ms, the browser also downloads 315 KB of scripts, 43 KB of fonts, 14 KB of styles and the 20 KB page.
- Chrome's slow-network emulation gives every request an equal share, whatever its priority. So the photo finishes only when nearly everything else has.
- **The two largest scripts:** 72 KB (React DOM) and 69 KB (the Supabase client, chunk `28dgwxsg`).

**First photo loaded, ms** (each run, in order):

| # | Variant | Photo bytes | Runs | Under 2,000? |
|---|---|---|---|---|
| B0 | main, noise photo (Fleet 38's case) | 170 KB | 3,790 / 3,467 / 3,243 | no |
| B1 | main, **real** photo, 1200 px | 207 KB | 3,681 / 3,926 / 3,971 | no |
| B2 | B1 with the Supabase client chunk blocked | 207 KB | 3,052 / 3,008 / 3,000 | no |
| B3 | B1 with **every script** blocked (the floor at 1200 px) | 207 KB | 1,851 / 1,874 | **just** |
| C1 | real photo at **640 px** | 65 KB | 2,933 (late start) / 2,097 / 2,192 | no |
| C2 | C1 with the Supabase client chunk blocked | 65 KB | **1,920 / 1,860 / 1,862** | **yes** |

**A fault both 640 builds showed:** the 640 px photo was **requested twice**, two 65 KB transfers at once. The two requests come from the fast first-card copy (`page.tsx`) and the feed's own card (`Carousel.tsx`). In main, one preload serves both. The planner's experiment changed the address list and lost that match: with or without the preload, both elements fetched.

So C1 and C2 carry an extra 65 KB on the line. **With one request, both would be faster.** The size of that gain is not measured.

**Sharpness on a 3x phone.** The image is drawn at 1,170 device pixels. Each width was compared to the original at that size (PSNR, mean over five real photos):

| Width | 640 | 800 | 1080 | 1200 |
|---|---|---|---|---|
| PSNR | 28.3 dB | 28.8 dB | 28.9 dB | 34.1 dB |

- 640 is about as sharp as **1080 was** (the size the app served before #372).
- 1200 is clearly sharper, because it is not stretched.
- 800 gains almost nothing over 640, for about 1.3 times the bytes (real photos, median: 37 KB against 29 KB; busiest: 97 KB against 63 KB).
- So the choice is 640 or 1200, not 800.

## 2. What this proves

- **At 1200 px, 2.0 s cannot be reached with any script on the line.** Even with every script blocked (B3), the real photo finishes at 1.85 to 1.87 s. Any shared script bytes push it over.
- **A smaller first photo alone is not enough, or only just.** C1's median is 2,192 ms with the duplicate. Without it, the result is unmeasured and probably close to 2.0 s.
- **A smaller first photo with the Supabase client off the line before it does reach 2.0 s:** C2 is 1.86 to 1.92 s, even carrying the duplicate.
- **A placeholder** (a tiny blurred copy shown at first paint, 0.5 to 0.8 s) is not the photo, so it meets #222 only if the PM rewrites the target. Not measured; it needs a stored preview per photo.
- **The server region** cannot move this test: the profile fixes the latency at 150 ms.
  - In real use, the owner in Indonesia reaches `iad1` (US East) for every uncached request.
  - Moving the app's functions nearer helps only if the database moves too. Home's server render makes about 15 database reads, some one after another, so functions in Asia reading a US database would be slower.
  - That is a hosting decision with its own cost, not a measurable lab candidate.

## 3. The recommendation

**Choose A then B, in that order, as two PRs. Stop after A if A meets the target.**
- **A, a 640 px first photo upgraded in place:** small, local to two components, and it removes the duplicate. Expected on its own: about 2.0 s, uncertain.
- **B, the Supabase client loaded after the first photo:** this is the step that makes 2.0 s certain (C2). It touches every Home client component that imports the client, so it is larger.

**If the PM prefers not to do B:** revise #222's target to "≤ 2.0 s on the 4G profile, ≤ 2.5 s on the slow profile", with these numbers as the reason.
- The 4G profile is already at 0.84 to 0.9 s on main (Fleet 38's ten-run sample).
- That is the planner's alternative, not its pick. The owner asked for 2 s, and B gets there.

## 4. PR A — branch `fix45/first-photo-640` — #222

**The change:**
1. **The first card only** starts with its 640 px file (`_640.webp`). Both the fast copy (`page.tsx`, `HomeFirstPhoto`, with its `preload`) and the feed's first card (`Carousel` with `priority`) use **exactly the same address and attributes**, so the browser makes one request.
   - **One shared reader decides it:** `firstPhotoSources(url)` in `src/lib/posts/feed-photo-url.ts` returns `{src, srcSet, sizes}`.
   - Both components and the preload use that reader, with no second copy of the attributes.
2. **The upgrade:** once the page has finished loading (`window` `load`, then an idle callback, with a 3-second limit), the first card's image swaps to the normal `feedPhotoSrcSet` (1200 px on a 3x phone). The 640 copy stays on screen until the sharp one has decoded (`img.decode()`), so there is no flash.
3. **Every other card** is unchanged.
4. **Rule 5:** this replaces the first card's current attributes. The old first-card `preload` and `srcSet` lines are deleted, not kept beside the new ones.

**Tests:**
- **The shared reader:** `firstPhotoSources` gives the 640 address and one candidate. Both components import it, and neither writes its own copy (a source check).
- **One request:** a browser check on the stack counts requests for the first photo's 640 address. **Met when it is exactly 1.**
- **The upgrade:** after `load`, the first image's current source is the 1200 file, and the 640 one was shown first.

**Measure** with the frozen instrument, the real-photo seed and the slow profile:
- A's build: **5 runs**.
- Main: 5 runs, the same hour, one build at a time.
- **Report, per run:** the first photo's load time (the 640 copy), the time the 1200 copy is shown, the first contentful paint, and the bytes before the first photo.
- **Met when A's median is ≤ 2,000 ms, and no run is over 2,300 ms.**

**If A is met:** do not start B. Report "A met", and stop at section 6.

## 5. PR B (only if A is not met) — branch `fix45/supabase-after-photo` — #222

**The change:**
- **Where it is loaded:** the Supabase browser client (`@/lib/supabase/client`) is no longer imported at the top of Home's client components. A single shared loader, `loadBrowserClient()`, imports it dynamically.
- **When:**
  - on the first photo's `load` event, or the window's `load`, whichever comes first, with a 3-second limit;
  - at once on any user action that needs it.
- **Rule 5:** every top-level import of the client in Home's client components goes. The components use the loader, with no fallback to a static import.
- **What changes for the person:** a tap that needs the database before the client has loaded waits for it (at most the remaining limit), then runs. Nothing fails silently.
- **Scope:** list each component changed in the PR body. If more than 12 files change, stop before B and report the count to the PM; the PM decides whether B goes ahead.

**Tests:**
- no Home client component imports `@/lib/supabase/client` at the top (a source check);
- the loader loads once and is shared;
- the existing Home tests pass.

**Measure** as in A, with 5 runs: A plus B, against main. **Met as in A.**

## 6. How it runs, and the stop

1. **Worktree** `/tmp/mfa-f45` from `origin/main`, with `npm ci`.
2. **Your own stack, outside the worktree:** `TEST_PORT_BASE=62660 TEST_PG_PORT=56949 TEST_STACK_DIR=/tmp/mfa-f45s TEST_ENV_FILE=.env.test.fleet45`. A stack folder inside the worktree breaks the Next build ("No such device or address" on the database's socket file).
3. **Checks:**
   - `npx tsc --noEmit`, and `npx eslint` on the changed files;
   - both suites once, with the built app started (10 minutes each);
   - the tests above.
4. **Review:** one PPLX review per PR on its final head (AGY if PPLX is unavailable). AGY rules on the visible upgrade from the 640 to the 1200 copy.
5. **Docs PR:** branch `docs/fleet45`, with this plan unchanged as `docs/plan-fleet45.md` and the measurement tables.
6. **Stop** when the PR or PRs and the docs PR are open and reviewed. Report to the PM in one message:
   - each PR's number, branch, final head (40 characters), checks and review;
   - the measurement tables, with every run;
   - met or not met;
   - the merge order: **A, then B if built, then the docs PR**.

**After the PM's merge order: production, once.**
- **Deployment:** wait for READY with the alias matched (at most 10 minutes).
- **One open,** as Fleet 38's production open: test account 2, a fresh native Chromium, 390 × 844 at DPR 3, the slow profile, with no baseline and no repeat.
  - Test account 2 needs a photo meal for the feed to show a photo. If it has none, post one first (one write, ledgered) and delete it after.
- **Report:** the first photo's load time, its request count (1) and the swap. One open is a reading, not a median.

## 7. Not in this run, and why

- **The placeholder:** it meets #222 only under a rewritten target, and it needs a stored preview per photo. It is listed for the PM.
- **The server region:** a hosting decision (functions and database together). It has no issue number.
- **React DOM (72 KB) and the Next runtime:** they cannot move.
