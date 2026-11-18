# Fleet 35 — the first photo's real size and a 1200-pixel copy, the leftovers preview in the same session, the deleted-meal sentence, and valid checks for #688, #628, #938, #987 and #351 (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-18 02:23Z, the backlog (Doc rev 2030) and Fleet 33's reports (`state/build/fleet33/report.md`, `state/build/fleet33-postmerge/report.md`). It has three code PRs and one docs PR, five local checks, one stop before the merges, and one production section after the PM's merge order. Planned from main `5be28fd594b449ce0e2a7f5e7e75c67e12f0dab1`. **Fleet 34 is with the builder: nothing here touches its files** (`scripts/numbers/study.mjs`, `tests/numbers-study.test.mjs`, `scripts/numbers/21-portion.sql`, `22-items.sql`, `README.md`, `tests/numbers-portion.test.mjs`).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and section 9's waits add up to at most 30 minutes.

**Builds.** The first `next build` of a worktree can stop with `SecurityFatalError` ("Your version of Next.js is affected by a known security vulnerability"). The same build run once more continues past it with a warning, as in Fleet 33. Do not upgrade anything for it. The PM numbers it as its own item (section 3).

## 1. Each item: what it is and what this plan does

| Item | What it is | What this plan does |
|---|---|---|
| #372 | **Instrument fault, then a fixture limit, then a real gap.** `img.naturalWidth` is not the file's width when `srcset` uses `w` descriptors: the browser divides the file's pixels by the density it picked. For the 1600w candidate in a 390-pixel slot, that density is 1600/390 ≈ 4.10. The served file was 633 px wide, because the fixture photo itself was only 633 px and the resize never enlarges (`resizeSharpPhoto`, `withoutEnlargement`). 633/4.10 = 154, the width Fleet 33 read. The real gap: for a 390-pixel card on a 3x phone (1,170 px wanted), the only candidate wide enough is 1600, which costs more bytes than the card needs | PR 1 adds a 1200 px copy, so a 3x phone gets 1200 (3.08x the card). P1 measures the decoded file's own width |
| #222 | **Probably bandwidth, not yet proven.** At 1.6 Mbit/s (about 200 KB/s) the first photo shares the line with Home's script (about 380 KB) after a cold first response; 3.80 s fits that arithmetic. The photo is server-rendered with its `srcset` and preloaded (`src/app/(tabs)/page.tsx` line 121), so it is not fetched twice | PR 1 cuts the photo's bytes; P1 records when the photo request starts and ends and the bytes that finished before it, so a miss says whether start delay or bytes dominate |
| #570 | **Product defect, found and reproduced.** While a meal posted in this session still has its upload entry, Home draws it with `UploadHydratedCard` (`src/components/Feed.tsx` line 493), which passes `PostCard` that finished upload, never the attachment. So a leftovers photo added to that meal shows no preview: it appears only when the server's slide loads. A meal from an earlier session uses the server card, which shows the preview at once. Fleet 33's P1 was this case | PR 2 passes the attachment to that card. L1 proves it |
| #688 | **Instrument fault.** The rail is a native horizontal scroller (`src/components/Carousel.tsx` line 81: `flex snap-x snap-mandatory overflow-x-auto`). A synthesized gesture scrolled the page instead | L2 and P5: a page-script control (`scrollBy`), then a real touch sequence with moves |
| #628 | **Missing state, and one harness fault.** The beer case needs the model to ask a question. Production's model accepts the caption, and Fleet 33's local run never put the local fake model in its `beer-question` mode (`tests/fixtures/local-model.mjs` line 11). Locally, the harness also blocked the script's own CDP discovery | L3: beer on the local stack with that mode set |
| #970 | **Product defect, one cause.** A meal deleted while its photo is on the way answers "Post not found." from the route's precheck (`src/app/api/posts/[id]/media/route.ts` line 14), before the refusal with its sentence can run. The "not ready" and "has drinks" causes cannot be reached from the menu (it offers Add photo only on a ready meal), so they need the request itself | PR 3; L4 makes all three by changing the meal while the request is held |
| #938 | **Instrument fault.** Fleet 33's desktop observer failed before any measurement ("Browser expression failed") | L5: the entry found by its own text |
| #987 | **Missing state.** No estimated coffee or tea exists. The estimate is the matcher's choice: when no USDA record is close, the model estimates and now stores caffeine (`src/lib/fdc/estimate.ts`, `tests/estimate-caffeine.test.mjs`) | P2: up to three typed Indonesian coffees with no close record, stopping at the first estimate |
| #351 | **Missing state.** Water had 4 uses and Coffee 2, so ordering by use could not show | P3: five Coffee taps (more than Water's four), then reopen |

