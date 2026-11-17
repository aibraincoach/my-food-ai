# Fleet 30 — the label read from every photo, a double count removed on the ledger, the hour-boundary test, the long header, and the checks that close #703, #937 and #659 (2026-11-17)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-17 19:36Z, the PM's ruling of 19:35Z on meal 1c4f16bf, and the Engineering backlog (`/home/opc/pm/my-food-ai/backlog/BACKLOG-web-current.md`). It has four code PRs and one docs PR, one stop before the merges, and one production section after the PM's merge order. Planned from main `45ea4cf7f190e9c01dd280e0d42f6e5f5dd07edd`; main `39d6d720` (#1031) changes only `BACKLOG.md` after it.

**Fleet 29 is with the builder.** No PR here touches a file Fleet 29 changes (`scripts/numbers/reanalyse.mjs`, `03-suspicious.sql`, `04-summary.sql`, `14-rule-failures.sql`, `15-repair.sql`, `16-carry.sql`, `17-census.sql`, `scripts/numbers/README.md`, `tests/numbers-reanalyse.test.mjs`). Fleet 30 relies on nothing new from Fleet 29. Section 8 uses `reanalyse.mjs` as main has it, `run --mode=reanalyse` and `restore`, which are on main since Fleet 28. If Fleet 29's PR 1 has merged by then, its version works the same for these two commands. The numbers README gets its line for `18-remove.sql` in the next fleet that may touch it.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and the waits of section 8 add up to at most 45 minutes (the PM's standing confirmation). Nothing here is a long run under AGENTS.md.

**Nothing runs against production before the merge order.** Every job of section 8 is an operator job, so the owner's phone gets no notification (#1001).

## 1. The items

| # | Item | What changes | Where |
|---|---|---|---|
| 1 | #990 | When a nutrition label's first photo leaves a value blank and the meal has more photos, up to two more are read, and a blank is filled from a reading of the same serving. Then meal 1c18b87e is re-analysed once | PR 1, section 8 |
| 2 | #990 | Meal 1c4f16bf's condensed milk, counted twice, is removed on the ledger under the PM's ruling (new `18-remove.sql`) | PR 2, section 8 |
| 3 | #1018 | The composer-drinks test passes across an hour boundary | PR 3 |
| 4 | #1022 | A long handle wraps in the feed card and the meal header, the engineering default the PM chose | PR 4, check K1 |
| 5 | #703 | The contract allows no new test for this behaviour, so it is closed by check K2 | check K2 |
| 6 | #937 | Re-measured after #952 | check K3 |
| 7 | #659 | Every unchecked finding is reproduced or dismissed with a line reference, and the stale wording inventory is regenerated | docs PR |

## 2. Facts the planner checked on 2026-11-17, and premises

Facts. Read on main `45ea4cf7`, in Fleet 28's private ledger and in USDA FoodData Central; do not check them again.

