# Fleet 22 plan

Planner: Fable 5.2, planner seat. Nov 16 2026 (WIB). All code read on `origin/main` = `5aaded91288f9c939c855faea4c734ee7440e8ff` on Nov 16.
On Nov 16 the planner applied every code edit in Part 1 to a scratch copy of main outside the repository and ran, on that copy and on unmodified main: `npx tsc --noEmit`, `npx eslint`, and the fourteen test files the edits touch or sit beside. The results are in the Facts table. The planner did not run the whole suite, a build, a browser or anything on production. Nothing was written to the repository or to GitHub.

**Stops: one.** One dispatch, one prompt. The run builds, reviews, tests, looks at every changed page and makes the local checks without stopping. It then stops once, before the merges: the coder posts each PR number with its full head SHA and waits for the PM's merge order naming them. After the order the run goes to its end without another stop.

**Halts.** The only legal halts are: a review tool is unavailable when the review is reached; a fact this plan states turns out false; an operation would contact a customer or breach an explicit prohibition. A halt stops only its own item. Every independent item continues.

**When done, stop.** Done means every numbered item in Part 1 is reported done or not done. After that the coder opens no new PR, makes no new reading and no new fix. A defect found during the run is reported to the PM for the backlog and is not fixed in this run.

**Size.** The Engineering backlog (the owner's Doc, rev 1916, read from the PM's copy on Nov 16) holds 76 items. This dispatch works **25**: 15 by a build with exact text and 10 by a check with exact steps. The other **51** each have a stated reason in Part 2. Twelve more are left out on the PM's instruction with the reason "waiting on owner ruling": the five held PRs and the seven carried items (Part 2 F). The Backlog for Designer and Interdit sections are not planned, on the PM's instruction.

Each item number appears in one part only. Part 1: 25. Part 2: 51 (A 24, B 5, C 12, D 6, E 4), then the 12 of section F.

---

# Part 1: the dispatch (25 items)

Builds (15): #523 (part), #571 (part), #574, #615 (part), #683 (part), #688, #704, #924, #926, #927, #928, #930, #931, the uploads-folder item, the session-remnants item.
Checks (10): #322, #323, #377, #454, #512, #573, #599, #703, #708, #711.

In this plan, `<main>` means the main checkout, `/home/opc/Projects/my-food-ai`, and `<w>` means `/tmp/mfa-f22/main`, a worktree of `origin/main` that step 5a makes and step 8 removes.

## How it runs

