# My Food AI — build plan, Fleet 10 (the whole post-Run 8 backlog: six code PRs, one README, one report, closures)

You are the coder. Written Tue 2026-11-03 ~16:00 WIB (09:00 UTC). All work is in `aibraincoach/my-food-ai`. Every time is WIB (UTC+7).

## Stops: zero

**Start:** at once. Begin item 9 (Coffee tile) and item 6 (capture) first among the lanes: they are what judges touch most. Fleet 9 (#345, #346, #347, #352) has merged.

**This plan is the merge order for its code PRs.** RT approved on Nov 3 ~15:08 WIB, in reply to the planner: "Plan is merge order" and "Freeze holds 23:59". At ~15:15 WIB RT withdrew the live sign-in probe: nothing sends sign-ups through the production form. For Fleet 10 only, this overrides the named-head rule. The coder merges each Fleet 10 code PR at the exact head the reviewer cleared with `BLOCKERS: NONE`, in ascending PR number. Nobody sends a further order.

**Owner merge rule, Nov 3 (verbatim):** "If the code checks out and the review is fine with zero blockers, the thing gets merged. When the planner re-evaluates, if there are still problems or defects, it goes on the backlog." No merge in this plan waits for anyone's call. A defect found after a merge is filed as a backlog issue, not reverted.

**Deadline (the 23:59 freeze holds):** every code PR is clean by **23:30**, merged and checked on production by **23:55**. A PR not clean by 23:30 is not merged and is reported not done. Nothing waits on it.

**Nothing is cut in advance.** Every item is built at once. The only rule is the deadline: a PR not clean by 23:30 is not merged.

## Every backlog item, and what Fleet 10 does with it

The backlog is the PM's post-Run 8 list as numbered in BACKLOG.md at `81bbaea` on #333, plus #280. Every item is here, once.

**What the right-hand column means:**
- **Code n** — built in plan item n.
- **Report 7x** — a docs-only section of `docs/run10-investigations.md`, with no code.
- **Close 8** — closed in item 8 with the evidence named.
- **RT** — only the owner can do it (see the end).

| Issue | Backlog item | Fleet 10 |
|---|---|---|
| #368 | Sign-ins may share one rate limit | Report 7a (read-only) |
| #369 | Public repo does not show Run 8; stale test claims | Code 3 (README) + merge #333 in item 8 |
| #370 | Camera view stays open after a photo | Code 6 + Report 7g (timing) |
| #371 | Thumbs "Feedback could not be saved." | Code 1 |
| #372 | Feed photos too large on mobile data | Report 7h (bytes); already resized (Facts) + fix under 20 |
| #373 | App reads more from the database than needed | Report 7d, 7e + fix under 20 |
| #374 | When the empty-claim loop started | Report 7b |
| #375 | Storage egress largest and uncut | Report 7c + fix under 20 |
| #376 | Feed photos re-download after session refresh | Code 4 |
| #377 | Existing drink posts show no caffeine | Code 13 + Report 7j |
| #325 | Regions far from Jakarta; regions and timeouts undeclared | Code 5 |
| #378 | Duplicate of #325 | Close 8 as duplicate of #325 |
| #222 | Feed fails to open; photos slow | Report 7h (emulation); phone part RT (#379) + fix under 20 |
| #304 | Open on the last feed | Code 11 + Report 7i |
| #305 | First photo first | Close 8 (built, Facts) |
| #281 | Muse Spark Open | Close 8 after RT's acceptance; coder's test-account check in 8 |
| #316 | Facebook button grayed out | Close 8 (built, Facts) |
| #306 | Every saving tap shows its result at once | Report 7k + fix under 20 |
| #307 | Food names before numbers | Built (19); production check 8 |
| #282 | App keeps working while judges use it | Report 7l; refusal tests exist (Facts) + fix under 20 |
| #287 | README shows the three Meta models and evidence | Code 3 |
| #60 | Start-here README; search for private strings | Code 3 |
| #322 | Tick cold start | Report 7h + fix under 20 |
| #323 | One sign-in check per page | Report 7h + fix under 20 |
| #324 | Day totals once | Report 7h + fix under 20 |
| #279 | CAPTCHA on | RT |
| #223 | Edited caption shows everywhere | Report 7m + fix under 20 |
| #228 | Summary numbers differ from totals | Close 8 (cannot happen, Facts) |
| #272 | Matcher returns unavailable for plain foods | Code 12 + Report 7n |
| #65 | Pipeline tests offline | Close 8 (built, Facts) |
| #66 | Brief 429 retried inside one attempt | Close 8 (built, Facts) |
| #294 | Words read naturally | Code 18 + Report 7o |
| #107 | Visible way into post detail | Code 2 |
| #175 | Days shows water-only days | Code 10 |
| #224 | Times in the user's zone | Report 7m + fix under 20 |
| #215 | Thumbs respond at the tap | Code 1 |
| #29 | Results card in the carousel | Report 7m + fix under 20 |
| #283 | Card PNG footer | Report 7m + fix under 20 |
| #193 | Screens against the designer's frames | Report 7p + fixes under 20 |
| #353–#367 | Visual differences, rounds 1–4 | Fixes under 20 (one PR each) |
| #217 | Smoothness audit | Report 7k + fix under 20 |
| #23 | One-time hints | Report 7m + fix under 20 |
| #280 | Installed app accepted on three real phones | RT |
| #379 | Phone checks of the installed app over mobile data | RT |
| #348 | Composer drink cards before posting (5b–5d) | Code 14 |
| #349 | Unmark leftovers and Replace photo (5l) | Code 15 |
| #350 | Undo after removing a photo or correction | Code 16 |
| #351 | Drink tile ordering by use and hold-for-sizes (5f) | Code 17 |
| PR #380 | Water tile labels, migration 0037 | Merged; item 8 confirms 0037 on production |
| #381 | Coffee tile returns 502 on production | Code 9 |
| #382 | Delete confirmation disappears on rerender | Code 21 |
| — | Water tiles returned 502 before 0037; tap not repeated | Check 8 (all six tiles) |
| — | Photographed cola shows 30 mg, not 32 mg | Decided: stored USDA 29.7 mg stands (RT list); closed in 8 with that ruling |

## Facts checked by the planner (Tue 2026-11-03, 08:00–09:00 UTC)

**Repository state**
- Main is `cbd0bd7a170a125dafb9ab8b3784db12a8d5492a`, after Fleet 9 and #380. Check: `git log -1 origin/main`.
- **#380 is merged** ("fix: allow water tile labels in atomic drink RPC", head `2fc6755bfb6ad1f051016311ac094a5903e51a15`). It adds migration `0037_water_tile_labels.sql`. Check: `gh pr view 380 --json state,headRefOid`.
- Open PRs: docs #333 at `81bbaeacc0efe0453652744ba43b0c58a7f11f16`, with a watch review `BLOCKERS: NONE` on that head, and docs #344 at `1c284679e24a5b36bd2eb8028b898bf9dae0cdb2`. Check: `gh pr list --state open`.
- **Fleet 10 adds migration 0038** (item 15).
- Every find-text items 1, 2, 4 and 6 replace occurs exactly once on main (checked at `467ec5c`; #380 touched only migrations and tests). Check: `git show origin/main:<file> | grep -c -F '<find text>'` gave 1 each.
- The backlog issues #368–#378 and #379 are filed. #378 duplicates #325 ("The Vercel and Supabase regions may be far from Jakarta (part of #222)"). #379 is the phone checks over mobile data. #280 is "The installed app is accepted on three real phones". Fleet 9 follow-ups #348–#351 are open. Check: `gh issue view <n>`. The coder files no backlog issue.

**Thumbs (#371, #215)**
- `saveFeedback` (`src/lib/posts/feedback.ts`) calls RPC `save_revision_feedback` and throws a bare `Error('Feedback could not be saved.')`, dropping the error code.
- The route (`src/app/api/posts/[id]/feedback/route.ts:18`) turns every throw into 500.
- The RPC (`supabase/migrations/0007c_feedback_revision.sql:32-46`) raises:
  - `42501` when the post is not the caller's;
  - `22023` for a bad verdict or model revision;
  - `40001` "Meal changed before feedback" when the client's fingerprint differs from `feedback_revision(post)`.
- The client's fingerprint comes from the feed or detail payload (`src/lib/posts/feed.ts:157`, `:243`). The feed also renders from a localStorage copy (`src/lib/posts/feed-cache.ts`). A card older than the post's current items sends a stale fingerprint.
- The message prints twice: once in `ThumbsFeedback.tsx` (`role="alert"` under the buttons) and once in `DoubleTap.tsx` (`role="alert"` over the photo).
- `sendFeedback` is used only by `DoubleTap.tsx` and `ThumbsFeedback.tsx`. Check: `git grep -n sendFeedback origin/main -- src`.

**Already built**
- **#305.** `Carousel.tsx:46` renders feed photos with `fetchPriority="high"` and `loading="eager"` for the priority card, `loading="lazy"` otherwise, and `decoding="async"`. It sets no `src` until the slide is near the viewport.
- **Feed photos are resized (#372).** The feed route serves WebP at most 512 px (fallback 384 px) with `Cache-Control: private, max-age=31536000, immutable`, `ETag "<media>-v1"` and `Vary: 'Cookie'` (`src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts`, `src/lib/posts/feed-photo.ts:38-45`). It checks the signed-in user and `owner === user.id` before the 304 path and before reading bytes.
- **#228 cannot happen.** `safeSummary` (`src/lib/pipeline/wording.ts:10-12`) ignores the model's text and returns `plainConsumed(totals)`.
- **#316.** `src/components/FacebookButton.tsx` renders a disabled "Continue with Facebook" with "Facebook sign-in is coming soon." on both auth pages.
- **#281's code** is merged (#315): `src/lib/meta/open-weights.ts`, the Profile switch "Identify food with Muse Spark Open" (`src/app/(tabs)/profile/IdentifyProviderSwitch.tsx`), and the detail line (`PostDetail.tsx:24`).
- **#65.** `tests/pipeline.test.mjs` ("offline model responses drive a real meal, correction and error transitions") drives a post to ready, a correction, a 400 that fails the job at once (attempts 1) and a 429 that requeues and then finishes, all through `tests/fake-meta` with no network key.
- **#66.** `tests/client-retry.test.mjs:5` is "a short 429 retries inside one job attempt; long waits leave the attempt". It uses the harness `h` with `h.control({status:429,times:1,retryAfter:1})`.

**Other code facts**
- Photo posts close the capture sheet at the tap: `CaptureSheet.tsx` `post()` calls `uploadManager.post(id);onClose();` without awaiting. `postBarcode` and the food-search `onLogged` await the server first.
- The actions row is `src/components/PostActions.tsx`: thumbs, comment, Log again, slide dots placed by `controlsRight=16+(drink?66:150)`, then the bookmark with `ml-auto`. It takes a `detail` prop that is true only in post detail.
- `src/lib/supabase/server.ts` imports only `cookies` from `next/headers` and forwards no client address.
- The worker claims through RPC `claim_owned_job` (`src/lib/queue/claim.ts:22`).
- `vercel.json` holds only `$schema` and `ignoreCommand`. `maxDuration` is 300 in `src/app/api/jobs/tick/route.ts:11` and 20 in `src/app/api/feed/route.ts:7`.
- Days attaches water and caffeine only to days that already have a post (`src/lib/posts/days.ts`, comment "Water and caffeine logged on a day that has meals").
- `package.json` has `test:db` and `lint`, and no `test` script. Unit tests run with `node --test tests/*.test.mjs`.
- On main: `docs/eval.md`, `docs/open-weights.md`, `docs/production-performance.md`, `docs/media-loading.md`, `docs/load-test.md`, `docs/egress.md`, `docs/auth-protection.md`, `docs/demo.md`, `docs/agents.md`, `THIRD_PARTY.md`. Only on #333's branch: `docs/run8-final-report.md`.

## Premises (unchecked; the report says which were false)

- **P1.** The production thumbs failure is the stale-fingerprint 40001. Item 1 step 1 records the real response. Item 1's code is the same whatever it shows. Any other status is filed as a new issue in item 8.
- **P2.** The coder can read Supabase Logs Explorer and the usage page, and Vercel deployments. Where one is refused, that report section states the command, the refusal and the remaining unknown.
- **P3.** Supabase Logs Explorer on the Pro plan keeps 7 days. Sections 7b and 7c report the window they actually got.

## Lanes

Seventeen worktrees under `../my-food-ai-wt/run10-<lane>`, each cut from `origin/main` (`467ec5c`), all started in the first 10 minutes. Nothing is stacked, and **Two pairs of lanes share a file:** M and N both edit `Carousel.tsx` (M the menu, N the removal call), and G, J and O touch `post-drink.ts`/`intake.ts` (G owns `post-drink.ts`, O changes only `parseDrinkInput` in it). The second of each pair to merge brings main in by merge commit and resolves the conflict, and that refresh gets the reviewer's confirmation (owner rule).

| Lane | Item | Branch | Files it owns |
|---|---|---|---|
| A | 1 | `run10/thumbs` | `src/lib/posts/feedback.ts`, `src/app/api/posts/[id]/feedback/route.ts`, `src/components/ThumbsFeedback.tsx`, `src/components/DoubleTap.tsx`, `tests/db/feedback-route.test.mjs` (new) |
| B | 2 | `run10/details` | `src/components/PostActions.tsx` |
| C | 3 | `run10/readme` | `README.md` |
| D | 4 | `run10/feed-cache` | `src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts`, `docs/media-loading.md` |
| E | 5 | `run10/regions` | `vercel.json`, `docs/deployment.md` (new) |
| F | 6 | `run10/capture-fast` | `src/components/CaptureSheet.tsx` (`addFiles` only) |
| G | 9 | `run10/coffee-tile` | `src/lib/intake/post-drink.ts`, `tests/drink-tiles-route.test.mjs` |
| H | 10 | `run10/days-intake` | `src/lib/posts/days.ts`, `src/components/MonthGrid.tsx`, `tests/db/days-intake.test.mjs` |
| I | 11 | `run10/last-feed` | `public/sw.js`, `src/app/shell/page.tsx`, `src/components/ShellRefresh.tsx`, `src/components/CleanFreshMarker.tsx`, `src/app/(tabs)/page.tsx` (one line) |
| J | 12 | `run10/matcher` | `src/lib/fdc/match.ts`, `src/lib/fdc/version.ts`, the matcher test |
| K | 13 | `run10/drink-backfill` | `scripts/backfill-item-drinks.ts` |
| L | 14 | `run10/composer-drink` | `src/components/LightComposer.tsx` |
| M | 15 | `run10/unmark-replace` | `supabase/migrations/0038_unmark_not_eaten.sql`, its rollback, `src/app/api/posts/[id]/media/route.ts`, `src/components/Carousel.tsx` (menu), `tests/db/unmark-not-eaten.test.mjs` |
| N | 16 | `run10/undo-removal` | `src/lib/posts/delayed-action.ts`, `src/components/Thread.tsx`, `src/components/Carousel.tsx` (removal call only), `tests/delayed-action.test.mjs` |
| O | 17 | `run10/tile-sizes` | `src/lib/intake/intake.ts`, `src/components/IntakeSheet.tsx`, `src/app/api/intake/tile-counts/route.ts` (new) |
| P | 18 | `run10/leftovers-label` | the files `git grep` names for the label |
| Q | 21 | `run10/sheet-host` | `src/components/ui/Sheet.tsx` |

**Dependencies:** none between PRs. If GitHub reports a conflict after an earlier merge, bring main in by merge commit. A refresh with no code change of its own merges without a new review. A refresh with a code change gets the same reviewer's confirmation first (owner ruling, Nov 2 23:21).

## 0. Docs PR (first 5 minutes)

Cut `run10/docs` from `origin/main`. Commit this file unchanged as `docs/plan-run10.md`. Open "docs: Fleet 10 plan". Item 7's report and item 8's report land on this branch. This PR is not merged.

## 1. A thumb saves on production; a failure shows one message (Lane A) — #371, #215

**The fix.**
- The route reports the RPC's real error.
- On the stale-fingerprint error (40001), the route returns the post's current revision, and the client retries once with it.
- Only `ThumbsFeedback` shows the error.

**Service.** `saveFeedback` and `sendFeedback` in `src/lib/posts/feedback.ts` own the save and its one retry. The feedback route is the server boundary. `ThumbsFeedback` is the only component that shows the error.

**Step 1 — record (P1).** This is a record only and changes nothing below. On production as test account 1, open DevTools › Network and tap thumbs-up on three ready posts, one of them the oldest card loaded. Paste each request body, status and response body into the PR body.

**Step 2.** In `src/lib/posts/feedback.ts`, replace

```ts
 if(error)throw new Error('Feedback could not be saved.');
```

with

```ts
 if(error)throw Object.assign(new Error('Feedback could not be saved.'),{code:error.code as string|undefined});
```

**Step 3.** In the route, replace

```ts
 try{await saveFeedback(client,id,body.verdict,body.modelCommentId,body.fingerprint);}catch{return NextResponse.json({error:'Feedback could not be saved.'},{status:500});}
```

with

```ts
 try{await saveFeedback(client,id,body.verdict,body.modelCommentId,body.fingerprint);}
 catch(error){
  const code=(error as {code?:string}).code;
  if(code==='42501')return NextResponse.json({error:'Meal not found.'},{status:404});
  if(code==='22023')return NextResponse.json({error:'Choose an analysis revision.'},{status:400});
  if(code==='40001'){
   const {data:current}=await client.rpc('feedback_revision',{p_post_id:id});
   return NextResponse.json({error:'Feedback could not be saved.',revision:current??null},{status:409});
  }
  return NextResponse.json({error:'Feedback could not be saved.'},{status:500});
 }
```

**Step 4.** In `src/lib/posts/feedback.ts`, replace the body of `sendFeedback` (keep its signature) with:

```ts
 const send=(comment:string,print:string)=>fetch(`/api/posts/${postId}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verdict,modelCommentId:comment,fingerprint:print})});
 let comment=modelCommentId,print=fingerprint;let response=await send(comment,print);
 if(response.status===409){
  const body=await response.json().catch(()=>null) as {revision?:{modelCommentId?:string|null;fingerprint?:string}|null}|null;
  if(body?.revision?.modelCommentId&&body.revision.fingerprint){comment=body.revision.modelCommentId;print=body.revision.fingerprint;response=await send(comment,print);}
 }
 if(!response.ok)throw new Error('Feedback could not be saved.');
 window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId,verdict,modelCommentId:comment,fingerprint:print}}));