- **The label (1c18b87e).** One item, "Packaged food", 220 ml, 140 kcal, fat 3.5 g, sugar 11 g, sodium 115 mg, protein and carbohydrate NULL, `source_ref` `label`. It comes from `readNutritionLabel(photo)` on the first photo only (`src/lib/pipeline/analyze.ts`, the `named.nutritionLabel` branch). The meal has three photos. Fleet 28's re-analysis read the same first photo again and stored the same partial panel. The other photos' bytes are already loaded there as `additionalPhotos`. The meal has no owner comment, so 12-reanalyse.sql accepts it.
- **The double count (1c4f16bf).** "Vietnamese drip coffee", 100 g, is matched to USDA 171880, "Beverages, coffee, ready to drink, milk based, sweetened" (SR Legacy): 71 kcal, with milk and sugar already in it. The meal also holds "sweetened condensed milk", 30 g, USDA 2758990: 100.8 kcal, protein 2.214 g, carbohydrate 17.37 g, fat 2.499 g, sugar 16.23 g. The third food is "stir-fried mixed vegetables", 120 g, 85.2 kcal. The meal totals 257 kcal; without the milk it is 156.2 kcal (−39.2%). It has no saved meal and no owner comment.
- **#1018.** `tests/composer-drinks-route.test.mjs` fixes its hour bucket once at the start (`hour.setUTCMinutes(0,0,0)`) and caps and reads that bucket. `increment_user_call` counts into `date_trunc('hour', clock_timestamp())` at the moment of each call (migration 0046). Across the hour, the route's one hit lands in the new hour and the test reads 0 from the old one: Fleet 27's recorded failure (`user_call_hits.hits` 0 where line 105 expected 1).
- **#1022.** The handle is `truncate` in `src/components/PostCard.tsx` (inside a fixed `h-[52px]` row) and in `src/components/PostDetailHeader.tsx`.
- **#703.** The fix is on main: the effect that arms the two timers depends on `attempt`, and Try again increments it (`src/components/PostOpenTransition.tsx` lines 54 and 56). Fleet 26's K1 showed both 12-second failure states and the meal opening after the release, with no error overlay; its last Back step looked for a button where the control is a link. The coder contract allows new tests only for money, sign-in and access, mail routing, migrations and data rules (`docs/coder-contract.md`, "Tests"), so this overlay behaviour gets a check, not a test.
- **#937.** PR #952 (`74b65ace`, Fleet 22, after Fleet 21's sixteen not-found responses) gave the Comment and Details links `prefetch={ready?undefined:false}` (`src/components/PostActions.tsx`). Nobody has measured since.
- **#659.** The finding in section 6 checks every listed item on main by line reference. Regenerating `docs/wording/inventory.md` on main gives 1,259 strings and 2,031 locations against the committed 1,249 and 2,024.
- **Tested.** With PRs 1 to 4 applied together to an export of main, on the planner's own stack:
  - `npx tsc --noEmit` reports nothing, and `npx eslint` on the changed files reports one warning that main has too (`mime` unused in `cropLabelBox`, `src/lib/meta/label.ts`).
  - `tests/label-photos.test.mjs`, `tests/label-reading.test.mjs` and `tests/label-orientation.test.mjs` pass 5 of 5.
  - `tests/numbers-remove.test.mjs` passes 1 of 1.
  - The application suite passes 770 of 776 with 6 skips and no failure, and the database suite 51 of 51.
  - `tests/composer-drinks-route.test.mjs` passes against the built app: once at 19:39Z, and in 31 back-to-back runs of about 4 seconds each from 19:59:01Z to 20:01:01Z, every one passing. One ran 19:59:56 to 20:00:00; the log does not show on which side of the hour its route call fell.
  - `18-remove.sql` ran end to end through the local worker on a fixture copy of 1c4f16bf's three foods. The meal came back ready with the coffee and the vegetables holding their numbers exactly, micronutrients included, the summary rewritten as "Consumed: 156 kcal · 4 g protein · 24 g carbs · 5 g fat.", one recompute job finished, and no error.
  - The planner re-applied this plan's edits to main's text and compared the result with the tested copy.

Premises. From reports, not checked by the planner.

- P1: Meals 1c18b87e and 1c4f16bf are as Fleet 28 left them (restored and unchanged), and Fleet 29 does not touch them (its section 8 lists them).
- P2: Fleet 28's and Fleet 29's private ledgers are kept. Section 8 writes a new ledger.

## 3. Not in this run, and why

| Item | Why it is left out |
|---|---|
| #708 | Fleet 26's K2 met its done line locally (the failed chip was gone after the retake and after a second reload). What remains is GrokBot's production look |
| #523 | Closed on GitHub, open on the backlog. Its done line is a browser look on production once Fleet 29's P2 and this fleet's P1 have run. 6fad4a16 will still show a blank value, listed with its reason |
| #999 | The live barcode loop runs only on the Barcode screen; the black picture needs a phone reading |
| #1000 | A new feature with no design |
| #212, #594, #579, #571 | Each needs a real phone |
| #373, #375 | Need the Supabase usage page's figures |
| #368, #279 | Wait for CAPTCHA to be switched on |
| #687 | The submission is already sent |
| #689 | Needs the receipt contents |
| #578 | Filing the 25 findings is the PM's work |
| #60 | Waits for the last feature |
| #683, #553, #552, #217 | Built; what remains is GrokBot's production look |
| #694, #285, #617 | Studies that need a person or GrokBot to judge photos |
| #988, #987 | In the GrokBot section of the backlog, not the Engineering one |
| #1029 and #990's other parts | In Fleet 29 |
| #323's setting | The PM's order (Fleet 28, section 7.2) |

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, under `/tmp/mfa-f30`. Before any test in a worktree: `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f30/stack TEST_ENV_FILE=.env.test.fleet30`. Keep `TEST_STACK_DIR` short (a Postgres socket path over 107 bytes is refused). Never stop or touch a container that does not end in `-61360`. If the stack reports "Local service did not become ready", remove the stack directory and the env file and start it once more.
3. **Tests.** Load the env file (`set -a; . ./.env.test.fleet30; set +a`), then `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC MFA_TEST_DISPOSABLE=1 timeout 600 node --import ./tests/fixtures/local-providers.mjs --import tsx --test <files>`. PR 3's test needs the built app started first (`node scripts/test-app.mjs build`, then `start` in the background, stopped later by its PID).
4. **Suites.** The application suite (`npm test`) and the database suite (`npm run test:db`) once each, on a scratch branch that merges all four PRs locally (never pushed), with the same env. Bound: 10 minutes each.
5. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`; the PR's named tests.
6. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA, with main's runner. AGY when PPLX is unavailable. The docs PR needs no review.
7. **Checks** K1 to K3 (section 6.1), on the scratch branch of step 4.
8. **Docs PR**, branch `docs/fleet30` from `origin/main`: this plan unchanged as `docs/plan-fleet30.md`, the finding of section 6 as `docs/findings/fleet18-review-findings-2026-11-17.md`, and `docs/wording/inventory.md` regenerated with `node scripts/wording-inventory.mjs` on the scratch branch of step 4 (all four PRs together), so that it matches main after the merges.
9. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix30/label-photos` — #990