## 2. Facts the planner checked, and premises

- **The size the first photo loads at.** The card's photo is `src/components/Carousel.tsx` line 111. Its `srcset` comes from `feedPhotoSrcSet` (`src/lib/posts/feed-photo-url.ts`): `_640.webp 640w, _1080.webp 1080w, _1600.webp 1600w`, with `sizes="(min-width: 1024px) 520px, 100vw"`. At 390 wide on a 3x phone the slot is 1,170 device pixels, so the browser picks the 1600 candidate. `/p/<photo>_<secret>_<width>.webp` (`src/app/p/[file]/route.ts`) reads the stored original and resizes it to fit inside width × width, never enlarging, as WebP quality 68. Fleet 33's fixture original was 633 px wide (an 800 × 1000 cap on a cropped repository photo), so its 1600 copy was 633 px: 108,694 bytes. A real capture since the sharper camera is 2560 × 1920, so its 1600 copy is 1600 px wide.
- **Why the ratio read 0.39.** For a `w`-descriptor `srcset`, `naturalWidth` is the file width divided by the chosen density: 633 / (1600 / 390) = 154.3, the 154 Fleet 33 recorded. It is not a photo smaller than its card. P1 reads the decoded file instead.
- **#570 reproduced and fixed on the planner's stack** (`fleet35-l570.mjs`, the built app, the local fake model):
  - **Main's `Feed.tsx`:** the meal was drawn as its upload card. After a leftovers photo was added, no new preview appeared in 15 seconds; the photo showed up only later, as the server's slide.
  - **With PR 2:** the same card showed the new preview 18 ms after the photo was sent, and the attachment was saved at 561 ms.
  - **After a reload:** the meal is a server card, which already showed the preview at once (27 ms).
- **#970's precheck.** The route reads the meal with the person's own client. A soft-deleted meal is not returned, so the route answered "Post not found." before `attachPostPhoto` could raise its refusal. Fleet 33's L1 saw exactly this. PR 3 answers with that refusal's own sentence and code (`attachment_meal_missing`), so the chip shows it.
- **Verified on the planner's stack** with the three PRs together: `npx tsc --noEmit` clean; `npx eslint` on the changed files clean; the database suite 51 of 51; the application suite 789 of 795 (6 skips, 0 failures). L2 to L5 and P1 to P5 were not run by the planner.

## 3. Not in this run, and why

- **Needs an issue number:** "The production build warns that Next.js 16.4.3 has a known security vulnerability". Fleet 33 found it; every first build stops on it. It is a dependency upgrade, and none is planned here.
- **Designs:** #631 (waiting, slow and failed states), #453 (the barcode prompt), #555 (the control audit), #455 and #457 wait for the designer's pages. To plan a build from a page, the planner needs these from it:
  - **Every state drawn:** rest, waiting, slow, failed, offline and empty, at 390 and at 1280 wide.
  - **The exact words**, or a note that AGY decides them.
  - **Existing tokens and components:** each colour, size and spacing named by its token in `src/lib/theme/tokens.ts`, and each region named by the existing component it changes (or "new").
  - **Timing:** when "slow" begins, and what a retry does.
  - **Accessibility:** what is announced and when.
  - **A done line a person can check.**
- #936's owner half, #684, #615's notification: the owner's sign-in or phone. #693's speech, #955's largest text, #452, #212, #999, #594, #579's camera: a phone.
- #1000: needs a design. #373, #375: the usage page's byte figures (PR 1 cuts photo bytes, which helps #375). #368, #279: fast throwaway sign-ups and the owner's phone. #578: a ruling on each finding. #60: waits for the last feature. #553, #552, #217: a slowed-processor table of every control. #571, #683, #708: failures made on purpose beyond these checks. #694, #285, #617: larger findings. #323's server half: the server log. #695: a busy resizer cannot be forced. #575: no meal with an unavailable value can be made on purpose. #990: Fleet 34.

## 4. How it runs