```

**Step 5 — one message.**
- In `DoubleTap.tsx`:
  - remove `const [error,setError]=useState('');` (keep `shown`);
  - remove `setError('');` from `vote`;
  - replace `.catch(()=>setError('Feedback could not be saved.'))` with `.catch(()=>window.dispatchEvent(new CustomEvent('feedback-error',{detail:{postId}})))`;
  - remove the line `{error?<p role="alert" className="absolute inset-x-0 bottom-0 bg-overlay px-screen-x text-meta text-white">{error}</p>:null}`.

  Leave the import line `import {useEffect,useRef,useState,type ReactNode} from 'react';` unchanged: `useState` is still used by `shown`.
- In `ThumbsFeedback.tsx`, in the `useEffect` that adds the `post-feedback` listener:
  - add `const onError=(event:Event)=>{if((event as CustomEvent).detail?.postId===postId&&revisionRef.current===revision)setError({revision,message:'Feedback could not be saved.'});};`;
  - add `window.addEventListener('feedback-error',onError);` after the existing `addEventListener`;
  - add `window.removeEventListener('feedback-error',onError);` in its cleanup.

**Test** (access rule) `tests/db/feedback-route.test.mjs`, using `tests/db/helpers.mjs` as the other `tests/db` files do:
- another user's post returns 404;
- a fingerprint different from `feedback_revision` returns 409 with `revision.fingerprint` equal to `feedback_revision(post).fingerprint`;
- the current fingerprint returns 204 and a `post_feedback` row exists.

**Done** when, on production:
- a tap on either thumb saves (204, or 409 then 204);
- the verdict survives a reload;
- a tap made with DevTools set offline shows "Feedback could not be saved." once, under the buttons.

**Blast radius:** feedback only. A verdict from an out-of-date card attaches to the post's current analysis instead of failing.

## 2. "Details ›" on every feed card (Lane B) — #107

**Boundary:** `PostActions.tsx`, which needs no service.

1. Replace

```tsx
    <button type="button" aria-label="Log again" className="flex h-6 items-center active:opacity-50" onClick={()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId,post}}))}><Icon name="log-again" /></button>