**Service:** the analysis worker's label read (`src/lib/meta/label.ts`, `src/lib/pipeline/analyze.ts`).
**What changes:** a new `readLabelFromPhotos(photos, read)` in `label.ts`. It reads the first photo as `readNutritionLabel` does. Only when that reading is a label with a serving and at least one blank value does it read the next photo, then one more, stopping as soon as no value is blank. From another photo it fills a blank only, and only when that reading is a label of the same serving amount and unit. A value already read is never replaced, and a failed read is skipped. `analyzePost` passes it the first photo and the meal's other photos. A meal whose first label reading is complete, or is no label, makes exactly the calls it makes today.

New file, given whole in section 6: `tests/label-photos.test.mjs`.

File `src/lib/meta/label.ts`.

Find:
```
}
export function labelNutrition(reading:LabelReading,servings:number){
```
Replace:
```
}
// #990: a meal can show its nutrition panel on more than one photo (1c18b87e has three; its first lacks protein and
// carbohydrate). When the first reading is a label with a value missing, up to two more photos are read, and a value
// is filled only where it is missing and only from a reading of the same serving. Nothing read already is replaced.
export const LABEL_KEYS = ["kcal", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"] as const;
export async function readLabelFromPhotos(photos:Uint8Array[],read:(image:Uint8Array)=>Promise<LabelReading>=image=>readNutritionLabel(image)):Promise<LabelReading>{
 const reading=await read(photos[0]);
 const panel=reading.per_serving;
 if(!reading.is_label||!panel||!reading.serving)return reading;
 const missing=()=>LABEL_KEYS.filter(key=>panel[key]===null);
 for(const photo of photos.slice(1,3)){
  if(!missing().length)break;
  let next:LabelReading;
  try{next=await read(photo);}catch{continue;}
  if(!next.is_label||!next.per_serving||next.serving?.amount!==reading.serving.amount||next.serving.unit!==reading.serving.unit)continue;
  for(const key of missing())if(next.per_serving[key]!==null)panel[key]=next.per_serving[key];
 }
 return reading;
}
export function labelNutrition(reading:LabelReading,servings:number){
```

File `src/lib/pipeline/analyze.ts`.

Find:
```
import { readNutritionLabel, labelNutrition } from "@/lib/meta/label";
```
Replace:
```
import { readLabelFromPhotos, labelNutrition } from "@/lib/meta/label";
```

Find:
```
    const reading=await readNutritionLabel(photo);
```
Replace:
```
    const reading=await readLabelFromPhotos([photo,...additionalPhotos]);
```