As Fleet 33:
1. **Worktrees.** One fresh worktree per PR from `origin/main` under `/tmp/mfa-f35`, with `npm ci` in the worktree.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f35/stack TEST_ENV_FILE=.env.test.fleet35`.
3. **Per PR:** `npx tsc --noEmit` and `npx eslint` on the changed files.
4. **Suites.** Both suites once, on a scratch branch of the three PRs with the built app started (10 minutes each).
5. **Reviews.** One PPLX review per code PR on its final head; AGY when PPLX is unavailable, and AGY in any case for PR 3's sentence.
6. **Local checks.** L1 to L5 (section 6), each once and at most 10 minutes, in fresh native Chromium with CDP at 390 by 844, DPR 3, unless a check says otherwise. Allow the harness's own requests to its CDP and BiDi discovery ports.
7. **Docs PR.** Branch `docs/fleet35`, with this plan unchanged as `docs/plan-fleet35.md`.
8. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix35/photo-1200` — #372, #222

A 1200-pixel copy of every public photo, served at the same kind of address and resized on request like the others. **No migration and no change to stored files:** copies are made from the stored original when first asked for, and the CDN keeps them (`s-maxage=86400`, immutable). Existing 640, 1080 and 1600 addresses are unchanged.

File `src/lib/posts/feed-photo-url.ts`.

Find:
```
export function publicPhotoUrl(media: string, secret: string, width: 640 | 1080 | 1600): string {
```
Replace:
```
export function publicPhotoUrl(media: string, secret: string, width: 640 | 1080 | 1200 | 1600): string {
```

Find:
```
  if (open) return `${open[1]}_640.webp 640w, ${open[1]}_1080.webp 1080w, ${open[1]}_1600.webp 1600w`;
```
Replace:
```
  // #372, #222: a 390-pixel card on a 3x phone needs 1170 pixels; 1200 serves it without the 1600 file's bytes.
  if (open) return `${open[1]}_640.webp 640w, ${open[1]}_1080.webp 1080w, ${open[1]}_1200.webp 1200w, ${open[1]}_1600.webp 1600w`;
```


File `src/app/p/[file]/route.ts`.

Find:
```
// A photo's permanent public address: /p/{photo id}_{secret}_{width}.webp.
// The secret on the photo's row is the only check, so the answer can be kept by the CDN.
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_(640|1080|1600)\.webp$/;
```
Replace:
```
// A photo's permanent public address: /p/{photo id}_{secret}_{width}.webp, width 640, 1080, 1200 or 1600.
// The secret on the photo's row is the only check, so the answer can be kept by the CDN.
const FILE = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_([0-9a-f]{32})_(640|1080|1200|1600)\.webp$/;
```


No new test: no test fixes the candidate list, and `tests/photo-address.test.mjs` keeps passing.

### PR 2 — branch `fix35/attach-preview` — #570

File `src/components/Feed.tsx`.

Find:
```
  const localCards=uploads.map(upload=>{const server=visibleState.kind==='ready'?visibleState.posts.find(post=>post.id===upload.postId):undefined;const seed:FeedPost=server??{id:upload.postId??upload.operationId,caption:upload.caption,eaten_at:upload.eatenAt,created_at:upload.eatenAt,status:"queued",photoUrl:upload.previewUrl,slides:[],items:[]};const zone=renderZone;const day=dateInZone(seed.eaten_at,zone);const header=!uploadDays.has(day);const measured=visibleState.kind==='ready'?visibleState.days.find(value=>value.day===day):undefined;const measuredTotal=measured?{...measured,ready:measured.ready||measured.kcal===0}:undefined;if(header)uploadDays.add(day);return <UploadHydratedCard key={upload.operationId} post={seed} upload={upload} header={header?<DayHeader day={day} zone={zone} empty={false} total={measuredTotal}/>:null}/>;});
```
Replace:
```
  const localCards=uploads.map(upload=>{const server=visibleState.kind==='ready'?visibleState.posts.find(post=>post.id===upload.postId):undefined;const seed:FeedPost=server??{id:upload.postId??upload.operationId,caption:upload.caption,eaten_at:upload.eatenAt,created_at:upload.eatenAt,status:"queued",photoUrl:upload.previewUrl,slides:[],items:[]};const zone=renderZone;const day=dateInZone(seed.eaten_at,zone);const header=!uploadDays.has(day);const measured=visibleState.kind==='ready'?visibleState.days.find(value=>value.day===day):undefined;const measuredTotal=measured?{...measured,ready:measured.ready||measured.kcal===0}:undefined;if(header)uploadDays.add(day);return <UploadHydratedCard key={upload.operationId} post={seed} upload={upload} attachment={upload.postId?attachmentUploads.find(attached=>uploadTargetsPost(attached,upload.postId!)):undefined} header={header?<DayHeader day={day} zone={zone} empty={false} total={measuredTotal}/>:null}/>;});
```

