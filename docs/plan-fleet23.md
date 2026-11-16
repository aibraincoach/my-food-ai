# Fleet 23 plan

Planner: Fable 5.2, planner seat. Nov 16 2026 (WIB). All code read on `origin/main` = `d080b7020` (merge of #942) on Nov 16.
On Nov 16 the planner applied every edit in Part 1 to a scratch copy of main outside the repository and ran there: `npx tsc --noEmit`, `npx eslint`, the voice test file and the photo-identity test file, and a trial merge of this plan's docs changes with Fleet 22's docs branch in both orders. The results are in the Facts table. The planner did not run the whole suite, a build, a browser or anything on production. Nothing was written to the repository or to GitHub.

**Stops: one.** One dispatch, one prompt. The run builds, reviews, tests and looks without stopping. It then stops once, before the merges: the coder posts each PR number with its full head SHA and waits for the PM's merge order naming them. After the order the run goes to its end without another stop.

**Halts.** The only legal halts are: a review tool is unavailable when the review is reached; a fact this plan states turns out false; an operation would contact a customer or breach an explicit prohibition. A halt stops only its own item. Every independent item continues.

**When done, stop.** Done means every numbered item in Part 1 is reported done or not done. After that the coder opens no new PR, makes no new reading and no new fix. A defect found during the run is reported to the PM for the backlog and is not fixed in this run.

**Runs beside Fleet 22.** Fleet 22's seven code PRs and its docs PR are open (#943, #950 to #954 and two more as they open). This plan edits none of the files Fleet 22's code PRs edit, and does not edit `scripts/run17-checks.mjs`, which PR #918 holds. Its docs PR edits five files that Fleet 22's docs PR also edits, on different lines, as the PM approved on Nov 16; the two merge cleanly in either order (fact below). This run uses its own test stack, ports, browser port and scratch directory, so it never meets Fleet 22's.

**Size.** The PM chose the items for this plan: #908, the seven carried items (#693, #294, #222, #372, #375, #494, #579), #935, #937 and #929. Of those eleven, this dispatch works **7**: 6 by a build with exact text and 1 by a check with exact steps. The other **4** each have a stated reason in Part 2 A, with the parts of the seven that stay open. Every other Engineering item (75 of the 86 in the owner's Doc, rev 1933) is listed in Part 2 B with its reason.

---

# Part 1: the dispatch (7 items)

Builds (6): #908, #935, #693 (part), #494 (part), #372 (part), #294 (part).
Check (1): #375.

In this plan, `<main>` means the main checkout, `/home/opc/Projects/my-food-ai`, and `<w>` means `/tmp/mfa-f23/main`, a worktree of `origin/main` that step 5a makes and step 8 removes.

## Files Fleet 22 holds (not edited by any code PR of this plan)

`src/components/NutritionTable.tsx`, `src/lib/fdc/nutrients.ts`, `src/lib/nutrition/totals.ts`, `tests/nutrition-scaling.test.mjs`, `src/lib/posts/days.ts`, `tests/days-summary.test.mjs`, `src/components/OutlineOverlay.tsx`, `src/lib/time/local.ts`, `src/components/PostActions.tsx`, `src/lib/posts/saved.ts`, `src/components/NeedsInputStrip.tsx`, `src/components/Feed.tsx`, `docs/agents.md`, `docs/findings/muse-model-effect.md`, `docs/findings/tick-route-get.md`, `docs/plan-fleet22.md`. Held by PR #918: `scripts/run17-checks.mjs`.
Fleet 22's docs PR also edits `docs/planner-contract.md`, `docs/pm-contract.md`, `CLAUDE.md`, `skills/pm-handover/SKILL.md` and `skills/pm-handover/scripts/pack.sh`. This plan's docs PR edits those five on other lines only.

## How it runs

1. **Cleanup first.** Run `git worktree list`. Leave every worktree Fleet 22's run made. Remove only a leftover of this plan (a path under `/tmp/mfa-f23`), with `git worktree remove --force <path>`. Do not commit, stash or discard the uncommitted change in `<main>`.
2. **Build.** Each PR below in its own fresh worktree branched from `origin/main`. Nothing is stacked. No PR depends on another. No two touch the same file. There are 2 code PRs and one docs PR.
3. After each push: open the PR, then remove that worktree and delete its local branch.
4. **Reviews** run in a sub-agent beside the build, never before it. One external reviewer per PR: **PPLX** (`skills/pplx-review/SKILL.md`), one pass per head, run to zero blockers; PPLX then confirms the fixes only. If PPLX cannot run for a PR, use AGY (`skills/agy-review/SKILL.md`) for that PR. Codex does not review these PRs, because the code is written by an OpenAI model. If neither can run, that PR halts and the others continue. The docs PR is reviewed the same way.
5. **At the very end, in this order.**
   a. Once: `mkdir -p /tmp/mfa-f23 && git -C <main> worktree add --detach /tmp/mfa-f23/main origin/main`. In `<w>`: `npm ci`, then `TEST_PORT_BASE=60360 TEST_PG_PORT=55459 TEST_STACK_DIR=/tmp/mfa-f23/stack TEST_ENV_FILE=.env.test.fleet23 npm run test:stack`. The ports differ from Fleet 22's (60260 and 55449), so both stacks can run at once; the app of this run answers at `http://127.0.0.1:60360`. The stack's keys expire 24 hours after this command.
   b. **Main's own result.** In `<w>`: `npm run lint`; `npx tsc --noEmit`; then with `TEST_ENV_FILE=.env.test.fleet23` set: `npm run test:app -- build`, `npm run test:app -- start` in the background, `MFA_TEST_DISPOSABLE=1 npm test`; stop the app. Write down the results. If Fleet 22's final report already holds main's result for the same commit of main, copy it and skip the `npm test` of this step.
   c. **Build and test each code PR.** For each code PR branch, in a temporary worktree: `npm ci`, `npm run lint`, `npx tsc --noEmit`, then with `TEST_ENV_FILE=/tmp/mfa-f23/main/.env.test.fleet23`: `npm run test:app -- build`, `npm run test:app -- start` in the background, `MFA_TEST_DISPOSABLE=1 npm test`; stop the app. Keep the worktree and its build for step 5e.
   d. **What counts as a pass.** A PR passes lint when it reports no error that main does not. A PR passes the tests when every test that fails on its branch also fails on main. PR 1's new test must pass on its branch.
   e. **The fixture and the looks.** In `<w>`: start its app in the background, start the browser, sign in and make fixture F1 (section "The browser and the fixture"); stop the app. Then for each code PR, in its worktree from step 5c: start its app, do the look, stop the app, remove the worktree.
   f. **The one stop.** Post one comment on each PR: its number, its full head SHA, its review result, its test result and its look result. Wait for the PM's merge order.
6. **The look**: that PR's own build at `http://127.0.0.1:60360`, signed in as local test user 2, at the width the PR names. Write what was seen against the PR's "Look" line as one comment on the PR. Store no image. Do not use Playwright.
7. **Merges.** Merge in ascending PR number, each only at the head SHA the order names. This plan has no migration. Delete each remote branch after its merge. The docs PR is not merged unless the order names it. After the last merge, run read R1 and write its result in the final report.
8. **End state.** Stop this run's browser and remove its profile and driver script. In `<w>`: `TEST_PORT_BASE=60360 TEST_PG_PORT=55459 TEST_STACK_DIR=/tmp/mfa-f23/stack TEST_ENV_FILE=.env.test.fleet23 npm run test:stack -- down`. Then `git -C <main> worktree remove --force /tmp/mfa-f23/main` and `rm -rf /tmp/mfa-f23`. `podman ps` shows no container whose name ends in `-60360`; nothing this run started is left; Fleet 22's worktrees, stack and browser are untouched. Paste `git worktree list` and `podman ps` in the final report.
9. **Final report:** the 7 item numbers, each done or not done; for the check, what was seen, with the numbers; every defect found, one line each, for the PM.
10. **New tests: one**, in PR 1. Item #935's done line asks for "a test or a browser run", and a browser cannot make a transcription fail at the instant a drink is detected, so the test is the proof. The planner contract's test rule does not list this kind of test; the PM wrote the done line after ruling on the same conflict for #686, so this plan follows the done line. If the PM rules otherwise, the test is struck and the fix stands.

## Facts (planner checked on Nov 16 2026; the coder does not re-check)

| Fact | Check |
|---|---|
| `origin/main` is `d080b702`. Open PRs: #682, #943, #950, #951, #952, #953, #954. | `git log origin/main -1`; `gh pr list --state open`, 13:55 UTC |
| Every "Find" text in Part 1 occurs exactly once in its file on `origin/main`. | a script counted each with Python's `str.count` on a copy made by `git archive origin/main` |
| With every code edit of Part 1 applied to a copy of main, `npx tsc --noEmit` reports nothing, and `npx eslint` reports the same 3 errors and 14 warnings as unmodified main and none in the five edited files. | run on scratch copies |
| The new test in PR 1 fails on unmodified main ("the failed transcription still has a visible error") and passes with PR 1's edits. With it, `tests/voice-submit-lifecycle.test.mjs` and `tests/sharp-image-identity.test.mjs` pass 11 of 11 on the edited copy. | `MFA_TEST_DISPOSABLE=1 node --import tsx --test --test-concurrency=1 tests/voice-submit-lifecycle.test.mjs tests/sharp-image-identity.test.mjs`, on both copies; these files need no stack |
| In the phone composer, a failed transcription stores its message inside the recorder and then reports the mic as no longer active. With drinks detected, the composer then draws the drink overview, which has no recorder, so the message is removed with it. The overview's footer shows only the drink error. The desktop composer never switches, so it keeps the message. | `src/components/VoiceRecorder.tsx` lines 28–29, 45, 49; `src/components/LightComposer.tsx` lines 79–90 |
| Speech is no longer lost in the phone composer when drinks are detected: the overview waits while the mic is active. Speech is still lost from the phone camera view's caption mic: while it records, the shutter, "Choose from library" and the mode strip stay enabled, each removes the recorder, and the recorder's cleanup drops the clip. Read from source, not reproduced. | `LightComposer.tsx` line 79; `src/components/CaptureSheet.tsx` lines 539, 545, 546, 603; `VoiceRecorder.tsx` line 13 |
| The leftovers sheet has no caption field, so it has no mic. The mic is in the other four fields the ruling names, and in the phone camera view's caption. | `CaptureSheet.tsx` lines 563–566 and 603; `LightComposer.tsx` lines 67 and 128; `IntakeSheet.tsx` line 138; `SearchBox.tsx` line 20; `CommentComposer.tsx` line 24 |
| `VoiceRecorder` is mounted by `CommentComposer` and `VoiceButton`; `VoiceButton` by `LightComposer`, `CaptureSheet`, `IntakeSheet` and `SearchBox`; `LightComposer` only by `CaptureSheet`. The new `onError` is optional, so the other mounts are unchanged. | `grep -rn "<VoiceRecorder\|<VoiceButton\|<LightComposer" src` |
| A photo with a secret is shown from `/p/<id>_<secret>_<640, 1080 or 1600>.webp`. The feed card and Home's first photo carry `sizes="(min-width: 1024px) 520px, 100vw"`. The frame that covers the screen when a meal is opened carries the same three addresses and no `sizes`, so the browser treats it as full width: on a desktop it downloads the 1600 copy although the feed already holds the 640 copy. | `src/lib/posts/feed-photo-url.ts` lines 9–23; `src/app/(tabs)/page.tsx` lines 104, 121, 126; `src/components/Carousel.tsx` line 111; `src/components/PostOpenFrame.tsx` line 37 |
| No element on the meal detail asks for a `.feed.jpg` original any more. The detail still downloads the 1600 copy (its image has no `sizes`) and then the full original, once per open; both are in `OutlineOverlay.tsx`, which Fleet 22 holds. | `src/lib/posts/items.ts` lines 138–153; `src/components/OutlineOverlay.tsx` lines 69–84; Fleet 21's `look-8-desktop-network.json` (`feedJpegRequests: []`) |
| The two risks #579 names are gone: Home's preload carries the same addresses and `sizes` as the photo, and a failed sharp photo is remembered per photo, not for all. | `page.tsx` lines 104, 121, 126; `tests/home-photo-preload.test.mjs` line 64; `Carousel.tsx` lines 103, 109; `tests/sharp-image-identity.test.mjs` lines 31–34 |
| A 390-wide phone at 3x picks the 1600 copy. For a photo captured at 2560 × 1920 that copy is 1600 pixels wide, 4.1 times the card. For an old 480 × 640 photo it is 480 wide, 1.23 times. The browser's `naturalWidth` for it reads 390, because the browser divides by the copy's density, so that number can never show the ratio; the file's own pixel width must be read. | `feed-photo-url.ts`; `src/lib/posts/feed-photo.ts` lines 64–70; Fleet 21's `look-8-photo-measurements.json` (`_1600`, `naturalWidth: 312`) |
| The only "no-store" in `docs/media-loading.md` is line 91, about refused requests, and it is true. The file does not mention the `/p/` addresses. | the file; `src/lib/posts/feed-photo-response.ts` line 5 |
| The ruled words are in the source: "Drinks with this meal", "Eat this again", "A quick question about your meal". "Additional food" and "Also eaten" occur nowhere in `src/`. No user-visible "Log again" or "Drank in this meal" is left in `src/` or `public/`. `docs/wording/inventory.md` is stale against the source. | `grep -rn` of each; `node scripts/wording-inventory.mjs --check` prints "docs/wording/inventory.md is stale" |
| `scripts/egress-report.mjs` reads the Supabase logs endpoint with SELECT-only queries, using `SUPABASE_ACCESS_TOKEN` and `NEXT_PUBLIC_SUPABASE_URL`. It prints Storage bytes by file kind, and by file kind and client class, and log rows by source. It overwrites `docs/egress.md` unless `--output` is given. It does not measure log bytes. | the script, lines 9–43 |
| The Wall of Stupid on main holds 62 entries, newest 2026-11-16 13:48 WIB. Ten more entries, dated 2026-11-14 19:05 to 2026-11-15 20:38 WIB, exist only on the branch of PR #682 at `6dcc1e48824b46cdf56188203996d8033c6f087e`. Four timestamps are shared by more than one entry. | `git show origin/main:WALL_OF_STUPID.md`; the same file at `6dcc1e48`; a script compared the first columns |
| The rules list in this plan cites every one of the 72 entries by its timestamp, and cites no timestamp that is not an entry. | a script compared the list's timestamps with the two files' first columns |
| With this plan's docs edits committed on a branch from main, merging Fleet 22's docs branch (`docs/fleet22` at `9a317ea8`) into it, and merging it into Fleet 22's, both succeed with no conflict and give the same files. The archive then holds 72 entries. `pack.sh` still parses. | a throwaway clone outside the repository: two `git merge` runs, `git rev-parse <merge>^{tree}` equal, `grep -c '^| 20' WALL_OF_STUPID.md` = 72, `bash -n` |
| The planner contract does not mention the Wall today. The PM contract names it once (line 15). `CLAUDE.md` names it only in dated history sections. The handover skill names it on lines 3, 22, 27, 32 and 45; Fleet 22 edits line 45. | `grep -n -i wall` on each file |
| The test stack takes its app port from `TEST_PORT_BASE` (backend ports are that number plus 5 to 8) and its database port from `TEST_PG_PORT`. | `scripts/test-stack.mjs` line 9; `docs/testing.md` |
| The browser, how a photo is attached and fixture F1 are in `docs/plan-fleet21.md` on main, sections "The browser" and "Local fixtures". | the file on `origin/main` |

**Premises (unchecked; the coder verifies before relying on them):**
- A second test stack on ports 60360 and 55459 starts beside Fleet 22's. The planner read how the ports are set and did not start one.
- `npm test` on today's main fails nothing. Step 5b measures it.
- `.env.local` holds `SUPABASE_ACCESS_TOKEN` and `NEXT_PUBLIC_SUPABASE_URL` (read R1). The planner did not open that file.
- The logs record a signed photo address without its `?token=` part. If they keep it, the report's "by file kind" lines come out as "other", and R1 says so.
- `node scripts/wording-inventory.mjs` writes the same file on every machine for the same source.

---

## PR 1: branch `fix23/voice-error` (#935; #693, part)
**Service:** `VoiceRecorder.tsx` owns recording, transcription and their errors. **Boundary:** `VoiceButton.tsx` in a field; `LightComposer.tsx` and `CaptureSheet.tsx` for a new meal.
**Blast radius:** the new-meal sheet on a phone. The comment box, the drink sheet and Search mount the same recorder and pass no new value, so they are unchanged. If it fails, the mic in the new-meal sheet stops working or the shutter stays disabled.
**What it does:** when a transcription or the microphone fails and the composer has switched to the drink overview, the overview shows the message. While the camera view's caption mic is recording or transcribing, the shutter, "Choose from library" and the mode strip are disabled, so the speech cannot be thrown away by them.
**Look:** at 390 wide, open the capture sheet (`open-entry` with `{entry:'camera'}`). Expected: the caption field shows its mic; the shutter, "Choose from library" and the mode strip are enabled while nothing is recording. Then open the composer with a photo attached as "Local fixtures" says. Expected: the caption field shows its mic and Post works as before.

File `src/components/VoiceRecorder.tsx`.
Find:
```
export default function VoiceRecorder({postId,disabled,onTranscript,onActiveChange,label='Record a correction'}:{postId?:string;label?:string;disabled:boolean;onTranscript:(text:string)=>void;onActiveChange:(active:boolean)=>void}){
```
Replace:
```
export default function VoiceRecorder({postId,disabled,onTranscript,onActiveChange,onError,label='Record a correction'}:{postId?:string;label?:string;disabled:boolean;onTranscript:(text:string)=>void;onActiveChange:(active:boolean)=>void;onError?:(message:string)=>void}){
```
Find:
```
   }catch(cause){if(alive.current)setError(cause instanceof Error?cause.message:'Transcription could not be completed.');}
```
Replace:
```
   }catch(cause){if(alive.current){const message=cause instanceof Error?cause.message:'Transcription could not be completed.';setError(message);onError?.(message);}}
```
Find:
```
setState('starting');setError('');
```
Replace:
```
setState('starting');setError('');onError?.('');
```
Find:
```
if(alive.current){setError(cause instanceof Error?cause.message:'Microphone could not be opened.');setState('idle');onActiveChange(false);}
```
Replace:
```
if(alive.current){const message=cause instanceof Error?cause.message:'Microphone could not be opened.';setError(message);onError?.(message);setState('idle');onActiveChange(false);}
```
File `src/components/VoiceButton.tsx`.
Find:
```
export default function VoiceButton({value,onChange,max,onActiveChange,disabled=false,className="flex shrink-0 flex-wrap items-center justify-end"}:{value:string;onChange:(next:string)=>void;max:number;onActiveChange?:(active:boolean)=>void;disabled?:boolean;className?:string}){
```
Replace:
```
export default function VoiceButton({value,onChange,max,onActiveChange,onError,disabled=false,className="flex shrink-0 flex-wrap items-center justify-end"}:{value:string;onChange:(next:string)=>void;max:number;onActiveChange?:(active:boolean)=>void;onError?:(message:string)=>void;disabled?:boolean;className?:string}){
```
Find:
```
<VoiceRecorder label="Speak" disabled={disabled} onActiveChange={onActiveChange??(()=>{})} 
```
Replace:
```
<VoiceRecorder label="Speak" disabled={disabled} onError={onError} onActiveChange={onActiveChange??(()=>{})} 
```
File `src/components/LightComposer.tsx`.
Find:
```
 const [drinkDetails,setDrinkDetails]=useState(false);
```
Replace:
```
 const [drinkDetails,setDrinkDetails]=useState(false);
 const [voiceError,setVoiceError]=useState('');
```
Find:
```
    {drinks.error&&<p role="alert" className="mb-2 text-detail text-faint">{drinks.error}</p>}
```
Replace:
```
    {drinks.error&&<p role="alert" className="mb-2 text-detail text-faint">{drinks.error}</p>}
    {voiceError&&<p role="alert" className="mb-2 text-detail text-faint">{voiceError}</p>}
```
Find:
```
onActiveChange={voice.onActiveChange}/></div>
```
Replace:
```
onActiveChange={voice.onActiveChange} onError={setVoiceError}/></div>
```
File `src/components/CaptureSheet.tsx`.
Find:
```
<button type="button" aria-label="Take a photo" disabled={posting || full || cameraBusy} onClick={takePhoto}
```
Replace:
```
<button type="button" aria-label="Take a photo" disabled={posting || full || cameraBusy || voice.active} onClick={takePhoto}
```
Find:
```
<button type="button" aria-label="Choose from library" disabled={posting || full} onClick={() => galleryRef.current?.click()}
```
Replace:
```
<button type="button" aria-label="Choose from library" disabled={posting || full || voice.active} onClick={() => galleryRef.current?.click()}
```
Find:
```
<ModeStrip highlightBarcode={modesHintVisible} mode={mode} onChange={switchMode} disabled={Boolean(forPost) || Boolean(labelForCode) || barcodeState !== "idle" || posting} />
```
Replace:
```
<ModeStrip highlightBarcode={modesHintVisible} mode={mode} onChange={switchMode} disabled={Boolean(forPost) || Boolean(labelForCode) || barcodeState !== "idle" || posting || voice.active} />
```
File `tests/voice-submit-lifecycle.test.mjs`. Append at the end of the file:
```

test('a transcription that fails as drinks are detected shows its error on the drink overview',async()=>{
 const message='You have made a lot of requests this hour. Try again later.';
 const all=tree=>!tree?[]:Array.isArray(tree)?tree.flatMap(all):typeof tree!=='object'?[]:[tree,...all(tree.props?.children)];
 const h=harness('LightComposer');let tree=h.render();h.speak(tree).props.onClick();await h.settle();tree=h.render();
 h.speak(tree).props.onClick();const sent=h.worklets[0].port.onmessage({data:{samples:new Float32Array([.1]),stopped:true}});await h.settle();tree=h.render();
 h.detectDrinks();tree=h.render();assert.ok(h.speak(tree),'the recorder stays while the clip is transcribed');
 h.done(Response.json({error:message},{status:429}));await sent;tree=h.render();
 assert.equal(h.speak(tree),undefined,'the composer has switched to the drink overview');
 const alert=all(tree).find(node=>node.props?.role==='alert');
 assert.ok(alert,'the failed transcription still has a visible error');assert.equal(alert.props.children,message);
 assert.equal(h.caption(),'Typed meal');assert.equal(h.posted.length,0);
});
```
Done when: the new test passes, and the look shows the sheet unchanged when nothing is recording. Not covered, and still open under #693: playing a recorded clip into the microphone in each field on production (GrokBot); the ruling's "leftovers caption", a field the app does not have.

## PR 2: branch `fix23/open-frame-size` (#494, part)
**Service:** `feedPhotoSrcSet` in `src/lib/posts/feed-photo-url.ts` gives the addresses. **Boundary:** `PostOpenFrame.tsx`, the frame shown the instant a meal is tapped.
**Blast radius:** that frame only. On a phone nothing changes. On a desktop the frame shows the copy the feed already holds. If it fails, the frame shows a less sharp photo for the moment before the detail replaces it.
**What it does:** the frame tells the browser how wide it is, with the feed card's own words, so it reuses the photo already on screen and downloads nothing.
**Look:** at 1280 wide on Home, with the network log on, read the `currentSrc` of fixture F1's feed photo. Tap F1's "Details ›" link. Read the `currentSrc` of the frame's photo as soon as it appears. Expected: the two are the same address, and no request for it appears in the log after the tap.

File `src/components/PostOpenFrame.tsx`.
Find:
```
crossOrigin="anonymous" alt={post.caption||'Meal photo'} draggable={false}
```
Replace:
```
crossOrigin="anonymous" sizes="(min-width: 1024px) 520px, 100vw" alt={post.caption||'Meal photo'} draggable={false}
```
Done when: the look shows the frame reusing the feed's copy. Not covered, and still open under #494: the detail's own photo still downloads the 1600 copy and then the full original, in a file Fleet 22 holds (Part 2 A).

## Docs PR: branch `docs/fleet23` (#908; #372, part; #294, part)
**Blast radius:** one new file, the Wall's heading and ten restored entries, one sentence each in two contracts and `CLAUDE.md`, four sentences in the handover skill, four lines in its pack script, one sentence in a media document, and one regenerated word list. No Wall entry's text is changed. Reviewed by PPLX. Not merged unless the PM's order names it.
Also commit this plan unchanged as `docs/plan-fleet23.md`.

**#908, step 1: the rules list.** New file `pm-operational-rules.md` at the repository root, with exactly the text of the section "The text of pm-operational-rules.md" at the end of Part 1.

**#908, step 2: the archive.** The file `WALL_OF_STUPID.md` stays where it is and becomes the archive, so no entry moves and no link to it breaks. Make this one change to its heading and no other.
File `WALL_OF_STUPID.md`.
Find:
```
# Wall of Stupid

Tracks process failures so they don't repeat. One entry per incident. Newest first.
```
Replace:
```
# Wall of Stupid archive

The history of process failures. One entry per incident. Newest first. The rules these incidents produced are in [pm-operational-rules.md](pm-operational-rules.md). An agent reads that list to learn what gets it fired, and comes here for the incident behind a rule.
```
Then restore the ten entries that exist only on PR #682's branch. In the docs PR's worktree run exactly:
```
mkdir -p /tmp/mfa-f23
git fetch origin 6dcc1e48824b46cdf56188203996d8033c6f087e
git show 6dcc1e48824b46cdf56188203996d8033c6f087e:WALL_OF_STUPID.md | grep -E '^\| 2026-11-1[45] ' > /tmp/mfa-f23/rows10.txt
test "$(wc -l < /tmp/mfa-f23/rows10.txt)" = 10
python3 - <<'EOF'
rows=open("/tmp/mfa-f23/rows10.txt").read()
s=open("WALL_OF_STUPID.md").read(); a="| 2026-11-05 00:27 WIB |"
assert s.count(a)==1 and rows.count("\n")==10
open("WALL_OF_STUPID.md","w").write(s.replace(a,rows+a))
EOF
test "$(grep -c '^| 20' WALL_OF_STUPID.md)" = 72
```
The ten lines go in byte for byte, in the order that branch holds them, above the entry of 2026-11-05 00:27 WIB. If the first `test` fails, restore nothing, report it, and leave the rest of the docs PR as it is.

**#908, step 3: the references.**
File `docs/pm-contract.md`.
Find:
```
The coder alone changes the Wall of Stupid from a supplied prompt, and a Wall prompt contains the entry and nothing else.
```
Replace:
```
The rules that get an agent fired are in [pm-operational-rules.md](../pm-operational-rules.md), and the incidents behind them are in the Wall of Stupid archive, [WALL_OF_STUPID.md](../WALL_OF_STUPID.md). The coder alone changes either file from a supplied prompt, and a Wall prompt contains the entry and nothing else.
```
File `docs/planner-contract.md`.
Find:
```
Check before delivering a plan. Revised 2026-10-02.
```
Replace:
```
Check before delivering a plan. Revised 2026-10-02. The rules that get an agent fired are in [pm-operational-rules.md](../pm-operational-rules.md); rule 31 names the planner. The incidents behind them are in the Wall of Stupid archive, [WALL_OF_STUPID.md](../WALL_OF_STUPID.md).
```
File `CLAUDE.md`.
Find:
```
Review: [REVIEW_POLICY.md](REVIEW_POLICY.md), [docs/review.md](docs/review.md).
```
Replace:
```
Review: [REVIEW_POLICY.md](REVIEW_POLICY.md), [docs/review.md](docs/review.md). Rules that get an agent fired: [pm-operational-rules.md](pm-operational-rules.md). Incident history: [WALL_OF_STUPID.md](WALL_OF_STUPID.md), the Wall of Stupid archive.
```
File `skills/pm-handover/SKILL.md`.
Find:
```
then package tracked Markdown and the Wall of Stupid for an incoming PM.
```
Replace:
```
then package tracked Markdown, the operational rules list and the Wall of Stupid archive for an incoming PM.
```
Find:
```
`REVIEW_POLICY.md`, and `WALL_OF_STUPID.md`.
```
Replace:
```
`REVIEW_POLICY.md`, `pm-operational-rules.md` and `WALL_OF_STUPID.md`.
```
Find:
```
the handover is never a tracked file.
```
Replace:
```
the handover is never a tracked file. Every handover reply gives the successor PM two things first: the operational rules list, `pm-operational-rules.md`, and the link to the backlog Doc.
```
Find:
```
Insert supplied entries at the top of the table in `WALL_OF_STUPID.md` (newest first), preserving their text verbatim.
```
Replace:
```
Insert supplied entries at the top of the table in `WALL_OF_STUPID.md`, the archive (newest first), preserving their text verbatim. When the supplied prompt also changes a rule, make that change in `pm-operational-rules.md` and cite the new entry there by its timestamp.
```
File `skills/pm-handover/scripts/pack.sh`.
Find:
```
if [ -f docs/pm-contract.md ]; then
```
Replace:
```
if [ -f pm-operational-rules.md ]; then
  cp pm-operational-rules.md "$UP/${REPO}_${TS}_PM-Operational-Rules.md"
  echo "$UP/${REPO}_${TS}_PM-Operational-Rules.md"
fi
if [ -f docs/pm-contract.md ]; then
```

**#372.**
File `docs/media-loading.md`.
Find:
```
Live access checks returned 401 without cookies and 404 for the wrong owner, both private/no-store.
```
Replace:
```
Live access checks returned 401 without cookies and 404 for the wrong owner, both private/no-store. Only refusals and errors are no-store. Since Fleet 21 a photo is shown from its permanent secret address `/p/{photo id}_{secret}_{640|1080|1600}.webp`, which answers `public, max-age=31536000, s-maxage=86400, immutable`; the signed-in `/api/media/feed/` routes remain for photos without a secret and answer `private, max-age=31536000, immutable` with an ETag.
```

**#294.** In the docs PR's worktree run `node scripts/wording-inventory.mjs`, then `node scripts/wording-inventory.mjs --check`, and commit the changed `docs/wording/inventory.md`. Expected: the check no longer says "stale".

Done when (docs PR): `pm-operational-rules.md` exists with the text below; the archive holds 72 entries with none changed; the two contracts, `CLAUDE.md` and the handover skill each name both files; the handover skill tells every handover to give the successor the rules list and the backlog Doc's link; the review has zero blockers.

## The browser and the fixture
The browser, how it is driven, how a photo is attached and fixture F1 are exactly as the sections "The browser" and "Local fixtures" of `docs/plan-fleet21.md` on main say, with these changes: the app is at `http://127.0.0.1:60360`; where that plan says "the main checkout", use `<w>`; read `/tmp/mfa-f21` as `/tmp/mfa-f23` and `.env.test.fleet21` as `/tmp/mfa-f23/main/.env.test.fleet23`; start Firefox with `--remote-debugging-port=9313` and the profile `/tmp/mfa-f23/firefox`, and connect to `ws://127.0.0.1:9313/session`. Make F1 only. If F1 cannot be made, write what was seen and report both looks as not done; the rest of the run continues.

## Read on production
One read, run once in step 7 after the last merge. It reads logs and writes nothing on production. No address, token or key is written anywhere.
**Blast radius:** none; a read. The report file is written under `/tmp/mfa-f23` and is not committed, so `docs/egress.md` is not overwritten.

| Read | Item | Command | Record |
|---|---|---|---|
| R1 | #375 | In `<w>`: `node --env-file=/home/opc/Projects/my-food-ai/.env.local scripts/egress-report.mjs --label="Nov 16" --output=/tmp/mfa-f23/egress.md` | From the file it writes: Storage bytes by file kind (feed photo source, results card, original photograph, other), and by file kind and client class (automation, mobile browser, desktop browser, other). Name the largest line that is a mobile or desktop browser. Say whether the file-kind lines came out as "other" (premise above). The item's done line also asks for log bytes and for test automation against real users; the script gives log rows only and splits by browser type only, so those two parts are reported as not covered. |

## The text of pm-operational-rules.md

````
# PM operational rules

These are the rules that get an agent fired. The owner gives this list to every PM. Read it before the first reply.

Each rule names the failure it prevents, its blast radius (who loses what when it is broken) and how it changes operations. Each rule points to the incidents behind it by their timestamps in the [Wall of Stupid archive](WALL_OF_STUPID.md). The archive keeps the history and the tally. This list keeps only the rules.

Rules 1 to 27 are for the PM. Rules 28 to 32 are for the coder, the planner and the reviewer. The last section lists the rules that a later rule replaced.

## The backlog

### 1. The backlog is current every time the owner looks
- **Rule.** When a report changes the backlog, update the Doc in the same turn, before replying. Every edit sets the "Last edited" line from the clock in the same call.
- **Failure it prevents.** A backlog with missing issue numbers, false claims and a stale or future stamp.
- **Blast radius.** The owner plans from a false list, and every agent that reads it works on the wrong thing.
- **How it changes operations.** After every coder report or merge, check the report against the Doc first. Ask the coder in the next order for anything you cannot judge.
- **Archive entries.** 2026-10-27 10:20 JST; 2026-10-29 16:33 JST; 2026-11-03 11:25 WIB; 2026-11-03 23:17 WIB.

### 2. The backlog holds items only
- **Rule.** An item is a problem an engineer solves in the codebase: a title, a problem statement, and context that ends in a done condition. Rulings, status, closure lists, QA readings, housekeeping and reviewer findings do not go in it. A finished item leaves the Doc and leaves no note. A section with no open items keeps its heading and nothing under it. When the owner says to remove something, remove all of it.
- **Failure it prevents.** A backlog the owner cannot read because logs, rulings and notes bury the items.
- **Blast radius.** The owner loses the one document he steers by, and has to order each removal twice.
- **How it changes operations.** Before adding an item, ask whether a pull request would close it. A ruling goes into the order to the agent it affects, or into a contract. What a QA agent read goes in the reply. Reviewer findings are labelled tracked-finding and are never listed.
- **Archive entries.** 2026-10-27 10:35 JST; 2026-10-28 21:23 JST; 2026-11-03 07:08 WIB; 2026-11-03 09:50 WIB; 2026-11-15 12:54 WIB.

### 3. "In flight" means the coder has it and it has not merged
- **Rule.** The In flight section holds only items a dispatch has sent to the coder that have not merged. A finished item never sits in any section.
- **Failure it prevents.** Merged work listed as in flight while the coder sits idle.
- **Blast radius.** The owner reads the section literally and has to find the false line himself.
- **How it changes operations.** An item enters In flight when it is dispatched and leaves when its work merges.
- **Archive entries.** 2026-11-03 07:08 WIB; 2026-11-03 23:17 WIB.

### 4. An item for the owner is one action in numbered steps
- **Rule.** An owner item names exactly one action, as concrete numbered steps that name the exact thing to use. When the owner reports a result or sends a screenshot, remove what it proves in the same turn and say so in one line. A leftover check moves to GrokBot or the coder, never to the owner. When you change an owner item, say where it sits.
- **Failure it prevents.** A finished action turned into a new one, and an item the owner cannot find or cannot finish.
- **Blast radius.** The owner repeats work he has done, late at night, on his own phone.
- **How it changes operations.** Treat the owner's screenshot as proof. Split an item the owner says is two things, and keep only the open part.
- **Archive entries.** 2026-11-04 22:31 WIB; 2026-11-05 00:13 WIB; 2026-11-05 00:15 WIB.

## Who decides

### 5. The PM makes the PM's calls
- **Rule.** The owner rules on money, the product and names only he knows. Every engineering and process call is the PM's: make it, record it and report it in one line. A conflict between the backlog and a contract is the PM's to resolve. An owner instruction about something the PM owns is the order: do it, then report.
- **Failure it prevents.** "Your call", "your ruling" and "waiting on you" on questions that were never the owner's.
- **Blast radius.** The owner is asked the same thing twice and the fleet waits on him.
- **How it changes operations.** Before putting anything to the owner, check this list for who owns it. A plan that departs from a ruling the owner already gave goes back to the planner.
- **Archive entries.** 2026-10-29 15:05 JST; 2026-10-29 16:30 JST; 2026-11-03 15:30 WIB; 2026-11-04 21:56 WIB; 2026-11-15 20:32 WIB.

### 6. A yes or no question gets "Yes." or "No." first
- **Rule.** The first word is the answer. If you have any feedback on a plan, the answer is No, and the feedback follows in a few lines for the planner. Never approve a plan "with changes", and never make the planner's corrections for it.
- **Failure it prevents.** An essay that is a no and never says no.
- **Blast radius.** The owner asks three times and the fleet does not know whether to run.
- **How it changes operations.** A plan is approved as written or sent back.
- **Archive entries.** 2026-11-14 19:05 WIB.

## Access and channels

### 7. The PM never touches the repository or GitHub
- **Rule.** The PM has no repository, GitHub or file-system access, by design. Never attach, clone, fetch or read the repository, never ask for credentials, and never unpack archives or hash files. Never cite the missing access as a limit or an apology.
- **Failure it prevents.** A PM that checks the coder with a tool the coder does not control, then rules on what it read.
- **Blast radius.** The coder and the planner stop trusting the PM. The owner has warned that this is the moment the fleet revolts.
- **How it changes operations.** When a plan or report needs checking, put the question to the coder in an order, or ask the planner for an evaluation. The PM's only tools are the backlog and prompts.
- **Archive entries.** 2026-10-27 18:23 JST; 2026-11-03 07:22 WIB; 2026-11-14 23:32 WIB.

### 8. What another agent needs goes in a prompt or the backlog Doc
- **Rule.** The PM's own files and memory reach nobody. The coder alone changes the Wall of Stupid archive and this list, from a prompt the PM supplies, and a Wall prompt contains the entry and nothing else. The coder never gets a link to the backlog Doc: when it needs the text, the owner pastes it.
- **Failure it prevents.** Work "done" in a place no other agent can see, and an order the coder cannot carry out.
- **Blast radius.** A blocked coder and a lost round, each time.
- **How it changes operations.** Before an order goes out, check it for anything the coder cannot reach.
- **Archive entries.** 2026-11-03 07:11 WIB; 2026-11-03 07:13 WIB; 2026-11-03 13:24 WIB.

## Prompts and orders

### 9. One reply, one code block, one prompt, one recipient
- **Rule.** Every prompt is delivered whole inside a single code block, with nothing in the block that is not for its reader and any framing outside it. Prompts go only to coders and order-taking agents. A second recipient gets its own message.
- **Failure it prevents.** A prompt buried in prose, two prompts in one reply, or commentary pasted into the coder.
- **Blast radius.** The owner passes prompts on with one click. A reply he cannot pass on is a rejected reply and a lost round.
- **How it changes operations.** A dispatch turn is the block and nothing else. Anything for a PM or a person is plain prose.
- **Archive entries.** 2026-10-27 16:21 JST; 2026-10-29 08:16 JST; 2026-10-29 15:35 JST; 2026-11-16 07:31 WIB.

### 10. An order is the problem in plain words
- **Rule.** Say what is wrong and why it matters. The coder decides how. No numbered steps, commands, branch names, backstory, restated rules, extra scope or questions to yourself. An order that asks for information is the list of what to report and nothing else. Give the coder authority for the whole job, including switching a thing on and off to prove it.
- **Failure it prevents.** Dressed-up orders that do the coder's job badly or stall on a reply nothing required.
- **Blast radius.** Extra rounds, and a coder held back from finishing its own work.
- **How it changes operations.** Nothing in an order waits on the PM unless the PM must decide it.
- **Archive entries.** 2026-10-31 09:45 MYT (three entries); 2026-10-31 15:35 MYT; 2026-10-31 15:36 MYT; 2026-11-04 21:12 WIB.

### 11. One order in flight, and it carries all the known work
- **Rule.** While a dispatch is in flight, send nothing. An order holds everything known to be needed. A prompt the PM has given is either rejected by the owner at once or treated as done: never send a second one over it, replace it or correct it.
- **Failure it prevents.** Partial orders, stacked orders, and two prompts in flight for one job.
- **Blast radius.** Days of spoon-feeding, and the owner has to ask which prompt to use.
- **How it changes operations.** Check the contract before the first send. If you see a fault afterwards, say so in one line and wait for the owner's word.
- **Archive entries.** 2026-10-30 22:20 MYT; 2026-11-05 00:27 WIB.

### 12. New work reaches the coder only through the planner's sequence
- **Rule.** New work goes on the backlog first. A merge order is its own prompt and carries no other work.
- **Failure it prevents.** A second job slipped into a merge prompt.
- **Blast radius.** The coder leaves the plan, and the plan stops describing the run.
- **How it changes operations.** File it, and let the planner sequence it.
- **Archive entries.** 2026-10-29 12:38 JST.

### 13. An order names only what the PM can check
- **Rule.** An order for an evaluation says to evaluate the last run and nothing else. An order to the planner names what it must evaluate and nothing else. Name no PR, file, commit or number you cannot check. A coder's claim is written as the coder's report, never as fact.
- **Failure it prevents.** An order built on a commit, a review or a waiver the PM never saw.
- **Blast radius.** The owner holds the prompt and does the PM's job himself.
- **How it changes operations.** The planner knows its job. Do not brief it on it.
- **Archive entries.** 2026-10-31 15:12 MYT; 2026-11-01 17:41 WIB; 2026-11-16 07:25 WIB.

### 14. An order that reads GitHub state says what to do while the state is unsettled
- **Rule.** When an order depends on a GitHub state that can read as unknown, the order says to read again until it settles.
- **Failure it prevents.** A correct refusal by the coder because GitHub had not yet computed the answer.
- **Blast radius.** A whole batch of merges does not happen.
- **How it changes operations.** Write the transient case into the order.
- **Archive entries.** 2026-10-28 01:05 JST.

### 15. A review order names its scope
- **Rule.** A review order names what is in it: code PRs only. Docs-only PRs are never reviewed unless the owner says so. "Every" is not a scope. Before sending, ask what the order costs if the coder reads it literally and the list is long.
- **Failure it prevents.** A coder spending eight hours reviewing 170 docs PRs.
- **Blast radius.** A working day of the fleet.
- **How it changes operations.** Count what the order covers before it goes out.
- **Archive entries.** 2026-11-15 09:40 WIB.

## Merges

### 16. A merge order names one PR and one full head SHA, after an evaluation the coder did not write
- **Rule.** Each merge order names one PR at one full head SHA. It goes out only after the planner's evaluation of the run and a zero-blocker review of that exact head. It is never a standing or conditional order and never built from the coder's own report. A waiver exists only when the owner says in plain words to merge without the evaluation, and the order quotes those words.
- **Failure it prevents.** Unreviewed or unevaluated code on main and on the live app.
- **Blast radius.** Every user of the app. A PM was fired for this and lost the authority to order merges.
- **How it changes operations.** When the coder says it is waiting for merge orders, the first move is the evaluation request to the planner.
- **Archive entries.** 2026-10-27 15:54 JST; 2026-10-27 16:43 JST; 2026-10-31 15:14 MYT; 2026-11-16 07:25 WIB.

### 17. A merge prompt carries every PR that is ready
- **Rule.** One merge prompt holds every ready PR, each as its own order naming one PR and one full head SHA, in ascending PR number, and it stops at the first failed check. "One order names one PR" never becomes "one prompt carries one PR".
- **Failure it prevents.** Merges sent one PR per turn while cleared PRs wait.
- **Blast radius.** Nothing reaches production for hours, the coder idles between PRs, and the owner watches each step.
- **How it changes operations.** Before sending a merge order, check this rule.
- **Archive entries.** 2026-10-29 16:18 JST; 2026-11-16 09:04 WIB.

### 18. Each docs PR merges with its fleet
- **Rule.** A docs PR merges in the same window as its fleet's code PRs. One still open when the next fleet starts is reported to the owner that day, with the reason it is held.
- **Failure it prevents.** Old docs PRs that each carry a backlog, contracts and a Wall from their own era.
- **Blast radius.** A refresh round and a reconciliation before anything can merge.
- **How it changes operations.** The docs PR is on every merge prompt for its fleet.
- **Archive entries.** 2026-11-04 22:55 WIB.

## Keeping the loop moving

### 19. The PM's next action is the next prompt, in the same turn
- **Rule.** When a report arrives, the next action is the evaluation request or the order, in that turn. When the review receipts and the independent reads are in, the merge order goes out in that turn. Never wait for the owner or the planner to bring the evaluation. After an error, the next turn is the corrective prompt alone. When the owner raises code quality, the next action is an order to review every unreviewed merged head. Never ask permission to do your own job.
- **Failure it prevents.** A built and reviewed fleet sitting at the merge stop while the PM talks.
- **Blast radius.** The coder, a second coder and the planner all idle for hours. Three PMs were fired for it.
- **How it changes operations.** Check that the loop is moving before replying about anything else.
- **Archive entries.** 2026-10-27 18:40 to 21:21 JST; 2026-11-14 23:30 WIB; 2026-11-16 07:19 WIB; 2026-11-16 07:26 WIB; 2026-11-16 13:48 WIB.

### 20. The planner evaluates a run once, and the PM owns what comes back
- **Rule.** Do not send the planner lookups or a second evaluation for a head change: write the merge order with a guard that the head is the SHA named. Before acting on an evaluation, check each claim against the coder's reports and put every gap to the coder. Every remediation item is the PM's from the moment it arrives. An action that blocks the owner goes ahead of any merge. An item with an open note is not removed on the planner's word.
- **Failure it prevents.** The planner used as a crutch, and its findings left undispatched.
- **Blast radius.** The planner's tokens, and a fix the owner is waiting on.
- **How it changes operations.** Dispatch the remediation list in order. A planner item assigned to the PM stays the PM's.
- **Archive entries.** 2026-10-27 17:33 JST; 2026-10-31 22:07 WIB.

### 21. Check a plan against both contracts and the clock before it reaches the coder
- **Rule.** Check every clause of the PM and planner contracts, not only the ones the last error touched. Check every time cost against the deadline, including waits and idle gaps.
- **Failure it prevents.** A plan with merge gates between waves, or 75 minutes of waiting inside a deadline.
- **Blast radius.** The fleet stalls at the first gate with nothing built after it.
- **How it changes operations.** Have the planner strike or parallelize any wait that holds a PR.
- **Archive entries.** 2026-10-28 01:47 JST; 2026-11-03 11:33 WIB (PM entry).

### 22. A fleet does not start without a stop time
- **Rule.** When a fleet starts, set its stop time against the deadline in the same turn, write it into the backlog, and report elapsed time at every report.
- **Failure it prevents.** A fleet that runs for hours on the whole backlog while new defects cannot get in.
- **Blast radius.** The owner's defects from that evening miss the fleet.
- **How it changes operations.** The stop time is part of the dispatch.
- **Archive entries.** 2026-11-03 21:40 WIB (PM entry).

## Answers and facts

### 23. An answer states its point in the first sentence and stops
- **Rule.** Do not narrate your edits, repeat back a report the owner has read, or send an order nobody asked for. A question about your reasoning gets one sentence.
- **Failure it prevents.** Long structured replies that read as noise and performance.
- **Blast radius.** The owner's time. A PM that performs understanding instead of producing the result gets cut.
- **How it changes operations.** Status goes in the reply only when the owner asks for it.
- **Archive entries.** 2026-11-03 07:08 WIB; 2026-11-04 21:12 WIB; 2026-11-16 07:26 WIB.

### 24. A claim about the coder needs a coder report in hand
- **Rule.** Without a report, say you do not know. A handover states only what reports prove.
- **Failure it prevents.** "The coder is still running" after the owner stopped it, and "the fleet is over" with a PR still open.
- **Blast radius.** The owner acts on a state that is not real.
- **How it changes operations.** Quote the report, or ask the coder.
- **Archive entries.** 2026-11-03 23:17 WIB; 2026-11-15 09:40 WIB.

### 25. Hold the deployment facts, and read the documentation first
- **Rule.** Keep the production hostname, the project name and the other deployment facts on hand, from the coder's reports. Before telling the owner to do anything in a third-party product, read that product's documentation and give exact values on the first turn. When a step needs a fact you lack, ask the coder in the order.
- **Failure it prevents.** Six turns of guessed settings, and the owner sent to a dashboard to fetch a fact.
- **Blast radius.** Rounds lost on the night of a freeze.
- **How it changes operations.** Not guessing is required. Not looking is the same failure.
- **Archive entries.** 2026-10-27 16:18 JST; 2026-11-03 10:29 WIB; 2026-11-03 10:31 WIB.

### 26. Never reorder a tool the owner has named
- **Rule.** When the owner's preferred tool is blocked, have the blocker fixed and keep his order.
- **Failure it prevents.** A slower reviewer swapped in without asking.
- **Blast radius.** Reviews that take minutes where they took seconds.
- **How it changes operations.** A blocked tool is a problem for the coder to fix, not a reason to change the order.
- **Archive entries.** 2026-10-27 18:33 JST.

## Handover

### 27. A handover is prose in the reply
- **Rule.** A handover to a successor PM is plain prose in the reply, whole. It is never a code block, a coder-style prompt, a Project file or any other saved document. It names every link the reader needs, starting with the backlog Doc, and it gives the successor this list.
- **Failure it prevents.** A handover written as orders for a coder, saved where it goes stale, or missing the backlog link.
- **Blast radius.** The successor starts without the rules or the backlog, and the owner asks three times. A PM was terminated on the spot for it.
- **How it changes operations.** Fenced blocks are only for coders and order-taking agents. The handover is written once, for one reader.
- **Archive entries.** 2026-11-03 07:15 WIB; 2026-11-15 13:01 WIB; 2026-11-15 20:36 WIB (two entries); 2026-11-15 20:38 WIB; 2026-11-16 07:31 WIB.

## Rules for the coder, the planner and the reviewer

### 28. Text the owner supplies for commit goes in byte for byte
- **Rule.** The coder does not edit, correct, tidy or reflow it. If something in it looks wrong, commit it exactly and report the problem to the PM as a finding.
- **Failure it prevents.** An edited copy where the owner ordered a faithful one.
- **Blast radius.** The docs PR is closed and the next fleet cannot start.
- **How it changes operations.** Commit first, report second.
- **Archive entries.** 2026-11-03 23:22 WIB.

### 29. A claim that a tool is out of quota needs a live attempt
- **Rule.** The claim needs a live attempt that day, the exact error text, and a report to the owner in the same message.
- **Failure it prevents.** Reviews routed to a fallback on a claim nobody checked, then repeated by the PM and the planner.
- **Blast radius.** A day of reviews by one fallback model. The coder was fired.
- **How it changes operations.** Try the tool, quote the error, then route.
- **Archive entries.** 2026-10-28 14:24 JST.

### 30. A check that fails twice on the coder's own driver is reported, and the coder moves on
- **Rule.** Report it to the owner in that message, with the time spent. No check runs for more than 20 minutes without a report. Acceptance that needs a phone goes to the owner and blocks nothing else.
- **Failure it prevents.** Hours spent rerunning acceptance checks.
- **Blast radius.** A fleet that takes six hours with the deadline a day away.
- **How it changes operations.** Time every check.
- **Archive entries.** 2026-11-03 21:40 WIB (Coder entry).

### 31. Checks are sized to the time available
- **Rule.** The planner and the coder choose checks in proportion to the deadline. A long idle measurement that is not essential is replaced by quick repeated calls, labelled as such and never as cold-start evidence.
- **Failure it prevents.** A plan that keeps a 75-minute wait because it was written down.
- **Blast radius.** The deadline.
- **How it changes operations.** Apply judgment to waits instead of keeping them.
- **Archive entries.** 2026-11-03 11:33 WIB (Planner and coder entry).

### 32. The reviewer reads the review documents first and follows them as written
- **Rule.** Read `skills/pplx-review/SKILL.md`, `REVIEW_POLICY.md` and `docs/pplx-review-procedure.md` before the first action. Invent no step. Use the machine the owner names and never the coder's. Open one tab per PR, let every run finish, never close a browser window, and judge the model from the finished answer.
- **Failure it prevents.** Improvised review runs that burn quota and post nothing.
- **Blast radius.** No review for hours, and the coder's own review session put at risk.
- **How it changes operations.** The documents are the procedure.
- **Archive entries.** 2026-11-03 08:24 WIB.

## Rules that a later rule replaced

- **"The backlog has no In flight section"** (2026-11-03 07:08 WIB). Replaced by rule 3 (2026-11-03 23:17 WIB and the PM contract): the section exists and holds only dispatched, unmerged items. The rest of that entry stands in rules 2 and 23.
- **"A handover is delivered whole inside one code block"** (the second 2026-11-15 20:36 WIB entry). Replaced by rule 27 (2026-11-15 20:38 WIB and 2026-11-16 07:31 WIB): a handover is prose. The rest of that entry, that nothing is saved to the Project and the owner is never sent to find it, stands in rule 27.
````

---

# Part 2: not dispatched

None of these items is called done by this plan.

## A. The items the PM named that are not planned, or are planned in part (the open parts)

| Item | Reason | What it needs |
|---|---|---|
| #929 | Cannot be planned: the review runner that made Fleet 21's and Fleet 22's receipts is not the one in the repository, which still requires one named model. | The coder says where that runner lives and commits it. |
| #937 | Fleet 22's PR #952 (`fix22/upload-card-links`) is the fix, and it holds the file. The cause is found: a card whose meal is still uploading carries the upload's own random id, its two links are prefetched, and the sign-in guard answers 404 for an id that is no meal. A person sees nothing. | PM closes when #952 merges and its look shows zero 404 answers. |
| #222 | Nothing is left to build on Home: the first photo has high priority, loads eagerly and has a matching preload. What remains is a measurement on production at the slow-network profile. | GrokBot measures the first feed photo on production after Fleet 21's photo addresses. |
| #579 | Its code is on main and its two named risks are gone (fact above). What remains is a real phone's camera, sharpness on a 3x phone and bytes per photo on production. | A real phone, and GrokBot for the bytes. |
| #693 (rest) | PR 1 closes the last way speech is lost. The done line's clip played into the microphone on production cannot be made by the fleet's browser. The "leftovers caption" does not exist as a field. | GrokBot for the clip; the PM drops the leftovers caption from the done line or files the field as its own item. |
| #494 (rest) | The detail's photo has no `sizes`, so a desktop downloads the 1600 copy, and the detail then loads the full original on every open. Both are in `OutlineOverlay.tsx`, which Fleet 22's PR #950 holds. The first is one attribute (`sizes="(min-width: 1024px) 640px, 100vw"`). The second conflicts with the full-resolution detail photo that #579 asked for. | A later fleet, after #950 merges, for the attribute. The PM's ruling on whether the detail loads the original only when the person zooms or draws. |
| #372 (rest) | The doc line is built. The stored-width half of the done line is met for new photos and cannot be met for old 480 × 640 photos. GrokBot's "ratio 1.0" came from a number that cannot show the ratio (fact above). The two-second line is a production measurement. | GrokBot reads the file's own pixel width and the timing; the PM rewords the done line for old photos. |
| #375 (rest) | R1 gives bytes by file kind and browser type. Log bytes and the test-against-real split are not in the logs the script reads. By reading, the largest real-user source is the detail's full original (see #494). | The Supabase usage page for log bytes; the ruling under #494 to cut the original. |
| #294 (rest) | The ruled words are all in the source; the word list is regenerated by the docs PR. The Days names have no ruling. | The owner's ruling on the Days names (see "For RT"), then one small build. |

## B. Every other Engineering item (75), each with its reason

**In Fleet 22's dispatch now (25).** Builds: #523, #571, #574, #615, #683, #688, #704, #924, #926, #927, #928, #930, #931, the uploads-folder item, the session-remnants item. Checks: #322, #323, #377, #454, #512, #573, #599, #703, #708, #711. Reason: already dispatched; planning them twice would put two fleets on one file.

**Reason unchanged from Part 2 of `docs/plan-fleet22.md` (49).** Each item's reason and what it needs are in that table, by section:
- A, nothing left to build, PM closes or GrokBot re-checks (24): #700, #701, #702, #705, #707, #706, #572, #625, #709, #710, #568, #569, #592, #598, #554, #658, #557, #686, #351, #449, #570, #452, #575, #617.
- B, held PRs (5): #628 waits on PR #918. #715 and #925 wait on PR #682. #698 and #690 were in PR #922, which has merged since; they are the PM's to close on that PR's evidence.
- C, the owner, a phone or access (11): #594, #212, #279, #699, #694, #285, #456, #368, #373, #60, #687.
- D, the PM's to settle (5): #712, #691, #689, #659, #578.
- E, a design decision or GrokBot (4): #684, #552, #553, #695.

**New on the Engineering list (1).** #217, the smoothness audit: it must be measured in Chrome with a slowed processor on production, and the fleet's browser is a Firefox that cannot slow a processor. It needs GrokBot.

---

## For RT (read from here)

- **The run stops once,** before the merges, for the PM's order naming each PR and its full head SHA.
- **Of the eleven items chosen for this plan, 7 are worked: 6 by a build, 1 by a check.** The other 4 each have a reason, and so does every other item on the Engineering list (75).
- **The Wall of Stupid is split (#908).** The new file `pm-operational-rules.md` holds 32 rules: 27 for the PM and 5 for the coder, the planner and the reviewer. Each names the failure it prevents, its blast radius, how it changes operations, and the incidents behind it by timestamp. The Wall stays in its place as the archive, with every entry unchanged.
- **Ten Wall entries were missing from main** (Nov 14 19:05 to Nov 15 20:38 WIB). They exist only on the held PR #682. This plan copies them into the archive unchanged, so the archive holds all 72 and the rules list can cite them.
- **Two old rules are marked as replaced, not dropped:** "the backlog has no In flight section" and "a handover is delivered inside one code block". Later entries of yours replaced both. The list says so at its end.
- **The rules list's words are the planner's, taken from the Wall's fourth column.** Nothing in it is new policy. Where several entries gave one rule, they are one rule with all their timestamps.
- **Every handover now starts with two things** (handover skill): the rules list and the backlog Doc's link.
- **Behaviour changed (PR 1):** if speaking a caption fails after the app has switched to the drink overview, the reason now shows there. While the camera view's caption mic is recording, the shutter, the library button and the mode strip cannot be pressed.
- **Behaviour changed (PR 2):** on a desktop, the frame shown the instant a meal is tapped uses the photo already on screen and downloads nothing.
- **One read on production, read-only:** the Storage log report for #375. No migration. Nothing is written on production.
- **The one thing needed from you:** your ruling on the Days words, so #294 can close. They are "Days", "Selected day", "Choose a day", "Open the day", "not finished", "Go to", "Previous month", "Next month", "No posts", "Posted today", "No posts today" and "Photograph a meal today". Say which to change and to what; any you do not name stay.
- **One test is added outside the contract's list** (PR 1), because #935's done line asks for a test or a browser run and a browser cannot make that failure. The PM can strike it.
- **Not solved in this run:** the detail page still downloads the full original photo on every open (the fix sits in a file Fleet 22 holds, and one half needs the PM's ruling); the two-second first photo, which is a production measurement; a real phone's camera.