**Tests:** `tests/label-photos.test.mjs` (a blank filled from the next photo while the first reading's own values stay; at most two more photos; a different serving, a non-label and a failed read add nothing; one read only for a complete label, a non-label and a single photo), `tests/label-reading.test.mjs`, `tests/label-orientation.test.mjs`.

**Done when:** those pass.

### PR 2 — branch `fix30/remove-double` — #990

**Service:** none a person runs: one new operator file in `scripts/numbers/`.
**What changes:** a new `18-remove.sql`, for the PM's ruling of 2026-11-17 19:35Z. In one statement it supersedes every current food of a ready meal that has no job queued or running and at least two current foods, one of them the named food. It copies every other food with `supersedes` pointing to its original, so recompute keeps each complete row and looks nothing up, then queues one recompute with payload `{"operator":"remove"}`. A second run, a food that is no longer current, or the last food of a meal changes nothing.

New files, given whole in section 6: `scripts/numbers/18-remove.sql`, `tests/numbers-remove.test.mjs`.

**Tests:** `tests/numbers-remove.test.mjs` with the stack's env loaded (it needs `TEST_SQL_DATABASE_URL`).

**Done when:** it passes.

### PR 3 — branch `fix30/drinks-test-hour` — #1018

**Service:** none; one test.
**What changes:** the test writes each cap to this hour's bucket and the next hour's, and reads the larger of the two buckets the last cap wrote. The server counts a call into the hour it is made, so a call on either side of the hour is found. Cleanup deletes every bucket the test wrote and puts the earlier rows back.

File `tests/composer-drinks-route.test.mjs`.

Find:
```
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString();
 const prior=checked(await db.from('user_call_hits').select('*').eq('user_id',user.id).in('route',['post','drink_identify']).eq('hour',bucket));
```
Replace:
```
 // #1018: the server counts a call into the clock hour in which it is made. Each cap writes this hour and the next,
 // and a read takes the larger of the two hours the last cap wrote, so a run that crosses the hour still finds its call.
 const hourOf=offset=>{const hour=new Date(Date.now()+offset*3600000);hour.setUTCMinutes(0,0,0);return hour.toISOString();};
 let capped=[hourOf(0),hourOf(1)];const written=new Set(capped);
 const prior=checked(await db.from('user_call_hits').select('*').eq('user_id',user.id).in('route',['post','drink_identify']).in('hour',capped));
```

Find:
```
 const cap=(hits,route='drink_identify')=>db.from('user_call_hits').upsert({user_id:user.id,route,hour:bucket,hits},{onConflict:'user_id,route,hour'}).then(checked);
 const count=()=>fetch(model+'/__calls').then(r=>r.json()).then(rows=>rows.filter(row=>row.name==='identify').length);
 const hits=async()=>checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route','drink_identify').eq('hour',bucket).single()).hits;
```
Replace:
```
 const cap=(hits,route='drink_identify')=>{capped=[hourOf(0),hourOf(1)];capped.forEach(hour=>written.add(hour));return db.from('user_call_hits').upsert(capped.map(hour=>({user_id:user.id,route,hour,hits})),{onConflict:'user_id,route,hour'}).then(checked);};
 const hitsFor=async route=>Math.max(...checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route',route).in('hour',capped)).map(row=>row.hits));
 const count=()=>fetch(model+'/__calls').then(r=>r.json()).then(rows=>rows.filter(row=>row.name==='identify').length);
 const hits=()=>hitsFor('drink_identify');
```

Find:
```
  await cap(0);await cap(40,'post');const response=await request('/api/drinks/identify',{upload_id:id,position:0});const reading=await response.json();assert.equal(response.status,200,JSON.stringify(reading));assert.equal(reading.allDrinks,true);assert.equal(reading.drinks[0].ml,300);assert.equal(await count(),1);assert.equal(checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route','post').eq('hour',bucket).single()).hits,40,'identify does not spend the full post bucket');await cap(0,'post');
```
Replace:
```
  await cap(0);await cap(40,'post');const response=await request('/api/drinks/identify',{upload_id:id,position:0});const reading=await response.json();assert.equal(response.status,200,JSON.stringify(reading));assert.equal(reading.allDrinks,true);assert.equal(reading.drinks[0].ml,300);assert.equal(await count(),1);assert.equal(await hitsFor('post'),40,'identify does not spend the full post bucket');await cap(0,'post');
```

Find:
```
  checked(await db.from('user_call_hits').delete().eq('user_id',user.id).in('route',['post','drink_identify']).eq('hour',bucket));if(prior.length)checked(await db.from('user_call_hits').insert(prior));
```
Replace:
```
  written.add(hourOf(0));checked(await db.from('user_call_hits').delete().eq('user_id',user.id).in('route',['post','drink_identify']).in('hour',[...written]));if(prior.length)checked(await db.from('user_call_hits').insert(prior));
```

**Tests:** `tests/composer-drinks-route.test.mjs`, with the built app started.

**Done when:** it passes.

### PR 4 — branch `fix30/header-wrap` — #1022

**Service:** the feed card and the meal header.
**What changes:** the handle wraps (`[overflow-wrap:anywhere]`, so a handle with no space also breaks) instead of ending in an ellipsis, in `PostCard.tsx` and `PostDetailHeader.tsx`. The card's header row becomes `min-h-[52px]`, so it grows with a second line instead of clipping it. No test: the contract allows none for layout. Check K1 is the evidence.

File `src/components/PostCard.tsx`.

Find:
```
    <div className="flex h-[52px] items-center gap-[10px] px-inset">
      <Avatar handle={handle} userId={author.userId} mediaId={author.avatarMediaId} sizePx={32} textClassName="text-avatar"/>
      <span className="min-w-0 flex-1 truncate text-handle">{handle}<AgentAttribution name={post.agentName}/></span>
```
Replace:
```
    <div className="flex min-h-[52px] items-center gap-[10px] px-inset">
      <Avatar handle={handle} userId={author.userId} mediaId={author.avatarMediaId} sizePx={32} textClassName="text-avatar"/>
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-handle">{handle}<AgentAttribution name={post.agentName}/></span>
```

File `src/components/PostDetailHeader.tsx`.

Find:
```
  <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="truncate text-handle">{handle}</p>{showServings&&servings!=null?<HeaderServings key={`${postId}:${servings}`} postId={postId} servings={servings}/>:null}</div><p className="text-label text-muted">{date} · {time}</p></div>
```
Replace:
```
  <div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-2"><p className="min-w-0 [overflow-wrap:anywhere] text-handle">{handle}</p>{showServings&&servings!=null?<HeaderServings key={`${postId}:${servings}`} postId={postId} servings={servings}/>:null}</div><p className="text-label text-muted">{date} · {time}</p></div>
```

**Done when:** `npx tsc --noEmit` and `npx eslint` pass on the two files, and K1 passes.

## 6. The new files

### `tests/label-photos.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { readLabelFromPhotos } from '../src/lib/meta/label.ts';

// #990: meal 1c18b87e's label read gave 140 kcal with no protein or carbohydrate from the first of its three photos.
const reading = (per, serving = { amount: 220, unit: 'ml' }) => ({ is_label: true, serving, product_name: null, box: null,
  per_serving: { kcal: null, protein_g: null, carbs_g: null, fat_g: null, fibre_g: null, sugar_g: null, sodium_mg: null, ...per } });
const reader = (...readings) => { const seen = []; return { seen, read: async (photo) => { seen.push(photo[0]); const next = readings.shift(); if (next instanceof Error) throw next; return next; } }; };
const photos = [1, 2, 3, 4].map((n) => new Uint8Array([n]));

test('a label missing values is completed from the next photo of the same serving, and nothing read is replaced', async () => {
  const { seen, read } = reader(reading({ kcal: 140, fat_g: 3.5, sugar_g: 11, sodium_mg: 115 }), reading({ kcal: 150, protein_g: 0, carbs_g: 33, fat_g: 3.5, sugar_g: 11, sodium_mg: 115, fibre_g: 1 }));
  const result = await readLabelFromPhotos(photos, read);
  assert.deepEqual(seen, [1, 2], 'the third photo is not read once every value is there');
  assert.equal(result.per_serving.kcal, 140, 'the first reading keeps its own values');
  assert.equal(result.per_serving.protein_g, 0, 'a zero is a value');
  assert.equal(result.per_serving.carbs_g, 33);
  assert.equal(result.per_serving.fibre_g, 1);
});

test('only up to two more photos are read, and a different serving, a non-label or a failed read adds nothing', async () => {
  const { seen, read } = reader(reading({ kcal: 140 }), reading({ protein_g: 2 }, { amount: 100, unit: 'ml' }), new Error('refused'));
  const result = await readLabelFromPhotos(photos, read);
  assert.deepEqual(seen, [1, 2, 3], 'the fourth photo is never read');
  assert.equal(result.per_serving.protein_g, null, 'a reading per 100 ml does not fill a 220 ml label');
  const notLabel = reader(reading({ kcal: 140 }), { is_label: false, serving: null, per_serving: null, product_name: null, box: null }, reading({ protein_g: 1 }));
  assert.equal((await readLabelFromPhotos(photos, notLabel.read)).per_serving.protein_g, 1);
});

test('a complete first label, a first photo that is no label, or a single photo makes exactly one read', async () => {
  const complete = reader(reading({ kcal: 140, protein_g: 1, carbs_g: 30, fat_g: 3.5, fibre_g: 0, sugar_g: 11, sodium_mg: 115 }));
  await readLabelFromPhotos(photos, complete.read);
  assert.deepEqual(complete.seen, [1]);
  const none = reader({ is_label: false, serving: null, per_serving: null, product_name: null, box: null });
  assert.equal((await readLabelFromPhotos(photos, none.read)).is_label, false);
  assert.deepEqual(none.seen, [1]);
  const single = reader(reading({ kcal: 140 }));
  await readLabelFromPhotos(photos.slice(0, 1), single.read);
  assert.deepEqual(single.seen, [1]);
});
```

### `scripts/numbers/18-remove.sql`

```
-- #990: remove one food of a meal that is demonstrably counted twice (the PM's ruling of 2026-11-17 19:35Z): meal
-- 1c4f16bf holds "sweetened condensed milk" beside a coffee matched to "Beverages, coffee, ready to drink, milk based,
-- sweetened" (171880), which already holds the milk and sugar. Every other current food is copied with its nutrition
-- kept (each copy supersedes its original, so recompute keeps the complete row and looks nothing up), the removed food
-- stays as a superseded row, and an operator recompute sums the meal again and rewrites its summary. The operator
-- records the removed food, its values and the reason in a private ledger, with the meal's snapshot (08) taken first;
-- 13-restore.sql through `reanalyse.mjs restore` puts the meal back from that snapshot.
-- psql variables: post (the full meal id) and item (the full id of the current food to remove).
begin;
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
    and exists (select 1 from public.post_items i where i.id = :'item'::uuid and i.post_id = p.id and i.superseded_at is null)
    and (select count(*) from public.post_items i where i.post_id = p.id and i.superseded_at is null) >= 2
), old as (
  update public.post_items i set superseded_at = now()
  where i.post_id in (select id from meal) and i.superseded_at is null
  returning i.*
), copies as (
  insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                                 not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
  select o.post_id, o.name, o.portion_text, o.portion_grams, o.box, o.mask_path, o.confidence, o.source, o.gtin,
         o.not_eaten_grams, o.count_text, o.not_eaten_count_text, o.not_eaten_calories, o.id
  from old o where o.id <> :'item'::uuid
  returning post_id
), queued as (
  -- Only a meal whose foods this statement superseded is queued, so a second run changes nothing.
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from copies)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select distinct id, 'recompute', 200, 'queued', '{"operator":"remove"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
```

### `tests/numbers-remove.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990, the PM's ruling of 2026-11-17 19:35Z: a food counted twice is removed on purpose; nothing else may change.
const file = fileURLToPath(new URL('../scripts/numbers/18-remove.sql', import.meta.url));
test('18-remove.sql removes one food, keeps the others with their ids as supersedes, and queues one operator recompute', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const remove = (post, item) => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${item}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), veg = randomUUID();
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','remove-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values
 ('${coffee}','${post}','Vietnamese drip coffee','model',100,'1 small glass'),('${milk}','${post}','sweetened condensed milk','model',30,'2 Tbsp'),('${veg}','${post}','stir-fried mixed vegetables','model',120,'1/2 cup');
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)values('${coffee}',71,1.98,12.6,1.38),('${milk}',100.8,2.214,17.37,2.499),('${veg}',85.2,2.412,11.58,3.408);`);
  assert.match(remove(post, milk), /recompute/);
  const current = sql(`select name||'|'||supersedes from post_items where post_id='${post}' and superseded_at is null;`).trim().split('\n').sort();
  assert.deepEqual(current, [`Vietnamese drip coffee|${coffee}`, `stir-fried mixed vegetables|${veg}`].sort());
  assert.equal(sql(`select count(*) from post_items where post_id='${post}' and superseded_at is not null;`).trim(), '3', 'every old row is kept, superseded');
  assert.equal(sql(`select status from posts where id='${post}';`).trim(), 'queued');
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "remove"}');
  assert.equal(remove(post, veg).trim(), '', 'a meal with a job queued is refused');
  sql(`update jobs set status='finished',finished_at=now() where post_id='${post}';update posts set status='ready' where id='${post}';`);
  assert.equal(remove(post, milk).trim(), '', 'a food that is no longer current is refused');
  const [last] = sql(`select id from post_items where post_id='${post}' and superseded_at is null and name like 'Viet%';`).trim().split('\n');
  sql(`update post_items set superseded_at=now() where post_id='${post}' and superseded_at is null and id<>'${last}';`);
  assert.equal(remove(post, last).trim(), '', 'the last food of a meal is never removed');
});
```