```

with

```tsx
    <button type="button" aria-label="Log again" className="flex h-6 items-center active:opacity-50" onClick={()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId,post}}))}><Icon name="log-again" /></button>
    {!detail&&<Link href={`/posts/${postId}`} className="flex h-6 items-center text-detail text-muted active:opacity-50">Details ›</Link>}
```

2. Replace `const controlsRight=16+(drink?66:150);` with `const controlsRight=16+(drink?66:150)+(detail?0:78);` so the slide dots clear the link.

**No test** (layout). **Page look:** one look at 390×844 on the preview deploy, on a one-photo post, a multi-photo post and a drink post. Post the differences on the PR. **Done** when every feed card shows "Details ›" and it opens that post's detail. **Blast radius:** the actions row of every feed card.

## 3. README is the judge start-here page (Lane C, docs-only) — #369, #287, #60

**Step 1 — measure on main after the Fleet 10 code merges** (item 8 step 3), at that commit:
- `npm run test:db`
- `node --test tests/*.test.mjs`
- `npx eslint .`

Fill these slots from the output:
- `{MAIN_SHA}`: the full SHA measured;
- `{DB_PASS}`, `{DB_FAIL}`, `{DB_SKIP}`;
- `{UNIT_PASS}`, `{UNIT_FAIL}`, `{UNIT_SKIP}`;
- `{UNIT_FAILURES}`: failing test names, comma-separated, or "none";
- `{LINT_ERR}`, `{LINT_WARN}`.

No other number goes in the README unless the linked document already states it.

**Step 2 — replace the whole of `README.md` with this text**, slots filled:

````markdown
# My Food AI

Photograph a meal, write a caption, or say what changed, and see what was consumed. My Food AI keeps a private meal history with food outlines, estimated portions, calculated nutrition and every correction behind each result. It records what was eaten. It gives no advice, sets no targets and makes no health claims.

Built for the Meta hackathon, October 26 to November 4, 2026.

## Meta models

| Model | Job in the app | Where it is called | Where its use is recorded |
| --- | --- | --- | --- |
| SAM 3.1 (`sam-3.1`) | Outlines each food in a meal photo. | [sam.ts](src/lib/meta/sam.ts) | `model_calls.model` |
| Muse Spark 1.3 (`muse-spark-1.3`) | Names the foods and their portions, reads nutrition labels, interprets corrections and picks the matching USDA reference. | [spark.ts](src/lib/meta/spark.ts), [match.ts](src/lib/fdc/match.ts) | `model_calls.model` |
| Muse Voice Transcribe 1.0 (`muse-voice-transcribe-1.0`) | Turns a spoken correction into text for the user to confirm. | [transcribe.ts](src/lib/meta/transcribe.ts) | `model_calls.model` |
| Muse Spark Open (`meta-models/muse-spark-open-1026`), Meta's open-weight model served by Baseten | An optional path for naming foods and portions. SAM and transcription stay on the Meta API. | [open-weights.ts](src/lib/meta/open-weights.ts) | `model_calls.model` and `model_calls.host`; post detail names the model that succeeded |

**Switch on Muse Spark Open:** sign in, open **Profile**, and turn on **Identify food with Muse Spark Open** under your handle. New meals use it, and post detail reads "Identified by Muse Spark Open". If it fails or returns an invalid result, the meal falls back to Muse Spark 1.3. [Setup and paired comparison](docs/open-weights.md).

USDA FoodData Central supplies nutrition references. It is a database, not a model. A food with no matching reference is shown as unavailable, never guessed. [Food matching](src/lib/fdc/match.ts), [third-party notices](THIRD_PARTY.md).

## For the judges

**Impact.** Food logging is abandoned because it is slow and its numbers are opaque. Here a photo is the whole entry, every number traces to the USDA reference it came from, and a correction in plain words ("I ate half the rice") changes the record while keeping the earlier version. [Demo record](docs/demo.md).

**Use of Meta AI tooling.** Three Meta models run in production on every photo meal, and Meta's open-weight Muse Spark Open is a real, switchable path. [Ten-photo evaluation and its limits](docs/eval.md), [open-weight comparison](docs/open-weights.md).

**Demo.** A photo becomes an outlined, calculated meal; a spoken correction changes it; a leftovers photo is marked "not eaten"; Days and Search find it again. [Demo record](docs/demo.md).

**Technical depth.** A durable job queue with leases and retries runs the pipeline. Every model call is traced. Item history is never overwritten: a correction supersedes rows instead of editing them ([migration 0007](supabase/migrations/0007_post_items_supersede.sql)). Accounts have hourly spending caps, and meal agents use revocable tokens. Feed reads and photo bytes are measured. [Worker timing](docs/production-performance.md), [worker drain under load](docs/load-test.md), [feed and photo measurements](docs/media-loading.md), [database egress](docs/egress.md), [sign-in protection](docs/auth-protection.md), [agent access](docs/agents.md).

## What was built

From Run 1 to Fleet 10: capture by photo, caption, barcode and nutrition label; outlined food detail; editable item history and corrections; Saved meals and Log again; drinks with water and caffeine; Days and Search; a desktop layout; durable uploads; delete with Undo and Recently deleted; and revocable meal-agent access. Each run's plan and report are in [docs](docs/), for example the [Run 8 report](docs/run8-final-report.md).

## Tests

Measured on main at `{MAIN_SHA}`:

| Command | Result |
| --- | --- |
| `npm run test:db` (disposable local Postgres, Auth, REST and the built app with scripted model responses) | {DB_PASS} passed, {DB_FAIL} failed, {DB_SKIP} skipped |
| `node --test tests/*.test.mjs` | {UNIT_PASS} passed, {UNIT_FAIL} failed, {UNIT_SKIP} skipped. Known failures: {UNIT_FAILURES} |
| `npx eslint .` | {LINT_ERR} errors, {LINT_WARN} warnings |

A passing test is not production acceptance. Phone-camera capture, installed-app sessions, mobile-data timing and background push are not yet proven on a physical phone.

## Run it

Copy `.env.example` to `.env.local` and fill in the server-only values it names, then run `npm install` and `npm run dev`. Apply `supabase/migrations` in number order. Never commit credentials.

## How this repository was built

Coding agents built it under written contracts, kept here: [planner contract](docs/planner-contract.md), [PM contract](docs/pm-contract.md), [review policy](REVIEW_POLICY.md), [backlog](BACKLOG.md).
````

**Step 3 — private-string search (#60).** Run `git grep -n -i -E "supabase\.co|vercel\.app|aibraintrust|@gmail|invoice|billing|card ending|sk-[a-z0-9]{10}" origin/main` and list every hit in the PR body. Remove none; RT decides.

**Done** when:
- the review agent has cleared the filled head with `BLOCKERS: NONE`;
- `README.md` is the text above with every slot filled;
- every relative link resolves on main after #333 has merged;
- the PR body lists the search hits.

**Blast radius:** none in code.

## 4. Feed photos stay cached across a session refresh (Lane D) — #376

**Service.** `src/lib/posts/feed-photo.ts` owns how a feed photo is located and resized (`feedPhotoPath`, `readFeedSource`, `resizeFeedPhoto`, `reserveFeedPhoto`), and it is unchanged. The feed photo route is the boundary that sets the response headers, and it is the only code file this item changes.

Replace

```ts
  const cacheHeaders = {...headers, 'Cache-Control': 'private, max-age=31536000, immutable', ETag: `"${media}-v1"`, Vary: 'Cookie'};
```

with

```ts
  // The URL is owner-scoped and ownership is checked on every request, including
  // the 304 path. Varying on Cookie made every session-token refresh refetch.
  const cacheHeaders = {...headers, 'Cache-Control': 'private, max-age=31536000, immutable', ETag: `"${media}-v1"`};
```

**Measure.** This is a record only; the change ships either way. In Chrome at 390×844, "Fast 4G", test account 1, measure on the production deploy before the change and on this PR's preview after:
1. Load the feed and scroll past three photos.
2. In DevTools › Application › Cookies, set the Supabase auth cookie's `expires_at` in the past, then reload once so the middleware refreshes the session.
3. Reload the feed. For the same three photos, record the source ("memory cache", "disk cache", "ServiceWorker" or network) and the transferred bytes.

Append the before/after table to `docs/media-loading.md` under the heading "## Session refresh (Fleet 10, #376)".

**No new test** (header). **Done** when the three photos load with 0 network bytes after a session refresh. **Blast radius:** every feed photo response. On a browser shared by two accounts, account 1's cached photos stay under account 1's URLs until the cache is cleared (RT list).

## 5. Regions declared (Lane E) — #325 (#378 is its duplicate)

**Service.**
- `vercel.json` owns the function region for every route.
- Each route's `export const maxDuration` owns its timeout. These are `src/app/api/jobs/tick/route.ts` and `src/app/api/feed/route.ts`, both unchanged.
- The Vercel build is the boundary that reads them.

1. Replace `vercel.json` with:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["iad1"],
  "ignoreCommand": "[ \"$VERCEL_GIT_COMMIT_REF\" = \"docs/fleet-initial\" ]"
}
```

2. Create `docs/deployment.md`:

```markdown
# Deployment

| Part | Where | Declared in |
| --- | --- | --- |
| Vercel functions | iad1 (Washington, D.C., USA, in Northern Virginia) | `vercel.json` `regions` |
| Supabase database | us-east-2 (Ohio) | Supabase project settings; chosen when the project is created, not changeable from the repository |
| Default function timeout | 300 s | Vercel project settings |
| Tick route | 300 s | `src/app/api/jobs/tick/route.ts` `maxDuration` |
| Feed route | 20 s | `src/app/api/feed/route.ts` `maxDuration` |

To reproduce: create the Supabase project in us-east-2, apply `supabase/migrations` in number order, import the repository in Vercel, and set the variables named in `.env.example`. The function region and route timeouts then come from the repository.
```

**No test.** **Done** when the preview deployment's Functions tab shows iad1. **Blast radius:** iad1 is today's region, so this has no effect in production. A typo would move functions away from the database, and the preview check catches it.

## 6. The photo shows in the composer at once (Lane F) — #370

**Why this is a fix now.** After the shutter, `takePhoto` awaits `addFiles`. For every Photo-mode shot, `addFiles` first runs `decodeBarcodeFile(file)` against a 900 ms timer. Only then does it add the shot and open the composer (`setComposer(true)`). Until then the camera view stays on screen with the shutter disabled (`cameraBusy`). The decoder can also block the main thread, so on a phone the 900 ms timer may fire late. The Post tap itself already closes at once (Facts). The fix opens the composer first and reads any barcode afterwards. Photo mode still reads barcodes, as the Fleet 9 hint says.

**Service.** `uploadManager` (`src/lib/uploads`) owns staging and is unchanged. `CaptureSheet.addFiles` is the boundary, and the only code that changes.

In `src/components/CaptureSheet.tsx`, inside `addFiles`, replace the lines from

```ts
        // A single bounded decode precedes all uploads, including library photos in text mode.
```

through, inclusive,

```ts
        setShots(shotsRef.current);setPhotoIndex(shotsRef.current.length-1);setComposer(true);
```

with:

```ts
        // Show the photo in the composer at once. A barcode in it is read
        // afterwards; when one is found the photo leaves the draft and the
        // barcode result opens, as before.
        shotsRef.current = [...shotsRef.current, { file, previewUrl: URL.createObjectURL(file) }];
        pendingFilesRef.current.shift(); setPendingCount(pendingFilesRef.current.length);
        operationRef.current=uploadManager.stage(shotsRef.current.map(shot=>shot.file),{caption,eatenAt:when===null?null:fromLocalInput(when),location:locationEnabled?location:null,options:{not_eaten_positions:notEaten,save_as_meal:saveAsMeal}},operationRef.current??undefined);setOperationId(operationRef.current);
        setShots(shotsRef.current);setPhotoIndex(shotsRef.current.length-1);setComposer(true);
        const shot = shotsRef.current[shotsRef.current.length - 1];
        let deadline: ReturnType<typeof setTimeout> | undefined;
        void Promise.race([decodeBarcodeFile(file), new Promise<null>((resolve) => { deadline = setTimeout(() => resolve(null), 900); })])
          .finally(() => clearTimeout(deadline))
          .then((code) => {
            if (!code || !mountedRef.current || postingRef.current) return;
            const index = shotsRef.current.indexOf(shot);
            if (index < 0) return;
            removeShot(index);
            if (!shotsRef.current.length) setComposer(false);
            void findBarcode(code, file);
          })
          .catch(() => {});
```

**No new test** (the timing is behaviour; barcode decoding is covered by its existing tests). **Page look and timing** on the preview deploy, in Chrome at 390×844 with CPU throttled 4×, test account 1, five shots each:
- a meal photo: record the milliseconds from the shutter tap to the composer showing the photo, before (production) and after (preview);
- a photo of a barcode in Photo mode: the barcode result still opens.

Paste both tables on the PR.

**Done** when the composer shows a meal photo within 300 ms of the shutter tap under 4× CPU, and a barcode photo in Photo mode still opens the barcode result. **Blast radius:** every Photo-mode shot. A photo that holds a barcode now shows in the composer for up to 900 ms before the barcode result replaces it, and a Post tapped in that window posts it as a meal photo.

## 7. Report — `docs/run10-investigations.md` on `run10/docs` (coder, docs-only, no code)

Read-only production queries and test-account actions only.

**Every section has exactly these four parts:**
- **Method** — the exact commands and queries run, with UTC times;
- **Result** — numbers in a table;
- **Answer** — one or two sentences answering the backlog item's question;
- **Unknown** — what is still unproven.

SQL runs with `psql "$SUPABASE_DB_URL" -c '<query>'`. Logs Explorer queries run in the Supabase dashboard › Logs › Explorer, with the stated window.

- **7a. #368 — the address Supabase records for app sign-ins.**
  - Query: `select created_at, ip_address, payload->>'action' as action, payload->>'actor_username' as who from auth.audit_log_entries where payload->>'action' in ('login','user_signedup','token_refreshed') order by created_at desc limit 30;`
  - Also record `curl -s https://api.ipify.org`, the coder's own public address.
  - Answer: whether the recorded addresses are users' addresses or Vercel's. The facts say the server client forwards no client address.
- **7b. #374 — the empty-claim loop.**
  - Run `git log --format='%h %ad %s' --date=iso origin/main -- src/lib/queue src/lib/jobs src/app/api/jobs`. Name the commit and merge PR before #340 that made an empty claim count as work.
  - Logs Explorer, the widest window allowed: `select date(timestamp) as day, count(*) as calls from edge_logs cross join unnest(metadata) as m cross join unnest(m.request) as r where r.path like '%/rpc/claim_owned_job%' group by day order by day;`
  - Run `gh issue view 222 --comments` and list the dates of the feed-error reports.
  - Answer: the first day of about one claim a second, the merge that caused it, and whether those dates cover #222's original failures.
- **7c. #375 — Storage egress by file kind and client.** Logs Explorer, last 7 days:

  ```sql
  select case when r.path like '%.feed.%' or r.path like '%/feed/%' then 'feed copy' when r.path like '%card%' then 'card' else 'original' end as kind,
    case when regexp_contains(lower(h.user_agent), r'headless|node|undici|curl|python') then 'automation' else 'browser' end as client,
    count(*) as requests, sum(safe_cast(rh.content_length as int64)) as bytes
  from edge_logs cross join unnest(metadata) as m cross join unnest(m.request) as r cross join unnest(r.headers) as h
    cross join unnest(m.response) as res cross join unnest(res.headers) as rh
  where r.path like '/storage/v1/%' group by kind, client order by bytes desc;
  ```

  Answer: the largest real-user source and its bytes per day.
- **7d. #373 — log ingestion.** From the Supabase usage page for the current cycle, record the billed log-ingestion bytes for each source the page lists. Answer: which source is largest.
- **7e. #373 — connections and RAM.**
  - `select usename, application_name, state, count(*) from pg_stat_activity group by 1,2,3 order by 4 desc;`
  - `show shared_buffers;`
  - `select pg_size_pretty(sum(size)) from pg_shmem_allocations;`
  - The Infrastructure page's memory and connections figures, read at the same time.
  - Answer: what accounts for the connections and the 70% RAM.
- **7f. #228.** Quote `src/lib/pipeline/wording.ts:10-12`. Answer: the published summary is always `plainConsumed(totals)`, so a 900 kcal model summary against 600 kcal totals publishes 600.
- **7g. #370 — capture-sheet wait.** In Chrome at 390×844, "Fast 4G", test account 1, record the tap-to-close time three times each for:
  - a photo post;
  - a barcode post with a pack photo;
  - a food-search post.

  Record each photo upload's bytes from the Network panel. Answer: which paths keep the sheet open, and for how long.
- **7h. #222, #372, #322, #323, #324 — opening the feed.**
  - **Cold tick:** right after a production deploy reaches READY, run `curl -s -o /dev/null -w '%{time_total}\n' https://<production host>/api/jobs/tick` twice (cold, then warm).
  - **Cold open:** in Chrome at 390×844, "Fast 4G", cleared cache, cold-open the feed as test account 1. Record:
    - time to first card;
    - time to first photo;
    - bytes for each of the first five feed photos;
    - `/auth/v1/user` requests in the browser;
    - day-total reads in the browser;
    - the matching server calls from Vercel function logs for that request.
  - **Openings:** repeat the cold open 10 times and record failures and blank feeds.
- **7i. #304 — last feed first.** Same setup. Cold-open the installed PWA (Chrome › Install) with "Fast 4G". Record:
  - the time until any feed card shows;
  - whether those cards come from `feed-cache.ts` (localStorage `mfa-feed:`) or the network;
  - whether the page is blank while `public/sw.js` waits for the network.
- **7j. #377 — drink posts without caffeine.** Count ready posts whose current items include an item named like coffee, tea, espresso, cola, coke or pepsi but have no `intake_logs` row with `source='item'` for that item:

  ```sql
  select count(*) from current_post_items i join posts p on p.id = i.post_id
  where p.status = 'ready' and p.deleted_at is null
    and i.name ~* '(coffee|tea|espresso|cola|coke|pepsi)'
    and not exists (select 1 from intake_logs l where l.post_item_id = i.id);
  ```

  List up to 20 post IDs. Change nothing.
- **7k. #306, #217 — taps.** At 390×844 with CPU throttled 4× and "Fast 4G", test account 1, cover every tappable control on Feed, post detail, capture sheet, drink sheet, Days, Search and Profile. One table row per control, with:
  - screen and control;
  - milliseconds from tap to the first visible change (Performance panel);
  - whether a pressed state shows at once;
  - whether anything jumps or flickers;
  - whether a second tap during the save does anything.
- **7l. #282 — refusals in production.** Read the code paths and quote file and line for what a user sees when:
  - the Meta API refuses with 400;
  - the Meta API refuses with 429;
  - USDA answers 429.

  Also record whether the post's Retry control appears.
- **7m. Checks on production with test account 2.** Remove every test post afterwards and record the cleanup. Record each result:
  - **#175:** post one Water tile on a date with no other post (drink sheet, then Edit time to an empty date). Does Days show that date?
  - **#224:** set DevTools › Sensors › Location to Tokyo, post a caption meal, and read its time on the card, post detail, thread and Days.
  - **#223:** edit the caption, reload, and read the feed card, post detail, Days and Search.
  - **#29:** for a photo post, are the photo and then the card swipeable slides? Does a caption-only post show the card? After a correction, does the card change?
  - **#283:** save the card PNG of a one-photo post and of a post with a leftovers photo. Is each footer whole?
  - **#23:** on a fresh browser profile signed in as test account 2 with hints reset (`update profiles set hints_seen = '{}' where id = '<test account 2 id>'`, test account only), does each of the capture, thread, thumbs and modes hints show exactly once?
- **7n. #272 — matcher.** Run `matchFood` five times each on "cheeseburger with lettuce, tomato, onion and pickle" and "dipping sauce" through the real API with the project's script runner (`npx tsx -e` importing `src/lib/fdc/match.ts`). Spend under US$1. Record the chosen `fdcId` and reason each time.
- **7o. #294 — terms.** For each of these terms, list every file and line where it appears (`git grep -n -F '<term>' -- src`):
  - "leftovers (not eaten)";
  - "Consumed";
  - "Log again";
  - "Saved meals";
  - "Additional food";
  - the needs-input question text;
  - the Days names.

  Leave the "Recommended" column empty for RT's rulings.
- **7p. #193.** Table of #353–#367: title, open or closed, and whether Fleet 9's merges changed the screen it names.

**Blast radius:** test posts that are removed, and one hint reset on test account 2.

## 9. The Coffee tile posts again (Lane G) — Fleet 9's failed production check

**Cause, confirmed on production (#381).** USDA's cached food for the coffee query is 171890, "Beverages, coffee, brewed, prepared with tap water". The tile's selector requires "from grounds", so it rejects that food and the route answers 502.
- Fleet 9 (#352) rewrote `postDrink` (`src/lib/intake/post-drink.ts`). Coffee now has only the exact pattern `/coffee,? brewed from grounds,? prepared with tap water/i`.
- Before Fleet 9 (`git show 6996817:src/lib/intake/post-drink.ts`, lines 30–33) that pattern had a fallback: `?? foods.find(f => /coffee/i.test(f.description) && !/milk|sugar|creamer|substitute|instant|decaffeinated/i.test(f.description))`.
- Without the fallback, when USDA's search returns no description that matches exactly, `postDrink` throws "Drink nutrition could not be found." and the intake route answers 502 "The drink could not be saved." (`src/app/api/intake/post/route.ts:42`).
- The fix restores the fallback for every caffeinated tile.

**Service.** `postDrink` in `src/lib/intake/post-drink.ts` owns the drink's nutrition. `POST /api/intake/post` is the boundary.

**Step 1 — record.** This is a record only. On production as test account 1, tap Coffee on the drink sheet with DevTools › Network open. Paste the request body, status and response body in the PR body. Run `select now();` and paste the Vercel function log line for that request.

**Step 2.** In `src/lib/intake/post-drink.ts`, replace

```ts
    const food = foods.find(f => source.match.test(f.description) && !/decaffeinated|diet|sugar.free/i.test(f.description));
```

with

```ts
    const plain = (f: {description: string}) => !/decaffeinated|diet|sugar.free|milk|creamer|substitute|instant/i.test(f.description);
    const kind = input.label.startsWith("Coca-Cola") ? /cola/i : input.label.startsWith("Tea") ? /\btea\b/i : input.label.startsWith("Espresso") ? /espresso/i : /coffee/i;
    // Exact reference first; otherwise the first plain search result of the same drink (pre-Fleet 9 behaviour for coffee).
    const food = foods.find(f => source.match.test(f.description) && plain(f)) ?? foods.find(f => kind.test(f.description) && plain(f));
```

**Test** (data rule): in `tests/drink-tiles-route.test.mjs`, add a case where the fake USDA search for the coffee query returns only food 171890, `"Beverages, coffee, brewed, prepared with tap water"`. Tile 1 then answers 200, and the stored caffeine is 95 mg.

**Done** when Coffee posts on production and every one of the six tiles posts (item 8). **Blast radius:** the nutrition reference of caffeinated tiles when the exact USDA description is missing. Caffeine stays the tile's fixed value either way.

## 10. Days shows water-only days (Lane H) — #175

**Cause (Facts).** `getDays` reads intake only `if (groups.size)` and attaches it only to days that already have a post. `getMonthSummary` reads posts only.

**Service.** `getDays` and `getMonthSummary` in `src/lib/posts/days.ts` own the day list. `/api/days` and `MonthGrid` are the boundaries.

1. In `getDays`:
   - Replace `  if (groups.size) {` (the line after the comment "Water and caffeine logged on a day that has meals…") with `  {`.
   - Replace that comment with `// Water and caffeine appear on their day, including a day with no meal (never a target).`
   - Replace `      for (const day of groups.values()) day.intake = byDay.get(day.date) ?? emptyIntake();` with:

```ts
      for (const [date, totals] of byDay) {
        if (date < from || date > through) continue;
        const day = groups.get(date);
        if (day) day.intake = totals;
        else groups.set(date, { date, posts: [], totals: sumNutrition([]), intake: totals });
      }
```

2. In `interface MonthDay`, add `intake?: boolean`.
3. In `getMonthSummary`, before its `return`, add:

```ts
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("intake_logs").select("logged_at,post_id")
      .eq("user_id", userId).is("post_id", null)
      .gte("logged_at", `${shiftDay(from, -1)}T00:00:00Z`).lt("logged_at", `${shiftDay(through, 2)}T00:00:00Z`)
      .order("logged_at", { ascending: true }).range(offset, offset + 999);
    if (error) break;
    for (const row of data ?? []) {
      const date = dateInZone(row.logged_at, zone);
      if (date < from || date > through || groups.has(date)) continue;
      groups.set(date, { day: date, kcal: null, posts: 0, ready: false, missing: [], known: 0, intake: true });
    }
    if ((data?.length ?? 0) < 1000) break;
  }
```

   Rows with a `post_id` belong to a drink post, which the posts loop already counts.
4. In `MonthGrid.tsx`:
   - Replace `{day?.ready ? \`${formatDayKcal(day.kcal)}${day.missing?.length?"*":""}\` : ""}` with `{day?.ready ? \`${formatDayKcal(day.kcal)}${day.missing?.length?"*":""}\` : day?.intake ? "drank" : ""}`.
   - In the `aria-label`, after the posts part, add `${day?.intake ? ", drank" : ""}`.

**Test** (data rule) `tests/db/days-intake.test.mjs`: one `intake_logs` water row with no post, on a date with no post.
- `getDays` returns that date with `posts: []` and `intake.water` equal to the row's amount.
- `getMonthSummary` returns that day with `intake: true` and `kcal: null`.

**Done** when a water-only day shows "drank" in the Days grid and opens with its water total. **Blast radius:** Days and the month grid. A failed intake read leaves the month as it was.

## 11. The app opens on the last feed (Lane I) — #304

**The fix.**
1. The service worker keeps a static shell page.
2. A navigation to `/` that has not answered within 1.5 s gets that shell, but only while a signed-in media session is active on the device.
3. The shell shows the last cached feed (`CachedFeedFallback`, which reads the signed-in user's `mfa-feed:<id>` from localStorage on the client).
4. The shell then navigates to `/?_=fresh`, which always goes to the network. The browser keeps the shell on screen until the fresh page arrives.

**Service.** `public/sw.js` owns the decision. `src/app/shell/page.tsx` is the page. `CachedFeedFallback` (`src/components/Feed.tsx`) already owns reading the cache, and it is unchanged.

1. New `src/app/shell/page.tsx`:

```tsx
import {CachedFeedFallback} from "@/components/Feed";
import ShellRefresh from "@/components/ShellRefresh";
export const dynamic = "force-static";
export default function Shell() {
  return <main className="mx-auto max-w-phone" data-shell><CachedFeedFallback /><ShellRefresh /></main>;
}
```

2. New `src/components/ShellRefresh.tsx`:

```tsx
"use client";
import {useEffect} from "react";
export default function ShellRefresh() {
  useEffect(() => { const t = setTimeout(() => location.replace("/?_=fresh"), 50); return () => clearTimeout(t); }, []);
  return null;
}
```

3. In the home page (`src/app/(tabs)/page.tsx`), clean the marker: the root client component that mounts first runs `if (new URL(location.href).searchParams.has("_")) history.replaceState(null, "", "/")`. Add it to `ShellRefresh`'s sibling, new `src/components/CleanFreshMarker.tsx`, rendered once at the top of the home page.
4. `src/middleware.ts` `matcher` does not include `/shell`, so the page is public. Keep it that way.
5. In `public/sw.js`:
   - Change `const SHELL_CACHE = "my-food-ai-shell-v2";` to `"my-food-ai-shell-v3"`.
   - In the install handler, change `["/", "/manifest.webmanifest"]` to `["/", "/shell", "/manifest.webmanifest"]`.
   - At the start of the `fetch` listener, after the media branch, add:

```js
  const navUrl = new URL(event.request.url);
  if (event.request.mode === "navigate" && navUrl.origin === self.location.origin && navUrl.pathname === "/" && !navUrl.searchParams.has("_")) {
    event.respondWith((async () => {
      const network = fetch(event.request).then(response => {
        if (response.ok) event.waitUntil(navigationSession(event, response).catch(() => {}));
        return response;
      });
      const timer = new Promise(resolve => setTimeout(() => resolve(null), 1500));
      const first = await Promise.race([network.catch(() => null), timer]);
      if (first) return first;
      const state = await control;
      const shell = state.mode === "active" ? await (await caches.open(SHELL_CACHE)).match("/shell") : null;
      if (shell) { event.waitUntil(network.catch(() => {})); return shell; }
      try { return await network; } catch { return (await (await caches.open(SHELL_CACHE)).match("/")) || Response.error(); }
    })());
    return;
  }
```

**No new test** (service-worker behaviour). **Page look and timing** in Chrome at 390×844, "Slow 4G", test account 1, with the app installed:
- record the time to the first card on a cold open, before and after;
- sign out, then open: no shell feed shows;
- sign in as test account 2 on the same browser: account 1's feed never shows.

**Done** when the installed app shows the last feed within 2 s on "Slow 4G" and the fresh feed replaces it. **Blast radius:** every opening of `/`. A service-worker defect persists on installed phones until the next deploy updates the worker. The new cache name forces that update.

## 12. The matcher tries the base food before giving up (Lane J) — #272

**The fix.** `matchFood` makes at most two searches, and a rejection on the second leaves the food "Nutrition unavailable" (a plain steak; sauteed spinach with corn). Add a third search on the decision's base food (`query_food`, for example "beef" or "spinach").

**Service.** `matchFood` in `src/lib/fdc/match.ts`. `resolveFoodMatch` is the boundary and is unchanged.

1. Replace `// At most two searches.` with `// At most three searches: the name, the model's improved query, then its base food.`
2. Replace `for(let attempt=0;attempt<2;attempt++){` with `for(let attempt=0;attempt<3;attempt++){`.
3. Replace `const decision=await dependencies.choose(name,caption,candidates,attempt===1,query);` with `const decision=await dependencies.choose(name,caption,candidates,attempt>0,query);`.
4. Replace

```ts
    if(attempt===1||!improved||improved.toLowerCase()===query.toLowerCase())return {food:null,reason:decision.reason,searches:attempt+1};
    query=improved;
```

with

```ts
    const base=decision.query_food?foodSearchQuery(decision.query_food):null;
    const next=attempt===0?improved:base;
    if(attempt===2||!next||next.toLowerCase()===query.toLowerCase())return {food:null,reason:decision.reason,searches:attempt+1};
    query=next;
```

5. In `src/lib/fdc/version.ts`, change `"fdc-reference-v5"` to `"fdc-reference-v6"`.

**Test** (data rule), added to the existing matcher test file (`git grep -l matchFood -- tests`):
- with a stub `search` that returns no eligible food for the first two queries and a beef steak for "beef";
- and a stub `choose` that returns `{id:null, query:"beef steak", query_food:"beef"}` until it sees the steak;
- `matchFood` returns the steak with `searches: 3`.

**Done** when "beef tenderloin steak topped with butter" and "sauteed spinach with corn" resolve to a reference on production (one post each on test account 1, then removed). **Blast radius:** a food that would have been unavailable now costs one more search and one more model call, and may resolve to its base food.

## 13. Existing drink posts get their caffeine (Lane K) — #377

**Service.** `syncItemDrinks` (`src/lib/intake/drinks-from-items.ts:51`) owns item drinks. A one-off script is the boundary.

New `scripts/backfill-item-drinks.ts`:
- It creates the admin client the way `src/lib/supabase/admin.ts` does.
- It runs 7j's query without `count(*)`, selecting `distinct p.id`.
- It calls `await syncItemDrinks(admin, id)` for each ID, one at a time.
- It prints `id ok` or `id error <message>`.

Run it on production with `npx tsx --env-file=.env.local scripts/backfill-item-drinks.ts` **after** Fleet 9's drink code is on main (it is), and paste the output in the PR. **No new test** (it reuses `syncItemDrinks`, which `tests/db/item-drinks.test.mjs` covers). **Done** when 7j's count is 0, or each remaining ID is listed with its error. **Blast radius:** `intake_logs` rows for those posts' drink items, and therefore the day water and caffeine totals on those days.

## 14. Drink cards in the composer before posting (Lane L) — #348, frames 5b–5d

**Where the frames are.** The frames file is on this machine at `/home/opc/Projects/my-food-ai/uploads/design-round5/My Food AI.dc.html` (ignored by Git). The texts below are copied from it. Where the file and this plan differ, this plan wins.

**What the frames show.** In Photo mode, after a photo is added and before Post, the model recognises drinks in it. The composer then shows a drink card in place of the food card.

**Service.** New `src/lib/intake/identify-drinks.ts`, `identifyDrinks(admin, userId, photo): Promise<PhotoDrink[]>`, owns it. It calls the existing Spark identify used by the pipeline (`src/lib/meta/spark.ts`), under the per-account call cap of #339, and keeps only items that `isDrinkItem` (`src/lib/intake/drinks-from-items.ts`) accepts. Each `PhotoDrink` is `{name, ml, caffeineMg|null, kcal, source: "read from the can"|"estimated from the photo"}`. New `POST /api/drinks/identify` (the staged photo's upload ID) is the boundary. The composer (`src/components/LightComposer.tsx`) calls it once per staged photo.
- No drinks: nothing changes.
- One or more drinks, and every item is a drink: the drink card shows.

**5b, one drink estimated from the photo** (water). The card shows, top to bottom:
- "Drink · estimated from the photo";
- the name ("Water, glass");
- the volume large ("300" then "ml");
- "How much did you drink?" with chips "All of it", "Half", "Other";
- "Adds 300 ml to today's 1,150 ml";
- the button "Post · 300 ml".

Water has no caffeine line.

**5c, one branded drink read from the pack** (cola). The card shows:
- "Drink · read from the can";
- "Coca-Cola, can" with a "Correct" link, which opens the existing correct-product sheet (3l);
- three equal tiles: "330 ml", "32 mg caffeine", "139 kcal";
- "How much did you drink?" with chips "The whole can", "Half", "Other";
- "Adds 330 ml and 32 mg caffeine to today";
- the button "Post · 330 ml".

**5d, several drinks.**
- The header reads "5 drinks", then "Tap one to change it".
- One numbered row per drink: number, name, "{ml} ml · {kcal} kcal", and caffeine in its own right-hand column ("126 mg", or "—" for none).
- A total line: "{total ml} ml · {total mg} mg caffeine · {total kcal} kcal".
- The button "Post {n} drinks".
- Tapping a row opens that drink's 5c card, to change it or remove it.

**Posting.** "Post" creates one photo post with the chosen volumes. The photo is slide 1, and the drinks are stored as the post's items, with caffeine as nutrient 1057, so the feed card follows #346's drink summary.
- "Half" halves the volume, caffeine and kcal.
- "Other" opens a number field in ml.

**No new test** beyond the call-cap rule, which `identifyDrinks` reuses. **Page look** against 5b, 5c and 5d, with the differences on the PR. **Done** when a photo of a glass of water shows the 5b card before posting and posts a water card, and a photo of a cola shows 5c. **Blast radius:** one extra identify call per staged photo, before posting, counted against the account's hourly cap.

## 15. Unmark leftovers and Replace photo (Lane M) — #349, frame 5l

**Spec, frame 5l** (texts copied from `/home/opc/Projects/my-food-ai/uploads/design-round5/My Food AI.dc.html`):
- The menu lists "Remove this photo", "Unmark as leftovers (not eaten)", "Replace photo" and "Cancel".
- The note under the options reads "Removing it re-analyses the post with the other photos. The record becomes the whole meal as photographed: {whole count or kcal}." The count or kcal is the pipeline's current numbers: the post's consumed amount plus its not-eaten amount (`not_eaten_count_text` or `not_eaten_calories`).
- Unmark keeps the photo and stops subtracting it. There is no second confirmation; Undo (item 16) is the safety net.

The leftovers slide's ··· menu (`Carousel.tsx`, `data-removal-menu`) gains, in this order after "Remove this photo":
- **"Unmark as leftovers (not eaten)":** new migration `0038_unmark_not_eaten.sql` adds `unmark_not_eaten(p_media_id uuid) returns uuid`, security definer and owner-checked as `remove_post_media` is in 0030. It sets `post_media.not_eaten=false` and queues the same re-analysis job that `remove_post_media` queues, returning the job ID. A rollback file reverses it. New route: `PATCH /api/posts/[id]/media?media_id=` with body `{"not_eaten":false}` calls it.
- **"Replace photo":** opens the existing add-photo flow for this post (the `forPost` mode of `CaptureSheet`, the same entry the "+" on a ready photo post uses). When its `post-created` event arrives for this post, it calls the existing `DELETE /api/posts/{id}/media?media_id=<old>`.

**Test** (migration) `tests/db/unmark-not-eaten.test.mjs`:
- the owner's unmark sets `not_eaten` to false and queues one job;
- another user's call raises 42501.

**Production:** apply 0038 with `psql "$SUPABASE_DB_URL" -f supabase/migrations/0038_unmark_not_eaten.sql` immediately before merging. **Done** when a leftovers photo can be unmarked and the post re-analyses with it counted as eaten, and a photo can be replaced. **Blast radius:** leftovers photos' menu, and one new re-analysis path.

## 16. Undo after removing a photo or a correction (Lane N) — #350

**The fix.** Removal is delayed on the client:
- The toast "Leftovers photo removed" or "Correction removed" shows at once with "Undo" for 6 s, and the item is hidden at once.
- The existing `DELETE …/media` or `POST …/revert` request is sent only when the 6 s pass.
- Undo cancels the timer and shows the item again.
- If the page is closed inside the 6 s, `pagehide` sends the pending request with `fetch(..., {keepalive:true})`.

**Service.** New `src/lib/posts/delayed-action.ts`: `delayAction(ms, run): {undo(): void}` owns the timer and the `pagehide` flush. `Carousel.tsx` (leftovers removal) and `Thread.tsx` (correction removal) are the boundaries. They use the existing `UndoToast` (`src/components/UndoToast.tsx`) with `ms=6000`.

**Test** (data rule) `tests/delayed-action.test.mjs`:
- `run` is not called before `ms`;
- `undo` before `ms` means it is never called;
- a `pagehide` event calls it once.

**Done** when both removals can be undone within 6 s on production. **Blast radius:** the two removals now land 6 s later.

## 17. Drink tiles ordered by use, with sizes on hold (Lane O) — #351, frame 5f

**Spec, frame 5f** (texts copied from the frames file named in item 14):
- Header: "Drink", with "Today: {ml} ml · {mg} mg caffeine" on the right.
- Six tiles in a 3×2 grid.
- The line "Tap to post. Hold to change the size."
- The field "Type a drink, e.g. oat latte, large".
- The frame's note: "Six tiles: the most-used drinks with their usual sizes, ordered by how often they were posted; new users get water, coffee, espresso, tea, cola, bottle."

**Service.** `DRINK_TILES` and `parseDrinkInput` (`src/lib/intake/intake.ts`, `post-drink.ts`). `IntakeSheet.tsx` is the boundary.

1. **Sizes.** In `intake.ts` add `TILE_SIZES`, indexed like `DRINK_TILES`:
   - Water glass: 250, 500, 750 ml;
   - Coffee: 240 (cup), 350 (large) ml;
   - Espresso: 30 (single), 60 (double) ml;
   - Tea: 300 (mug), 450 (large) ml;
   - Coca-Cola: 330 (can), 500 (bottle) ml;
   - Water bottle: 500, 1000 ml.

   Caffeine scales with volume from the tile's value, rounded.
2. **Server.** `parseDrinkInput` accepts `{tile, ml}`, where `ml` must be one of that tile's sizes, or it returns 400. The label is `{name}, {size word}`. The water labels stay within 0037's allowed set ("Water, glass", "Water, bottle").
3. **Hold.** Holding a tile for 500 ms (pointer down without moving) opens a row of that tile's sizes. Tapping a size posts `{tile, ml}`.
4. **Order by use.** The sheet orders tiles by how many of the user's posts in the last 30 days carry that tile's label, most first; ties keep `DRINK_TILES` order. The counts come from a new `GET /api/intake/tile-counts`, which reads `intake_logs` grouped by `label` for the user. The tile index sent to the server stays the `DRINK_TILES` index.

**Test** (data rule), added to `tests/drink-tiles-route.test.mjs`:
- `{tile:1, ml:350}` gives 138 mg;
- `{tile:1, ml:300}` gives 400.

**Done** when holding Coffee offers cup and large, posting large records 350 ml with 138 mg, and the most-used tile is first. **Blast radius:** the drink sheet and the intake POST body; the old bodies stay accepted.

## 18. The leftovers label reads naturally (Lane P) — #294

**Service.** The label's single source of text: find it with `git grep -n -F "leftovers (not eaten)" -- src`. Every hit is the boundary.

Replace every user-facing `leftovers (not eaten)` with `Leftovers · not eaten`, and `Unmark as leftovers (not eaten)` (item 15) with `Unmark leftovers`. 7o's term list is still written, and the other terms stay unchanged.

**Test:** `node --test tests/wording.test.mjs`. If it asserts the old label, update the assertion to the new text. **Done** when the new label shows on the composer, the carousel and post detail. **Blast radius:** the label everywhere it appears.

## 19. #307 food names before totals — already built (no lane)

`writePendingNames` and `writePendingKcal` (`src/lib/pipeline/pending-items.ts`, called from `analyze.ts:268` and `persist.ts:64,74`) and the `PostCard` pending list are on main (commit `3cce15a`, "feat: show identified foods while nutrition is resolving"). Item 8 posts a meal on production and records that the food names show before the total. If they do not, the coder files the observed gap.

## 20. Report findings become fixes

For every section of item 7 whose result fails its issue's done condition, the coder builds the fix in Fleet 10 as its own PR (`run10/fix-<issue>`), reviewed and merged like any code PR, and names the boundary file in the PR. This covers #222, #306, #217, #223, #224, #29, #283, #23, #282, #322, #323, #324, #372, #373 and #375. It also covers #193 and each visual-difference issue #353 to #367: for each, the coder builds the listed differences against the frames file named in item 14, as one PR per issue (`run10/fix-<issue>`), and posts the before and after page look on the PR. Each issue's differences are listed in its own body (`gh issue view <n>`) and in Fleet 9's `docs/design/visual-pass.md`, which is on #344's branch: `git show origin/run9/docs:docs/design/visual-pass.md`. The report states each finding, and the PR states its fix.

## 21. The delete confirmation stays open (Lane Q) — #382

**Cause found in code.** `Sheet` (`src/components/ui/Sheet.tsx:53`) picks its portal host on every render with `document.querySelector('[role="dialog"][aria-modal="true"]')`. A confirmation sheet's own panel has `aria-modal="true"`. On the first rerender after it opens, the query finds that panel, React moves the portal into it, and the dialog disappears without a confirm or close.

**The fix.** Choose the host once, before the sheet's own panel exists, and keep it.

**Service.** `Sheet` is the shared boundary for every sheet. Nothing else changes.

1. In `Sheet`, replace

```tsx
  close.current=onClose;
```

with

```tsx
  close.current=onClose;
  // Chosen once, before this sheet's own aria-modal panel exists: a confirmation
  // must never become its own portal host on a rerender.
  const [portalHost]=useState<HTMLElement|null>(()=>typeof document==='undefined'?null:document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]'));
```

2. Replace `document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]')??document.body);` with `(portalHost&&portalHost.isConnected?portalHost:document.body));`.

The `react` import already includes `useState`.

**Test:** none (component behaviour). **Page look:** on the preview, open a feed card's ··· › Delete, then trigger a rerender: let the feed's 2 s discovery tick run for 10 s. The confirmation stays until Delete or Cancel. Repeat inside the capture sheet (a nested sheet) and confirm it still shows above the capture dialog. **Done** when the confirmation survives 10 s of feed rerenders on production. **Blast radius:** every sheet's portal host. A nested sheet opened inside a modal keeps that modal as its host, as before.

## Run rules

- **Worktrees:** `git worktree prune`, then remove every leftover `run9-*` worktree first.
- **Checks per code PR on its final head:** `npx tsc --noEmit`, `npx eslint <changed files>`, `npm run build`, and the test file it adds (`npm run test:db` for item 1; `node --import tsx --test tests/drink-tiles-route.test.mjs` for item 9). Paste each command with its exit code in the PR body.
- **Review:**
  - The owner's review agent checks open PRs every two minutes.
  - When a head is pushed, comment `Ready for review at <full SHA>`. Fix every blocker, push and comment again.
  - A PR merges only at a head with `BLOCKERS: NONE` on that exact SHA.
  - If no review appears within 20 minutes, run PPLX (`skills/pplx-review/SKILL.md`). If PPLX cannot run, that PR's review is a legal halt for that PR only.
  - Item 3 is docs-only, but the review agent still reads it before it merges (item 8 step 3).
- **Legal halts only:** a review tool unavailable when reached; a fact in this plan proves false; an operation would contact a customer or breach a prohibition. A halt stops only its own item, and every other item continues.
- **Claims rule:** consumed and drank, past tense; no target, goal, ring, percentage, or "left" for an amount.
- **No customer contact.** Production checks use the two test accounts only.

## 8. Merges, production checks, closures, report

1. **Merge as each PR is ready, not at the end.** Each code PR (items 1, 2, 4, 5, 6, 9–18, 20 and 21) merges as soon as its head has clean checks and `BLOCKERS: NONE` on that exact SHA. When several are ready at once, they merge in ascending PR number. After each merge, bring main into every open Fleet 10 branch by merge commit (owner refresh rule, Lanes). At 23:30, list every code PR as merged (with SHA) or not done.
2. Merge docs **#333** at `81bbaeacc0efe0453652744ba43b0c58a7f11f16` before the first code PR, so `docs/run8-final-report.md` exists on main. This is the PM's ruling (Wall entry 10-29 15:05 makes docs merges the PM's call): "The PM rules that #333 merges at item 8 step 2, as your plan has it." If #333's head has moved, merge only at a head with a watch `BLOCKERS: NONE` on that exact SHA.
3. As soon as the last code PR has merged, or at 22:45 if any are still open, run item 3 step 1 on main's READY deploy and fill the README slots. A code PR that merges after the measurement leaves the counts stated against `{MAIN_SHA}`, and that is true as written. Check every relative link with `grep -oE '\]\([^)h#][^)]*\)' README.md | tr -d '()]' | xargs -I{} git ls-files --error-unmatch {}`. Then comment `Ready for review at <full SHA>` on the README PR. The review agent reads it like any code PR: claims against the linked evidence, links, claims rule and private strings. Merge it only at a head with `BLOCKERS: NONE` on that exact SHA.
4. Production checks on the final deploy, each with its time:
   - migration 0037 (#380) is applied: `psql "$SUPABASE_DB_URL" -c "select pg_get_functiondef('public.create_drink_post(uuid,timestamptz,text,integer,text,integer,jsonb)'::regprocedure) like '%Water, glass%';"` returns `t`. If it returns `f`, apply `psql "$SUPABASE_DB_URL" -f supabase/migrations/0037_water_tile_labels.sql`, record the time, and run the query again;
   - all six drink tiles post on test account 1, one tap each, in this order: Water glass, Coffee, Espresso, Tea, Coca-Cola, Water bottle. Each appears at the top of the feed with its volume and caffeine. Then remove the six posts;
   - take a meal photo on the capture sheet: the composer shows it at once;
   - tap each thumb on a test post and reload;
   - tap "Details ›" on a feed card;
   - item 4's session-refresh measure once;
   - region iad1 on the deployment;
   - #281 on test account 1: switch Profile › "Identify food with Muse Spark Open" on, post a meal, read the detail line, switch it off.
5. Close each of these with an evidence comment:
   - #371 and #215 (item 1);
   - #107 (item 2);
   - #369, #287 and #60 (item 3);
   - #376 (item 4);
   - #370 (item 6), with the before/after shutter timing;
   - #325 (item 5), and #378 as a duplicate of #325;
   - #65 and #66 (Facts), after running `node --import tsx --env-file=.env.local --test tests/pipeline.test.mjs tests/client-retry.test.mjs` and recording the result;
   - #305 and #228 (Facts);
   - #381 (item 9), #175 (10), #304 (11), #272 (12), #377 (13), #348 (14), #349 (15), #350 (16), #351 (17), #294 (18), #307 (19, after its production check) and #382 (21), each once its Done holds on production;
   - each issue fixed under item 20, once its fix PR is merged and its done condition holds;
   - #316 only after this check on both production pages, `/sign-in` and `/sign-up`, in Chrome at 390×844 with DevTools › Network and Console open: the Facebook button looks gray; tapping it changes nothing on screen; no request to `/auth/v1/` or `facebook.com` starts; no console error and no error text appear. Paste the result per page in the closing comment;
   - #224, #223, #175, #29, #283 and #23 only where 7m shows their done condition met on production.

   On every other issue in the table, comment its report section's Answer and link the report. File one new issue for each failure found in 7a–7p, and for any thumbs status other than 409 in item 1 step 1.
6. Write `docs/run10-report.md` on `run10/docs`. It holds:
   - items 0–8, each done or not done;
   - the premises found false;
   - the production checks with times;
   - every issue closed, commented or filed, by number.

   Leave this docs PR and #344 open.

## Cleanup

Remove leftover worktrees before the first PR. Remove each worktree and local branch once its PR is pushed. Delete each remote branch after its merge. At the end only the main checkout remains and nothing temporary is running. Run `scripts/cleanup.sh` last.

## For RT's eyes (defaults the plan takes)

- **Why #370 is now a fix:** the code shows the wait. Every shot runs a barcode read (up to 900 ms, longer if the decoder blocks the phone's main thread) before the composer opens. Item 6 opens the composer first. The Post tap already closes the sheet at once. 7g still times all three capture paths on a throttled connection.
- **Everything in the backlog is built or checked in Fleet 10** (items 1–21), including Fleet 9's production defects #381 (Coffee 502), #382 (delete confirmation) and the unrepeated Water tile check.
- **The photographed cola shows 30 mg.** The stored USDA value (29.7 mg) is a measurement, and the 32 mg estimate applies only when USDA has none. That is the app's never-guess rule; the card text does not change.
- **The shut-down coder's local prototypes** in `uploads/run9-handoff/` are not used. Items 9 and 21 are the specified fixes. The owner ruled that nothing is held: "100% of the backlog".
- **Report findings become fix PRs (item 20).** This departs from the contract's "no conditional code" because the owner ordered every item done tonight.
- **The leftovers label becomes "Leftovers · not eaten"** (item 18). It is the planner's choice, since a ruling round would pass the freeze.
- **Unmark and Replace (item 15) add migration 0038**, applied right before its merge.
- **Removals of a photo or correction land 6 s after the tap** (item 16), so Undo works.
- **The installed app shows the last feed after 1.5 s without an answer** (item 11). A worker defect persists until the next deploy.
- **Yours only:**
  - #279 CAPTCHA: set `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` in Vercel production and redeploy, **then** enable CAPTCHA in Supabase Auth, never the reverse.
  - #280 acceptance on three real phones, and #379 the phone checks of the installed app over mobile data.
  - #281 acceptance on your own account (the coder checks it on a test account).
- **No live sign-in probe** (you withdrew it). 7a reads existing logs only, so whether one script can lock every judge out stays unproven. CAPTCHA covers it.
- **A thumb on an out-of-date card now saves against the post's current analysis** instead of failing. The error shows once, under the buttons, including for a double-tap on the photo.
- **Every feed card gets "Details ›"** after Log again. Post detail does not.
- **Feed photos no longer vary by cookie.** On a browser shared by two accounts, account 1's cached photos stay under account 1's URLs until the cache is cleared.
- **#333 merges tonight** at item 8 step 2, before the README (PM ruling). #344 and Fleet 10's docs PR stay open.
- **Every PR merges on clean checks and zero blockers** (your rule). Defects found afterwards go on the backlog.
- **A barcode photo taken in Photo mode** now shows in the composer for up to 900 ms before the barcode result replaces it.
- **The README is replaced whole** with item 3's text: tests as measured tonight with their known failures, and a plain statement of what a phone has not yet proven. Private-string hits are listed, not removed.
- **Closed as built, impossible or duplicate:** #305, #316, #65, #66, #228, and #378 (duplicate of #325).