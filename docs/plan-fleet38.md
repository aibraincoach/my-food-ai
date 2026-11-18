# Fleet 38 — #222: ask for Home's first photo first, and stop phones downloading the desktop column's photos (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack, Vercel and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** Item 1 of the PM's packet of 2026-11-18 07:32Z (`qitem-20261118073219-8e5b5c716f2279ba`), from Fleet 35's production result (`state/build/fleet35-postmerge/report.md`, P1). It has one code PR and one docs PR, three local checks, one stop before the merges, and one production section after the PM's merge order. Planned from main `4b8988e890f22af76bba80b158ece5abb22a8411`.
- **No overlap:** Fleets 37 (`src/lib/fdc/`, `scripts/numbers/`), 39 (#987) and 40 (#1075) touch none of this plan's files.
- **One overlap, Fleet 41 (#1082):** if its fix lands in `src/components/NeedsInputStrip.tsx`, that file is not touched here either.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and section 9's waits add up to at most 30 minutes.

## 1. What holds the first photo back: measured, not guessed

The planner reproduced Fleet 35's miss on a local stack built from `4b8988e8`, with a seeded feed of six photo meals (each like Fleet 35's: 2560 × 1920 noise JPEG at quality 90). The instrument is Fleet 35's: fresh Chromium, 390 by 844, DPR 3, cache disabled, service worker bypassed, 150 ms latency, 1.6 Mbit/s down. The instrument file is `fleet38-measure.mjs` (section 2).

**On main**, the first photo (`_1200.webp`, 175 KB) loaded at **3,799 ms and 3,572 ms** (production: 4,475–4,546 ms). Before it finished, these finished:

| What | Bytes | When requested | Why it is there |
|---|---:|---|---|
| 22 script chunks | 305 KB | 370 ms, before the photo | The page shell names them in its first bytes. The biggest: React DOM 71 KB, the Supabase browser client 68 KB, the Next runtime 36 KB |
| **Five 640 px photos** | **56 KB** | 609 ms, **before the photo** | **The desktop-only "Today" column** (`DesktopToday.tsx`, `hidden … desktop:flex`) is in the phone's HTML. A hidden image still downloads unless it is lazy |
| Three Manrope faces | 42 KB | 819 ms | Text uses them; they already have `preload: false` |
| Styles | 14 KB | 362 ms | Needed to draw |

**The photo is asked for late:** its request starts at 600–880 ms. Home's HTML names the photo only once the server has read the feed (`HomeFirstPhoto`'s `preload`, `src/app/(tabs)/page.tsx` line 121), and the shell's scripts were already being requested at 370 ms.

**What each cut is worth**, measured by blocking that group in the same instrument:

| Run | First photo loaded |
|---|---:|
| main | 3,572–3,799 ms |
| no scripts | 2,734 ms |
| no fonts | 3,320 ms |
| no desktop photos | 3,383 ms |
| **only the page and the photo** (the floor) | **1,904 ms** |

**The floor decides the target.** With this fixture photo (169–175 KB, near the worst case: real food photos from `eval/photos` are 49–171 KB at 1200 px), 1.6 Mbit/s cannot show it in 2 seconds even with nothing else on the line.

**Chrome's throttle shares the line evenly** between requests, whatever their priority. It therefore shows a request that starts first, but not a server sending a high-priority image ahead of low-priority scripts, which a phone's real HTTP/2 connection can do.

**At a 4G-like profile** (70 ms, 9 Mbit/s) the patched build loads the first photo at 1,463 ms cold and 1,112 ms returning, and first paint is at 288–452 ms. At 1.6 Mbit/s first paint is 488 ms. "The feed shows something within 2 s" is therefore already met locally.

**This fleet's change, measured** (three opens each, same instrument, patched build):

| Open | First photo loaded | Its request started |
|---|---|---|
| **Returning** (the person's own cookies kept, cache cleared: the owner's case) | 3,306 / 3,256 / 3,360 ms, median **3,306** | 167–282 ms |
| **Fresh profile** (no cookie) | 3,617 / 3,225 / 3,236 ms | 263–880 ms |

No desktop photo downloaded in either.

**The remaining lever, not in this fleet:** the 305 KB of scripts (section 10).

## 2. Facts the planner checked, and premises