### `docs/findings/fleet18-review-findings-2026-11-17.md`

```
# Finding: the unchecked Fleet 18 review findings, checked on main (#659)

Fleet 30, 2026-11-17. A read of main `45ea4cf7f190e9c01dd280e0d42f6e5f5dd07edd`. No code was changed for this finding. Line numbers are on that commit.

#659 lists the review findings on the merged Fleet 18 PRs that nobody had checked on main. Each is reproduced or dismissed below, with the line that shows it.

| Finding | On main | Result |
|---|---|---|
| #641: the database does not accept `portion_unit` "serving" | Migration 0060 (`supabase/migrations/0060_label_serving_unit.sql`, lines 17 and 81) accepts `g`, `ml` and `serving`, and writes "1 serving" or "N servings" (lines 46 and 110) | Dismissed |
| #638: Feed discovery polling stops when the tab is hidden | It skips a poll while hidden (`src/components/Feed.tsx` line 410) and starts again on a return to the tab (lines 426 to 432) | Dismissed |
| #638: `today_summary` disagrees with the legacy totals | Nothing in `src` reads `today_summary` any more | Dismissed: the code is gone |
| #639: NeedsInputStrip never finds new questions after an empty first poll | After an empty poll it schedules the idle discovery poll (`src/components/NeedsInputStrip.tsx` line 36, `DISCOVERY_IDLE_MS`), and it listens for a return to the tab and for focus (lines 90 and 91) | Dismissed |
| #639: RealtimePost does not refresh on visibility | It listens for `visibilitychange` and `focus` (`src/components/RealtimePost.tsx` lines 114 and 115) and stops polling while hidden (line 109) | Dismissed |
| #637: Thread retry polling | It polls with a backoff from 2 to 30 seconds and starts again at 2 seconds on a return to the tab (`src/components/Thread.tsx` lines 53 to 59). The review's own wording of this finding is not held, so this reads the code as it stands | Dismissed on the code as it stands |
| #643: the header text is cut off | Reproduced in Fleet 27 at 390 pixels wide (a 30-character handle, 318 pixels of text in 219) | Reproduced; filed as #1022 and fixed in Fleet 30 |
| #647 blocker: every post header shows the viewer's avatar and handle | `usePostAuthor` (`src/components/PostHandle.tsx` lines 39 to 54) uses the viewer's identity only for the viewer's own posts, and the post's author otherwise | Dismissed |
| #647 blocker: the avatar route reads with the viewer's token, so another user's avatar fails | The route answers 404 to anyone but the owner or an admin (`src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts` line 34) and reads the file with the service client (line 52). A 404 for another user is the intended result (#689's done line) | Dismissed |
| #647 blocker: the avatar route sends a public one-year cache header | It sends `private, max-age=31536000, immutable` (same file, line 8) | Dismissed |
| #648 blocker: `wording-inventory.mjs` embeds the HEAD short hash, so its check can never pass | The script no longer reads git or a hash (`scripts/wording-inventory.mjs`) | Dismissed |
| #648 blocker: `docs/wording/inventory.md` was generated before later changes | Reproduced: regenerating it on main gives 1,259 strings and 2,031 locations against the committed 1,249 and 2,024, and moved line numbers | Reproduced; regenerated in Fleet 30's docs PR |

Every finding #659 lists is now reproduced or dismissed. The two reproduced ones are #1022 and the inventory, and both are handled in Fleet 30.
```

