# Fleet 17 plan: the sheet closes at the tap (#370) and a posted beer stays posted (#615)

Written 2026-11-04, revised 22:58 WIB (15:58 UTC) against `origin/main` `3677332317058a742284fba99fa806f074529632` (Fleet 16 #605–#614 and #616 merged; migrations through 0055 on main; next free number 0056). **Every find-text below was checked against `36773323` with `git show` at 22:58 WIB and occurs exactly once.** Open PRs are docs only (#604, #600, #577, #558); nothing here waits on them or touches them.

**Stops: zero. Stop time: 01:30 WIB, November 5.** One prompt to the end. **If a find-text does not match exactly once on `36773323`, the coder skips that edit, reports it in the final report, and does not rewrite it.** No item asks the owner anything. At 01:30 WIB the coder writes the report with every item done or not done and stops, whatever state the work is in.

**When done, stop (the coder rule, five parts).** (1) The fleet ends when every numbered item below is reported done or not done. (2) No new work goes inside it: no new PR, no new reading, no new fix after the last item. (3) A defect found at any point is reported to the PM at once, as one line on the fleet's PR or in the report, and nothing more. (4) A review finding outside the PR's own diff goes to the backlog, not into the loop. (5) The fix for any new defect runs in a new fleet.

**Merges and reviews (owner rule, November 4, 22:20 WIB).** A PR merges at a green head after the coder's own hand review of its diff; it waits for nothing else. External reviews are collected after the fact, in parallel, and all count: the PPLX runner on this machine (`export PPLX_TABS=<n>; eval "$(scripts/pplx-firefox.sh)"; node tools/pplx-review.mjs --tabs <n> <PR URL> --out docs/reviews`, submission exactly `code review <PR URL>`), AGY (`scripts/run-agy-pr.sh <PR>`), Muse and Codex where they answer (Codex not on code an OpenAI model wrote), and Sonnet on the owner's laptop as an optional extra. No route ladder, no Cloudflare ask, no laptop gate, no recording hold. Each receipt is posted on its PR when it lands; the report lists which arrived. The docs lane gets none.

**Production sign-in is authorized for the two readings in section 4**, as Fleets 14–16: designated test account 2 through `scripts/lib/session.mjs`, never the owner's or the demo account. Reading R6 creates production posts on test account 2 and deletes them with the owned-fixture ledger and cleanup `scripts/run15-photo-checks.mjs` already uses (its `ledger`/`save`/`storedPaths` pattern, lines 27–29). The protection-bypass secret stays as it is: permanent reviewer/coder access, never revoked, regenerated or listed for revocation.

## 0. The nine pasted items, and what this plan does with each

| Item | State on `36773323` | This plan |
|---|---|---|
| #601 measure the detail photo | Moot: #611 (stored-size photo box) merged in Fleet 16, so the first-instant square and the desktop crop it measured no longer exist | Nothing. The PM closes it against #611's deployment |
| #370 camera stays open | Close-at-tap and the uploading card are on main (F1). The close still waits on a durable write queued behind the raw camera still plus both encoded copies (F2); every emulated reading used a small canvas fixture, never a phone-sized still | **Lane A** caps that wait at 700 ms; **R4** proves it with a 4032×3024 still |
| #222 feed and first photo in 2 s | Built (Run 8 cold-open fixes; Fleet 15 2x/3x copies). Nothing to build | Nothing. The PM's browser helper checks production after the merge (PM, 22:30 WIB) |
| #281 Muse Spark Open | Complete on main: the Profile switch, the Baseten call, the model ID on the post and in the trace, the paired ten-photo table in `docs/open-weights.md`, a passed production check on a test account (F3) | Nothing to build. **Lane D** corrects the stale "Part 2" line. The owner's own-account look is the one open step (owner list) |
| #372 feed photo bytes | Built: immutable WebP copies v2 1920 / 1040 / 1560 px, bytes measured by Fleet 15 (F4) | Nothing to build. **Lane D** corrects the stale "no-store" line. The PM's helper checks production |
| #455 / #456 / #457 drinks | Built and closed on GitHub (F5) | Nothing. The owner's phones are the acceptance (owner list) |
| #615 the beer that vanished | Not built: a question sets `status='needs_input'`, which every feed read, the live card and the in-flight card hide (F6); the "needs a reply" push already exists | **Lane C** builds the owner's ruling; **R6** proves it |

## Facts (checked this session on `36773323`; the coder does not re-check facts, only the find-texts)

- **F1 (#370, built).** `src/components/CaptureSheet.tsx` `post()` closes at `if(!await uploadManager.post(id))throw …;onClose();router.refresh();`. `src/lib/posts/upload-manager.ts` `post()` sets `posted = true`, notifies `upload-started`, starts `run(entry)` unawaited, then awaits `resolveOwner()` and `this.persist(entry)`. `Feed.tsx` renders `useUploads().filter(upload=>upload.posted…)` at the top as `status:"queued"`; `PostCard.tsx` prints "Uploading photo…" and, on failure, "Not posted yet. The photo is kept on this phone." So the post is at the top of the feed from the moment `post()` runs, independent of the durable write.
- **F2 (#370, the wait).** `upload-manager.ts` `persist()` chains every write on `entry.writing`; the background `process()` queues its own writes on the same chain, each storing the raw `files` and, once encoded, both re-encoded blobs. `src/lib/media/camera.ts` returns the camera's native still (`ImageCapture.takePhoto()`, up to 3 s) unresized; `reencode.ts` then makes a 4096-px original and a 1920-px feed copy at JPEG 0.85. Emulated close readings: 46–155 ms (`docs/evidence/run10-final7g/posting.json`), 186–322 ms (`run11-saving/timings.json`), 365–474 ms (Fleet 15 report), all with canvas fixtures.
- **F3 (#281).** `src/lib/meta/open-weights.ts` (`openWeightsConfigured()` on `IDENTIFY_OPEN_API_KEY`, Baseten base URL, model `meta-models/muse-spark-open-1026`, 16,384 tokens, 75 s deadline); `spark.ts` switches identify-and-portions only, Meta fallback; `profiles.identify_provider` (0032) with `IdentifyProviderSwitch.tsx`; `posts.identify_model/identify_host` and `model_calls.model/host`; `PostDetail.tsx` prints "Identified by Muse Spark Open (meta-models/muse-spark-open-1026) · Built with Muse Spark Open"; `docs/open-weights.md:27–54` the paired table; `docs/evidence/run10-open-production/README.md` the Nov 3 production check. `docs/open-weights.md:75` still says those remain "Part 2".
- **F4 (#372).** `feed-photo-url.ts`: `v2.webp` with `v2-1040.webp 2x, v2-1560.webp 3x`; `feed-photo-response.ts` and `[variant]/route.ts` send `private, max-age=31536000, immutable` with an ETag. `docs/media-loading.md:79` still says "private, no-store WebP of at most 50,000 bytes".
- **F5 (drinks).** `drink-glyph.ts` (coffee/water/cocktail/wine/beer/tumbler, `waterCups(500)=2`), `DrinkPicture.tsx`, `alcohol.ts` `keepsCaffeine`, `card-data.ts:52` "<g> g alcohol · <n> standard drinks", `hydration.ts:34,146` alcohol out of water, `IntakeSheet.tsx:101–106` the Today line; tests `drink-glyph.test.mjs`, `db/alcohol-intake.test.mjs`.
- **F6 (#615).** No code compares a label or glass against the drink; the question is the model's under `src/lib/prompts/spark/identify.ts:14` ("If caption and photo disagree, set needs_input … Do not guess."). Items are persisted with the question (`0011:10`), but `persist.ts` skips `markReady` when `named.needsInput` is set: no card, no intake rows, no day totals (`days.ts:57,168`). Hiding: `feed.ts` `VISIBLE_MEAL_FILTER="needs_input.is.null,status.eq.failed"` plus `.neq("status","needs_input")`; `Feed.tsx:122` drops `needs_input`; `Feed.tsx:203` and `RealtimePost.tsx:65,113` retire the card; `Feed.tsx:496–500` removes the in-flight card and dispatches `post-unavailable` (the vanish). The strip reads `status='needs_input'` every 2 s; its X calls `/api/posts/<id>/discard`, which hard-deletes. The answer posts a comment; `append_post_comment` queues a `correct` job; `publish_results_card` (0011:82) clears `needs_input`. Push: `send.ts` sends "Your meal needs a reply" only for `status === "needs_input"` with a matching question; `jobs/analyze.ts:25–26` pushes the question or queues the remainder. `tests/push-payload.test.mjs` fakes a `posts` row without a `question` column. `posts` has `deleted_at` and RLS `posts_owner_all for all`. No `src/app/api/posts/[id]/question/` exists.

## Lanes (each in its own worktree under `../my-food-ai-wt/run17-<lane>`, all started together, each cut from `36773323` or later main)

| Lane | Branch | Service that owns the how · boundary that calls it |
|---|---|---|
| A | `run17/post-close` | `uploadManager.post` (acknowledgement wait → boolean) · `CaptureSheet.post` |
| C | `run17/visible-question` | `persistAnalysis` (question beside a named meal → ready post + `posts.question` + push) · analyze job, `sendPostPush`, `NeedsInputStrip`/`NeedsInputSheet`, question dismiss route, comments route, identify prompt |
| D | `run17/docs` | report, two doc corrections · docs only, no review |

Lane A touches `upload-manager.ts` only; lane C touches none of lane A's files. No lane waits on another.

## 1. The sheet closes within a second of the tap (Lane A): #370

`src/lib/posts/upload-manager.ts`:

1. Replace `import { reencodeShot } from '@/lib/media/reencode';` with
   ```ts
   import { reencodeShot } from '@/lib/media/reencode';
   // #370: the capture sheet closes within a second of the Post tap. The durable
   // acknowledgement waits at most this long; the write and the upload go on behind it.
   const CLOSE_WAIT_MS = 700;
   ```
2. Replace
   ```ts
               entry.data.ownerId = owner;
               await this.persist(entry);
               return current();
   ```
   with
   ```ts
               entry.data.ownerId = owner;
               // The write is queued behind earlier snapshot writes that carry the camera
               // still and both encoded copies (several MB on a phone). The entry is already
               // at the top of the feed from memory and run() has started; when the write
               // takes longer than CLOSE_WAIT_MS the sheet closes and the write lands behind it.
               await Promise.race([this.persist(entry), new Promise<void>(resolve => setTimeout(resolve, CLOSE_WAIT_MS))]);
               return current();
   ```
3. `npx tsc --noEmit`; `npm run lint`; `npm test -- $(ls tests | grep -i upload | sed 's#^#tests/#' | tr '\n' ' ')`. No new test (timing is not in the contract's categories).

**Blast radius.** Every photo and caption post from the capture sheet. If the app is killed between the close and the write landing, the earlier snapshot write (same files, `posted` false) restores a draft on the next open; nothing is lost silently. The upload itself is unchanged. **Done:** R4.

## 2. A posted drink stays posted; the question sits beside it (Lane C): #615

The owner's ruling (Nov 4, 21:07 WIB): the beer shows up as posted with the calories of the drink as stated; the clarification arrives as a notification; nothing removes a post to make room for a question. Design taken: when the model asks a "Clarification needed" question and names at least one item, the meal is persisted and published like any ready meal (card, intake rows, day totals, saved meal), the question is kept in a new `posts.question` column, the Home strip shows it (the card the owner likes) beside the post instead of in place of it, and the existing "Your meal needs a reply" push goes out. The item is the drink as stated: the caption's food when there is a caption, otherwise the food the visible label or packaging names; the question asks about the mismatch. Answering posts the comment as today, which queues the correction and clears the question; the strip's X dismisses the question without touching the post. "No food found" keeps today's held route.

1. Create `supabase/migrations/0056_visible_question.sql`:
   ```sql
   -- A clarification question beside a posted meal (owner ruling, Nov 4, #615): the meal is ready
   -- and counted like any other; the question shows in the Home strip and goes out as a push until
   -- it is answered (a comment) or dismissed. Held questions (no food found) keep status/needs_input.
   alter table public.posts add column question jsonb;
   ```
   Apply to production with `psql "$SUPABASE_DB_URL" -f supabase/migrations/0056_visible_question.sql` after lane C's build is green and before R6 and the merge; read it back with `select column_name from information_schema.columns where table_name='posts' and column_name='question';` (one row). The column is additive; code on main before the merge never reads or writes it.
2. `src/lib/pipeline/analyze.ts`: replace `  hasNotEaten?:boolean;` with `  hasNotEaten?:boolean;\n  // Set by persistAnalysis when the question was kept beside a published meal (#615).\n  questionShown?:boolean;`.
3. `src/lib/pipeline/persist.ts`:
   - Replace `  const args = {` with
     ```ts
     // Owner ruling (Nov 4, #615): a question about a meal the model could still name does not hold
     // the post back. The meal publishes with the named items; the question is kept in posts.question,
     // shown in the Home strip, and sent as the "needs a reply" push. No food found keeps the held route.
     const visibleQuestion = Boolean(named.needsInput && named.needsInput.short === "Clarification needed" && items.length > 0);
     const args = {
     ```
   - Replace `    p_needs_input: named.needsInput ?? null,` with `    p_needs_input: visibleQuestion ? null : named.needsInput ?? null,`.
   - Replace `  if (!named.needsInput) await markReady(named.postId, admin, jobId,{notify:!named.hasNotEaten,saveMeal:!named.hasNotEaten});` with
     ```ts
     if (visibleQuestion && named.needsInput) {
       const question = named.needsInput;
       const kept = await admin.from("posts").update({ question }).eq("id", named.postId);
       if (kept.error) throw ioError("The question could not be kept with the meal.", kept.error, kept.status);
       const { data: asked } = await admin.from("post_comments").select("id").eq("post_id", named.postId).eq("author", "model").eq("body", question.question).limit(1).maybeSingle();
       if (!asked) { const comment = await admin.from("post_comments").insert({ post_id: named.postId, author: "model", body: question.question }); if (comment.error) throw ioError("The question could not be posted.", comment.error, comment.status); }
       named.questionShown = true;
       const ready = await markReady(named.postId, admin, jobId, { notify: false, saveMeal: !named.hasNotEaten });
       if (ready) await sendPostPush(admin, named.postId, question.question);
       return;
     }
     if (!named.needsInput) await markReady(named.postId, admin, jobId,{notify:!named.hasNotEaten,saveMeal:!named.hasNotEaten});
     ```
4. `src/lib/worker/jobs/analyze.ts`: replace `  if (named.needsInput) await sendPostPush(admin, job.post_id, named.needsInput.question);\n  else await queueRemainder();` with `  if (named.needsInput && !named.questionShown) await sendPostPush(admin, job.post_id, named.needsInput.question);\n  else await queueRemainder();`.
5. `src/lib/push/send.ts`:
   - Replace `    const { data: post, error } = await admin.from("posts").select("user_id,status,needs_input").eq("id", postId).maybeSingle();` with `    const { data: post, error } = await admin.from("posts").select("user_id,status,needs_input,question").eq("id", postId).maybeSingle();`.
   - Replace `      if (post.status !== "needs_input" || post.needs_input?.question !== question) return;` with `      // Held: the meal waits for the answer. Beside: the meal is published and the question sits next to it.\n      const held = post.status === "needs_input" && post.needs_input?.question === question;\n      const beside = post.status === "ready" && post.question?.question === question;\n      if (!held && !beside) return;`.
6. `src/components/NeedsInputSheet.tsx`:
   - Replace `export type QuestionPost={id:string;eaten_at:string;needs_input:NeedsInput;photoUrl:string|null};` with `// held: the meal waits for the answer (status needs_input). Otherwise the meal is posted and the question sits beside it.\nexport type QuestionPost={id:string;eaten_at:string;needs_input:NeedsInput;photoUrl:string|null;held:boolean};`.
   - Replace `window.dispatchEvent(new CustomEvent("post-answer-resume",{detail:{id:post.id}}));onAnswered();` with `if(post.held)window.dispatchEvent(new CustomEvent("post-answer-resume",{detail:{id:post.id}}));onAnswered();`.
7. `src/components/NeedsInputStrip.tsx`:
   - Replace `        const {data,error}=await db.from("posts").select("id,eaten_at,needs_input").eq("user_id",userId).eq("status","needs_input").order("created_at",{ascending:false}).abortSignal(AbortSignal.timeout(8000));` with `        const {data,error}=await db.from("posts").select("id,eaten_at,status,needs_input,question").eq("user_id",userId).or("status.eq.needs_input,question.not.is.null").is("deleted_at",null).order("created_at",{ascending:false}).abortSignal(AbortSignal.timeout(8000));`.
   - Replace
     ```ts
             const questions = (data??[]).flatMap(post => {
               const question = readNeedsInput(post.needs_input);
               return question ? [{...post,needs_input:question}] : [];
             });
     ```
     with
     ```ts
             const questions = (data??[]).flatMap(post => {
               const held = post.status === "needs_input";
               const question = readNeedsInput(held ? post.needs_input : post.question);
               return question ? [{id:post.id,eaten_at:post.eaten_at,needs_input:question,held}] : [];
             });
     ```
   - Replace `    <button type="button" aria-label="Discard meal" className="flex size-tap items-center justify-center" onClick={async()=>{const response=await fetch(`/api/posts/${post.id}/discard`,{method:"POST"});if(response.ok)remove(post.id);else setError("Meal could not be discarded.");}}><Icon name="close"/></button>` with `    <button type="button" aria-label={post.held?"Discard meal":"Dismiss question"} className="flex size-tap items-center justify-center" onClick={async()=>{const response=post.held?await fetch(`/api/posts/${post.id}/discard`,{method:"POST"}):await fetch(`/api/posts/${post.id}/question`,{method:"DELETE"});if(response.ok)remove(post.id);else setError(post.held?"Meal could not be discarded.":"Question could not be dismissed.");}}><Icon name="close"/></button>`.
8. Create `src/app/api/posts/[id]/question/route.ts`:
   ```ts
   import {NextResponse} from "next/server";
   import {createClient} from "@/lib/supabase/server";
   import {createAdminClient} from "@/lib/supabase/admin";
   import {isUuid} from "@/lib/posts/items";
   // Dismiss the question beside a published meal (#615). The meal, its items and its card are untouched.
   export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
     const db=await createClient();const {data:{user}}=await db.auth.getUser();
     if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
     const {id}=await params;if(!isUuid(id))return new Response(null,{status:404});
     const {data:post,error}=await db.from("posts").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();
     if(error)return new Response(null,{status:500});if(!post)return new Response(null,{status:404});
     const cleared=await createAdminClient().from("posts").update({question:null}).eq("id",id).eq("user_id",user.id);
     if(cleared.error)return NextResponse.json({error:"Question could not be dismissed."},{status:500});
     return new Response(null,{status:204});
   }
   ```
9. `src/app/api/posts/[id]/comments/route.ts`: replace ` if(error)return NextResponse.json({error:'Comment could not be saved.'},{status:error.code==='42501'?404:500});` with ` if(error)return NextResponse.json({error:'Comment could not be saved.'},{status:error.code==='42501'?404:500});\n // A comment answers the question beside a published meal (#615); the queued correction applies it.\n const cleared=await createAdminClient().from('posts').update({question:null}).eq('id',id).eq('user_id',user.id).not('question','is',null);\n if(cleared.error)console.warn('question could not be cleared',cleared.error.message);`.
10. `src/lib/prompts/spark/identify.ts`: replace `- If caption and photo disagree, set needs_input with one question, short "Clarification needed", and two or three food options. Do not guess.` with `- If caption and photo disagree, set needs_input with one question about the mismatch, short "Clarification needed", and two or three food options, and still name the items so the meal is logged now: the item is the food as stated, which is the caption's food when there is a caption, otherwise the food named by a visible label or packaging, with your best portion estimate. The answer corrects it. A "Clarification needed" question always comes with at least one named item.`
11. Test (data rule, the push gate): create `tests/visible-question-push.test.mjs` on the `tests/push-payload.test.mjs` pattern (same `Module._load` stub of `web-push`, same fake `admin`): a `posts` row `{user_id:'owner',status:'ready',needs_input:null,question:{question:'Which beer is it?'}}` with `sendPostPush(admin,'p','Which beer is it?')` delivers one payload whose `title` is `Your meal needs a reply` and that carries no `question`, `caption`, `image` or nutrition key; the same row with `sendPostPush(admin,'p','A different question')` delivers nothing; a row `{status:'ready',question:null}` with a question delivers nothing.
12. `npx tsc --noEmit`; `npm run lint`; `npm test -- tests/visible-question-push.test.mjs tests/push-payload.test.mjs tests/push-completion.test.mjs tests/needs-input.test.mjs tests/needs-input-batch.test.mjs tests/answer-readiness.test.mjs tests/clarification-order.test.mjs tests/clarification-wording.test.mjs tests/analysis-integrity.test.mjs`; `npm run build`. Where a test quotes the old prompt line verbatim, update that assertion to the new text and nothing else.

**Blast radius.** Every meal whose analysis raises a "Clarification needed" question with named items: it now publishes at once with those items' nutrition (the stated food matched to USDA, as for any meal), counts in Days and Today, and carries the question in the strip and the push; the answer still runs the correction job and can change the numbers. The held route is unchanged for "No food found". If the model ever returns a "Clarification needed" question with no items despite the prompt, the post takes the held route and R6 records it as a defect for the backlog. The strip's X on a published meal dismisses the question only; on a held meal it still discards. The feed, `RealtimePost` and the in-flight card need no change because the post never enters `needs_input`. `posts.question` is read by the owner (RLS `posts_owner_all`) and written by the service role only. **Done:** R6.

## 3. Docs (Lane D)

- `docs/plan-run17.md` holds this plan unchanged.
- `docs/open-weights.md`: replace `- Migration 0032, production/preview environment configuration, production switch persistence, owner-visible open-model detail and owner acceptance remain Part 2.` with `- Migration 0032 is applied, production holds the provider configuration, the switch persists and the detail line shows on production (Fleet 10 check, \`docs/evidence/run10-open-production/\`). The owner's own-account look is the one step left on #281.`
- `docs/media-loading.md`: replace `and emits a private, no-store WebP of at most 50,000 bytes.` with `and emits a private WebP of at most 50,000 bytes; since Fleet 12 the feed route family answers \`private, max-age=31536000, immutable\` with an ETag (v2 1920 px, v2-1040 and v2-1560 for 2x/3x screens), measured in Fleet 15 (\`docs/run15-report.md\`).`
- `docs/run17-report.md`: items 1–3 done or not done; each PR with its head, merge commit and the receipts that arrived; R4 and R6 with their numbers and the decision each fed; every find-text skipped; one line per defect noticed (reported to the PM at the time, listed here again); nothing else.
- Docs and evidence go up in one push at the end; no `.mts`/`.ts` evidence files in the tracked tree.

## 4. Readings, one each, with the decision each feeds

Each runs once, after the lane it proves is built. One driver, `scripts/run17-checks.mjs`, modelled on `scripts/run15-photo-checks.mjs` (same sign-in, `capture-files` injection at its line 33, Post tap timing at 40–41, ledger and cleanup at 27–29), with `--mode=post-close` and `--mode=beer`; Chromium CDP through `scripts/lib/cdp.mjs` for R4 (`Emulation.setCPUThrottlingRate {rate:4}`; `Network.emulateNetworkConditions` 1.6 Mbit/s down, 0.75 Mbit/s up, 150 ms latency: the Run 8 profile), Firefox BiDi for R6. Every post the driver creates is in its ledger and deleted at the end of its mode.

- **R4 (#370, lane A).** Fixture: `scripts/fixtures/plate3.jpg` resized to 4032×3024 JPEG q95 in memory (not committed). Local production build (`npm run build && npm start`) of `36773323` first, then of lane A's head, each in Chromium 390×844 with the Run 8 profile and CPU 4×, signed in as test account 2: inject the fixture through `capture-files`, wait for Post enabled, tap Post, time to the caption textarea disappearing (`closeMs`), and confirm the top feed card reads "Uploading photo…" within the same second. Three runs each; record the two encoded sizes the draft produced. Done when lane A's head closes in ≤ 1,000 ms on all three runs. Decision: numbers on #370; the PM's helper does the production check after the merge.
- **R6 (#615, lane C).** With 0056 applied, a local production build of lane C's head pointed at the same environment the Fleet 16 readings used, test account 2, Firefox BiDi 390×844, with one `push_subscriptions` row inserted for the account by the admin client (a fixed endpoint; `web-push` left real so the send either delivers or logs its error): inject `scripts/fixtures/plate3.jpg` with the caption `a glass of beer` (a photo/caption disagreement the prompt must question), tap Post, and record at 1 s, 5 s, every 5 s to settle, and at settle: the feed (card present; its status text), the Home strip (question row present), Days (the day's count and kcal), the post page (items, kcal, the model comment holding the question), `posts.status, needs_input, question`, and the worker's push log line. The items must name the beer. Then tap the strip row, answer with the first option, and record the same screens at settle; then post a second disagreement, tap the strip's X, and confirm the post is still in the feed and `question` is null. Done when the card never leaves the feed, kcal shows from the first settle, the strip row appears beside it, the push went out, the answer runs the correction, and X dismisses without deleting. Anything else is a defect: one line to the PM, nothing fixed. Delete the posts.

## 5. Closures and comments

- Comment with commit-pinned evidence: #370 (R4 + lane A's merge commit), #615 (R6 + lane C's merge commit). The PM closes both on its own checks.
- #601, #222, #372, #281, #455, #456, #457: no comment from this fleet; their state is in section 0 and the owner list.
- No docs PR is merged by this plan. #604, #600, #577 and #558 stay as they are.

## Cleanup and exit

Remove leftover worktrees under `../my-food-ai-wt/run17-*` before the first PR; remove each worktree and local branch once its PR is pushed; delete each remote `run17/*` branch after its merge (the docs branch stays until the owner merges or closes its PR); retain the protection-bypass secret permanently; delete every post the readings created (the ledger is the list); stop local servers and the browser contexts the readings used; run `scripts/cleanup.sh`; only the main checkout and the docs checkouts remain, and nothing temporary is running. Then the report, then stop.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- A meal whose photo and caption disagree is no longer held out of the feed, Days and Today while its question waits. Only "No food found" still holds a post.
- Nothing else is removed.

**Behaviour this plan changes (the default the plan takes)**
- The capture sheet closes within 700 ms of the Post tap even when the phone's durable write is still landing; the upload and the write continue behind it, and the "Uploading photo…" card is already at the top of the feed. Default: 700 ms cap; an app killed in that window shows a draft on the next open, not a lost post.
- A "Clarification needed" question now publishes the meal at once with the stated drink's nutrition (the caption's food, or the labelled food when there is no caption), keeps the question in the Home strip beside the post, and sends the existing "Your meal needs a reply" push. The strip's X on such a post dismisses the question only; answering runs the correction as a comment does today. Default: strip card plus push; no in-app inbox.
- The identify prompt tells the model to name the stated food and ask about the mismatch, never to return a question with nothing named.
- Two stale sentences in `docs/open-weights.md` and `docs/media-loading.md` are corrected to what is on main.
- Merges wait for nothing but green checks and the coder's hand review; PPLX, AGY, Muse, Codex and (optionally) your laptop review after the fact. Stop time 01:30 WIB.

**Places where the design and the product's function disagree**
- You like the strip card: the plan keeps that row and adds no badge to the post card itself, so the post looks like any ready meal; only the strip and the push say a question is open. Default: no badge.
- No designer frame exists for a question beside a published meal; it uses the existing strip. Default: existing strip.
- The question push carries generic text only ("Your meal needs a reply"), by the earlier privacy ruling; the beer's question is not in the notification. Default: unchanged.

**Yours, acceptance only (no process asks)**
- #281: on your own account, Profile → "Identify food with Muse Spark Open" on, log one meal, open it and read the line under the items. That is the last open step.
- #455/#456/#457: on your phones, Coffee, Water bottle, "a glass of red wine", "a lime and rum tiki cocktail", "a can of Bintang beer"; swipe each card. Closed on GitHub already; your look is the acceptance.
- #615: photograph the beer again after the merge; the post stays, the strip row appears, the phone shows the notification.

---