- **Code read** on `4b8988e8`:
  - **Home:** `src/app/(tabs)/page.tsx` (`homeSeed`, `HomeFirstPhoto` and its preload), `src/components/DesktopToday.tsx` (the desktop column's `<img>`), `src/lib/posts/days.ts` line 70 (its 640 px address) and `src/lib/posts/feed-photo-url.ts`.
  - **Around it:** `src/middleware.ts` (Home sets `Cache-Control: private, no-store` for a signed-in person) and `src/lib/theme/font.ts`.
- **Attached**, in `/home/opc/.claude/plans/`. Check each hash; a file that does not match is void, and so is its PR.
  - `fleet38-first-photo.patch` (the PR), sha256 `0f95946158f96e03c341939ec05e5024a73be9989bb2947b548878de053ff821`.
  - `fleet38-measure.mjs` (the instrument), sha256 `f23097464375dd7e3ca643f090f967eee4f398ac4d4cbdddb4f5929fc6279618`.
  - `fleet38-seed.mjs` (the local feed), sha256 `1abfa45daf8882785dd3ad1f9968af276e5d73cf4c9e26d79bb8f28067c9cfc3`.
- **Verified on the planner's worktree:** `npx tsc --noEmit` is clean. The new `tests/first-photo-hint.test.mjs` passes 2 of 2. `npx eslint` on the changed files shows one error, `prefer-const` at `DesktopToday.tsx` line 16 (`slowTimer`). It is on main already and is not this change; leave it alone.
- **Not run by the planner:** the suites.

## 3. The code PR — branch `fix38/first-photo-first` — #222

Apply with `git apply /home/opc/.claude/plans/fleet38-first-photo.patch`. What it changes:

- **`src/lib/posts/first-photo-hint.ts` (new):** cookie `mfa-first-photo` holds `<person's id>|<the first photo's /p/…_1080.webp address>`.
  - **`firstPhotoCookie`** writes it (7 days, `samesite=lax`, `secure` on https), or clears it when there is no usable photo.
  - **`firstPhotoLinkHeader`** turns it into `Link: <…_1080.webp>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous; imagesrcset="…640w, …1080w, …1200w, …1600w"; imagesizes="(min-width: 1024px) 520px, 100vw"`.
  - **It refuses** a different person's cookie, anything that is not a `/p/` photo address, and undecodable text.
- **`src/components/FirstPhotoMemory.tsx` (new):** a client component that writes the cookie for the photo Home's first card shows.
- **`src/app/(tabs)/page.tsx`:** `HomeFirstPhoto` keeps the person's id from `homeSeed` and renders `FirstPhotoMemory` inside the first-photo seed.
- **`src/middleware.ts`:** for `/` and a signed-in person, it appends that `Link` header next to the existing `Cache-Control`. The response's headers leave before any of the page, so the photo is asked for first.
- **`src/components/DesktopToday.tsx`:** the desktop column's meal photos get `loading="lazy"`, so a phone, where that column is hidden, never downloads them. Desktop is unchanged: the column is visible there, so lazy images in view load at once.

**Why a cookie and not the page.** Home's HTML is a prerendered shell with the feed streamed in later. Only the request knows which photo will be first, and only from the last visit. A new meal posted since then is the first photo instead. The remembered one then costs one wasted photo download, and the new one is still preloaded by the page as today. L2 measures that case.

**AGY reviews** in place of the owner: the cookie's contents (a person's id and a public photo address, never sent to another site), and whether "remember the first photo for 7 days" is acceptable.

## 4. How it runs

1. **Worktree** `/tmp/mfa-f38` from `origin/main`, with `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61760 TEST_PG_PORT=56049 TEST_STACK_DIR=/tmp/mfa-f38/stack TEST_ENV_FILE=.env.test.fleet38`. Keep the stack directory path short: a long one fails, because Postgres's socket path has a 107-byte limit.
3. **Checks:** `npx tsc --noEmit`, `npx eslint` on the changed files, and both suites once with the built app started (10 minutes each).
4. **Review.** One PPLX review on the final head (AGY if PPLX is unavailable), plus AGY on section 3's two questions.
5. **Local checks** L1 to L3 (section 6).
6. **Docs PR.** Branch `docs/fleet38`, with this plan unchanged as `docs/plan-fleet38.md`.
7. **Stop** (section 7).

## 5. The target, stated

All figures use the instrument in section 6, three opens each, reported as each value and the median.

| # | Measure | Main (planner, local) | Target, local | Target, production |
|---|---|---|---|---|
| T1 | First photo's request start, returning open | 600–880 ms | ≤ 300 ms | ≤ 400 ms |
| T2 | Desktop-column photos downloaded on a phone | 5 (56 KB) | 0 | 0 |
| T3 | First photo loaded, returning, 1.6 Mbit/s and 150 ms | 3,572–3,799 ms | median ≤ 3,400 ms | median at least 400 ms below the same-day main baseline |
| T4 | First photo loaded, returning, **4G-like 9 Mbit/s and 70 ms** | (not measured on main) | median ≤ 1,500 ms | **median ≤ 2,000 ms: the issue's own target** |
| T5 | First contentful paint, 1.6 Mbit/s | 488 ms (patched; main not measured) | ≤ 1,000 ms | ≤ 2,000 ms |

**T3 does not ask for 2 seconds**, because the floor in section 1 (1,904 ms with nothing else on the line) makes that impossible with this photo at this speed. T4 is the phone over mobile data that #222 describes. Each production row is measured against a main baseline taken the same hour (section 9), because production's server time varies by day.

## 6. The local checks