### 6.1 The checks

Run each on the scratch branch of section 4, step 4, with the built app at 390 by 844 pixels in Chromium unless it says otherwise. Each check's bound is 10 minutes. Record each in the stop report as passed or failed, with the numbers it asks for.

- **K1, #1022.** Give local test user 1 the 30-character handle `fleet30-long-handle-abcdefghij` (restore the old one afterwards). Open Home, then that user's newest meal. On both, read the handle element: its text must equal the whole handle, and its `scrollWidth` must not exceed its `clientWidth`. The menu button beside it must measure 44 by 44 and open its menu. Repeat at 1280 by 800. Report the four widths and both menu sizes.
- **K2, #703.** Fleet 26's K1 sequence again. Hold the meal page's request (route interception), open a meal, and wait for "Couldn't open this meal." (at most 12 seconds). Tap Try again with the request still held, and wait for the same message once more (at most 12 seconds). That second failure must show the message with Try again, and no spinner may be left behind it. Then release the request: the meal opens within 5 seconds with no overlay over it. Last, tap the meal page's Back control (a link, `a` element) and land on Home. Report the three times and the overlay's presence after the release (expected: absent).
- **K3, #937.** Two uploads that overlap: start a photo post on test user 1, and start a second one while the first card still shows "Uploading photo…". Until both meals are ready (at most 5 minutes), record every response under `/posts/` with its status. Report the count of 404 responses (expected: 0) and, for any, its path with the meal id cut to 8 characters, its time and which card was uploading.