1. **Cleanup first.** Run `git worktree list`. If it lists anything but the main checkout, remove it with `git worktree remove --force <path>`, then `git worktree prune`. The main checkout sits on a docs branch with one uncommitted change to `docs/pm-contract.md` (fact below). Do not commit, stash or discard that change. Every branch of this run is made in a fresh worktree from `origin/main`, so the change is never touched.
2. **Build.** Each PR below in its own fresh worktree branched from `origin/main`. Nothing is stacked. No PR depends on another. No two touch the same file. There are 7 code PRs and one docs PR.
3. After each push: open the PR, then remove that worktree and delete its local branch.
4. **Reviews** run in a sub-agent beside the build, never before it. One external reviewer per PR: **PPLX** (`skills/pplx-review/SKILL.md`), one pass per head, run to zero blockers; PPLX then confirms the fixes only. If PPLX cannot run for a PR, use AGY (`skills/agy-review/SKILL.md`) for that PR. Codex does not review these PRs, because the code is written by an OpenAI model. If neither PPLX nor AGY can run, that PR halts and the others continue. The docs PR is reviewed the same way, as the PM ordered for this plan.
5. **At the very end, in this order.**
   a. Once: `mkdir -p /tmp/mfa-f22 && git -C <main> worktree add --detach /tmp/mfa-f22/main origin/main`. In `<w>`: `npm ci`, then `TEST_STACK_DIR=/tmp/mfa-f22/stack TEST_ENV_FILE=.env.test.fleet22 npm run test:stack`. The stack is made from `<w>` and not from `<main>`, because `<main>` sits on a docs branch and the stack reads its migrations from the checkout it is run in. The paths are short on purpose (PostgreSQL's socket path fails when it is long). The stack's keys expire 24 hours after this command, so steps 5 and 6 finish within 24 hours of it.
   b. **Main's own result (check K1, #711).** In `<w>`: `npm run lint`; `npx tsc --noEmit`; then with `TEST_ENV_FILE=.env.test.fleet22` set: `npm run test:app -- build`, `npm run test:app -- start` in the background, `MFA_TEST_DISPOSABLE=1 npm test`, `MFA_TEST_DISPOSABLE=1 npm run test:db`; stop the app. Write down the four results: lint errors and warnings, type check, the suite's tests, passes, failures and skips, and the database suite's.
   c. **Build and test each code PR.** For each code PR branch, in a temporary worktree, `npm ci`, then the same commands as step 5b except `test:db`, with `TEST_ENV_FILE=/tmp/mfa-f22/main/.env.test.fleet22`. Keep the worktree and its build for step 5f. PRs 2 and 4 change no page; their worktrees are removed now.
   d. **What counts as a pass.** A PR passes lint when it reports no error that main does not report in step 5b. A PR passes the tests when every test that fails on its branch also fails on main in step 5b. PR 1's new test and PR 2's new test must pass on their branches.
   e. **The seed and the fixtures.** In `<w>`, on the build step 5b made: `TEST_ENV_FILE=.env.test.fleet22 npm run test:app -- start` in the background. Run the seed. Start the browser, sign in, and make fixtures F1 and F4, then F7 to F9 (section "The browser and the fixtures"). Stop the app.
   f. **The page looks** (PRs 1, 3, 5, 6 and 7). For each, in its worktree from step 5c: start its app in the background, do the look in the browser, stop the app, remove the worktree.
   g. **The local checks** K2 to K7, once, in `<w>`, with its app started as in step 5e. Then stop that app.
   h. **The one stop.** Post one comment on each PR: its number, its full head SHA, its review result, its test result and its page-look result. Wait for the PM's merge order.
6. **The page look**: open that PR's own build (`http://127.0.0.1:60260`) in the browser at 390 × 844 and, where the PR says so, at 1280 × 900, signed in as local test user 2. Write what was seen against the PR's "Look" line as one comment on the PR. Store no image. Do not use Playwright.
7. **Merges.** Merge in ascending PR number, each only at the head SHA the order names. This plan has no migration. Delete each remote branch after its merge. The docs PR is not merged unless the order names it. After the last merge is deployed, run the reads R1 to R5 (section "Reads on production") and write each result in the final report.
8. **End state.** Stop the browser and remove its profile and the driver script. In `<w>`: `TEST_STACK_DIR=/tmp/mfa-f22/stack TEST_ENV_FILE=.env.test.fleet22 npm run test:stack -- down`. Then `git -C <main> worktree remove --force /tmp/mfa-f22/main` and `rm -rf /tmp/mfa-f22`. Run `scripts/cleanup.sh`. `git worktree list` shows only the main checkout; `podman ps` shows no `mfa-test-` container; no process started by this run is left. Paste the three outputs in the final report.
9. **Final report:** the 25 item numbers, each done or not done, and for each check what was seen, with the numbers. Every defect found, as one line each, for the PM.
10. **New tests: two.** One in PR 1 (a stored nutrition value is never negative: a data rule). One in PR 2 (the two Days counts use one rule: a data rule). No other PR adds a test.

## Facts (planner checked on Nov 16 2026; the coder does not re-check)

| Fact | Check |
|---|---|
| `origin/main` is `5aaded91` (merge of #915). Open PRs: #682, #918, #922, #932, #933, #934. | `git log origin/main -1`; `gh pr list --state all --limit 40` |
| The main checkout is on branch `docs/muse-readiness-pm-pack` with one uncommitted change, in `docs/pm-contract.md`. `git worktree list` shows only the main checkout. | `git status --short`; `git worktree list` |
| Every "Find" text in Part 1 occurs exactly once in its file on `origin/main`. | a script counted each with Python's `str.count` on a copy made by `git archive origin/main` |
| With every code edit of Part 1 applied to a copy of main, `npx tsc --noEmit` reports nothing. Unmodified main also reports nothing. | both run on scratch copies |
| `npx eslint` reports 3 errors and 14 warnings on unmodified main and the same 3 and 14 on the edited copy. One of the 3 is `react-hooks/set-state-in-effect` in `OutlineOverlay.tsx`; PR 3 moves it from line 72 to line 73 and adds none. | both run on scratch copies |
| These fourteen test files pass on unmodified main (58 tests) and on the edited copy with the two new tests (60 tests): `nutrition-scaling`, `days-summary`, `local-time`, `feed-cache-lifecycle`, `feed-removal`, `needs-input-batch`, `save-meal-readiness`, `sharp-image-identity`, `card-polling`, `nutrition-totals`, `days-range`, `home-day-totals`, `unknown-meal-totals`, `feed-unavailable-retry`. | `MFA_TEST_DISPOSABLE=1 node --import tsx --test --test-concurrency=1 tests/<file>` for each, on both copies; these files need no stack |
| `tests/local-time.test.mjs` on unmodified main passes 4 of 4 under `LANG=en_US.UTF-8` and `en_CA.UTF-8`, and fails 3 of 4 under `en_AU.UTF-8` and `en_GB.UTF-8`. With PR 4 it passes 4 of 4 under all four. So three tests change with the machine's language, not two. | `LANG=<x> LC_ALL=<x> node --import tsx --test tests/local-time.test.mjs`, eight runs |
| The three calls in `src/lib/time/local.ts` pass `undefined` as the locale. Every other call in `src/` whose output a test reads already names `'en'` or `'en-US'`. | `src/lib/time/local.ts` lines 5, 6, 11; `grep -rn "toLocale\|Intl\." src` |
| The meal detail's notice "Known nutrition shown. Nutrition unavailable: …" is raised by any of seven values, fibre, sugar and sodium included. Every other screen uses the four main values (calories, protein, carbs, fat), the default of `unavailableFoods`. The rows for fibre, sugar and sodium still name the foods that lack them. | `src/components/NutritionTable.tsx` lines 15 and 19; `src/lib/nutrition/totals.ts` line 83 |
| No code subtracts carbs. A negative carbs value comes from the USDA value "Carbohydrate, by difference" (nutrient 1005), which can be slightly below zero and is multiplied by the portion without a floor. A model estimate is already held at zero or above. | `src/lib/fdc/nutrients.ts` line 183; `src/lib/fdc/estimate.ts` lines 13, 33 |
| The calendar cell's count (`getMonthSummary`) and the day summary's count (`getDays`) apply the same rule today, written twice: a meal with status `ready` is a post, and a `queued`, `processing` or `needs_input` meal is "not finished". | `src/lib/posts/days.ts` lines 40–114 and 223–266 |
| The meal detail trusts a saved photo link without loading it when the page is opened by a reload: the server sends the small photo, React keeps it, and the saved link is never requested, so its failure is never seen and the entry stays. On an open from the feed the existing error handler already removes a link that fails. | `src/components/OutlineOverlay.tsx` lines 69–95; Fleet 21 check K4 saw the entry survive a reload |
| A meal that is still uploading is drawn as a card whose id is the upload's own random id, not a meal's. Its two links (`/posts/<id>?reply=1` and `/posts/<id>`) are prefetched by Next, and the sign-in guard answers 404 for an id that is no meal. These are the 16 not-found answers Fleet 21 saw. They do not explain "The meal could not be saved." | `src/components/Feed.tsx` line 483; `src/components/PostCard.tsx` line 93; `src/components/PostActions.tsx`; `src/middleware.ts` lines 41–45 |
| Saving a finished meal that holds no food is refused by the database with error code `22023`, and the app then says only "The meal could not be saved." | `src/lib/posts/saved.ts` line 36 |
| The Home question strip lists the signed-in user's meals whose status is `needs_input` or whose `question` column is set. One row whose stored question cannot be read throws, and the whole strip then shows nothing until its next read 60 seconds later. | `src/components/NeedsInputStrip.tsx` lines 45–49; `src/lib/pipeline/needs-input.ts` line 4 |
| A meal that keeps its place in the feed with a question beside it (the #615 state) is a `ready` meal with `question` set and `needs_input` empty. Fleet 21's fixture F5 set `status='needs_input'`, which is the other state: the meal leaves the feed. | migrations `0056` and `0059`; `src/lib/posts/feed.ts` lines 108, 305, 337 |
| Home's server page sends the newest 6 meals. Any `router.refresh()` hands the feed a new first page, and the feed then drops every older meal it had loaded, so the page shortens and the scroll position jumps. `router.refresh()` runs every 60 seconds, on return to the tab, and when a meal settles. Older pages themselves are appended below and move nothing. | `src/components/Feed.tsx` lines 103, 320, 336–347, 462; `src/components/PostReadinessListener.tsx` line 79 |
| A GET to `/api/jobs/tick` writes nothing when no job is queued and none is running: it makes three count-only reads and returns. When a job is queued or running it tries to take the worker lease, and if it gets it, starts a drain. | `src/lib/queue/tick.ts` lines 24–35; `src/lib/queue/traffic.ts`; `src/app/api/jobs/tick/route.ts` lines 27–31 |
| The local stack signs its sign-in tokens with a shared secret (HS256, no key id). With such a token the sign-in guard's check (`getClaims`) asks the sign-in service once per request it guards. With a token signed by a published key the same check is made locally and asks nothing. | `scripts/test-stack.mjs` lines 18, 22, 37; `node_modules/@supabase/auth-js/src/GoTrueClient.ts` lines 6739–6762 (version 2.118.0) |
| The MCP server is the route `/mcp`. It answers JSON-RPC over POST, accepts only the header `Authorization: Bearer mfa_live_…`, has no sign-in page and no OAuth flow, and lists four tools. A token is made only on the page Profile → Connect an agent. `docs/agents.md` already says how to make a token and gives the address as "the app's `/mcp` endpoint"; it has no `tools/list` example and no steps for a client. | `src/app/mcp/route.ts`; `src/lib/agents/tokens.ts` line 26; `src/lib/agents/mcp-tools.ts`; `docs/agents.md` |
| `skills/pm-handover/scripts/pack.sh` writes a zip and up to four copies into `uploads/` in the checkout on every run and removes nothing. The replacement lines in the docs PR were run in a scratch directory: no argument gives a new directory under `/tmp`; an output directory inside the checkout is refused with exit 1; one outside is accepted. | `pack.sh` lines 12–31; a scratch run of the four lines |
| `scripts/cleanup.sh` removes only the PPLX Firefox processes and profiles and merged worktrees named `my-food-ai-*`. | the script |
| The sections "The browser" and "Local fixtures" and the seed command of the Fleet 21 plan are in `docs/plan-fleet21.md` on the branch `docs/fleet21` at `0a069601` (PR #922, open). Fleet 21's coder made the stack, the browser and the fixtures with them. | `git show origin/docs/fleet21:docs/plan-fleet21.md`; `docs/evidence/fleet21/local-check-summary.md` on the same branch |
| The Days screen on a phone loads the current month and the one before, then one older month each time a 1-pixel marker under the month name is on screen, until the month of the account's first meal. At 390 × 844 with four months loaded the marker leaves the screen and loading stops until the user scrolls to the top. | `src/components/DaysScreen.tsx` lines 20–24; `src/components/PhoneCalendar.tsx` lines 27–70; `src/components/DaysView.tsx` lines 190–192 |
| The retry on a failed meal opening schedules its two timers again (the effect depends on the attempt count), so the item's bug as written is gone. The failure message appears only when a request hangs for 10 seconds. A request that fails at once (offline) is answered by the service worker with the saved Home page, the document reloads, and no message can show. | `src/components/PostOpenTransition.tsx` lines 40–50; `public/sw.js` lines 296–306 |
| The review runner on main and on every open branch names one model, "Gemini 3.8 Flash", and refuses any other. The receipts on PR #922 show reviews run on "Gemini 4 Hydrogen" with a line ("Model picker at submission") that no runner in the repository can print. | `tools/pplx-review.mjs` lines 155, 354, 481–503 on `origin/main`, `origin/docs/fleet21`, `origin/fix21/check-script`; PR #922's comment of Nov 16 04:24 UTC |

**Premises (unchecked; the coder verifies before relying on them):**
- `npm test` on today's main fails nothing. Fleet 21's last whole-suite figure (711 tests, 705 pass, 0 fail, 6 skipped) was for a combination of heads, not for main as merged. Step 5b measures it.
- The fixtures and the browser of the Fleet 21 plan still work on today's main. They worked on Nov 16 before the last five merges.
- `network.addIntercept` holds a request for as long as it is not answered (check K2 relies on a held request to make a 10-second hang). Fleet 21 used it to fail requests, not to hold them.
- `script.addPreloadScript` is carried out by this Firefox (check K6).
- The page Profile → Connect an agent on the local build has a name field and a button "Create token", and shows the token once (check K7). The planner read the guide, not the page.
- `.env.local` holds `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (read R5). The planner did not open that file.
- The run happens in November 2026. Fixture F7's dates and check K3's month boundary assume it.

---

## PR 1: branch `fix22/nutrition-values` (#523, part)
**Service:** `scaleNutrition` in `src/lib/fdc/nutrients.ts` owns the stored value; `formatNutrition` in `src/lib/nutrition/totals.ts` owns the printed value. **Boundary:** `NutritionTable.tsx` on the meal detail.
**Blast radius:** every newly analysed food's carbs pass through the floor; every screen that prints a nutrition amount passes through the display floor (16 callers, all print amounts, none a difference). If it fails, a carbs value prints wrong. The notice change touches the meal detail only.
**What it does:** the meal detail's "Nutrition unavailable" notice shows only when calories, protein, carbs or fat is missing; a carbs value below zero is stored as zero for new analyses and printed as zero for rows already stored.
**Look:** at 390 wide, open fixture F1's meal detail. Expected: the notice is absent when the four main values are known; the fibre, sugar and sodium rows still name foods that lack them.

File `src/components/NutritionTable.tsx`.
Find:
```
import { NUTRIENT_KEYS, unavailableFoods, formatCalories, formatNutrition, sumNutrition, type CurrentItem } from "@/lib/nutrition/totals";
```
Replace:
```
import { unavailableFoods, formatCalories, formatNutrition, sumNutrition, type CurrentItem } from "@/lib/nutrition/totals";
```
Find:
```
{unavailableFoods(totals,NUTRIENT_KEYS).length ? <p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {unavailableFoods(totals,NUTRIENT_KEYS).join(", ")}</p> : null}
```
Replace:
```
{unavailableFoods(totals).length ? <p className="text-meta text-muted">Known nutrition shown. Nutrition unavailable: {unavailableFoods(totals).join(", ")}</p> : null}
```
File `src/lib/fdc/nutrients.ts`.
Find:
```
    carbsG: scale([CARBS_ID], unitToGrams),
```
Replace:
```
    // USDA carbohydrate is "by difference" and can come out slightly below zero; a food never has negative carbs.
    carbsG: (carbs => carbs === null ? null : Math.max(0, carbs))(scale([CARBS_ID], unitToGrams)),
```
File `src/lib/nutrition/totals.ts`.
Find:
```
  return amount === null ? "—" : Math.round(amount).toLocaleString("en-US");
```
Replace:
```
  return amount === null ? "—" : Math.round(Math.max(0, amount)).toLocaleString("en-US");
```
File `tests/nutrition-scaling.test.mjs`. Append at the end of the file:
```

test('a USDA carbohydrate-by-difference value below zero is stored as zero, never negative', () => {
  const meat = { fdcId: 2, description: 'Fixture meat', dataType: 'Foundation', foodNutrients: [
    { nutrientId: 1008, nutrientName: 'Energy', unitName: 'KCAL', value: 150 },
    { nutrientId: 1005, nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: -0.6 },
  ] };
  const n = scaleNutrition(meat, 200);
  assert.equal(n.carbsG, 0); assert.equal(n.calories, 300);
  assert.equal(scaleNutrition({...meat, foodNutrients: meat.foodNutrients.slice(0, 1)}, 200).carbsG, null);
});
```
Done when: the new test passes; on production a meal whose calories and macros are known and whose only missing value is fibre, sugar or sodium (the backlog names post 88d38425) no longer shows the notice. Not covered by this PR, and still open under #523: the blank values on posts f08e2e86 and 89286fbf, "unavailable kcal" on leftovers post 189673aa, sambal at 0 kcal (509ef9bc), bakpia at 0 g (e7e1782c); post 38de279e prints 0 g carbs and its stored row stays negative until it is recomputed.

## PR 2: branch `fix22/days-count` (#574)
**Service:** `src/lib/posts/days.ts` owns the counting rule. **Boundary:** the calendar cell and the day summary call it through `getMonthSummary` and `getDays`.
**Blast radius:** none in behaviour: the same rule, now written once. If it fails, the Days counts are wrong.
**What it does:** one shared function decides what counts as a post on Days, and a test holds the calendar cell and the day summary to the same counts for every status.

File `src/lib/posts/days.ts`.
Find:
```
export const LOGGED_STATUSES = ["ready", "queued", "processing", "needs_input"];
```
Replace:
```
export const LOGGED_STATUSES = ["ready", "queued", "processing", "needs_input"];
// The one counting rule for Days: a ready meal is a post; every other logged meal is "not finished".
// The calendar cell (getMonthSummary) and the day summary (getDays) both use it.
export function countsAsPost(status: string): boolean { return status === "ready"; }
```
Find:
```
if (row.status !== "ready") { const day = groups.get(date);
```
Replace:
```
if (!countsAsPost(row.status)) { const day = groups.get(date);
```
Find:
```
if (row.status === "ready") day.posts++; else day.pending++;
```
Replace:
```
if (countsAsPost(row.status)) day.posts++; else day.pending++;
```
Find:
```
      if (row.status === "ready") {
        day.ready = true;
```
Replace:
```
      if (countsAsPost(row.status)) {
        day.ready = true;
```
File `tests/days-summary.test.mjs`.
Find:
```
import { getLoggedDates, getDays, getMonthSummary, LOGGED_STATUSES } from "../src/lib/posts/days.ts";
```
Replace:
```
import { getLoggedDates, getDays, getMonthSummary, LOGGED_STATUSES, countsAsPost } from "../src/lib/posts/days.ts";
```
In the same file `tests/days-summary.test.mjs`, append at the end of the file:
```

test('the calendar cell and the day summary count the same posts for every logged status', async () => {
 const {createClient}=await import('@supabase/supabase-js');
 const nutrition={calories:100,protein_g:5,carbs_g:10,fat_g:4,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[]};
 const rows=LOGGED_STATUSES.flatMap((status,index)=>[0,1].map(copy=>({id:`${status}-${copy}`,status,caption:'Rice',eaten_at:`2026-10-31T1${index}:0${copy}:00Z`,post_media:[],current_post_items:status==='ready'?[{id:`i${copy}`,name:'Rice',portion_grams:100,item_nutrition:[nutrition]}]:[]})));
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>Response.json(new URL(input instanceof Request?input.url:String(input)).pathname.endsWith('/posts')?rows:[])}});
 const cell=(await getMonthSummary(db,'u','UTC','2026-10')).days.find(day=>day.day==='2026-10-31');
 const [day]=await getDays(db,'u','UTC','2026-10-31','2026-10-31');
 assert.equal(cell.posts,2);assert.equal(cell.posts,day.posts.length);
 assert.equal(cell.pending,6);assert.equal(cell.pending,day.pending);
 assert.equal(cell.kcal,day.totals.calories);
 assert.equal(countsAsPost('ready'),true);
 for(const status of ['queued','processing','needs_input','failed'])assert.equal(countsAsPost(status),false);
});
```
Done when: the new test passes, and read R3 shows the two counts agree on production.

## PR 3: branch `fix22/saved-photo-link` (#704)
**Service:** `DetailImage` in `src/components/OutlineOverlay.tsx`. **Boundary:** the meal detail (`PostDetail.tsx`).
**Blast radius:** the meal detail's photo only. One extra image request when a saved link exists, normally answered from the browser's cache. If it fails, the detail shows the small photo.
**What it does:** a saved photo link is test-loaded; when it does not load, the saved entry is removed and the fresh link is loaded.
**Look:** at 390 wide, open fixture F1's meal detail. In the page, list the `sessionStorage` keys that start with `mfa-original-`. Replace that key's value with `{"url":"http://127.0.0.1:60260/missing.jpg","expiresAt":<now in milliseconds plus 3600000>}`. Reload. Expected: the photo shows, and the key no longer holds `/missing.jpg` (it is gone or holds a fresh address).

File `src/components/OutlineOverlay.tsx`.
Find:
```
    if (cached) { setLoaded({ of: photo.url, url: cached }); return; }
```
Replace:
```
    if (cached) {
      setLoaded({ of: photo.url, url: cached });
      let live = true;
      const probe = new Image();
      probe.crossOrigin = "anonymous";
      // A saved link that no longer loads is removed and the fresh signed photo.url is loaded instead.
      probe.onerror = () => {
        if (!live) return;
        try { sessionStorage.removeItem(cacheKey!); } catch { /* ignore */ }
        setLoaded(null);
        setReloadOriginal(n => n + 1);
      };
      probe.src = cached;
      return () => { live = false; probe.onerror = null; };
    }
```
Done when: the look shows the saved bad link removed after a reload and the photo showing.

## PR 4: branch `fix22/time-locale` (#930)
**Service:** `src/lib/time/local.ts`. **Boundary:** every screen that prints a meal's time or weekday through it.
**Blast radius:** times and weekdays print in US English form ("5:20 PM", "Sat, Oct 31") on every machine and phone. A phone set to a 24-hour language now sees AM and PM. If it fails, times print wrong.
**What it does:** the three time and date calls name their locale, so the three tests give one result on any machine.

File `src/lib/time/local.ts`.
Find:
```
date.toLocaleTimeString(undefined, options)
```
Replace:
```
date.toLocaleTimeString('en-US', options)
```
Find:
```
date.toLocaleDateString(undefined,{weekday:'long'
```
Replace:
```
date.toLocaleDateString('en-US',{weekday:'long'
```
Find:
```
date.toLocaleDateString(undefined,{weekday:'short'
```
Replace:
```
date.toLocaleDateString('en-US',{weekday:'short'
```
After the build, in this PR's worktree, run `LANG=en_AU.UTF-8 LC_ALL=en_AU.UTF-8 node --import tsx --test tests/local-time.test.mjs` and the same with `en_US.UTF-8`. Write both results on the PR.
Done when: both runs pass 4 of 4, and step 5b's count of failing tests on main is written in the final report (the item's "one failing-test count").

## PR 5: branch `fix22/upload-card-links` (#571, part; #683, part)
**Service:** `src/lib/posts/saved.ts` owns the save and its message. **Boundary:** `PostActions.tsx` under every card.
**Blast radius:** cards whose meal is not finished stop prefetching the detail page (a finished card is unchanged); one error sentence changes. If it fails, links under a card do not open.
**What it does:** a card whose meal is not finished no longer asks the server for its detail page ahead of a tap, which ends the not-found answers during an upload; saving a meal with no food says why.
**Look:** at 390 wide on Home, with the network log on, post one photo meal as "Local fixtures" says (`plate2.jpg`, caption `Fixture overlap 1`) and, while its card shows as uploading, a second (`plate3.jpg`, caption `Fixture overlap 2`). Wait until both are finished. Expected: no request to `/posts/…` answers 404; both meals save on one press of Post each.

File `src/components/PostActions.tsx`.
Find:
```
<Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct"
```
Replace:
```
<Link prefetch={ready?undefined:false} href={`/posts/${postId}?reply=1`} aria-label="Comment or correct"
```
Find:
```
{!detail&&<Link href={`/posts/${postId}`} className
```
Replace:
```
{!detail&&<Link prefetch={ready?undefined:false} href={`/posts/${postId}`} className
```
File `src/lib/posts/saved.ts`.
Find:
```
'This meal is still being analysed. Save it once its nutrition shows.':'The meal could not be saved.'
```
Replace:
```
'This meal is still being analysed. Save it once its nutrition shows.':error?.code==='22023'?'No food was found in this meal, so there is nothing to save.':'The meal could not be saved.'
```
Done when: the look records zero 404 answers on `/posts/…`. Not covered, and still open under #571: why the owner's phone showed "The meal could not be saved." Not covered under #683: the failed meal's page wording and a retry for a blocked cover photo.

## PR 6: branch `fix22/question-strip` (#615, part)
**Service:** `readNeedsInput` in `src/lib/pipeline/needs-input.ts`. **Boundary:** `NeedsInputStrip.tsx` on Home.
**Blast radius:** the Home question strip only. If it fails, the strip shows nothing, as it does today when one row is unreadable.
**What it does:** one meal whose stored question cannot be read no longer hides every other meal's question.
**Look:** at 390 wide on Home with fixtures F8 (a readable question) and F9 (an unreadable one). Expected: the strip shows F8's row "A question about this meal"; F8's meal is still in the feed. Tap the row's X. Expected: the row goes without a reload and the meal stays in the feed.

File `src/components/NeedsInputStrip.tsx`.
Find:
```
const question = readNeedsInput(held ? post.needs_input : post.question);
```
Replace:
```
let question: ReturnType<typeof readNeedsInput> = null;
          try { question = readNeedsInput(held ? post.needs_input : post.question); } catch { /* One unreadable row must not hide the other questions. */ }
```
Done when: the look shows F8's row while F9 exists, and the X removes the row and keeps the meal. Not covered, and still open under #615: the production check with a beer caption and the notification, which need PR #918's script.

## PR 7: branch `fix22/feed-keep-rows` (#688)
**Service:** the feed's page state inside `src/components/Feed.tsx`. **Boundary:** Home.
**Blast radius:** Home's list of loaded meals. A meal deleted on another device can stay in the older part of the list until its delete event arrives. If it fails, Home shows the wrong meals or loses its place; this is the riskiest PR of the run.
**What it does:** when Home's server page is refreshed, the feed keeps the older meals it had already loaded below the new first page, so the page does not shorten and the scroll position does not jump.
**Look:** at 390 wide on Home with the 75 seeded meals. Scroll down until at least 20 meals are loaded. Read `window.scrollY` and the number of meal cards. Wait 70 seconds without touching the page (one 60-second refresh passes). Read both again. Then add a leftovers photo to fixture F1 as "Local fixtures" says (`notEaten:true`, `plate2.jpg`), wait until it is attached, and drag F1's photo one slide to the left with a touch pointer. Expected: `scrollY` and the card count are unchanged after the wait; after the drag F1 shows its second photo and fixture F4's card still shows its first.

File `src/components/Feed.tsx`.
Find:
```
const loadMore = useRef<() => void>(()=>{});
```
Replace:
```
const loadMore = useRef<() => void>(()=>{});
  const kept = useRef<{userId: string | null; posts: FeedPost[]; cursor: string | null}>({userId: null, posts: [], cursor: null});
```
Find:
```
let baseline: FeedPost[] = initialPage?.posts ?? [];
```
Replace:
```
// A re-rendered server page or a revalidation carries only the newest rows; keep the older rows already loaded below it (#688).
    const withOlder = (owner: string | null, page: {posts: FeedPost[]; nextCursor: string | null}) => {
      const last = page.posts.at(-1), prior = kept.current;
      const tail = last && page.nextCursor && owner && prior.userId === owner ? prior.posts.filter(post => post.eaten_at < last.eaten_at || (post.eaten_at === last.eaten_at && post.id < last.id)) : [];
      return tail.length ? {posts: [...page.posts, ...tail], nextCursor: prior.cursor} : {posts: page.posts, nextCursor: page.nextCursor};
    };
    const seeded = initialPage ? withOlder(initialUserId ?? null, initialPage) : null;
    let baseline: FeedPost[] = seeded?.posts ?? [];
```
Find:
```
let cursor: string | null = initialPage?.nextCursor ?? null;
```
Replace:
```
let cursor: string | null = seeded?.nextCursor ?? null;
```
Find:
```
      if (!live) return;
      // A late initial load must not erase cards received while it was in flight.
```
Replace:
```
      if (!live) return;
      if (loaded) kept.current = {userId, posts: baseline, cursor};
      // A late initial load must not erase cards received while it was in flight.
```
Find:
```
baseline = page.posts.filter(post=>!unavailable.has(post.id)).map(post=>retainCompleteItems(baseline.find(prior=>prior.id===post.id),post));
```
Replace:
```
const merged = withOlder(userId, page);
        baseline = merged.posts.filter(post=>!unavailable.has(post.id)).map(post=>retainCompleteItems(baseline.find(prior=>prior.id===post.id),post));
```
Find:
```
hasFreshPage = true; setFreshResponse(true);
        cursor = page.nextCursor;
```
Replace:
```
hasFreshPage = true; setFreshResponse(true);
        cursor = merged.nextCursor;
```
Done when: the look shows no change in `scrollY` or card count across the refresh, and the drag moves only F1's photos.

## Docs PR: branch `docs/fleet22` (#927, #928, #924, #926, #931, the uploads-folder item, the session-remnants item)
**Blast radius:** words in two contracts, one skill, `CLAUDE.md` and one guide; the pack script writes somewhere else. Nothing else changes. Reviewed by PPLX. Not merged unless the PM's order names it.
Also commit this plan unchanged as `docs/plan-fleet22.md`.

**#927.** File `docs/planner-contract.md`.
Find:
```
## Run shape
```
Replace:
```
## What a plan covers

A planner plans as many backlog items as are feasible. An item is left out only when it contains a fallacy or cannot be done, and the plan states that reason beside the item. When the owner picks the items a planner works on, the plan covers those items and does not grow to the whole backlog. Every plan lists each item it did not plan next to its reason.

## Run shape
```

**The session-remnants item.** Same file. Replace the whole paragraph that begins `**Cleanup.** Every plan states its cleanup:` with:
```
**Cleanup.** Every plan states its cleanup, and a session removes everything it made before it ends. Leftover worktrees are removed before the first PR; each worktree and local branch is removed once its PR is pushed; each remote branch is deleted after its merge. When the session ends it stops every process it started (the test stack and its database server, containers, provider stubs, the local app, browsers and browser drivers) and deletes every file and folder it created outside the main checkout (scratch under the system temp directory, test-stack data and its environment file, handover packages). Inside the main checkout it leaves nothing untracked: the uploads folder is empty, and `node_modules`, `.next` and build caches are removed. The final report pastes the output of `scripts/cleanup.sh`, of `git worktree list` showing only the main checkout, and of a process listing. Processes and files that belong to other projects or tools are left alone.
```

**#928.** File `docs/pm-contract.md`.
Find:
```
It has no status table or “in flight” section. Finished work leaves it when its issue closes.
```
Replace:
```
It has no status table. Its second-to-last section is “In flight”, which holds only the items a dispatch has sent to the coder that have not merged. A finished item leaves the backlog when its work is merged, and no finished item sits in any section.
```
The PM contract in the Project is outside the repository; the PM changes that copy.

**The uploads-folder item.** Same file `docs/pm-contract.md`.
Find:
```
then run `skills/pm-handover/scripts/pack.sh`.
```
Replace:
```
then run `skills/pm-handover/scripts/pack.sh`, which writes its package outside the checkout and prints the path.
```
File `skills/pm-handover/scripts/pack.sh`.
Find:
```
# Package markdown for PM handover. Run from repository root.
```
Replace:
```
# Package markdown for PM handover into a directory outside the checkout.
# Usage: pack.sh [output directory]. Default: a new directory under the system temp directory. Prints every path it writes.
```
Find:
```
UP="$ROOT/uploads"
```
Replace:
```
UP="${1:-$(mktemp -d "${TMPDIR:-/tmp}/my-food-ai-handover.XXXXXX")}"
mkdir -p "$UP"
UP=$(cd "$UP" && pwd -P)
case "$UP/" in "$(pwd -P)/"*) echo "Error: the output directory must be outside the checkout." >&2; exit 1;; esac
```
File `skills/pm-handover/SKILL.md`.
Find:
```
The script writes under `uploads/`: a zip
```
Replace:
```
The script writes outside the checkout, to the directory given as its first argument or else a new directory under the system temp directory, and prints each path. Nothing is written under the checkout's `uploads/`, and the package is deleted once the owner has taken it. It writes a zip
```
File `CLAUDE.md`.
Find:
```
zip output goes under `uploads/` (gitignored).
```
Replace:
```
the pack script writes its zip outside the checkout and prints the path; nothing is kept under the checkout's uploads folder.
```
Not covered: whether the owner wants the designer zip back, and the test stack's default data directory, which is also under `uploads/` (this run names its own directory, `/tmp/mfa-f22`).

**#924.** File `docs/agents.md`. Append at the end of the file:
````
## Connect a client

1. Create a token as the top of this page says.
2. In the client, add a remote MCP server. Its address is the app's address followed by `/mcp`. Set the request header `Authorization: Bearer <token>`.
3. Ask the client to list the tools. It shows `log_meal`, `list_meals`, `get_meal` and `correct_meal`.

To check the connection without a client, list the tools with curl:

```sh
curl '<app origin>/mcp' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/list"}'
```

The server accepts only this fixed header. It has no sign-in page and no OAuth flow, so a client that cannot send its own `Authorization` header cannot connect. Without a token the server answers 401.
````

**#926.** New file `docs/findings/muse-model-effect.md` with this text:
````
# What a stronger Muse model does to My Food AI

Written Nov 16 2026 from the code on main (`5aaded91`). Each mark says what the code hands to a model today. No newer model was measured.

A stronger model removes none of the product's steps. It improves the steps that are model calls today. It leaves unchanged the steps that deterministic code and the database own, and those are what the product keeps.

| Step | What the code does | Who does the work | Mark |
|---|---|---|---|
| Find regions and outlines | Sends the photo to SAM and stores a box and a mask for each region (`src/lib/meta/sam.ts`). | Model call (SAM) | Unchanged: a separate model, and its masks draw the outlines. |
| Identify the food | Sends the photo, the caption and the boxes to Muse Spark, which returns one named item per food (`src/lib/meta/spark.ts`). | Model call | Improved: the names are the model's. |
| Estimate the portion | The same call returns grams per item; the prompt carries fixed anchors such as an egg at 50 g (`src/lib/prompts/spark/identify.ts`). | Model call | Improved: the grams are the model's. |
| Match a USDA record | Code searches FoodData Central and filters the results; the model picks one record or asks for another search, up to three (`src/lib/fdc/match.ts`). | Code and model call | Improved: the model chooses among records the code found. |
| Closest record when none matches | Code searches the plain food name among generic records and the model picks the nearest; for rice dishes code blends a rice record and a protein record (`src/lib/fdc/approximate.ts`). | Code and model call | Improved: the pick is the model's; the search and the label are code. |
| Estimate when no record is close | The model returns values per 100 g; code range-checks them and stores them as an estimate with its basis (`src/lib/fdc/estimate.ts`). | Model call | Improved: these numbers come from the model alone. |
| Scale and total | Multiplies the record's values by the grams and sums the meal (`src/lib/fdc/nutrients.ts`, `src/lib/nutrition/totals.ts`). | Code | Unchanged: arithmetic on stored values. |
| Consumed amount from a leftovers photo | The model estimates the grams not eaten per item; code subtracts and rescales the stored nutrition (`src/lib/meta/remainder.ts`, `src/lib/pipeline/remainder-rule.ts`). | Model call and code | Improved: the reading is the model's; the accounting is code. |
| Drink, caffeine and alcohol records | Classifies items by USDA category, name and the alcohol value, then writes water and caffeine records (`src/lib/intake/`). | Code and database | Unchanged: no model decides these records. |
| Corrections by comment or voice | Muse Voice transcribes; the model rewrites the item list; code matches the changed foods again and reapplies the deductions (`src/lib/worker/jobs/correct.ts`). | Model calls and code | Improved: the model applies the words; the versions and the undo are code. |
| Reuse an earlier meal | The database scores earlier meals, the model confirms the same meal, and code copies the stored nutrition (`src/lib/pipeline/prior.ts`). | Database, model call, code | Unchanged: it depends on the account's stored meals. |
| Keep the history | Stores items, versions, day totals, saved meals and copies for "Eat this again" (`src/lib/posts/`). | Database and code | Unchanged: stored rows and queries. |
| The trail behind a number | Stores the record id, the estimate's basis or the reason a value is unavailable, logs every search and decision, and writes the closest-record sentence in the meal's first comment (`src/lib/fdc/unavailable.ts`, `src/lib/pipeline/wording.ts`, `src/lib/trace/record.ts`). | Code and database | Unchanged: code writes it from the decision. |

## What a stronger model replaces

- The fixed portion anchors in the identify prompt and the long compatibility rules in the match prompt.
- The loops that retry a call with a larger output allowance (`match.ts`, `approximate.ts`, `estimate.ts`).
- The word-list guard against a wrong-species record (`src/lib/fdc/protein-reference.ts`).
- The estimate with no record: there the product adds only a range check and a label to the model's own numbers.

## What the product keeps that a general model with a camera does not have

- Numbers from a named source: a USDA record multiplied by grams. The model supplies numbers only in the labelled estimate.
- A stored trail: each food carries its record id, its estimate's basis or the reason it is unavailable.
- Consumed-versus-leftover accounting that is kept per item and reapplied after a correction.
- Water, caffeine and alcohol records per day.
- The account's own history: Days, saved meals, "Eat this again" and reuse of an earlier meal.
- Outlines that tie each number to a region of the photo.
````

**#931.** New file `docs/findings/tick-route-get.md` with this text:
````
# What a GET to the tick route can do

Written Nov 16 2026 from the code on main (`5aaded91`).

**Answer: yes.** A GET to `/api/jobs/tick` may take the worker lease and start a drain. It does so whenever a job is queued or running and no live lease is held. The route's own comment calls it a "public, idempotent tick". It is the wake, by design, not a read.

| State when the GET arrives | What the GET does |
|---|---|
| No job queued and none running | Three count-only reads. Nothing is written. |
| A job queued or running, and another holder's lease is live | The same reads and one lease attempt that changes nothing. |
| A job queued or running, and no live lease | Takes the lease (the lease function first marks abandoned jobs for recovery), then starts `/api/jobs/drain` for that holder after it answers. The drain runs the worker: job claims, model calls, lease renewals, release. |

Code: `src/app/api/jobs/tick/route.ts`, `src/lib/queue/tick.ts`, `src/lib/queue/lease.ts`, `try_acquire_worker_lease` in `supabase/migrations/0007b_comment_corrections.sql`.

**Who calls it.** Every caller but one wants the wake and ignores the answer: the routes that queue work (new meal, comment, correction, items, photos, servings, retry, discard), the agent kickoff, the drain route when it finishes, the meal detail after a correction, and the database's once-a-minute wake (`net.http_get`, migration `0024`). Only `QueueTicker.tsx` (app open, tab focus, upload events) uses both the wake and the three numbers.

**The drain route** needs the `holder` value of the live lease: 400 without one, 409 when it does not hold the lease. It has no other secret.

**There is no read-only way** to get the three numbers today.

**What "a GET changes nothing" would cost.** The wake moves to POST: the tick route, `tick.ts`, `QueueTicker.tsx`, `OutlineOverlay.tsx`, the drain route, the agent kickoff, eight route files (twelve call sites), a migration that changes the database wake to `net.http_post`, three test files and five scripts.

**What #322 needs instead.** #322 assumed the route only reads. To time a cold start without starting work, call it when no job is queued or running: then it writes nothing.
````
Done when (docs PR): the PR holds the seven texts above and the plan file, and its review has zero blockers. #931's choice (leave the wake on GET and reword #322, or move it to POST) is the PM's and is not made here.

---

## The browser and the fixtures
The browser, how it is driven, how a photo is attached, and fixtures F1 and F4 are exactly as the sections "The browser" and "Local fixtures" of the Fleet 21 plan say, and the seed is the command under "The seed" in its section "Checks on the local build". Read them with `git show origin/docs/fleet21:docs/plan-fleet21.md` (fact above). Where that plan says "the main checkout", use `<w>`. Read `/tmp/mfa-f21` there as `/tmp/mfa-f22` and `.env.test.fleet21` as `/tmp/mfa-f22/main/.env.test.fleet22`. The driver script is kept under `/tmp/mfa-f22/`, is not committed, and is deleted in step 8. In the commands below, `$DB` stands for `"$(grep ^SUPABASE_DB_URL= /tmp/mfa-f22/main/.env.test.fleet22 | cut -d= -f2-)"`.

Make F1 and F4 as that plan says. F2, F3 and F6 are not used by this run, and F5 is not made (its row is the wrong state; fact above). Then make these three, in step 5e:

| Fixture | What it is | How it is made |
|---|---|---|
| F7 | Two old meals, so Days has months to load on scroll | `psql $DB -v ON_ERROR_STOP=1 -c "insert into public.posts(user_id,caption,eaten_at,status,analysis_initialized_at) select u.id,'Seeded '||d,d::timestamptz,'ready',now() from auth.users u, (values ('2026-07-10 12:00+00'),('2026-06-10 12:00+00')) v(d) where u.email='local-test-2@example.com'"` |
| F8 | A finished meal with a question that keeps its place in the feed | Make a meal as F1 is made, with caption `Fixture question`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set status='ready', needs_input=null, question='{\"question\":\"Was the sauce made with cream?\",\"short\":\"Clarification needed\",\"options\":[\"Yes\",\"No\"]}'::jsonb where caption='Fixture question'"` |
| F9 | A finished meal whose stored question cannot be read | Make a meal as F1 is made, with caption `Fixture bad question`. When it has finished: `psql $DB -v ON_ERROR_STOP=1 -c "update public.posts set question='\"not an object\"'::jsonb where caption='Fixture bad question'"` |

If a fixture's command fails, write what was seen and report the looks and checks that name it as not done; the rest of the run continues.

## Checks on the local build
K1 runs in step 5b. K2 to K7 run once in step 5g, on main's build in `<w>`, signed in as local test user 2. Nothing here touches production or a customer. Each result goes in the final report as what was seen, in one or two sentences, with the numbers. A check that cannot be carried out is reported as not checked, with the reason; it stops nothing else.
**Blast radius:** rows in the disposable database only.

| Check | Item | Steps | Record |
|---|---|---|---|
| K1 | #711 | Step 5b. | The four results of step 5b, and by name the result of `tests/profile-avatar.test.mjs` and `tests/save-meal-readiness.test.mjs`. The item is met when both files pass and the run is written in the final report. |
| K2 | #703 | At 390 wide on Home, add an intercept for `http://127.0.0.1:60260/posts/*` and do not answer the held requests. Tap a meal's "Details ›" link. Wait 12 seconds. Tap "Try again" in the message. Wait 12 seconds. Then answer every held request with `network.failRequest`, remove the intercept, tap "Back", and tap the Days tab. | Whether "Couldn't open this meal." showed after the first wait and again after the second; whether the Days tab opened (an overlay left on screen would block it). |
| K3 | #454, #512 | At 390 × 844, open Days. Read `window.scrollY`, the page height, the month name at the top and the bounding box of today's cell. Read the list of months on the page. Scroll up 20 px at a time, one step every 200 ms, to the top, and keep going for 3 seconds after each new month appears. After every step read `scrollY`, the month name at the top, and the distance from the top of the screen to the cell of September 1. | Whether today's cell lies wholly on screen above the tab bar at the start; the month name as the cell of September 1 passes under it (expected: September, then August); for each older month that loads (July, then June), the distance to the September 1 cell just before and just after (the item is met when it does not change by more than 1 px). |
| K4 | #708 | Make a finished photo meal as F1 is made, caption `Fixture lost photo`, with no intercept on. Only then add an intercept for `http://127.0.0.1:60260/api/posts/*`, failing held requests whose address contains `/media` and continuing the others. Add a photo to that meal (`notEaten:false`, `plate2.jpg`). Wait for the failed chip. Remove the intercept. In the page, open the IndexedDB database `mfa-uploads` and delete every row of the store `drafts`. Reload. Tap the chip's retake button. List the rows of `intents`. Reload. | The chip's words after the first reload; whether the camera opened; the number of rows in `intents` after the tap (expected 0); whether the chip is gone after the second reload. |
| K5 | #323 | Note the time. At 390 wide, already signed in, with the network log on, open Home once and wait 10 seconds. Run `podman logs --since <that time> mfa-test-auth-60260 2>&1 \| grep -c '"path":"/user"'`. From the network log count the requests in that window in four groups: the page itself; addresses under `/posts/`; other addresses with `_rsc`; addresses under `/api/`. Repeat for Days and for Profile. | For each page: the `/user` count and the four group counts. This says whether the `/user` calls follow the prefetched links (the local stack asks once per guarded request; fact above). Read R5 says whether production does the same. |
| K6 | #599 | Before opening the page, add a preload script (`script.addPreloadScript`) that records `performance.now()` and the text of the element containing "Today" on every DOM change. At 1280 wide open Home. | The text of the Today column at its first appearance and the time of the first appearance of a number in it. The item's line is a placeholder from the first instant and numbers within two seconds. |
| K7 | #924 | In the browser open `http://127.0.0.1:60260/profile/agents/new`, type the name `fleet22`, create the token and copy it from the page. Then, following only the new section of `docs/agents.md` in the docs PR's branch: run its curl with `http://127.0.0.1:60260` as the app origin and the token; run it again without the `Authorization` header. Revoke the token on Profile → Agents. | The names of the tools the first call lists (expected four); the status of the second (expected 401). The token is not written anywhere. |

(In this table, `\|` stands for the plain character `|`.)

## Reads on production
Five reads, run once in step 7 after the last merge is deployed. Each is read-only. None writes a row, creates an account or sends anything to anyone. Use `set -a; . ./.env.local; set +a` first, in `<main>`. Ids in the report are shortened to 8 characters; no email address, token or key is written anywhere.
**Blast radius:** none; reads only. R5 signs in as production test account 2, as earlier fleets did.

| Read | Item | Command | Record |
|---|---|---|---|
| R1 | #573 | `psql "$SUPABASE_DB_URL" -Atc "select count(*) filter (where labels > 1), count(*) filter (where labels = 1), (select compact from public.nutrition_provenance_format limit 1) from (select (select count(*) from jsonb_array_elements(n.micronutrients) e where e ? 'approximation') as labels from public.item_nutrition n where jsonb_typeof(n.micronutrients) = 'array') s"` | The three values: rows whose label repeats, rows with one label, and whether the once-per-food format is on. The item is met when the first is 0 and the third is `t`. |
| R2 | #377 | `psql "$SUPABASE_DB_URL" -Atc "select i.name, i.portion_text, i.portion_grams, n.food_category, n.calories, (select e->>'value' from jsonb_array_elements(n.micronutrients) e where e->>'nutrientId' = '1057' limit 1), (select count(*) from public.intake_logs l where l.post_item_id = i.id) from public.post_items i left join public.item_nutrition n on n.post_item_id = i.id where i.post_id::text like '4dfe4411%' and i.superseded_at is null"` | For the Oct 29 black coffee: each item's name, portion, category, kcal, stored caffeine and number of drink records. This says whether the 112 kcal and the missing caffeine come from the name, the category or the matched record. |
| R3 | #574 | Signed in to production as test account 1 and then as test account 2 (`.env.local`), at 390 wide, open Days, go to October 2026, and read the `aria-label` of the Oct 31 cell and the count in that day's summary line. | Both texts for each account. The item is met when the two counts agree on both accounts, or the account has no Oct 31 meals (say so). |
| R4 | #322 | Run `psql "$SUPABASE_DB_URL" -Atc "select count(*) from public.jobs where status in ('queued','running')"`. Only when it prints 0: `curl -s -o /dev/null -D - -w 'total %{time_total}\n' "$APP_URL/api/jobs/tick"` three times, ten seconds apart. When it prints another number, wait 60 seconds and read again, up to five times; then report the read as not done. | For each call: `x-tick-cold` and the total time. With no job queued or running the call writes nothing (fact above). The "before" time and the phone post in the item's done line are not covered. |
| R5 | #323 | `curl -s "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/token?grant_type=password" -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" -H 'Content-Type: application/json' -d "{\"email\":\"$TEST_USER2_EMAIL\",\"password\":\"$TEST_USER2_PASSWORD\"}" \| node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const t=JSON.parse(s).access_token;console.log(Buffer.from(t.split(".")[0],"base64url").toString())})'` | The token's header only: its `alg` and whether it has a `kid`. `HS256` with no `kid` means production asks the sign-in service on every guarded request, as the local stack does. Any other `alg` with a `kid` means it does not, and the local counts of K5 do not describe production. |

---

# Part 2: not dispatched (51 items, and the 12 the PM set aside): each one's reason

None of these items is called done by this plan.

## A. Nothing is left to build or check in a fleet (24). The code on main meets the done line; closing is the PM's, on the evidence named.

| Item | Evidence | Still needed |
|---|---|---|
| #700 | Fleet 21 K1: 409 for a wrong holder, 400 for none. Read Nov 16: the drain needs the live lease's holder; the lease function's row lock stops two workers. | PM closes. |
| #701 | Fleet 21 K2: zero `/api/today` requests in 15 s. | PM closes. |
| #702 | The saved-failed-meal unsave test passes on main (PR #913). | PM closes. |
| #705, #707 | Fleet 21 K11: both tests pass on main. | PM closes. |
| #706, #572, #625 | Their tests are on main and pass (PR #920). | PM closes. |
| #709 | Fleet 21 K5: the chip went when the meal was deleted and stayed gone. | PM closes. |
| #710 | Fleet 21 K17: the three cases pass. Read Nov 16: Home no longer calls `today_summary`; a missing value prints a dash. | PM closes. |
| #568 | Fleet 21 on production: About lists 11 meals matching Profile. | PM closes. |
| #569 | Fleet 21 K7: 30, then 60, then 76 circles; the last whole. | PM closes. |
| #592 | Fleet 21 K18: smallest gap 119 px; no overlap; no arrows at 390. | PM closes. |
| #598 | Fleet 21 K14: the new build showed on the first normal reload. | PM closes. |
| #554, #658 | Fleet 21 K9: first change at 0 ms; a double tap opened nothing. Read Nov 16: a tap paints the meal's frame at once; the 320 ms now delays only the server request. | PM closes, or GrokBot repeats with a slowed processor. |
| #557 | Read Nov 16: an incomplete saved label keeps the provider error; a label with every value empty no longer counts as complete; `tests/barcode-resolver-outage.test.mjs` covers both. | PM closes. |
| #686 | Read Nov 16: a load in flight queues one more read, which restarts the poll (`Thread.tsx` lines 27, 44). No test, by the contract's test rule (PM ruling, Nov 15). | PM closes. |
| #351 | Fleet 21 K8 on the local build: six tiles, and a hold opened the sizes. Production showed four on Nov 5. | GrokBot re-checks production. |
| #449 | The code draws each pending food's name with a shimmer until its numbers arrive. | GrokBot re-checks one new upload on production. |
| #570 | The leftovers sheet waits only for a small save, then closes. | GrokBot times it on production. |
| #452 | The label prompt names Indonesian labels; a label in Photo mode is read by the analysis. | GrokBot posts the Goldfish photo and the English label on production. |
| #575 | Read Nov 16: a newly analysed food with no match carries one of three reasons, shown on the meal detail and in the first comment. A matched record that lacks one value (the salami, the butter) carries none. | GrokBot checks a new unavailable meal on production; the no-value case is for the PM to file if wanted. |
| #617 | Read Nov 16: the code now refuses a record "topped with" another protein, and a test covers squid against tuna. A record that names the other protein in other words, or a food name not in the word list (for example "ika nigiri"), still rests on the model. The paid real-food test still accepts a tuna record. | This is the written finding the item asks for. The PM decides whether it is acceptable and files what should change. |

## B. Waiting on owner ruling: the item's work sits in a held PR (5)

| Item | Held PR |
|---|---|
| #628 | Its script repairs are PR #918. Planning more edits to the same script would touch a file a held PR already changes. |
| #698, #690 | Both are PR #922. |
| #715, #925 | Both turn on PR #682. |

## C. Needs the owner, a real phone, or access the fleet does not have (12)

| Item | What is needed |
|---|---|
| #908 | The name the owner gives the rules list, and his word on its wording. This is the one thing this plan needs from the owner (see "For RT"). |
| #594 | The owner's ruling whether it is accepted without a phone check. |
| #212 | A real phone and a real packaged product. |
| #279 | The owner turns CAPTCHA on when the app goes public; he holds the key. |
| #699 | The owner's leave to read his other repositories, which are private. |
| #694, #285 | The owner's leave for a coder to read his production meals and photos. Fleet 21's default was not to read them, and no ruling has reached the planner. |
| #456 | The code is fixed for new and re-analysed drinks. The three cocktails keep old stored caffeine rows; clearing them means re-analysing three of the owner's meals on production, which needs his yes. |
| #368 | A time window from the owner and a second network: fast sign-ups through production could lock judges out. |
| #373 | The Supabase usage page, which the coder cannot open. |
| #60 | The README is already a start-here page. The search finds the production host in 66 files (12 outside `docs/evidence`) and the database host in 11 (6 outside). The owner chooses what stays. |
| #687 | GrokBot checks the mic and the switch; the owner checks the portal. |

## D. The PM's to settle (6)

| Item | State |
|---|---|
| #929 | Cannot be planned to exact text: the runner that made Fleet 21's reviews is not the one in the repository (fact above). The PM asks the coder where that runner is; once it is committed, the item's finding and fix can be planned. Five failed receipts are on record: four "invalid model" (the answer came from another model) and one "invalid input" (the ask box was not found). |
| #712 | The receipt that exists is the passing one (`docs/evidence/run19/ten-photos.json`). No receipt of a failed ten-photo run is in the repository. The PM withdraws the failure claim or names its source. |
| #691 | `push-row-delete.json` is nowhere in the repository and cannot be committed. The PM changes the closing comments, or orders the check run again. |
| #689 | Reviewing the seven merged heads needs the PM's order naming them. The production avatar check is GrokBot's. |
| #659 | Read against main in Fleet 21: five findings are not present, and three real gaps are for the PM to file (the question strip after a signed-out first read; the thread's retry poll after the tab returns; the header's date line clipped). |
| #578 | Rank 1 is built. The other findings are the rows of `docs/reviews/main-a24587a-dry-service-audit.md`, for the PM to file one each. PR 2 of this plan removes one more copy (the Days counting rule). |

## E. Needs a design decision or a production reading by GrokBot (4)

| Item | State |
|---|---|
| #684 | Remove is built and works. Two parts remain. The chip is a fixed overlay with no space kept for it, so it covers whatever scrolls under it: that needs the designer to say where it sits. The cause of the owner's failure needs his failed upload's row (see C). |
| #552, #553 | The thumbs and the bookmark are built as ruled. The saving, failed and turned-off looks, and the timing on a slowed processor, need GrokBot: the fleet's Firefox cannot slow a processor. |
| #695 | GrokBot on production: a feed photo asked for while the resizer is busy. |

## F. Left out on the PM's instruction: waiting on owner ruling (12)
The held PRs #918, #922, #932, #933 and #682. The carried items #693, #294, #222, #372, #375, #494 and #579.

---

# Part 3: Fleet 21's reported defects that are not filed yet

Each is planned only where it falls under an item above. The rest wait for the PM to file them.

| Reported defect | In this plan | If not, what it needs |
|---|---|---|
| Home makes 115 sign-in calls in 10 seconds (Days 10, Profile 18) | Checks K5 and R5, under #323. | No fix is planned: the local stack asks the sign-in service once per guarded request by its key type, and production may not. K5 and R5 settle it. If production does the same, the fix (remember an accepted token for 30 seconds in the guard) is written and waits for a fleet; it changes a sign-in rule, so it needs its own access test. |
| #628's check scripts still fail | No. | PR #918 is held (Part 2 B). |
| #911 hides the transcription error after a drink is detected | No. | Falls under #693, which the PM set aside. |
| #916 still makes 3 card re-reads | No. | Cause found by reading: a finished meal that has items and no numbers card keeps re-reading at 2, 6 and 14 seconds until a 120-second limit. Local fixtures have no numbers card, and a meal with any food lacking nutrition never gets one. Stopping it needs a ruling on meals that can never get a card. The PM files it. |
| Offline shows no failure message | Check K2 tests the message with a hung request, under #703. | The offline case is by design of the service worker (fact above). An edit that shows the message when the phone reports itself offline is possible in `PostOpenTransition.tsx`; it changes what offline does, so it waits for the PM to file it. |
| A meal with a question is missing from the Home question strip | PR 6 and fixtures F8 and F9, under #615. | The Fleet 21 fixture was the wrong state (fact above). PR 6 fixes the one product defect found: one unreadable row hid every question. |
| R4 starts the worker | Read R4 now runs only when no job is queued or running. The finding is the docs PR's #931 text. | The PM decides #931. |
| 16 not-found errors on a meal's own address while uploading | PR 5, under #571. | — |

Also seen while reading, for the PM to file if wanted: Home's day circles leave a finished meal with an unanswered question out of an earlier day's kcal, while Days counts it (`getDayTotals` in `src/lib/posts/days.ts`); a rum and cola counts in the feed's caffeine for the day and not in Days; the meal detail's cover photo offers no retry when it cannot load; a failed first analysis reads "Nutrition could not be updated." on the meal's page before any tap; `today_summary` in the database is no longer called by the app.

---

## For RT (read from here)

- **The run stops once,** before the merges, for the PM's order naming each PR and its full head SHA.
- **25 engineering items are worked: 15 by a build, 10 by a check.** 51 are not, each with its reason (24 + 5 + 12 + 6 + 4). The 5 held PRs and the 7 carried items are set aside as "waiting on owner ruling".
- **The one thing needed from you:** the name of the short rules list that the Wall of Stupid is split into (#908). You said the name is yours to give. Nothing in this plan waits for it; #908 is planned as soon as the name exists.
- **No migration. Nothing is written on production.** Five reads on production after the merges, all read-only: two counts, one of your meals (the Oct 29 black coffee), the Days screen on the two test accounts, three timed calls to the worker's address made only when no work is waiting, and one sign-in as test account 2 to read a token's type.
- **Behaviour changed (PR 1):** a meal's page says "Nutrition unavailable" only when calories, protein, carbs or fat is missing. A meal that lacks only fibre, sugar or sodium no longer shows it; those rows still name the food.
- **Behaviour changed (PR 1):** carbs are never shown or newly stored below zero.
- **Behaviour changed (PR 4):** times and weekdays print the US English way on every phone ("5:20 PM"). A phone set to a 24-hour clock now sees AM and PM. Default taken: one form everywhere, because the tests and the server need one.
- **Behaviour changed (PR 5):** saving a meal in which no food was found says "No food was found in this meal, so there is nothing to save." These are the plan's words, not yours.
- **Behaviour changed (PR 5):** a card whose meal is still being analysed no longer loads its detail page ahead of a tap. A finished card is unchanged.
- **Behaviour changed (PR 7):** Home keeps the older meals you have scrolled to when it refreshes itself, so the page no longer jumps. A meal deleted on another phone can stay in that older part until its delete arrives. This is the riskiest change of the run.
- **Behaviour changed (docs PR):** the handover script no longer writes into the checkout's uploads folder; it writes outside the checkout and prints where. Sessions are told to remove everything they made, `node_modules` included.
- **Contract changes (docs PR):** the planner contract gains the three coverage rules you stated (#927) and the cleanup rule; the PM contract describes an In flight section that holds only dispatched, unmerged items (#928).
- **Two findings written (docs PR):** what a stronger Muse model does to each step of a meal (#926), and what a GET to the worker's address can start (#931). The second leaves one choice to the PM.
- **Not solved in this run:** why your leftovers upload failed; the chip covering the numbers; "The meal could not be saved." on your phone; the old cocktails' caffeine; the blank and zero values on the six meals #523 names; the 115 sign-in calls, which may be a property of the test stack only.
- **Design and product disagree, left as they are:** on Days at phone size the month name at the top is the month whose first day last passed it, so on opening it can read an earlier month than today's.