Find:
```
function UploadHydratedCard({post,upload,header}:{post:FeedPost;upload:UploadState;header:import("react").ReactNode}) {
```
Replace:
```
// #570: a photo added to a meal posted in this session shows on this card at once, as it does on a server card.
function UploadHydratedCard({post,upload,attachment,header}:{post:FeedPost;upload:UploadState;attachment?:UploadState;header:import("react").ReactNode}) {
```

Find:
```
  return <div data-desktop-post={upload.postId??upload.operationId} tabIndex={-1}>{header}<PostCard post={fresh??post} upload={upload}/></div>;
```
Replace:
```
  return <div data-desktop-post={upload.postId??upload.operationId} tabIndex={-1}>{header}<PostCard post={fresh??post} upload={attachment??upload}/></div>;
```


No test: the contract asks for none for layout. L1 is its evidence; it fails on main.

### PR 3 — branch `fix35/deleted-meal-sentence` — #970

File `src/app/api/posts/[id]/media/route.ts`.

Find:
```
import {attachPostPhoto,AttachmentStageExpired} from '@/lib/posts/attach-photo';
```
Replace:
```
import {attachPostPhoto,AttachmentStageExpired,ATTACH_REFUSALS} from '@/lib/posts/attach-photo';
```

Find:
```
 if(!post)return NextResponse.json({error:'Post not found.'},{status:404});
```
Replace:
```
 // #970: a meal deleted while its photo was on the way says so, with the same sentence the attach refusal uses.
 if(!post){const missing=ATTACH_REFUSALS.get('Post not found')!;return NextResponse.json({error:missing.message,code:missing.code},{status:404});}
```


No test: the contract asks for none for wording. L4 is its evidence.

## 6. The local checks

- **L1, #570.** Copy `/home/opc/.claude/plans/fleet35-l570.mjs` (sha256 `874aeed714ce71c7146f41f07021943ec639375574a7fd06b15a6eb43a6131cf`) outside Git, and run it once. The command is `MFA_TEST_DISPOSABLE=1 K3_OUT=<private folder with an empty private/> timeout 600 node fleet35-l570.mjs K3 <scratch worktree> <its env file> <build marker>`. It posts a meal and lets it become ready **without reloading** (so Home still shows it as the session's own upload card). It then adds a leftovers photo through the `open-entry` event and times that card until a new local preview image shows (`previewMs`, at most 15 seconds). Report `cardKind` (expected "upload card"), `previewMs`, `savedMs`, and the cleanup. Met when `previewMs` is under 1,000.
- **L2, #688.** On a local meal with two photos (insert a second `post_media` photo row with the service key, and say so), on Home at 390 wide:
  1. **Find a rail that can scroll.** Find that card's `[aria-label="Meal photos"]` element (the rail) and check `scrollWidth > clientWidth`. If it cannot scroll, report that and stop.
  2. **Control:** `rail.scrollBy({left: rail.clientWidth})` from page script. After 1 second, record `scrollLeft`.
  3. **Reset:** `rail.scrollLeft = 0`.
  4. **Touch:** `Emulation.setTouchEmulationEnabled` with `enabled: true`. Then `Input.dispatchTouchEvent` `touchStart` at the rail's centre, ten `touchMove` events each 30 px further left, 16 ms apart, and `touchEnd`. After 1 second, record every rail's `scrollLeft` and `window.scrollY`.

  Met when the control moved the rail, the touch moved only that rail by at least 200 px, and the page moved less than 200 px. If the control moves it and touch does not, report it as an instrument limit, not a product verdict.
- **L3, #628.** Set the local fake model to ask (`POST <MODEL_API_BASE_URL>/__fixture` with `{"mode":"beer-question"}`). Run `scripts/run17-checks.mjs --mode=beer` once against the local app with a fresh Firefox BiDi session, under `timeout 600`. Then set the mode back with `{"mode":null}`. Report the exit code and the first error. Met when it exits 0.
- **L4, #970: the three causes the menu cannot reach.**
  1. **Hold:** on a ready local meal, start adding a photo through its post menu's "Add photo", with `Fetch` holding the `POST /api/posts/<id>/media` request.
  2. **Change the meal and release**, once for each cause:
     - **Not ready:** set its `status` to `queued`. Expected: "This meal is still being analysed, so try again a little later."
     - **Has drinks:** insert an `intake_logs` row with `source = 'sheet'`. Expected: "Photos cannot be added to meals with drinks, so log this as a new meal instead."
     - **Deleted:** set `deleted_at`. Expected with PR 3: "This meal was deleted, so remove this photo or log it as a new meal."
  3. **Read** the chip's `[role="alert"]` each time, then put the meal back.

  Met when each shows its own sentence.
