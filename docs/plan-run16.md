# Fleet 16 plan: the November 4 evening paste (fifteen items), design zip 6.2 and the owner's screenshots

Written 2026-11-04 (observed 10:56–11:30 UTC) against `origin/main` `376e3306942161a5e659e8d99c85154c8ac26a35` (Fleet 14 #559–#566 and #581 merged; migration 0052 applied), following `docs/planner-contract.md` including its "Nothing without a use" section. **This checkout (`run13/docs`) is behind main for `src/`, `public/` and `tests/`; every find-text below was read from `origin/main` with `git show` this session, and every worktree is cut from `origin/main`.** Fleet 15's code PRs #582–#590 are open on `run15/*` (created 10:27–10:37 UTC) and are not part of this plan; section "Dependencies" says which files they share with this fleet. Docs PRs #577 (`run14/docs`, draft, head `eeba864c`) and #558 (`run13/docs`) stay open and untouched; no docs merge is ordered here.

**Stops: zero. No legal halts. No waiting.** One prompt to the end. Where a find-text does not occur exactly once, the coder re-reads the current file on its branch and applies the same change to the current text; it never stops. No item asks the owner anything. **Nothing here runs for hours:** every reading is one measurement taken when the work is done, and each names the decision it feeds (section 10). No observation window, sampler or collector exists in this plan.

**How the fleet runs.** All ten code lanes start together, one coder subagent per lane in its own worktree cut from the current `origin/main`; nothing stacks. Lane C opens its PR before any other lane opens one, so it carries the lowest Fleet 16 number and merges first (reading M3 needs a later deployment after it). Reviews run beside each build and never block it. Merges come last, in ascending PR number, each at the exact head that holds a counting review with green checks, and only after the Fleet 15 PRs that share a lane's files have merged or closed (section "Merge order across Fleet 15 and Fleet 16"). There is no migration in this plan: photo sizes are already stored (F15), and Fleet 15's #588 holds 0053–0055, so the next free number is 0056 for whoever needs one. Lane J's one-time size backfill is a production data write under the same authorization Fleet 13's sugar backfill used, run only for the rows reading M9 names. A defect found after a merge goes on the backlog; the merge is not reverted. The recording hold (no merge or deployment between a recording-start notice and submission) is a standing owner rule the coder reads; none has been received.

**Production sign-in is authorized for the readings in section 10**, as Fleets 14 and 15: designated test account 2 through `scripts/lib/session.mjs`, never the owner's or the demo account; no new production posts are needed by this plan; previews are reached with the retained Fleet 14 Protection Bypass secret, which is permanent reviewer/coder access and is never revoked, regenerated or listed for revocation.

**Review: which route works today and who runs it.** The coder runs every review; Muse is out of quota until November 9 (PM, this evening) and is not a route for this fleet. State of this machine at 11:05 UTC (F13): the original authenticated Firefox is running on display :10 with `--remote-debugging-port=9223`, the BiDi listener answers on 9223, and the nine Fleet 15 PPLX captures in `docs/reviews/` (`mfa-pplx-pr582…pr590`) are all the same three-line failure, "No input found during live page inspections (11.0s); inspect browser/authentication": that is REVIEW_POLICY route 2's symptom (a stale `cf_clearance` or a Cloudflare page in the profile), not a PPLX outage, and the owner has run PPLX on his own laptop today. The order, per PR, with exact commands:

1. **PPLX, route 1 (the runner, this machine).** `node tools/mem-guard.mjs <tabs>`; `export PPLX_TABS=<n>; eval "$(scripts/pplx-firefox.sh)"`; `node tools/pplx-review.mjs --tabs <n> <PR URL> … --out docs/reviews`. The submission is exactly `code review <PR URL>` and nothing else (the 19:08 WIB Wall entry). A capture that reads "No input found" is route 2's case, not a review.
2. **PPLX, route 2 (cookie refresh).** Inspect the page the runner saw (its screenshot or BiDi snapshot); when it is Cloudflare's "Just a moment…" or the composer never shows `#ask-input`, bring the same Firefox profile to the owner's display :10 visibly, post one line to the owner naming the PR batch and asking him to pass the check in that window, and re-run route 1 the moment the check is passed. Never copy the profile; never substitute Chromium or Playwright.
3. **PPLX, route 4 (the other OCI server).** The same runner there, with the same submission text.
4. **AGY (`/home/opc/.local/bin/agy`, `scripts/run-agy-pr.sh <PR>`, model `gemini-3.8-flash-high`, 45 m).** Only after routes 1, 2 and 4 each produced a live attempt in this session with its exact error pasted in the PR comment. Exit 0 clean; 3 blockers (fix, re-run on the new head); a second exit 2 or 4 makes AGY unavailable for that head.
5. **The owner's laptop.** The prompt at the very end of this plan is handed to Sonnet on the owner's laptop; it submits `code review <PR URL>` on Gemini 3.8 Flash in the laptop browser for the PRs the coder lists as unreviewed, checks the model on the thread after submission (REVIEW_POLICY route 3's model rule), and posts the receipt. The coder's final report lists, per PR, which route produced the counting review and, for every route that failed, the exact text submitted and the exact error.

A PR merges only at a head holding a counting review (PPLX, AGY, or the laptop receipt) with green checks; a PR without one is left open with its state on the report and in the laptop prompt's list. Codex is used only when PPLX and AGY both failed live and no commit on the head was written by an OpenAI model. Real findings are fixed inside the review loop on the same branch and re-reviewed on the new head by the same route. A head refreshed from main with no code change of its own needs no new review (owner ruling, November 2). The coder also runs its own review subagent beside each build and fixes what it finds; that never counts. The docs lane gets no review.

## 0. The whole pasted list, item by item

| Item | What the paste asks | State today (GitHub `gh issue list`, 2026-11-04 10:58 UTC; code read from main) | This plan |
|---|---|---|---|
| #592 arrow over "kcal" | No arrow covers text on any slide at 1100/1280/1440 and on a phone | OPEN. Cause found (F1): the feed carousel's 32 px arrow at 12 px inset ends at 44 px; the card's text starts at 41 px on the 500 px desktop column. The post detail's own arrows (36 px at 12 px) overlap the card at phone width too | **Built, lane A** |
| #593 outlined first post | Nothing outlined on load; outline after the first J, K or Tab; a click hides it; live at 1280×800; owner confirms | OPEN. Cause found (F2): `DesktopWorkspace` marks the first card when nothing is focused | **Built, lane B**; owner confirmation stays his |
| #598 old build until hard refresh | A browser holding the previous build shows the new build on its next normal load; check recorded | OPEN. Cause in code (F3): `sw.js` never changes between deploys, so the installed worker and its cached `/shell` of the old build stay; the `/` navigation serves that shell whenever the network loses a 1.5 s race (the mechanism Fleet 14 reproduced on production) | **Built, lane C**; one reading on production after the merge |
| #594 where a photo is saved | Toggle in personal settings with an explanation of each mode; Save photo via the share sheet in app-camera mode; the phone's camera app in the other mode; the default stays today's camera; owner flips it on his phone | OPEN. Nothing built: no `navigator.share`, no settings toggle beyond the Muse Spark Open switch; a hidden `capture="environment"` input already exists as the no-stream fallback (F4) | **Built, lane E**; the share sheet and camera roll on real phones are the owner's checks |
| #599 Today column late | Numbers within 2 s of opening at 1280×800 on the owner's desktop; check recorded | OPEN. Cause found (F5): the column renders nothing on the server (`if(!desktop)return null`), the Suspense fallback is `null`, and on the owner's day (6 posts today, one food unavailable) the page-derived seed is null, so the column waits for a browser fetch of `/api/days` after hydration | **Built, lane D**; one timed reading each way on production after the merge |
| #580 nine undersized controls | Each named, resized or filed; a second audit finds none | OPEN. The nine are named in `run14-report.md` and its evidence (F6) | **Built, lane F**, second geometry audit in section 10 |
| #595 no revoke line in the Fleet 14 plan | The coder confirms at the final head of `run14/docs` before #577 merges | OPEN. Checked this session (F7): head `eeba864c`, three "revok" lines, all retain statements | **Lane I** records the same grep at the head current when the report is written; no code |
| #596 Caesar without dressing | The Caesar case matches a record with dressing; the other 17 still pass | OPEN. Cause (F8): nothing in code rejects a reference whose description explicitly leaves out a component the target has not excluded; the prompt line about exclusions is advisory and the model took FNDDS 2706818 "…no dressing" | **Built, lane G**; one run of the 18-case real gate decides |
| #597 five new lint warnings | Lint ≤ 6 warnings, suite passes | OPEN. The five are listed with their lines (F9) | **Built, lane H** |
| #370 camera stays open | Sheet closes within 1 s on a throttled connection; post at top in processing state; failed upload shown | OPEN (reopened for owner-phone acceptance). All three behaviours are on main (#505, #563: the sheet closes once the local write is acknowledged; the feed shows the uploading card with "Uploading photo…" and "Not posted yet. The photo is kept on this phone." on failure) | Nothing to build. The owner's phone over mobile data is the done condition (owner list) |
| #222 feed and first photo in 2 s on the owner's phone | On the owner's phone over mobile data | OPEN | Nothing new to build; the owner's phone. Lane C removes one way a phone can be shown an old shell |
| #372 feed photo bytes | Bytes before/after in docs; first photo in 2 s on mobile data; same look | OPEN. The feed serves resized WebP copies (v1 512 px, v2 1920 px, immutable); Fleet 15 lane A (#590) adds the 2x/3x copies and re-measures bytes | Nothing to build here; Fleet 15 measures; the owner's phone |
| #455 drink pictures | Coffee, 500 ml water as two cups, cocktail, wine each with their own picture, on three phones | CLOSED on GitHub; built (`DrinkPicture`, `drinkGlyph`, `waterCups`) | Nothing to build; the owner's three phones |
| #456 cocktail caffeine | No caffeine on a cocktail or wine; day total leaves it out | CLOSED on GitHub; built (`alcohol.ts` keeps USDA caffeine only when the name names a caffeine source) | Nothing to build; the owner's three phones |
| #457 alcohol shown | Grams and standard drinks on the post and in Today; not in the water tile | CLOSED on GitHub; built (`card-data.ts`, `summary-line.ts`, `hydration.ts`, `IntakeSheet`) | Nothing to build; the owner's three phones |
| Photo box (added after the paste; design 7f per the PM's description, the frame is not in zip 6.2) | Each photo's width and height saved at upload; every photo box takes its shape before any image loads; never cropped, no bars; capped at 680 px tall on desktop and 80% of the screen on a phone; the quick preview and the full file share one box and one fit; the designer did not say what happens to older posts | Not built on the read side: every upload already stores width and height (F15), but the feed never reads them, so the quick frame starts square and measures the loaded image (the crop-then-zoom and the 390→520 jump the owner saw three times); the desktop window is a fixed 640 px column with bars | **Built, lane J**; sizes still missing on old rows are backfilled once (reading M9); overlaps #590 and merged #581 (merge order section) |
| Servings fraction (added after the paste) | The Servings control on a meal accepts 0.5 and 1.5; every nutrient, Home, Days and Today scale to match (Cal AI's editable "1 ✎" count is the exemplar) | The − / + control already steps by 0.5 on a quarter grid (0.25–50) and the server rescales every item, so 0.5 and 1.5 are reachable by stepping; the count cannot be typed (F16) | **Built, lane K**: the count becomes a typed field as in the exemplar, on the same route and rescale |
| Photo-box measurement (added after the paste) | Measuring the live photo box on production | Done and recorded by the owner's note | Nothing to build or measure; no lane |

## Facts (checked this session; the coder does not re-check facts, only the find-texts)

- **F1 (#592).** `src/components/Carousel.tsx:90` renders both arrows as `absolute left-3 top-1/2 hidden size-8 -translate-y-1/2 … desktop:flex` (and `right-3`), visible on hover or focus at ≥1024 px: the left arrow spans x = 12…44 px. The card slide is `LiveNutritionCard` → `ResultsCard` at the column width; `ResultsCard.tsx:36,47` scale the 3n layout by `size/390` with `padding: 32 × scale`, so on the 500 px desktop column the content starts at ~41 px and "kcal" (line 57, under the big number, vertically centred by `space-between`) sits under the arrow. `OutlineOverlay.tsx:180` (post detail page and desktop window) has its own always-visible arrows, `absolute left-3 top-1/2 size-9` (12…48 px), over the same `ResultsCard` (line 179, `size={width}`): at phone width (390, padding 32) they also cover the first letter. Below 1024 px the feed card shows no arrows at all. `tests/results-card-layout.test.mjs` asserts nothing about padding.
- **F2 (#593).** `DesktopWorkspace.tsx:16` `const [focused,setFocused]=useState<string|null>(selected);` (null without `?post=`); lines 54–58 mark `data-focused="true"` on the card whose id equals `focused ?? first card`, re-applied by a MutationObserver; `globals.css:41` draws `outline:2px solid var(--color-text); outline-offset:8px` for `[data-desktop-post][data-focused="true"]` at ≥1024 px. Lines 59–72: J/K step with `(index<0?0:index)+step`, so with nothing focused J lands on the second card; Enter with nothing focused opens the first card. `onFocusCapture` (line 73) sets `focused` to any card that receives focus (Tab or click); nothing ever clears the outline except a deleted selected post. No test covers `data-focused`, J/K or Tab.
- **F3 (#598).** `public/sw.js:1` `SHELL_CACHE = "my-food-ai-shell-v4"`, a hand-edited constant; no build id anywhere in the file. Install (lines 84–104) caches `/`, `/shell`, the manifest and up to 64 `_next/static` files named by the shell; activate (105–111) deletes other-named caches and claims clients; `_next/static` is served cache-first (253–256); a navigation to `/` races the network against a 1500 ms timer and serves the cached `/shell` for a signed-in user with an active media session when the timer wins (263–278). `ServiceWorkerRegistration.tsx:17` registers `/sw.js` with no `update()`, no `controllerchange` handling and no reload. `next.config.ts` has only `cacheComponents`, `partialPrefetching` and the Tailwind turbopack rule; no `headers()`, no `generateBuildId`. `package.json`: `"build": "next build"`, `"prebuild": "node scripts/build-tokens.mjs"`. `tests/sw-media-cache.test.mjs` fakes `self` with only `location.origin` (line 17) and a cache with `keys()`/`delete()` (line 15); its install test asserts three stored entries in `my-food-ai-shell-v4` (line 133). Browsers refetch a worker script on navigation and treat a different script URL as a new worker, so `?b=<build>` on the registration URL installs a new worker per build without touching the file's cache names.
- **F4 (#594).** `CaptureSheet.tsx:531`: `<input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" … onChange={… addFiles …}/>`; `takePhoto` (358–371) clicks it when there is no stream (`if (!stream || !videoRef.current) { cameraRef.current?.click(); return; }`). `cameraEnabled` (line 164) is `mode !== "text" && (!composer || takingPhoto)`. The viewfinder (lines 497–501) shows `<Icon name="camera"/>` when there is no stream and no latest shot. `addFiles` (307–356) stages the file and opens the composer. Shots are `{file, previewUrl}` (line 331); `photoIndex` state is at line 51. `LightComposer.tsx` has two layouts: desktop rows (lines 67–70, `Switch` rows of 56 px) and phone rows (lines 129–133, 52 px rows with a leading icon). No `navigator.share`, `canShare` or `<a download>` exists in `src/`. `globals.css` sets no `-webkit-touch-callout`. The only Profile setting is `IdentifyProviderSwitch` (`profile/page.tsx:44`), a client switch section with a one-line explanation. Icon names available: `thumb-up thumb-down comment log-again bookmark chevron-right clock photo-add pin entry-camera entry-text entry-drink entry-coffee home search plus days profile close back chevron-down camera flip thumb mic`.
- **F5 (#599).** `DesktopToday.tsx:13` `if(!desktop)return null;` with `useDesktop`'s server snapshot `false` (`use-desktop.ts:5`), so the server never renders the aside even when `initial` is present; the aside itself is already `hidden … desktop:flex` (line 16). Line 12 fetches `/api/days?date=…` on mount when `initial` is undefined and on `post-settled`/`post-deleted`/`post-restore`/`intake-changed`. `page.tsx:114` wraps `HomeToday` in `<Suspense fallback={null}>`; `HomeToday` (line 110) awaits `homeSeed()` (the shared 6-post first page, line 99–104) and derives `initial` with `todayFromPage`, which returns null when the page cannot prove today complete (no post eaten before today and a next cursor) or any of today's posts has `itemsUnavailable` (`today-view.ts:11–14`); `itemsUnavailable` is set when a ready post's items were not read (`feed.ts:258`). `/api/days?date=` (`api/days/route.ts:20–21`) answers with `getDays(db,user.id,zone,date,date)[0]` or an empty day; `LoggedDay` (`days.ts:7`) carries the same `posts[].{id,caption,eatenAt,photoUrl,items,totals}` and `totals` the column reads, plus `intake`. `homeReader` (26–32) is request-cached. `page.tsx:22` imports `dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone` from `@/lib/posts/days`; `sumNutrition` is not imported there. `tests/desktop-review.test.mjs:10–22` calls `DesktopToday` without `initial`.
- **F6 (#580).** `origin/run14/docs:docs/run14-report.md:89,141,158,165–168,172` and `docs/evidence/run14/control-scope-final.md`: caption **More** 37.18×19.6 (`PostCaption.tsx:10`, `absolute bottom-0 right-0 bg-surface pl-1`); saved-meal **Log now** 79.12×34 (`SavedMealsSheet.tsx:10`, `h-[34px] … rounded-[17px]`, in a `min-h-[84px]` row); bottom-bar **+** 34×34 (`BottomBar.tsx:37`, `size-[34px] … border-[1.5px]`, inside a 46 px cell); **Photo/Text/Barcode tabs** 36 px high (`ModeStrip.tsx:84–86`, `h-9` tabs in a `top-1` track inside an `h-11 overflow-hidden` tablist); **capture Caption field** 358×42 (`LightComposer.tsx:123`, phone `textarea rows={2}`); **Drink description** 260×21 and **Search field** 294×21 are the inner `<input>` of a 48 px `Field` (`ui/Field.tsx:16–17`, `h-field-h` = 48) and of the 44 px search label (`SearchBox.tsx:19`, `h-tap`): the box is tall enough, the input element measured is not.
- **F7 (#595).** `git show origin/run14/docs:docs/plan-run14.md | grep -n -i revok` at head `eeba864c8e54c562f9a76cf90872187d172564ab` (11:02 UTC) returns exactly three lines (5, 502, 682), each a retain statement ("never revoked or removed", "Retain the protection-bypass secret permanently", "retained permanently … never revoked or removed"). `origin/run14/docs` also changes `AGENTS.md`, `CLAUDE.md`, `REVIEW_POLICY.md`, `WALL_OF_STUPID.md`, `docs/planner-contract.md` and 148 files in all (`git diff --stat origin/main...origin/run14/docs`).
- **F8 (#596).** `scripts/fixtures/food-matching.json:242–259`: name "Grilled chicken Caesar salad with croutons", caption "Caesar salad", `requires [["chicken"],["caesar"]]`, `rejects ["no dressing","without dressing","dressing only","fried chicken"]`; `scripts/real-food-match-smoke.mjs:15` passes a case by substring checks on the chosen description. `match.ts:59–70`: every search result with a gram basis and nutrition enters `eligible`; the model chooses (`choose`, lines 41–56) with `MATCH_INSTRUCTIONS` whose line 19 says an explicit exclusion conflicts with the target's component; no code enforces it. Fleet 14's receipt (`docs/evidence/run14/food-match-real.json`) shows the selection: FNDDS 2706818 "Chicken or turkey caesar garden salad, chicken and/or turkey, lettuce, tomato, cheese, no dressing", after lookups `Grilled chicken Caesar salad with croutons` and `+grilled +chicken +caesar +salad +with +croutons`. `approximate.ts:35` filters closest-generic candidates by `GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f)`. `tests/fdc-reference-search.test.mjs`, `tests/fdc-match-response-budget.test.mjs` and `tests/analysis-integrity.test.mjs` drive `matchFood`/`resolveFoodMatch` with stubbed dependencies.
- **F9 (#597).** ESLint on main: 0 errors, 11 warnings; the five new ones: `scripts/lib/cdp.mjs:6:126`, `scripts/run14-control-table.mjs:18:166`, `scripts/run14-production-checks.mjs:13:234` (`no-unused-expressions`, each a ternary used as a statement), `src/components/PostOpenTransition.tsx:49:74` (`@next/next/no-location-assign-relative-destination` on `window.location.assign('/')`), `tests/food-estimate.test.mjs:10:101` (`no-unused-vars`, `init`). The six older warnings (`DaysView.tsx:196`, `LogAgainSheet.tsx:29`, `SavedMealsSheet.tsx:10`, `SearchBox.tsx:28` img elements; `tests/agent-tokens.test.mjs:6`, `tests/feed-nutrition.test.mjs:61` unused vars) predate Fleet 14 and stay.
- **F10 (design 6a, zip 6.2).** The 6a text now reads: "Nothing is selected on load, so the feed opens with no outline. The outline appears only after the first J, K or Tab, and a mouse click on the page clears it." The hit list adds "Feed runs edge to edge, update Nov 4 4:41 PM: … the page in the browser is not main. Either the Vercel production deployment is stuck on an older commit or the service worker is serving an old cached shell." The designer's `github.md` says the project was synced from main at 09:48 UTC. No frame changes the card arrows or the numbers card.
- **F11 (owner screenshots).** 16:47 WIB (new build): the first post carries the thick outline; the Today column is present with 1,468 kcal and six posts; the unavailable-food line sits under the column. 16:41 WIB and 11:06–11:08 WIB (old build): the "* Known nutrition shown…" footnote and a full-width post. 14:48 WIB phone: the old build's footnote on a phone, with the day rings already present.
- **F13 (reviews, this machine, 11:05 UTC).** `pgrep -a firefox`: `/usr/lib64/firefox/firefox --no-remote --profile /home/opc/.mozilla/firefox/<profile> --restore-last-session --remote-debugging-port=9223` is running; `/dev/tcp/127.0.0.1/9223` opens. `docs/reviews/mfa-pplx-pr582-dc07c47.md` … `mfa-pplx-pr590-aa4b31c.md` each hold three lines: the head at submission and "No input found during live page inspections (11.0s); inspect browser/authentication". `/home/opc/.local/bin/agy` and `/usr/bin/antigravity` exist; `scripts/run-agy-pr.sh` and `scripts/review/agy-review.mjs` are on main; `config/agy-review-policy.json` names effort high. The run15-docs worktree's Wall entry (19:08 WIB) records that the #582 run was discarded because the coder submitted a prompt of its own instead of `code review <PR URL>`.
- **F14 (Fleet 15 heads).** At 11:08 UTC `gh pr view` shows #585 at `5887f56`, #587 `bb354b5`, #588 `223bf70`, #589 `911c33b`, #590 `69a216b`, all past the heads their PPLX captures name (`dc60980`, `03b29ae`, `5b785d4`, `9ff7281`, `aa4b31c`); #582/#583/#584/#586 are unchanged (`dc07c47`, `e7db5ce`, `7279ca3`, `4b8ebcf`).
- **F15 (photo sizes).** `supabase/migrations/0001_init.sql:40-47` creates `post_media` with `width int, height int`; every insert path writes them (`0023_photo_publication.sql:89-90`, `0028_multiple_leftovers.sql:159`, `0029_drinks_from_items.sql:432-433`, cards at `0011:78-79` as 1080×1080), validated 1–4096; they are the original's pixels after EXIF orientation (`reencode.ts:17-20,62`), and the feed copies keep the ratio (`feed-photo.ts:43,49`, `fit:'inside'`). The feed never reads them: `feed.ts:66` `slides: {id?:string;url:string;kind?:"photo"|"card";not_eaten?:boolean}[];`, selects at 141 and 200 omit `width,height`, slide objects at 144 and 255 carry none; `Carousel.tsx:13` `export type Slide={id?:string;url:string;kind?:'photo'|'card';not_eaten?:boolean};`. The detail read has them (`items.ts:120,141`, missing → `1`). `OutlineOverlay.tsx:155` sizes the phone frame `{aspectRatio:`${activePhoto.width} / ${activePhoto.height}`,maxHeight:"80dvh"}` (bars appear when the cap applies because the box stays full width); the desktop window is `globals.css:55` `.desktop-post-content { display:grid; grid-template-columns:minmax(0,640px) minmax(320px,360px); height:min(680px,calc(100dvh - 96px)); border-radius:10px; overflow:hidden; }`, 56 `.desktop-post-content > div:first-child { height:100% !important; }`, 54 `.desktop-post-dialog { width:min(1000px,calc(100vw - 112px)); }`. `PostOpenFrame.tsx:25-35` `Photo` starts at `1 / 1` and reads `naturalWidth` after load; line 45 `<Photo post={post} square={false}/>`, line 55 `<Photo post={post} square/>` (a square crop on desktop). #590 changes only the three `<img>` lines and the import blocks of these components (srcSet, onError, a `useState`).
- **F16 (servings).** `ServingsControl.tsx:23-27`: "Servings − n +", `stepServings` with `SERVINGS_STEP = 0.5` on a quarter grid, `MIN_SERVINGS = 0.25`, `MAX_SERVINGS = 50` (`servings.ts:1-11`); the route `POST /api/posts/[id]/servings` accepts any finite decimal in range and `set_post_servings` (`0020_food_post_photo.sql:71-105`) rescales every item and queues a recompute, from which Home, Days and Today read. The control shows on the post detail only when `analysis_initialized_at` is set and the post is not a drink (`PostDetail.tsx:29`). No test file under `tests/` names servings.
- **F12 (Fleet 15 overlap).** `origin/run15/photos` (#590) changes `public/sw.js`, `Carousel.tsx`, `OutlineOverlay.tsx`, `PostOpenFrame.tsx`, `(tabs)/page.tsx`, the feed photo route, `camera.ts`; `run15/capture-height` (#584) changes `CaptureSheet.tsx`, `LightComposer.tsx`, `globals.css`; `run15/uploads` (#587) changes `CaptureSheet.tsx`, `Feed.tsx`, `PostActions.tsx`, `upload-manager.ts`; `run15/nutrition-reasons` (#588) changes `match.ts`, `approximate.ts`, `estimate.ts`, `nutrients.ts`, `persist.ts`, `wording.ts`, `recompute.ts` and adds migration 0053; `run15/day-rings` (#582) changes `(tabs)/page.tsx`, `BottomBar.tsx`, `DayRings.tsx`; `run15/judges-page` (#583) changes `profile/page.tsx`; `run15/day-counts` (#585) changes the days read and calendar files (not `getDays`'s signature).

## Premises (unchecked; the report states which were false)

- **P1 (#598).** `VERCEL_GIT_COMMIT_SHA` is set in Vercel's build environment for this project (it is a documented system variable; the project's exposure setting was not read). If it is absent the fallback `local-<time>` still changes per build, so the mechanism holds either way.
- **P2 (#594, iPhone).** On the owner's iPhone the share sheet opened from `navigator.share({files})` has no "Save Image" (WebKit bug 255544 as the paste says), and a press-and-hold on the composer's preview offers it; the plan builds the button and the preview either way, and the owner's phone decides.
- **P3 (#594, camera roll).** A photo taken through the phone's camera app from a web page is kept in the camera roll on the owner's Android phone; on iPhone, Safari's file-input camera does not keep a copy (known Safari behaviour, not verified on the owner's iOS). The toggle's wording states the owner's ruling; the report records what each phone did.
- **P4 (#599).** The owner's desktop column was blank because `todayFromPage` returned null on his day (F5 names both triggers his screenshot shows: six posts today, one unavailable food) and the browser then fetched `/api/days`. Lane D removes the dependence on that fetch whatever the trigger; section 10 records the before/after reading.
- **P5 (#598).** Browsers compare a worker's imported scripts as well as its main script during the update check they run on every navigation, and `updateViaCache: "none"` makes that check bypass the HTTP cache for imports (the service worker specification; Chromium does this; Safari is assumed). Reading M3 proves it in Chromium on production; the owner's iPhone is his reading.

## Dependencies, shared files, and the merge order across Fleet 15 and Fleet 16

Every PR branches from the then-current `origin/main`; nothing is stacked. Fleet 15's #585, #587, #588, #589 and #590 are being fixed now, so their heads move (F14); Fleet 16 lanes and those PRs share these files: lane A with #590 (`Carousel.tsx`, `OutlineOverlay.tsx`: different lines); lane C with #590 (`sw.js`: #590 edits the media regex at line 181, lane C edits the top constants, install and activate); lane D with #582/#590 (`(tabs)/page.tsx`: lane D replaces line 110 and line 114's fallback and adds two imports); lane E with #584/#587 (`CaptureSheet.tsx`, `LightComposer.tsx`: lane E adds lines, changes line 164 and passes one new prop) and #583 (`profile/page.tsx`: lane E adds one import and one element); lane F with #582 (`BottomBar.tsx`, line 37 only); lane G with #588 (`match.ts`, `approximate.ts`: lane G adds one import and one condition per file); lane J with #590 and merged #581 (`Carousel.tsx` MealPhoto, `OutlineOverlay.tsx` DetailImage, `PostOpenFrame.tsx` Photo, `feed.ts` slides, the media insert routes) and with #587 (`upload-manager.ts`, `create.ts`); lane K with #588 (`recompute.ts`) where its sections say so. Lanes B, H and I touch no file another lane or Fleet 15 touches.

**Merge order.** Fleet 15's PRs carry lower numbers and merge first, under their own merge orders, each at its reviewed head: #582, #583, #584, #585, #586, #587, #588 (migration 0053 applied and read back before it), #589, #590. Fleet 16 then merges in ascending PR number, lane C's PR first because it was opened first, lane J's after migration 0054 is applied and read back. Before a Fleet 16 PR merges, every Fleet 15 PR that shares its files (the list above) must be merged or closed; the Fleet 16 branch then brings main in and re-applies its own substring to each merged line (lane J touches no `<img>` line, only wrappers, types and styles; where #590 changed the same line, lane J keeps #590's `srcSet`, `onError` and `useState` and re-applies its own substring), and that refresh needs no new review when it adds no code of its own. A Fleet 15 PR that is closed unmerged removes its entry from this rule and nothing else. No Fleet 16 PR merges ahead of a Fleet 15 PR it shares files with.

## Lanes (each in its own worktree under `../my-food-ai-wt/run16-<lane>`, all started together)

| Lane | Item | Branch | Service that owns the how (inputs → outputs) · boundary that calls it |
|---|---|---|---|
| A | 1 | `run16/card-gutter` | `ResultsCard` (`gutter` → side padding) · `LiveNutritionCard` (feed slide) and `OutlineOverlay` (detail slide) |
| B | 2 | `run16/feed-outline` | `DesktopWorkspace` outline state (keyboard/pointer events → `data-focused`) · every desktop screen |
| C | 3 | `run16/build-stamp` | build id (`next.config.ts` env → `data-build`, worker URL) and `sw.js` install pruning · `ServiceWorkerRegistration`, root layout |
| D | 4 | `run16/today-server` | `HomeToday` server read (first page, else one `getDays` read → `TodayView`) · `DesktopToday` placeholder/seed |
| E | 5 | `run16/camera-mode` | `camera-mode.ts` (device setting → `app`/`phone`) · Profile switch, `CaptureSheet` (camera enable, shutter, Save photo), `LightComposer` row |
| F | 6 | `run16/tap-targets` | the nine controls' own markup · `PostCaption`, `SavedMealsSheet`, `BottomBar`, `ModeStrip`, `LightComposer`, `ui/Field`, `SearchBox` |
| G | 7 | `run16/exclusion-guard` | `excludedComponents` (description, target → excluded phrases) · `matchFood` candidate pool and `closestGenericFood` |
| H | 8 | `run16/lint` | the five warning sites · none |
| J | 9 | `run16/photo-box` | `photo-box.ts` (stored size → one box style, desktop window variables) and the feed read carrying `width`/`height` · `OutlineOverlay`, `PostOpenFrame`, the desktop window CSS; backfill script for sizes still missing |
| K | 10 | `run16/servings` | `parseServings` (typed text → quarter-grid count or null) · `ServingsControl`, which posts to the existing servings route |
| I | 11 | `run16/docs` | report, #595 grep, closures · docs only, no review |

## 1. No arrow over the numbers card's text (Lane A): #592

1. `src/components/ResultsCard.tsx`:
   - Replace `  fontFamily?: string;\n};` with `  fontFamily?: string;\n  // Extra side padding where slide arrows overlay the live card (the stored card image uses 0).\n  gutter?: number;\n};\n\n// Carousel and detail arrows are at most 36 px wide at a 12 px inset (48 px). The 3n\n// padding is 32 px at 390 px and scales up, so 24 px more keeps every size clear.\nexport const ARROW_GUTTER = 24;`.
   - Replace `items = [], size = tokens.spacing.phone, fontFamily }: ResultsCardProps) {` with `items = [], size = tokens.spacing.phone, fontFamily, gutter = 0 }: ResultsCardProps) {`.
   - Replace `padding: tokens.spacing['card-padding'] * scale, boxSizing: 'border-box'` with `padding: tokens.spacing['card-padding'] * scale, paddingLeft: tokens.spacing['card-padding'] * scale + gutter, paddingRight: tokens.spacing['card-padding'] * scale + gutter, boxSizing: 'border-box'`.
2. `src/components/LiveNutritionCard.tsx`:
   - Replace `import { ResultsCard } from "@/components/ResultsCard";` with `import { ARROW_GUTTER, ResultsCard } from "@/components/ResultsCard";\nimport { useDesktop } from "@/lib/ui/use-desktop";`.
   - Replace `  const ref = useRef<HTMLDivElement>(null);\n  const [width, setWidth] = useState<number>(tokens.spacing.phone);` with `  const ref = useRef<HTMLDivElement>(null);\n  // The feed shows its slide arrows at desktop widths only (Carousel.tsx).\n  const desktop = useDesktop();\n  const [width, setWidth] = useState<number>(tokens.spacing.phone);`.
   - Replace `<ResultsCard size={width} time={time} data={cardData} />` with `<ResultsCard size={width} time={time} data={cardData} gutter={desktop ? ARROW_GUTTER : 0} />`.
3. `src/components/OutlineOverlay.tsx`: replace `<ResultsCard data={displayCard} size={width} time={localTime} />` with `<ResultsCard data={displayCard} size={width} time={localTime} gutter={visibleSlides.length>1?ARROW_GUTTER:0} />` and replace `import { ResultsCard } from "@/components/ResultsCard";` with `import { ARROW_GUTTER, ResultsCard } from "@/components/ResultsCard";`.
4. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/results-card-layout.test.mjs tests/card-io.test.mjs tests/card-cleanup.test.mjs` (the stored card image passes no gutter and must render byte-identically; `card-io` covers it).

**Blast radius.** The live numbers card on every feed card at ≥1024 px and on every post detail with more than one slide; the stored card PNG is unchanged. **Done:** section 12 M1.

## 2. Nothing outlined on load (Lane B): #593, design 6a

`src/components/DesktopWorkspace.tsx`:

1. Replace `  const [focused,setFocused]=useState<string|null>(selected);` with
   ```tsx
     const [focused,setFocused]=useState<string|null>(selected);
     // 6a: the feed opens with nothing outlined. The outline appears after the
     // first J, K or Tab and a pointer press anywhere hides it again.
     const [outlined,setOutlined]=useState(false);
     const keyboard=useRef(false);
   ```
2. Replace
   ```tsx
       const mark=()=>{const first=element.querySelector<HTMLElement>('[data-desktop-post]');for(const card of element.querySelectorAll<HTMLElement>('[data-desktop-post]')){if(card.dataset.desktopPost===(focused??first?.dataset.desktopPost))card.dataset.focused='true';else delete card.dataset.focused;}};
       mark();const observer=new MutationObserver(mark);observer.observe(element,{childList:true,subtree:true});return()=>observer.disconnect();
     },[focused]);
   ```
   with
   ```tsx
       const mark=()=>{const target=outlined?focused:null;for(const card of element.querySelectorAll<HTMLElement>('[data-desktop-post]')){if(target&&card.dataset.desktopPost===target)card.dataset.focused='true';else delete card.dataset.focused;}};
       mark();const observer=new MutationObserver(mark);observer.observe(element,{childList:true,subtree:true});return()=>observer.disconnect();
     },[focused,outlined]);
     useEffect(()=>{const hide=()=>{keyboard.current=false;setOutlined(false);};window.addEventListener('pointerdown',hide,{passive:true});return()=>window.removeEventListener('pointerdown',hide);},[]);
   ```
3. In the keydown handler, replace `      if(!matchMedia('(min-width:1024px)').matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;` with `      if(event.key==='Tab')keyboard.current=true;\n      if(!matchMedia('(min-width:1024px)').matches || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || (event.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="dialog"]'))return;`.
4. Replace `      if(step){event.preventDefault();const next=cards[Math.max(0,Math.min(cards.length-1,(index<0?0:index)+step))];setFocused(next.dataset.desktopPost!);next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});if(selected)open(next.dataset.desktopPost!);}` with `      if(step){event.preventDefault();const next=cards[Math.max(0,Math.min(cards.length-1,index<0?0:index+step))];setFocused(next.dataset.desktopPost!);setOutlined(true);next.focus({preventScroll:true});next.scrollIntoView({block:'nearest'});if(selected)open(next.dataset.desktopPost!);}` (with nothing selected, the first J or K selects the first post).
5. Replace `      if(event.key==='Enter'&&!(event.target as HTMLElement)?.closest('button,a')){event.preventDefault();const id=focused??cards[0]?.dataset.desktopPost;if(id)open(id);}` with `      if(event.key==='Enter'&&!(event.target as HTMLElement)?.closest('button,a')){event.preventDefault();const id=outlined?focused:null;if(id)open(id);}`.
6. Replace `  },[focused,selected,open]);` (the keydown effect's dependency line, the only occurrence of that exact text) with `  },[focused,outlined,selected,open]);`.
7. Replace `  return <div onFocusCapture={event=>{if(!desktop)return;const card=(event.target as HTMLElement).closest<HTMLElement>('[data-desktop-post]');if(card?.dataset.desktopPost)setFocused(card.dataset.desktopPost);}}` with `  return <div onFocusCapture={event=>{if(!desktop)return;const card=(event.target as HTMLElement).closest<HTMLElement>('[data-desktop-post]');if(card?.dataset.desktopPost){setFocused(card.dataset.desktopPost);if(keyboard.current)setOutlined(true);}}}`.
8. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/desktop-review.test.mjs tests/feed-cache-lifecycle.test.mjs`. No new test (layout).

**Blast radius.** Keyboard selection on Home, Search and Profile at desktop widths; the click-to-open path is unchanged. If `keyboard` is never set (a browser that fires no keydown for Tab), Tab leaves no outline but J and K still do. **Done:** section 12 M2; the owner's confirmation is his.

## 3. A new build replaces the installed worker, even under an old cached shell (Lane C): #598

Why not a build id on the registration address alone: a window served the old cached `/shell` runs the old build's page code, which registers the old address, so no new worker would ever install for it. The browser's own update check does not depend on page code: on every navigation it refetches the worker's script and its imported scripts and installs a new worker when any byte differs. So the worker imports a one-line script whose text changes per build, and the new worker reloads the windows an old build is showing.

1. `next.config.ts`: replace `  partialPrefetching: true,` with
   ```ts
     partialPrefetching: true,
     // One value per build, read by the page (data-build) and by /build.js,
     // the script the service worker imports.
     env: { NEXT_PUBLIC_BUILD: process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}` },
   ```
2. `src/app/layout.tsx`: replace `    <html lang="en" className="h-full antialiased">` with `    <html lang="en" className="h-full antialiased" data-build={process.env.NEXT_PUBLIC_BUILD}>`.
3. Create `src/app/build.js/route.ts`:
   ```ts
   import { connection } from "next/server";
   // The service worker imports this script. Its text changes with every build,
   // so the browser's update check, which runs on each navigation outside the
   // worker and (with updateViaCache "none") outside the HTTP cache, installs a
   // new worker after each deployment, even for a window showing an old cached
   // shell whose own code never changes.
   export async function GET() {
     await connection();
     return new Response(`self.BUILD=${JSON.stringify(process.env.NEXT_PUBLIC_BUILD ?? "dev")};`, { headers: { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" } });
   }
   ```
4. `src/components/ServiceWorkerRegistration.tsx`: replace `      void navigator.serviceWorker.register("/sw.js").catch(() => {` with `      // "none": the update check refetches /build.js past the HTTP cache.\n      void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {`.
5. `public/sw.js`:
   - Replace `const SHELL_CACHE = "my-food-ai-shell-v4";` with `importScripts("/build.js");\n// self.BUILD names the deployment that served this worker; a new deployment\n// changes /build.js, so the browser installs a new worker on its next check.\nlet updating = false;\nconst SHELL_CACHE = "my-food-ai-shell-v4";`.
   - Replace `self.addEventListener("install", event => {\n  self.skipWaiting();` with `self.addEventListener("install", event => {\n  updating = Boolean(self.registration.active);\n  self.skipWaiting();`.
   - Replace `    await self.clients.claim();\n  })());\n});` with
     ```js
         await self.clients.claim();
         // After an update, every open window loads again through this worker, so
         // a window that an older build's cached shell is showing gets the
         // deployed build without a hard refresh.
         if (updating) for (const client of await self.clients.matchAll({type: "window"})) { if (new URL(client.url).origin === self.location.origin) await client.navigate(client.url).catch(() => {}); }
       })());
     });
     ```
   - Replace
   ```js
       await Promise.allSettled(shellAssets(shell).map(async url => {
         const response = await fetch(new Request(url, {credentials: "omit", cache: "force-cache"}));
         const policy = response.headers.get("cache-control") ?? "";
         if (response.ok && /\bpublic\b/i.test(policy) && /\bimmutable\b/i.test(policy) && !/\bprivate\b|no-store/i.test(policy)) await putDecoded(cache, url, response);
       }));
     })());
   });
   ```
   with
   ```js
       await Promise.allSettled(shellAssets(shell).map(async url => {
         const response = await fetch(new Request(url, {credentials: "omit", cache: "force-cache"}));
         const policy = response.headers.get("cache-control") ?? "";
         if (response.ok && /\bpublic\b/i.test(policy) && /\bimmutable\b/i.test(policy) && !/\bprivate\b|no-store/i.test(policy)) await putDecoded(cache, url, response);
       }));
       // Files of earlier builds are no longer named by this shell; drop them so
       // the cache holds one build and cannot serve an old page or chunk.
       const keep = new Set(["/", "/shell", "/manifest.webmanifest"].map(path => new URL(path, self.location.origin).href).concat(shellAssets(shell)));
       for (const request of await cache.keys()) if (!keep.has(request.url)) await cache.delete(request);
     })());
   });
   ```
6. `tests/sw-media-cache.test.mjs`: replace `vm.runInNewContext(source,{self,caches,fetch:(request,init)=>fetcher(request,init),URL,Request,Response,Headers,Promise,Date,setTimeout:setTimer,clearTimeout});` with `vm.runInNewContext(source,{self,caches,fetch:(request,init)=>fetcher(request,init),URL,Request,Response,Headers,Promise,Date,setTimeout:setTimer,clearTimeout,importScripts(){}});` (the fake `registration` is `{}`, so `updating` is false and no client is navigated in tests).
7. `npm run build`, then `grep -c 'data-build="' .next/server/app/index.html` (or the equivalent for this build output) must print 1 and `curl -s http://localhost:3000/build.js` on `next start` must print `self.BUILD="…"` with the build's value and a `cache-control: no-store` header; `npm test -- tests/sw-media-cache.test.mjs tests/media-session.test.mjs tests/push-lifecycle.test.mjs`; `npm run lint`. No new test (cache behaviour is not in the contract's test categories).

**Blast radius.** Every page's worker registration; after each deployment every open window of the app reloads once through the new worker (a caption being typed in an open sheet at that moment is lost; deployments are the owner's and never happen during recording). A first install never reloads. If a browser compared only the main script (P5 false), the item is not fixed for that browser and reading M3 says so. The cache names stay, so the media cache and its tests are untouched. **Done:** section 12 M3.

## 4. The Today column is on the page when it opens (Lane D): #599

1. `src/app/(tabs)/page.tsx`:
   - Replace `import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";` with `import { dateInZone, getDays, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";\nimport { sumNutrition } from "@/lib/nutrition/totals";\nimport type { TodayView } from "@/lib/posts/today-view";`.
   - Replace `async function HomeToday(){await connection();const cookieZone=(await cookies()).get('time-zone')?.value;let initial;try{const seed=await homeDeadline(homeSeed());initial=seed&&cookieZone?todayFromPage(seed.page,seed.zone)??undefined:undefined;}catch{/* Preserve the client fallback. */}return <DesktopToday zone={cookieZone} initial={initial}/>;}` with
     ```tsx
     async function HomeToday(){
      await connection();const cookieZone=(await cookies()).get('time-zone')?.value;let initial:TodayView|undefined;
      try{
       const seed=await homeDeadline(homeSeed());
       if(seed&&cookieZone){
        // The first page proves today complete only when it holds a post eaten
        // before today and every item of today's posts. Otherwise read today
        // once here, the same read /api/days makes, so the column is in the
        // server HTML instead of waiting for a browser fetch after hydration.
        initial=todayFromPage(seed.page,seed.zone)??undefined;
        if(!initial){const {db,user}=await homeReader();const today=dateInZone(new Date(),seed.zone);const days=user?await homeDeadline(getDays(db,user.id,seed.zone,today,today)):[];initial=days[0]??{date:today,posts:[],totals:sumNutrition([])};}
       }
      }catch{/* Preserve the client fallback. */}
      return <DesktopToday zone={cookieZone} initial={initial}/>;
     }
     ```
   - Replace `<DesktopHomeFrame today={<Suspense fallback={null}><HomeToday/></Suspense>}>` with `<DesktopHomeFrame today={<Suspense fallback={<DesktopToday placeholder/>}><HomeToday/></Suspense>}>`.
2. `src/components/DesktopToday.tsx`:
   - Replace `export default function DesktopToday({zone:configuredZone,initial}:{zone?:string;initial?:TodayView}){` with `export default function DesktopToday({zone:configuredZone,initial,placeholder=false}:{zone?:string;initial?:TodayView;placeholder?:boolean}){`.
   - Replace ` useEffect(()=>{if(!desktop)return;let live=true;` with ` useEffect(()=>{if(!desktop||placeholder)return;let live=true;` and `},[desktop,zone,initial]);` with `},[desktop,zone,initial,placeholder]);`.
   - Delete the line ` if(!desktop)return null;` (the aside is already `hidden … desktop:flex`, and the 1024–1147 px rule in `globals.css:105` hides it; the server now renders it).
   - Replace `<h2 className="mb-[6px] text-[13px] text-muted">Today · {date.toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'})}</h2>` with `<h2 className="mb-[6px] text-[13px] text-muted">{placeholder?'Today':`Today · ${date.toLocaleDateString('en',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'})}`}</h2>` (the placeholder prints no date, so server and client agree before the zone is known).
3. `npx tsc --noEmit` (a `LoggedDay` is assignable to `TodayView`: same `posts[]` fields and `totals`, plus `intake`); `npm test -- tests/today-view.test.mjs tests/desktop-review.test.mjs tests/home-day-totals.test.mjs tests/feed-cache-lifecycle.test.mjs`; `npm run build`.

**Blast radius.** Home's Today stream on desktop: one extra server read of today only when the first page cannot prove today complete (the case the owner hit); phones render a hidden aside in HTML. The `/shell` page keeps its client fetch. The first-ever visit with no zone cookie still falls back to the browser fetch (recorded as such). **Done:** section 12 M4.

## 5. Where a photo is kept: the app's camera with Save photo, or the phone's camera app (Lane E): #594

1. Create `src/lib/media/camera-mode.ts`:
   ```ts
   "use client";
   import { useSyncExternalStore } from "react";
   // Which camera takes a photo, kept per device in the browser's storage:
   // "app" (default) is My Food AI's own camera, with Save photo opening the
   // share sheet; "phone" is the phone's camera app, which keeps its own copy.
   export type CameraMode = "app" | "phone";
   const KEY = "mfa-camera-mode";
   const listeners = new Set<() => void>();
   export function readCameraMode(): CameraMode { try { return localStorage.getItem(KEY) === "phone" ? "phone" : "app"; } catch { return "app"; } }
   export function writeCameraMode(mode: CameraMode): void { try { localStorage.setItem(KEY, mode); } catch { /* Storage unavailable: the default stays. */ } for (const listener of listeners) listener(); }
   const subscribe = (listener: () => void) => { listeners.add(listener); window.addEventListener("storage", listener); return () => { listeners.delete(listener); window.removeEventListener("storage", listener); }; };
   export function useCameraMode(): CameraMode { return useSyncExternalStore(subscribe, readCameraMode, () => "app"); }
   ```
2. Create `src/app/(tabs)/profile/CameraModeSwitch.tsx`:
   ```tsx
   'use client';
   import {useCameraMode,writeCameraMode} from '@/lib/media/camera-mode';
   export default function CameraModeSwitch() {
    const mode=useCameraMode();
    return <section className="border-b border-line px-screen-x py-4">
     <div className="flex items-center justify-between gap-3"><span className="text-body">Use the phone&apos;s camera app</span><button type="button" role="switch" aria-label="Use the phone's camera app" aria-checked={mode==='phone'} onClick={()=>writeCameraMode(mode==='phone'?'app':'phone')} className="min-h-tap min-w-tap rounded-pill border border-line px-3 text-detail">{mode==='phone'?'On':'Off'}</button></div>
     <p className="text-[13px] text-muted">Off: My Food AI&apos;s own camera takes the photo and sends it only to the app. Save photo, under the preview, opens the phone&apos;s share sheet.</p>
     <p className="text-[13px] text-muted">On: the phone&apos;s camera app takes the photo and hands it to My Food AI. Whether the phone keeps a copy of it is up to the phone. This choice is kept on this device.</p>
    </section>;
   }
   ```
3. `src/app/(tabs)/profile/page.tsx`: replace `import IdentifyProviderSwitch from "./IdentifyProviderSwitch";` with `import IdentifyProviderSwitch from "./IdentifyProviderSwitch";\nimport CameraModeSwitch from "./CameraModeSwitch";`; replace `      {openWeightsConfigured()?<IdentifyProviderSwitch` with `      <CameraModeSwitch/>\n      {openWeightsConfigured()?<IdentifyProviderSwitch`.
4. `src/components/CaptureSheet.tsx`:
   - Replace `import {useDesktop} from "@/lib/ui/use-desktop";` with `import {useDesktop} from "@/lib/ui/use-desktop";\nimport {useCameraMode} from "@/lib/media/camera-mode";`.
   - Replace `  const desktop=useDesktop();\n  const liveCameraRef = useRef<Camera | null>(null);` with `  const desktop=useDesktop();\n  // The phone's camera app replaces the in-app viewfinder for photos on a phone.\n  const phoneCamera=useCameraMode()==='phone'&&!desktop;\n  const liveCameraRef = useRef<Camera | null>(null);`.
   - Replace `  const cameraEnabled = mode !== "text" && (!composer || takingPhoto);` with `  const cameraEnabled = mode !== "text" && (!composer || takingPhoto) && !(phoneCamera && mode === "photo");` (`takePhoto` already clicks the `capture="environment"` input when there is no stream, so the shutter opens the phone's camera app; barcode mode keeps the live stream).
   - Replace `          ) : desktop&&forPost ? null : <Icon name="camera" />}` with `          ) : desktop&&forPost ? null : <Icon name="camera" />}\n          {phoneCamera&&mode==="photo"&&!latest&&<p className="absolute inset-x-6 bottom-6 text-center text-[14px] text-surface">The shutter opens the phone&apos;s camera app. Change this under Profile.</p>}`.
   - After the line `  const takePhoto = async () => {` block, that is, replace `  const post = async () => {\n    if (postingRef.current || cameraBusy || pendingFilesRef.current.length > 0 || (!caption.trim() && shotsRef.current.length === 0)) return;` with
     ```tsx
       // Save photo: the share sheet where the browser offers one for files;
       // otherwise a download of the same JPEG.
       const savePhoto = async () => {
         const shot = shotsRef.current[photoIndex];
         if (!shot) return;
         try {
           if (typeof navigator.canShare === "function" && navigator.canShare({ files: [shot.file] })) { await navigator.share({ files: [shot.file] }); return; }
           const link = document.createElement("a"); link.href = shot.previewUrl; link.download = shot.file.name || "meal.jpg"; link.click();
         } catch { /* The sheet was closed. */ }
       };

       const post = async () => {
         if (postingRef.current || cameraBusy || pendingFilesRef.current.length > 0 || (!caption.trim() && shotsRef.current.length === 0)) return;
     ```
   - Replace `onPost={()=>{void post();}} onRemove={removeShot}` with `onPost={()=>{void post();}} onRemove={removeShot} onSavePhoto={phoneCamera?undefined:()=>{void savePhoto();}}`.
5. `src/components/LightComposer.tsx`:
   - Replace `searchPanel?:ReactNode;onRemove:(index:number)=>void};` with `searchPanel?:ReactNode;onRemove:(index:number)=>void;onSavePhoto?:()=>void};`.
   - Phone layout: replace `    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="pin"/>` with `    {p.onSavePhoto&&p.shots.length>0&&<button type="button" disabled={busy} onClick={p.onSavePhoto} className="flex h-[52px] w-full items-center gap-[14px] border-b border-hairline text-left"><Icon name="camera"/><span className="min-w-0 flex-1"><span className="block text-body">Save photo</span><span className="block text-meta text-muted">Opens the share sheet</span></span><Icon name="chevron-right" size={16}/></button>}\n    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="pin"/>`.
   - Desktop layout: replace `    <div className="flex min-h-[56px] items-center justify-between border-b border-hairline text-[14px]">Location<Switch` with `    {p.onSavePhoto&&p.shots.length>0&&<div className="flex min-h-[56px] items-center justify-between border-b border-hairline text-[14px]">Save photo<button type="button" disabled={busy} onClick={p.onSavePhoto} className="h-9 rounded-field bg-field px-3 text-[13px]">Save</button></div>}\n    <div className="flex min-h-[56px] items-center justify-between border-b border-hairline text-[14px]">Location<Switch`.
6. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/sharper-capture.test.mjs tests/camera-frame.test.mjs tests/camera-flip.test.mjs tests/upload-guard.test.mjs`. No new test (a device preference and a share button are neither money, sign-in, access, migration nor a data rule).

**Blast radius.** The capture sheet on phones in photo mode when the switch is on (no live viewfinder; the shutter opens the phone's camera app and the chosen file goes through `addFiles` as today); the composer gains one row in the default mode; Profile gains one section. The default mode is unchanged, so judges see today's camera. **Done:** section 12 M8; both phones are the owner's.

## 6. The nine controls reach 44 px (Lane F): #580

1. `src/components/PostCaption.tsx`: replace `<button type="button" className="absolute bottom-0 right-0 bg-surface pl-1 text-text" aria-expanded={expanded} onClick={()=>setExpanded(true)}>more</button>` with `<button type="button" className="absolute bottom-0 right-0 flex h-11 min-w-11 items-end justify-end text-text" aria-expanded={expanded} onClick={()=>setExpanded(true)}><span className="bg-surface pl-1">more</span></button>` (the box grows upward over the clamped caption; only the word keeps the covering background).
2. `src/components/SavedMealsSheet.tsx`: replace `<button disabled={busyId!==null} onClick={()=>onLog(m)} className="h-[34px] shrink-0 rounded-[17px] bg-text px-[14px] text-slide-label text-surface">{busyId===m.id?'Posting…':'Log now'}</button>` with `<button disabled={busyId!==null} onClick={()=>onLog(m)} className="flex h-11 shrink-0 items-center"><span className="flex h-[34px] items-center rounded-[17px] bg-text px-[14px] text-slide-label text-surface">{busyId===m.id?'Posting…':'Log now'}</span></button>`.
3. `src/components/BottomBar.tsx`: replace `className="flex size-[34px] items-center justify-center rounded-circle border-[1.5px] border-text text-text active:opacity-50"><Icon name="plus" size={20} style={{transform:`rotate(${menuOpen?45:0}deg)`,transition:'transform 160ms'}} /></button>` with `className="flex size-11 items-center justify-center text-text active:opacity-50"><span className="flex size-[34px] items-center justify-center rounded-circle border-[1.5px] border-text"><Icon name="plus" size={20} style={{transform:`rotate(${menuOpen?45:0}deg)`,transition:'transform 160ms'}} /></span></button>` (the 46 px cell holds the 44 px box).
4. `src/components/ModeStrip.tsx`: replace `    <div ref={track} className="absolute left-1/2 top-1 flex w-max items-center gap-6 transition-transform duration-[180ms] motion-reduce:transition-none"` with `    <div ref={track} className="absolute left-1/2 top-0 flex w-max items-center gap-6 transition-transform duration-[180ms] motion-reduce:transition-none"` and `        className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-[18px] text-[15px] disabled:opacity-50 ${` with `        className={`relative flex h-11 shrink-0 items-center gap-1.5 rounded-pill px-[18px] text-[15px] disabled:opacity-50 ${` (labels stay centred at 22 px; the accent dot at `bottom-0` stays inside the 44 px tablist).
5. `src/components/LightComposer.tsx`: replace `className="w-full resize-none bg-transparent text-body font-normal outline-none placeholder:text-muted"/></div>` with `className="min-h-tap w-full resize-none bg-transparent text-body font-normal outline-none placeholder:text-muted"/></div>`.
6. `src/components/ui/Field.tsx`: replace `      <input id={inputId} className={`min-w-0 w-full bg-transparent text-body outline-none disabled:opacity-50 ${` with `      <input id={inputId} className={`h-full min-w-0 w-full bg-transparent text-body outline-none disabled:opacity-50 ${` (every Field's input now fills its 48 px box; this covers Drink description).
7. `src/components/SearchBox.tsx`: replace `className="min-w-0 flex-1 bg-transparent text-body outline-none"` with `className="h-full min-w-0 flex-1 bg-transparent text-body outline-none"` (the input fills the 44 px label, 48 px on desktop).
8. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/saved-summary.test.mjs tests/intake.test.mjs`. No new test (layout).

**Blast radius.** The caption's "more" box overlaps the last two caption lines (not interactive); the bottom-bar + and Log now keep their drawn size inside a larger box; the capture tabs grow 8 px within their unchanged 44 px strip; text inputs fill their existing boxes. **Done:** section 12 M5.

## 7. A reference that leaves out a component the meal has is not a candidate (Lane G): #596

1. Create `src/lib/fdc/exclusions.ts` (its own file: `match.ts` already imports `approximate.ts`, so neither may import the other):
   ```ts
   // A record that explicitly leaves out a dish component ("no dressing",
   // "without croutons") describes a different food unless the target says the
   // same. Preparation notes (no added fat, no salt, no sugar) are not components.
   const EXCLUSION = /\b(?:no|without)\s+(?!added\b|salt\b|sugar\b|fat\b)([a-z]+)/gi;
   export function excludedComponents(description: string, target: string): string[] {
     const lower = target.toLowerCase();
     return [...description.matchAll(EXCLUSION)].map(match => match[0].toLowerCase().replace(/\s+/g, " ")).filter(phrase => !lower.includes(phrase));
   }
   ```
2. `src/lib/fdc/match.ts`: add `import { excludedComponents } from "./exclusions";` as a new line immediately after the file's first line that begins with `import `; replace `      if(gramBasis(food)&&hasNutrition(food)&&!eligible.has(food.fdcId))eligible.set(food.fdcId,food);` with `      if(gramBasis(food)&&hasNutrition(food)&&!eligible.has(food.fdcId)&&!excludedComponents(food.description,`${name} ${caption}`).length)eligible.set(food.fdcId,food);`.
3. `src/lib/fdc/approximate.ts`: replace `import { recordCall } from "@/lib/trace/record";` with `import { recordCall } from "@/lib/trace/record";\nimport { excludedComponents } from "./exclusions";`; replace `    const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f)).slice(0, 30);` with `    const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f) && !excludedComponents(f.description, `${name} ${caption}`).length).slice(0, 30);`.
4. Test (data rule): in `tests/fdc-reference-search.test.mjs`, add one case that drives `matchFood` with stubbed `search` returning two gram-basis foods with nutrition, `{fdcId:1,description:"Chicken caesar salad, no dressing",dataType:"Survey (FNDDS)"}` and `{fdcId:2,description:"Chicken caesar salad, with dressing",dataType:"Survey (FNDDS)"}`, and a stubbed `choose` that asserts it received only id 2 and returns `{id:2,query:null,query_food:null,reason:"test"}`; assert the result's `food.fdcId` is 2. Add a second assertion that `excludedComponents("Rice, white, cooked, no added fat","steamed white rice")` is `[]` and `excludedComponents("Salad, no dressing","green salad no dressing")` is `[]` (import it from `../src/lib/fdc/exclusions.ts`).
5. `npm test -- tests/fdc-reference-search.test.mjs tests/fdc-match-response-budget.test.mjs tests/analysis-integrity.test.mjs tests/food-estimate.test.mjs`; `npx tsc --noEmit`.

**Blast radius.** Every USDA match: records whose description says "no <word>" or "without <word>" for a word the item's name and caption do not also exclude never reach the model; the "no added/salt/sugar/fat" records stay. A food that USDA holds only as a "no …" record and the model would have accepted now goes to the next search, the closest generic record or the labelled estimate (#549/#561). **Done:** section 12 M6.

## 8. Lint back to six warnings (Lane H): #597

1. `scripts/lib/cdp.mjs`: replace `m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};` with `if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}};`.
2. `scripts/run14-control-table.mjs`: replace `m.error||m.type==='error'?p.reject(Error(m.error?.message||m.message)):p.resolve(m.result);}};` with `if(m.error||m.type==='error')p.reject(Error(m.error?.message||m.message));else p.resolve(m.result);}};`.
3. `scripts/run14-production-checks.mjs`: replace `m.type==='error'?p.reject(Error(m.message)):p.resolve(m.result);}};` with `if(m.type==='error')p.reject(Error(m.message));else p.resolve(m.result);}};`.
4. `src/components/PostOpenTransition.tsx`: replace `  <PostPageShell onBack={event=>{event.preventDefault();setOpening(null);window.location.assign('/');}}>` with `  {/* eslint-disable-next-line @next/next/no-location-assign-relative-destination -- A full load abandons the pending post navigation; a router push would queue behind it. */}\n  <PostPageShell onBack={event=>{event.preventDefault();setOpening(null);window.location.assign('/');}}>` (the behaviour Fleet 14 chose stays; the rule exception is documented at the site).
5. `tests/food-estimate.test.mjs`: replace `globalThis.fetch=async(input,init)=>{const url=new URL(input);` with `globalThis.fetch=async(input)=>{const url=new URL(input);`.
6. `npm run lint` must print `0 errors, 6 warnings` (the six in F9); `npm test` full.

**Blast radius.** None at runtime; three measurement scripts and one test keep their behaviour. **Done:** section 12 M7.

## 9. The photo box takes its shape before any image loads, never cropped, no bars (Lane J): design 7f (added after the paste)

Scope: the post detail page (phone), the desktop post window and the quick open frame that precedes both. The feed card's square rail is not changed (owner list). Sizes come from `post_media.width/height`, which every upload already stores (F15).

1. Create `src/lib/media/photo-box.ts`:
   ```ts
   import type { CSSProperties } from "react";
   // 7f: one box for a photo shown whole. It has the photo's own shape, is never
   // cropped, has no bars, and is capped in height; the stored width and height
   // give it its size before any image loads. A missing size draws a square.
   export const PHONE_PHOTO_CAP = "80dvh";
   type Size = { width?: number | null; height?: number | null } | null | undefined;
   const ratio = (size: Size) => ({ w: size?.width && size.width > 0 ? size.width : 1, h: size?.height && size.height > 0 ? size.height : 1 });
   export function photoBoxStyle(size: Size, cap = PHONE_PHOTO_CAP): CSSProperties {
     const { w, h } = ratio(size);
     return { aspectRatio: `${w} / ${h}`, maxHeight: cap, width: `min(100%, calc(${cap} * ${w} / ${h}))`, marginInline: "auto" };
   }
   // The desktop window's CSS reads these to size its photo column and its height.
   export function desktopPhotoVars(size: Size): CSSProperties {
     const { w, h } = ratio(size);
     return { "--photo-w": w, "--photo-h": h } as CSSProperties;
   }
   ```
2. `src/lib/posts/feed.ts` carries the size to the browser:
   - Replace `  slides: {id?:string;url:string;kind?:"photo"|"card";not_eaten?:boolean}[];` with `  slides: {id?:string;url:string;kind?:"photo"|"card";not_eaten?:boolean;width?:number;height?:number}[];`.
   - Replace `media?: {id:string;storage_path:string;kind:string;not_eaten:boolean}[]}` with `media?: {id:string;storage_path:string;kind:string;not_eaten:boolean;width?:number|null;height?:number|null}[]}`.
   - Replace `    .select("id,storage_path,kind,not_eaten").eq("post_id",row.id).order("position");` with `    .select("id,storage_path,kind,not_eaten,width,height").eq("post_id",row.id).order("position");`.
   - Replace `kind:entry.kind as "photo"|"card",not_eaten:Boolean(entry.not_eaten)}; }` with `kind:entry.kind as "photo"|"card",not_eaten:Boolean(entry.not_eaten),width:entry.width??undefined,height:entry.height??undefined}; }`.
   - Replace `  const mediaRead = optionalRead<null | {id:string;post_id:string;storage_path:string;kind:string;not_eaten:boolean;position:number}[]>('media', async () => {\n    const result = await db.from('post_media').select('id,post_id,storage_path,kind,not_eaten,position').in('post_id', ids)` with `  const mediaRead = optionalRead<null | {id:string;post_id:string;storage_path:string;kind:string;not_eaten:boolean;position:number;width:number|null;height:number|null}[]>('media', async () => {\n    const result = await db.from('post_media').select('id,post_id,storage_path,kind,not_eaten,position,width,height').in('post_id', ids)`.
   - Replace `      return url ? [{ id: entry.id, url, kind: entry.kind as 'photo' | 'card', not_eaten: Boolean(entry.not_eaten) }] : [];` with `      return url ? [{ id: entry.id, url, kind: entry.kind as 'photo' | 'card', not_eaten: Boolean(entry.not_eaten), width: entry.width ?? undefined, height: entry.height ?? undefined }] : [];`.
   - `src/components/Carousel.tsx`: replace `export type Slide={id?:string;url:string;kind?:'photo'|'card';not_eaten?:boolean};` with `export type Slide={id?:string;url:string;kind?:'photo'|'card';not_eaten?:boolean;width?:number;height?:number};`.
3. `src/components/OutlineOverlay.tsx` (phone detail and desktop window):
   - Add `import {desktopPhotoVars,photoBoxStyle} from '@/lib/media/photo-box';` as a new line immediately after `import {alcoholGrams,isAlcoholic} from '@/lib/intake/alcohol';`.
   - Replace `  return <Container {...(desktopModal?{className:"desktop-post-content"}:{})}>` with `  return <Container {...(desktopModal?{className:"desktop-post-content",style:desktopPhotoVars(activePhoto)}:{})}>`.
   - Replace `style={{ ...(wholePhoto&&activePhoto?{aspectRatio:`${activePhoto.width} / ${activePhoto.height}`,maxHeight:"80dvh"}:{height}), touchAction: drawing ? "none" : "auto" }}` with `style={{ ...(wholePhoto&&activePhoto?photoBoxStyle(activePhoto):{height}), touchAction: drawing ? "none" : "auto" }}` (the outline maths at lines 116–120 keep measuring the real box through the ResizeObserver, so masks and chips stay aligned).
4. `src/app/globals.css` (inside the `@media (min-width: 1024px)` block):
   - Replace `  .desktop-post-dialog { width:min(1000px,calc(100vw - 112px)); }` with `  .desktop-post-dialog { width:fit-content; max-width:calc(100vw - 112px); }`.
   - Replace `  .desktop-post-content { display:grid; grid-template-columns:minmax(0,640px) minmax(320px,360px); height:min(680px,calc(100dvh - 96px)); border-radius:10px; overflow:hidden; }` with
     ```css
       /* 7f: the window's photo column is the photo's own shape, at most 680 px tall and 640 px wide; --photo-w/--photo-h come from the stored size (1/1 when unknown). */
       .desktop-post-content { --photo-w:1; --photo-h:1; --photo-box-h:min(680px,calc(100dvh - 96px),calc(640px * var(--photo-h) / var(--photo-w))); display:grid; grid-template-columns:calc(var(--photo-box-h) * var(--photo-w) / var(--photo-h)) minmax(320px,360px); height:var(--photo-box-h); border-radius:10px; overflow:hidden; }
     ```
     (line 56, `height:100% !important` on the first child, stays: the photo box fills a column that already has the photo's shape, so `object-contain` leaves no bars).
5. `src/components/PostOpenFrame.tsx` (the frame painted in the tick of the tap; after #590 merges, keep its `srcSet`, `onError` and `useState` on the `img` line and re-apply these substrings):
   - Replace `import {useLayoutEffect,useRef,useState} from 'react';` with `import {desktopPhotoVars,photoBoxStyle} from '@/lib/media/photo-box';`.
   - Replace the whole `Photo` function (from `function Photo({post,square}:{post:FeedPost;square:boolean}) {` through its closing `}` before `function Rows() {`) with
     ```tsx
     function Photo({post,desktop=false}:{post:FeedPost;desktop?:boolean}) {
      const slide=post.slides.find(slide=>slide.kind!=='card');
      const url=slide?.url??post.photoUrl;
      if(!url)return <div className="aspect-square w-full bg-card"/>;
      // 7f: the box takes the stored size's shape before the image loads, the
      // same box the detail uses, so nothing moves when the detail replaces this
      // frame. On desktop the window's grid gives the box its size.
      // eslint-disable-next-line @next/next/no-img-element
      return <div className="relative w-full overflow-hidden bg-card" style={desktop?undefined:photoBoxStyle(slide)}><img src={url} crossOrigin="anonymous" alt={post.caption||'Meal photo'} draggable={false} className="h-full w-full object-contain"/></div>;
     }
     ```
   - Replace `  <Photo post={post} square={false}/>` with `  <Photo post={post}/>`.
   - Replace ` return <div className="desktop-post-content" data-post-open-frame>\n  <Photo post={post} square/>` with ` return <div className="desktop-post-content" data-post-open-frame style={desktopPhotoVars(post.slides.find(slide=>slide.kind!=='card'))}>\n  <Photo post={post} desktop/>`.
6. Backfill for rows without a size (reading M9 names them): create `scripts/backfill-media-sizes.mjs`, run with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (from `.env.local`, never printed): select `id, storage_path` from `post_media` where `kind='photo' and (width is null or height is null or width<1 or height<1)`; for each, download `storage_path` from the `media` bucket, read `sharp(buffer).metadata()`, take `width`/`height` swapped when `orientation` is 5–8, clamp to 1–4096, `update post_media set width=…, height=… where id=…`, and print one line per row (`id width height`). It changes nothing else and runs once.
7. `npx tsc --noEmit`; `npm run lint`; `npm run build`; `npm test -- tests/feed-cache-lifecycle.test.mjs tests/feed-pagination.test.mjs tests/feed-nutrition.test.mjs tests/near-viewport.test.mjs tests/post-detail-reads.test.mjs` (every test that stubs `post_media` reads: add `width,height` to its stubbed select strings where a test asserts the exact select text). No new test (layout).

**Blast radius.** The phone detail box (narrower than the column when the 80% cap applies, centred), the desktop window's size per post (a 4:3 photo gives a 480 px tall window, a 3:4 photo 680 × 510), the open frame on both, and one more column pair in the feed's media read. If a slide has no size the box is square, as today. **Done:** section 12 M9 and M10.

## 10. A typed servings count (Lane K): the servings item (added after the paste)

1. `src/lib/posts/servings.ts`: replace `export const servingsLabel = (value: number): string => String(Number(value.toFixed(2)));` with
   ```ts
   export const servingsLabel = (value: number): string => String(Number(value.toFixed(2)));

   // A typed count: any number within the stored range, kept on the quarter grid
   // the database stores; null for anything else (the field then reverts).
   export function parseServings(text: string): number | null {
     const value = Number(text.trim().replace(",", "."));
     if (!Number.isFinite(value)) return null;
     const quarter = Math.round(value * 4) / 4;
     return quarter >= MIN_SERVINGS && quarter <= MAX_SERVINGS ? quarter : null;
   }
   ```
2. `src/components/ServingsControl.tsx`:
   - Replace `import { MAX_SERVINGS, MIN_SERVINGS, servingsLabel, stepServings } from "@/lib/posts/servings";` with `import { MAX_SERVINGS, MIN_SERVINGS, parseServings, servingsLabel, stepServings } from "@/lib/posts/servings";`.
   - Replace `  const change = async (direction: 1 | -1) => {\n    if (busyRef.current) return;` with `  const submit = async (next: number) => {\n    if (busyRef.current) return;`.
   - Replace `body: JSON.stringify({ servings: stepServings(servings, direction) }) });` with `body: JSON.stringify({ servings: next }) });`.
   - Replace `    finally { busyRef.current = false; setBusy(false); }\n  };` with `    finally { busyRef.current = false; setBusy(false); }\n  };\n  const change = (direction: 1 | -1) => submit(stepServings(servings, direction));`.
   - Replace `    <span className="min-w-8 text-center tabular-nums" role="status">{servingsLabel(servings)}</span>` with `    <input type="text" inputMode="decimal" aria-label="Servings count" defaultValue={servingsLabel(servings)} disabled={busy} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} onBlur={event => { const next = parseServings(event.currentTarget.value); if (next === null) { event.currentTarget.value = servingsLabel(servings); setError("Enter a count from 0.25 to 50, in quarters."); return; } if (next !== servings) void submit(next); }} className="h-tap w-16 rounded-field border border-line bg-white text-center text-detail tabular-nums disabled:opacity-50" />` (the `key` on the control in `PostDetail.tsx:29` remounts it with the saved value after each change, so `defaultValue` is always current).
3. Test (data rule): create `tests/servings-input.test.mjs` with `node:test` cases: `parseServings("1.5")` is 1.5, `"0,5"` is 0.5, `"1.6"` is 1.5, `"0.1"` is null, `"51"` is null, `"abc"` is null, `""` is null.
4. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/servings-input.test.mjs`.

**Blast radius.** The Servings control on a meal's detail (phone and desktop window); the route and the rescale are unchanged, so every nutrient, Home, Days and Today follow as they do for the − / + buttons. The control stays where it is (owner list). **Done:** section 12 M11.

## 11. Docs (Lane I): #595, the report, closures

- `docs/plan-run16.md` holds this plan unchanged.
- `docs/run16-report.md`: items 1–11 done or not done; each PR with its reviewed head, receipt kind and merge commit; P1–P4 outcomes; the readings M1–M8 with their numbers and the decision each fed; one line per thing noticed and left unfixed; every backlog issue this run created (or "none created").
- **#595:** at report time run `git fetch origin run14/docs && git show origin/run14/docs:docs/plan-run14.md | grep -n -i revok` and paste the head SHA and the lines into the report and as a comment on #595: done when every line is a retain statement (F7 shows three such lines at `eeba864c`); if a new line is not, say so on #595 and change nothing on `run14/docs` (#577 belongs to Fleet 14 and merges only on the owner's word).
- Docs and evidence go up in **one push** at the end (owner ruling, November 4, 16:46 WIB); any failed preview is diagnosed before another push; no `.mts`/`.ts` evidence files are added to the tracked tree (the Fleet 14 preview failures).

## 12. Readings, one each, with the decision each feeds

Each reading runs once after the work it checks is merged (or on a local production build where it says so), with the owner's test account 2 where sign-in is needed, and no new production post. None is a window or a series.

- **M1 (#592, lane A).** On a local production build at 1100×800, 1280×800 and 1440×900 (desktop feed, hover a card's numbers slide) and at 390×844 (post detail on its numbers slide): read `getBoundingClientRect()` of each visible arrow and of the text node range of the big number and "kcal" (`document.createRange().selectNodeContents(...)`); no intersection in any case. Decision: close #592 (with the four readings on the issue) or keep it open with the failing case named.
- **M2 (#593, lane B).** Production at 1280×800 after the merge: on load `document.querySelector('[data-focused]')` is null; after pressing J the first card has `data-focused="true"`; after a click anywhere in the feed it is gone; after Tab from the address bar into the feed a card is outlined. Decision: comment the four results on #593; the issue closes when the owner confirms on his desktop.
- **M3 (#598, lane C).** Lane C's PR merges first (build X). In one Chromium profile signed in as test account 2, load production twice so worker X is installed and `/shell` of build X is cached; then, with 2,500 ms added latency on the page and the worker (the Fleet 14 reproduction method), navigate to `/` once and confirm the cached shell was served (`[data-shell]` present). Keep that profile. After the next PR in the merge order deploys (build Y), with the same 2,500 ms latency: one normal reload. Record, in order: the `data-build` of the document first shown (expected X's shell), whether the browser installed worker Y (`navigator.serviceWorker.getRegistration()` then `registration.active.scriptURL` and `self.BUILD` through a message, or the Application panel's worker list), whether the window navigated itself, and the final `data-build`. Done when the final `data-build` equals Y within that one normal load. Decision: close #598 with the four readings, or keep it open naming the step where the old build still showed (and P5 as false if worker Y never installed).
- **M4 (#599, lane D).** Production at 1280×800 as test account 2, after the merge: with a `MutationObserver` on `aside[aria-label="Today"]`, record `performance.now()` at the first mutation in which the kcal span's text contains a digit, for one normal reload and one hard refresh; also record whether the server HTML (`curl` with the session cookie) already contains the kcal number. Done when both are under 2,000 ms. Decision: comment the three readings on #599; it closes when the owner's desktop shows the column within two seconds (his check).
- **M5 (#580, lane F).** On a local production build at 390×844, re-run the Fleet 14 geometry audit for the nine controls (the drivers in `scripts/run14-control-table.mjs` and the scope in `docs/evidence/run14/control-scope-final.md`) and record each control's rectangle. Done when all nine are ≥44 px on both sides. Decision: close #580 or file each still-undersized control as its own item.
- **M6 (#596, lane G).** One run of `scripts/real-food-match-smoke.mjs` (18 cases, real Meta and USDA, after lane G is on the branch); record every case's chosen record and pass/fail. Done when the Caesar case's description names dressing (and none of the fixture's rejected phrases) and the other 17 still pass. Decision: close #596, or keep it open with the failing case and its chosen record on the issue.
- **M7 (#597, lane H).** `npm run lint` on the merged main: `0 errors, 6 warnings`. Decision: close #597.
- **M8 (#594, lane E).** On a local production build in a phone-sized Chromium: (a) the Profile switch persists across a reload; (b) with it on, opening the capture sheet shows no live video and the shutter triggers a `click` on `input[capture="environment"]` (observed through a `click` listener); (c) with it off, Save photo calls `navigator.share` when `canShare({files})` is stubbed true and otherwise starts a download named `meal.jpg`. Decision: the toggle ships; the share sheet, Save Image and the camera roll are the owner's phone readings (P2, P3).
- **M9 (photo sizes, lane J).** One read-only query on production through `SUPABASE_DB_URL` before the backfill: `select count(*) from public.post_media where kind='photo' and (width is null or height is null or width<1 or height<1);`. The backfill script then runs for exactly the rows that query names (no rows when the count is 0) and the same query is run again after it. Done when the second count is 0. Decision: whether old posts need the fallback square at all; the report records both counts.
- **M10 (photo box, lane J).** On a local production build: at 390×844, from the feed tap a 3:4 photo post and record, with a `MutationObserver` and `getBoundingClientRect()`, the photo box's height at the first paint of the open frame and the height after the detail replaced it (expected equal, 520 px for a 390 px column, and no later change); at 1280×800 open the same post in the window and record the window's photo column width and height and the image's rendered width and height (expected equal within 1 px, no crop, no bars), plus the same for a 4:3 photo; on both, open the post directly by URL (no frame in memory) and record the same. Decision: the PM files the item as done, or the failing case is named.
- **M11 (servings, lane K).** On a local production build at 390×844 and 1280×800, on a ready meal: type `1.5` in the Servings field and leave it; record the request body sent to `/api/posts/<id>/servings` (`{"servings":1.5}`), then `0.5`, then `abc` (field reverts, message shown, no request). `npm test -- tests/servings-input.test.mjs`. Decision: the PM files the item as done.

## 13. Closures and comments (after the merge and the stated reading)

- Close after the merge and the reading: #597 (M7), #592 (M1), #580 (M5, if all nine pass), #596 (M6, if it passes), #598 (M3, if the build matches).
- Comment with commit-pinned evidence and leave open for the owner: #593 (M2), #599 (M4), #594 (M8 plus P2/P3 for his phones), #595 (lane I's grep), #370/#222/#372/#455/#456/#457 (one comment each: what is on main and that the phone check is the done condition; #455/#456/#457 are already closed on GitHub and stay closed).
- The photo-box and servings items have no issue numbers yet: the report carries M9–M11 under their backlog titles, and the PM files or closes them.
- No docs PR is merged by this plan. #577 and #558 stay as they are.

## Cleanup and exit

Remove leftover worktrees under `../my-food-ai-wt/run16-*` before the first PR; remove each worktree and local branch once its PR is pushed; delete each remote `run16/*` branch after its merge (the docs branch stays until the owner merges or closes its PR); retain the protection-bypass secret permanently, never revoke, regenerate or list it; stop local servers and the browser contexts the readings used; run `scripts/cleanup.sh`; only the main checkout, the untouched `run13/docs` checkout and the Fleet 15 worktrees that fleet still uses remain, and nothing temporary is running.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- The outline on the first post when desktop Home opens, and Enter opening the first post when nothing is outlined. J, K and Tab bring the outline back; a click hides it (6a).
- The square crop of the photo in the desktop window's first frame, and the square-then-resize box on the phone's first frame: both now take the photo's own shape at once.
- Nothing else is removed.

**Behaviour this plan changes (the default the plan takes)**
- The live numbers card gets 24 px more padding on each side where slide arrows can overlay it (desktop feed, post detail with more than one slide); the stored card image keeps the 3n layout. Default: padding on the live card, arrows unchanged.
- Each deployment installs a new service worker (the worker imports a one-line script that changes per build, so the browser's own update check finds it even for a window showing an old cached shell), the worker keeps only the current build's files, and after an update the new worker reloads every open window of the app once. Default: reload every window (a caption being typed at that moment is lost; deployments are yours and never happen during recording).
- The desktop post window is sized by the photo: a 3:4 photo gives a 680 × 510 photo column, a 4:3 photo a 640 × 480 one, with the record column beside it; the window is no longer a fixed 1000 × 680. On the phone the detail photo keeps its shape, capped at 80% of the screen height and centred when the cap applies. Default: as 7f describes; the feed card's square rail is not changed (below).
- Posts whose photo rows have no stored size (reading M9 counts them; every upload path has stored sizes since the first migration) are backfilled once from the stored files; until then they draw a square box as today. Default: backfill, no new column.
- The Servings count on a meal can be typed (0.25–50, quarters) as well as stepped; − and + keep their 0.5 step. Default: a typed field in the same control, same route, same rescale.
- Reviews: the coder runs PPLX on this machine first (routes 1, 2 and 4), then AGY; unreviewed PRs are listed for the laptop prompt at the end of this plan and are not merged until that receipt exists. Default: no PR merges without a counting review.
- Fleet 16 PRs merge only after the Fleet 15 PRs that share their files; Fleet 15 keeps its own merge orders. Default: Fleet 15 first, lane C first within Fleet 16.
- The desktop Today column is rendered on the server with its numbers; when the feed's first page cannot prove today complete, the server reads today once (the same read `/api/days` makes) instead of leaving the column blank for a browser fetch. Default: that one extra server read on such days.
- The camera-mode choice is kept on the device (browser storage), not in the account, because a phone's camera setting describes that phone. Default: device storage; the Profile text says so.
- In "phone camera" mode the shutter opens the phone's camera app; nothing opens by itself when the sheet appears. Default: shutter-triggered (browsers require a tap to open a file chooser).
- The lint exception at the post-opening overlay keeps the full-page navigation Fleet 14 chose and documents the rule it bends. Default: keep behaviour, document the exception.
- Text fields fill their 48 px boxes and the capture mode tabs grow from 36 to 44 px; "more", "Log now" and the + button keep their drawn size inside a 44 px box. Default: as listed.
- A USDA record whose description says "no <component>" or "without <component>" is dropped before the model sees it unless the meal's name or caption says the same; "no added fat/salt/sugar" records stay. Default: the deterministic filter, no prompt change.

**Places where the design and the product's function disagree**
- 6a says a mouse click "on the page" clears the outline; the plan clears it on any pointer press anywhere in the window. Default: any press.
- 3n draws the numbers card at 32 px padding; the live card under arrows now has 56 px sides. Default: the gutter.
- Design 7a/7 sized the mode tabs at 36 px; the paste's 44 px rule wins. Default: 44 px.
- 7f, as described to me, says every photo box takes the photo's shape; the feed card keeps its square rail, because its slides (several photos and the square numbers card) share one rail and 7f gives no rule for a rail of mixed shapes. The detail, the window and the first frame are 7f. Default: feed card square; say the word and the rail becomes the first photo's shape in a later fleet.
- The Servings control stays inside the meal's nutrition area where it is; the exemplar shows it near the top. Default: unchanged position.

**Yours, outside this plan**
- Confirm on your desktop: no outline on load (#593), the Today column within two seconds (#599), the window and first frame taking the photo's shape (7f).
- Your iPhone and Android phone for #594: flip the Profile switch, take a photo in each mode, and check the share sheet (iPhone may lack "Save Image" on the sheet; press and hold the preview) and whether the camera roll kept a copy. The report records what the plan could check without a phone.
- The three-phone checks that remain the done conditions for #370, #222, #372, #455, #456, #457.
- Fleet 15's PRs #582–#590 and docs #577/#558 are not touched by this plan; their merge orders are yours, and Fleet 16 waits for the ones that share its files.
- When the coder asks (route 2): pass Cloudflare once in the Firefox window on display :10, so the runner can submit.
- Hand the prompt below to Sonnet on your laptop when the coder's report lists PRs without a counting review.
- Say when recording starts and ends (the hold stops merges and deployments).

---

## Prompt for Sonnet on the owner's laptop: PPLX reviews in the laptop browser

Copy everything between the lines into a new Sonnet session on the laptop that has Perplexity signed in. Fill the PR list from the coder's report (section "Reviews" of `docs/run16-report.md`, the rows marked "no counting review"). Nothing else is filled in.

```
You are reviewing pull requests for the GitHub repository aibraincoach/my-food-ai by submitting each one to Perplexity in this laptop's browser, which is already signed in. You change no code and merge nothing. Work one PR at a time, exactly as below, and stop only when every PR in the list has a receipt or a recorded failure.

PRs to review (number, URL, head SHA):
- #<n> https://github.com/aibraincoach/my-food-ai/pull/<n> <full head sha>
- (one line per PR)

For each PR, in order:
1. Open https://www.perplexity.ai in a new tab. In the model picker, select "Gemini 3.8 Flash". Confirm the picker shows "Gemini 3.8 Flash" before you type anything.
2. In the ask box type exactly, with the PR's URL and nothing else:
   code review https://github.com/aibraincoach/my-food-ai/pull/<n>
   Submit it. Do not add instructions, files, context or a second message.
3. After the answer finishes, read the model label shown on the thread for that answer. If it reads anything other than "Gemini 3.8 Flash" (for example "GPT-6.1 Sol"), the attempt is invalid: do not post it, note "invalid attempt: thread model <label>" for this PR, open a fresh tab and try once more from step 1. After a second invalid attempt, record the failure for this PR and move to the next.
4. If the answer says it is "Searching the web" or reviews something other than this PR, record "wrong submission" with the thread link and move on; do not post it as a review.
5. When the model label is "Gemini 3.8 Flash": copy the whole answer verbatim. Post it as one comment on the PR with this first line:
   PPLX review (Gemini 3.8 Flash, owner's laptop browser) · head <full head sha> · thread: <the thread's URL>
   then a blank line, then the verbatim answer, then a last line that reads exactly BLOCKERS: NONE if the answer names no blocking defect, or BLOCKERS: <the list, one per line> if it does.
6. Post the same text as a second comment only if the first failed to post. Do not edit, delete or merge anything, and do not reply to other comments.

When every PR is done, print a table: PR, head, result (receipt posted / invalid attempt / wrong submission / failed), thread URL. That table is your whole report.
```