All three use `fleet38-measure.mjs` and `fleet38-seed.mjs`.
- **Setup:** copy both into the worktree root (they import `./scripts/lib/…`), seed once with `node fleet38-seed.mjs <worktree>`, and run each measurement as `QUIET=1 node fleet38-measure.mjs <label> 1 <port>`.
- **Profiles:** `RETURNING=1` visits Home once to set the cookie, clears the cache and opens Home again. `LAT=70 DOWN=9000000` is the 4G-like profile.
- **Each run** writes `/tmp/mfa-p222/<label>.json`: every request with bytes, priority, start and end, the resource timings, and the paint entries.
- **Make the output directory first:** `mkdir -p /tmp/mfa-p222`, or edit the path in the script and say so.

The checks:
- **L1, before and after.** Build main and the PR from the same stack, one at a time. For each build, take three runs each of:
  - fresh profile at 1.6 Mbit/s;
  - `RETURNING=1` at 1.6 Mbit/s;
  - `RETURNING=1` with `LAT=70 DOWN=9000000`.

  Report T1 to T5 per build: each value, the median, and the bytes by kind that finished before the photo (scripts, styles, fonts, 640 px photos). Met when the PR's local targets in section 5 hold.
- **L2, a new meal since the last visit.** After a returning open, add a new photo meal with the seed's code (one meal, newest), and open Home again with `RETURNING=1` (the cookie names the old photo). Report:
  - whether the old photo was still downloaded, and its bytes;
  - the new first photo's load time, against L1's returning median.

  This is a measurement, not pass or fail. If the new photo is more than 500 ms slower than L1's returning median, say so for the PM.
- **L3, another person.** Sign in as test user 2 in the same profile, without clearing cookies. Open Home and record the response's `Link` headers. Met when none names user 1's photo.

## 7. The stop

Stop when the code PR and the docs PR are open, the code PR is reviewed or reported "written, not reviewed", and L1 to L3 are reported. Report to the PM in one message:
- the PR's number, branch, final head (40 characters), checks and results, and review (with AGY's two answers);
- the two suites' counts;
- L1's table, L2 and L3;
- anything void under section 2;
- the merge order: **the code PR, then the docs PR**.

Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. (Reserved.)

## 9. After the PM's merge order: production, test account 2

As Fleet 35's section 9:
- **Browser:** fresh native Chromium with CDP at 390 by 844, DPR 3, signed in as test account 2.
- **Writes:** app-origin writes and media uploads for test account 2 only; service workers bypassed.
- **The ledger:** record every post id.
- **Cleanup at the end:** delete each post and its rows and files, and read them back as absent.

Steps:
1. **Baseline, before the merge.** On the deployment that is live before the merge (main), make P1's meal as in Fleet 35: the 2560 × 1920 noise JPEG, "Roast beef with gravy", wait until ready (at most 240 seconds). Take three runs of each of L1's three profiles with the measuring script's production mode. The script refuses a non-loopback address as written. Change only its address guard to your production browser core's guard, and keep everything it records. Wait at most 10 minutes for all nine.
2. **Merge**, wait for the deployment to be READY with the alias matched (at most 10 minutes), and check the served build marker.
3. **After.** The same nine runs on the same meal, within the same hour as the baseline.
4. **T1 to T5:** report each against section 5's production targets and against the baseline.
5. **The header itself:** on one returning open, record the `Link` header of `GET /` and confirm it names the meal's `_1080.webp` address.
6. **Cleanup.**

**What section 9 reports.** One row per target, met or not met, with all numbers, plus the cleanup count.

## 10. Not in this run, and why

- **The scripts (305 KB before the first photo).** On this profile they are the largest remaining cost: blocking them all moves the photo from about 3.6 s to 2.7 s. The movable part is the Supabase browser client (68 KB), which every Home client component imports at its top. Moving it behind a dynamic import that starts after the first photo loads is a change across Home's client components, larger than this fleet. React DOM (71 KB) and the Next runtime (36 KB) cannot move. Planned only on the PM's word, as its own fleet.
- **After the first photo** (not on the first photo's path):
  - each card reads its own feedback, so `post_feedback` is requested 10 times for six cards (`ThumbsFeedback.tsx`, `Thread.tsx`);
  - `/api/feed` is read twice right after hydration (about 10 KB each);
  - the tab bar prefetches `/search`, `/days` and `/profile`;
  - the second card's 1200 px photo loads eagerly.

  They affect what follows, not the first photo. A batched feedback read is the clear one for a later plan.
- **The server's region.** Production answered from `iad1` (Fleet 35's `x-vercel-id`), with the owner in WIB. A phone in Indonesia pays that round trip on every uncached request. Measuring or moving it is a separate decision with no issue number here.
- **AVIF.** It saves 9–43% against WebP at 1200 px (planner's test on the fixture and `eval/photos` 01–03), but encoding takes 3.0–6.6 seconds per photo on the first request. Not worth it.