## 7. The stop

Stop when the four code PRs and the docs PR are open, each code PR reviewed or reported "written, not reviewed", and K1 to K3 are reported. Report to the PM, in one message:

1. Each PR: number, branch, final head (40 characters), tests and their counts, and the review's result.
2. The two suites' counts.
3. K1 to K3, with the numbers they ask for.
4. Anything void under section 2.
5. The merge order this plan expects: PR 1, PR 2, PR 3, PR 4, then the docs PR. Section 8 needs PR 1 served on production and PR 2 on main.

Then wait for the PM's merge order. It names each PR and its full head SHA.

## 8. After the PM's merge order: the label meal and the double count

Run this only after every PR of the merge order has merged and production serves the last merge. Keep every private file in a new ledger, `state/build/fleet30-postmerge/private/ledger`, mode 0700, files 0600. Print and commit meal prefixes only, never a caption or comment text. Reads use a read-only session (`PGOPTIONS='-c default_transaction_read_only=on'`).

- **P1, the label meal.** `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=reanalyse --meals=1c18b87e --ledger=<new ledger> --max-meals=1 --wait-seconds=240`. Expected: about 5 to 9 model calls. If another photo shows the panel's protein and carbohydrate, the meal is "changed" with them filled and 140 kcal kept. If not, it is "unchanged", and it is listed: "the label's protein and carbohydrate are not readable on any of its photos". The tool puts the meal back by itself if it got worse. Undo for a kept meal: `node scripts/numbers/reanalyse.mjs restore --meal=1c18b87e --ledger=<new ledger> --snapshot=last --wait-seconds=240`.
- **P2, the double count.** Meal 1c4f16bf, the food "sweetened condensed milk". In order:
  1. Snapshot: `psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 -v prefixes=1c4f16bf -f scripts/numbers/08-snapshot.sql`, appended as one line to `<new ledger>/snapshots.jsonl`. This is the restore point.
  2. From that snapshot, take the current item named "sweetened condensed milk". There must be exactly one; otherwise stop P2 and report.
  3. `psql "$SUPABASE_DB_URL" -X -At -v ON_ERROR_STOP=1 -v post=<meal id> -v item=<that item id> -f scripts/numbers/18-remove.sql`. It must print one recompute job; if it prints none, stop P2 and report.
  4. Wake the worker (`curl -s -m 30 "$APP_URL/api/jobs/tick"`) and read the meal's status every 10 seconds, waking it again every 60, for at most 240 seconds, until it is `ready` with no job queued or running.
  5. Snapshot again into `<new ledger>/after.jsonl`.
  6. The loss check, with main's own comparison: `node --input-type=module -e "import {lostValues} from './scripts/numbers/reanalyse.mjs'; import {readFileSync} from 'node:fs'; const last=f=>JSON.parse(readFileSync(f,'utf8').trim().split('\n').at(-1)); console.log(JSON.stringify(lostValues(last(process.argv[1]),last(process.argv[2]))))" <new ledger>/snapshots.jsonl <new ledger>/after.jsonl`. Every value it lists must begin "renamed foods:", and the current foods afterwards must be exactly the coffee and the vegetables, each with the same numbers as before. Otherwise it is an unintended loss: run restore as in P1, report it, and stop P2.
  7. Append one line to `<new ledger>/ledger.jsonl`: `{"meal":"1c4f16bf","mode":"remove","food":"sweetened condensed milk","item":"<8 characters>","values":{its calories, protein_g, carbs_g, fat_g, fibre_g, sugar_g, sodium_mg and micronutrient count},"reason":"counted twice: the coffee is matched to USDA 171880, Beverages, coffee, ready to drink, milk based, sweetened, which already holds the milk and sugar (PM ruling 2026-11-17 19:35Z)","before":<totals>,"after":<totals>,"at":"<time>"}`.
  Expected: 257 to 156.2 kcal, no model call. Undo: restore, as P1.
- **P3, the list and the usage.** `14-rule-failures.sql` with the owner's id, and `09-usage.sql` for the two meals since P1 began.

Stop conditions: a command that exits 1; an unintended loss in P2; 45 minutes of waiting in all, counted from P1. A stop ends section 8; report what ran.

**What section 8 reports.** Each meal: prefix, rules before, what ran, outcome, kcal before and after, model calls, and rules after. For P2, the ledger line of step 7. Ask GrokBot, through the PM, to read the card and day total of each meal that changed.