- **L5, #938.** At 1280 by 800:
  1. Add a photo to a ready local meal with `Fetch` failing the storage upload.
  2. Find the failed entry by its own text ("Not saved · Try again" together with "Remove" inside the same row). Record its row's box and the Remove button's box.
  3. Tap Remove. Wait at most 5 seconds until no row with that text remains.
  4. Reload, and check it stays gone.

  Met when Remove lies inside the row and the entry stays gone.

## 7. The stop

Stop when the three code PRs and the docs PR are open, each code PR reviewed or reported "written, not reviewed", and L1 to L5 are reported. Report to the PM, in one message: each PR's number, branch, final head (40 characters), checks and results, and review (PR 3's AGY sentence); the two suites' counts; L1 to L5 with their numbers; anything void under section 2; and the merge order this plan expects: PR 1, PR 2, PR 3, then the docs PR. Section 9 needs all three served on production. Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. (Reserved.)

## 9. After the PM's merge order: production, test account 2

As Fleet 33's section 9:
- **Browser:** fresh native Chromium with CDP at 390 by 844, DPR 3, signed in as test account 2.
- **The guard:** app-origin writes and Supabase media uploads for test account 2 only; service workers bypassed.
- **The ledger:** record every post id before the next action.
- **Cleanup at the end:** delete each post and its `post_upload_drafts`, `post_photo_attachments`, `intake_logs`, `post_media` rows, operation receipts and stored files. Read each back as absent, and report the count.

Each step's bound is 10 minutes; the waits add up to at most 30 minutes.

- **P1, #372 and #222.**
  1. **Make a photo meal.** Generate a 2560 by 1920 JPEG with real detail: `sharp({create:{width:2560,height:1920,channels:3,background:{r:150,g:110,b:60},noise:{type:'gaussian',mean:128,sigma:30}}})`, as JPEG quality 90. Post it as a meal ("Roast beef with gravy") and wait until it is ready (at most 240 seconds). It is then first on Home.
  2. **Open Home four times, cold:** once unthrottled, then three times slowed (150 ms latency, 1.6 Mbit/s down, 0.75 Mbit/s up), each in a fresh profile with `Network.setCacheDisabled`.

  For each open, record:
  - **Which candidate:** the first photo's `currentSrc`, expected `_1200.webp`.
  - **The file's own width:** take its response body with `Network.getResponseBody` and read its width with `sharp(...).metadata()`. Never use `naturalWidth`; section 1 says why.
  - **Its bytes:** `encodedDataLength`.
  - **Its timing:** its Resource Timing `requestStart` and `responseEnd`, and its load event.
  - **What it shared the line with:** the total encoded bytes of every response that finished before its `responseEnd`.

  Met for #372 when the file's own width is at least 780 px (twice the 390-pixel card). Met for #222 when each slowed load is 2 seconds or less. If #222 is not met, the record says which dominated: a late `requestStart`, or the bytes before it plus its own.
- **P2, #987.** Post as text meals, one at a time, stopping at the first that gives an estimate: "es kopi susu gula aren", then "kopi joss", then "wedang kopi rempah". When each is ready (at most 120 seconds), read-only SQL says whether its coffee food's micronutrients carry an approximation of kind `estimate`, and its caffeine (1057). Met when an estimated coffee stores a caffeine value. If none of the three is estimated, report each one's matched record and mark #987 not checked.
- **P3, #351.** From the drink sheet, tap "Coffee cup" five times (no hold), waiting for each to save. Close the sheet, open it again, and record the tile order and the use counts. Met when "Coffee cup" is first (five uses against Water's four).
- **P4, #570.** L1's steps, in Fleet 33's production browser core, as test account 2. The L1 helper itself refuses any address that is not loopback. Post a meal, wait until it is ready without reloading, add a leftovers photo through `open-entry`, and time that card until a new `blob:` preview image is complete. Do this once. Met when the time is under 1,000 ms and the card was the session's own upload card.
- **P5, #688.** L2's steps 1 to 4 on P4's meal, which has two photos. Met as in L2.

**What section 9 reports.** One row per check, met, not met or not checked, with its numbers. Also the cleanup count, and each created row read back as absent.
