# Fleet 34 — #990: decide the six disagreements, complete the seven, correct what is judged wrong, and run the blind study again (2026-11-18)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-18 01:05Z and the blind study's report (`state/build/fleet32-study-replacement/report.md`). Every item is #990. It has two code PRs and one docs PR, one stop before the merges, and one production section after the PM's merge order. Planned from main `aa11e8a24e859697f13c706c0268a45e4bdb3583`. Fleet 33 (PRs on `scripts/run17-checks.mjs` and `src/lib/posts/upload-manager.ts`) touches no file here. The two fleets can merge in any order.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and section 8's waits add up to at most 45 minutes. Each batch of readers or reviewers is a command of at most 10 minutes.

**Privacy.** Photos go to two reviewers: a fresh `codex exec` and AGY. The PM's packet asks for both. Captions go only to a fresh `codex exec`, never to AGY. Neither reviewer gets a meal prefix, an account, a caption (AGY) or a stored total. Reports print prefixes and food names only.

## 1. The items

| # | Item | What this plan does | Where |
|---|---|---|---|
| 1 | The six disagreements | For each food that explains the gap, two blind reviewers say which of two readings (stored or estimate, unlabelled) the photo supports; a fixed rule turns that into stored-wrong, estimate-wrong or undecidable | section 8, A1 to A4 |
| 2 | The seven incomplete meals | A second reader prompt that keeps the drafted foods and picks the nearest record; a reader that finds every candidate contradicted names a better search, which the new `study.mjs requery` runs | PR 1, section 8, D |
| 3 | The stored-wrong meals | A wrong weight gets the new `21-portion.sql` (one food rescaled, nothing lost). A wrong record or recipe gets one re-analysis with the carry, kept only when it moves within 25% of the estimate. A stored food both reviewers find absent is removed on the ledger, under the PM's ruling of 01:24Z | PR 2, section 8, B |
| 4 | The study again | The same 20 meals and drafts, new readers, new seal, the same closing rule; the result is also given without the meals B changed | section 8, D |
| 5 | The five meals with no photo | Their drinks are checked against the drink tiles' own figures. Their captions are studied the same blind way, as a separate result | PR 1, section 8, E |

**The PM's ruling of 2026-11-18 01:24Z, for B3.** The ledgered-removal ruling of 2026-11-17 19:35Z also covers a stored food that both blind reviewers independently find absent from the photo, when the photo shows the whole plate, under these conditions:
- the owner's own caption or comment on the meal does not name that food (a food the owner names is never removed);
- the ledger names the meal, food and values;
- a snapshot exists first;
- the undo works;
- the restore rule still covers every other lost value.

Otherwise the food stays listed.

## 2. Facts the planner checked, and premises

- **The study's inputs** (`fleet32-study-replacement/private/ledger/`): the revised drafts `sample/blind-portion-drafts.json` (20 meals, 79 foods, sha256 `dfa234dd370e7a02d3378df069126b04685b55670eb4a3508499e40135e3b852`), the blind folder `blind/` (its `candidates.json`, `choices/`, sealed `estimates.json`, sha256 `9c4b75e388bf7d5b7dfaf2383cfa8273f1044326ffeb2c28037da94e962c6bcb`), and the map `blind-map.json`.
- **What the six differ on** (the study report's item table):

  | Meal | Deciding food(s) | Kind of difference |
  |---|---|---|
  | 2a45c157 | the chicken: one filled item 150 g (stored) against chicken 160 g, cheddar and mayonnaise (estimate) | record and recipe |
  | 24b9b270 | the peanuts, 40 g, stored only; the cocktail, 417.2 stored against 274.2 kcal | a food present or not; recipe |
  | 20512311 | the papaya, 210 g stored against 100 g, same 43 kcal per 100 g | weight |
  | 43753d2f | the dumpling, 30 g at 273 kcal per 100 g stored against 40 g at 113 | record |
  | 8fa8d835 | the rice: coconut rice 150 g at 267 kcal per 100 g stored against rice 100 g plus coconut milk 20 g | record and recipe |
  | 231dfd5e | the drink, 330 g: one radler record (68 kcal per 100 g) stored against half beer and half lemonade (44.5) | record |

- **Why the seven are incomplete.** In every case the readers declined a listed record and left it blank. For espresso, the photo didn't show it. For browned potatoes, the photo contradicted "boiled". For the beef, it didn't look like any listed record. For the oil (four meals), its type couldn't be seen. For the leaf variety and the onion type, the photo didn't settle them. For 1c4f16bf, a creamy coffee contradicted black-coffee records. The calories of cooking oils differ very little (about 880 to 900 kcal per 100 g). So "the type cannot be seen" is no reason to leave one out, and the same holds for a food named in the draft that the photo doesn't show. The second prompt (D2) says so. A real contradiction, like the creamy coffee, gets a better search of the reader's own (D3).
- **`21-portion.sql` on the planner's stack, end to end through the local worker.** A meal had papaya at 210 g (90.3 kcal, three micronutrients, one of them 0) and melon at 150 g. With `grams=100`, the job finished ready. The papaya came out at 100 g, 43.0 kcal, every value scaled by 100/210 and the zero kept. The melon was exactly unchanged, both foods were copied with `supersedes`, and a second run changed nothing. A same-weight, zero-weight or leftovers-weight food is refused.
- **The study tool's new parts** were tested: `requery` asks one search per food and query, only for an unchosen food of that meal, and adds its results after the first candidates, each record once, marked. `prepare --captions` writes a no-photo meal's caption and still refuses a meal with neither. 13 of 13 tests pass (`numbers-study` 12, `numbers-portion` 1). On main, `numbers-study.test.mjs` fails to import `requeryWanted`.
- **AGY reads a photo.** One planner run on a generated plate (no user data) — `agy --print … --add-dir <folder> --json-schema <file> --output-format json` — exited 0 in 31 seconds with a valid answer, and chose the cooked-rice reading over the raw one. The fresh `codex exec` reader was checked in Fleet 32 and ran for all 20 meals in the study.
- **Why both reviewers see the two readings unlabelled.** Neither is told which side is stored. A side is "A" or "B" by a fixed rule (section 8, A2), so the builder cannot tilt it either.
- **Verified on the planner's stack** with both PRs together: `npx tsc --noEmit` clean; `npx eslint` on the changed files clean; the database suite 51 of 51; the application suite 793 of 799 (6 skips, 0 failures).

## 3. Not in this run, and why

- The three meals failing a rule (6fad4a16, a0e6b3bf, e7e1782c) are Fleet 33 section 8's. The salami needs the owner's figure.
- A wider pass over unflagged meals: it waits for D's result.
- Every other backlog item: Fleets 32 and 33 list them with their reasons.

## 4. How it runs

As Fleet 33: one fresh worktree per PR from `origin/main` under `/tmp/mfa-f34`, `npm ci` in the worktree; your own stack `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f34/stack TEST_ENV_FILE=.env.test.fleet34`; per PR `node --check`, `npx tsc --noEmit`, `npx eslint` on the changed files, the named tests, and the red check on main; both suites once on a scratch branch of both PRs (10 minutes each); one PPLX review per code PR on its final head (AGY when PPLX is unavailable); the docs PR `docs/fleet34` with this plan unchanged as `docs/plan-fleet34.md`; then the stop.

## 5. The code PRs

### PR 1 — branch `fix34/study-pass2` — #990

File `scripts/numbers/study.mjs`.

Find:
```
//               A meal with any food unchosen or unlooked-up is incomplete and has no total. Prints the sha256 seal.
//   compare     estimates against stored totals: agrees when |stored - estimate| <= 25% of the estimate, and the
```
Replace:
```
//               A meal with any food unchosen or unlooked-up is incomplete and has no total. Prints the sha256 seal.
//   requery     (#990, Fleet 34) a second search for a food a reader left unchosen with a better search of its own
//               (choices/meal-NN.json: fdcId null and a non-empty "query"). Its results join that food's candidates,
//               and only those meals go to a second reader.
//   compare     estimates against stored totals: agrees when |stored - estimate| <= 25% of the estimate, and the
```

Find:
```

// Pure: one meal's estimate from its drafted foods, the reader's choices and the candidates.
```
Replace:
```

// Pure: the second searches the readers asked for: one per food and query, from choices with fdcId null.
export function requeryWanted(portions, choicesByMeal) {
  const wanted = new Map();
  for (const portion of portions) for (const choice of choicesByMeal[portion.meal]?.foods ?? []) {
    const query = typeof choice.query === 'string' ? choice.query.trim() : '';
    if (choice.fdcId == null && query && portion.foods.some(f => f.key === choice.key)) {
      const id = `${choice.key}\0${query.toLowerCase()}`;
      if (!wanted.has(id)) wanted.set(id, { key: choice.key, query, meals: [] });
      wanted.get(id).meals.push(portion.meal);
    }
  }
  return [...wanted.values()];
}

// Pure: a food's candidates with a second search's results added after them, each record once, the new ones marked.
export function mergeCandidates(existing, result) {
  if (!result?.ok) return existing;
  const seen = new Set((existing?.foods ?? []).map(f => f.fdcId));
  const added = result.foods.filter(f => !seen.has(f.fdcId)).map(f => ({ ...f, requery: result.query }));
  return { ...(existing ?? {}), ok: true, query: existing?.query ?? result.query, foods: [...(existing?.foods ?? []), ...added], requeries: [...(existing?.requeries ?? []), { query: result.query, attempts: result.attempts, added: added.length }] };
}

// Pure: one meal's estimate from its drafted foods, the reader's choices and the candidates.
```

Find:
```
    estimates: { type: 'string' }, stored: { type: 'string' }, 'max-minutes': { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help || !['prepare', 'candidates', 'total', 'compare'].includes(step)) {
    console.log(`node scripts/numbers/study.mjs prepare --drafts=<blind-portion-drafts.json> --sample=<folder of <prefix>/photo-* files> --blind=<new folder> --map=<private map file>
node scripts/numbers/study.mjs candidates --blind=<folder> [--max-minutes=10]      (needs FDC_API_KEY)
```
Replace:
```
    estimates: { type: 'string' }, stored: { type: 'string' }, captions: { type: 'string' }, 'max-minutes': { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help || !['prepare', 'candidates', 'requery', 'total', 'compare'].includes(step)) {
    console.log(`node scripts/numbers/study.mjs prepare --drafts=<blind-portion-drafts.json> --sample=<folder of <prefix>/photo-* files> --blind=<new folder> --map=<private map file> [--captions=<private {prefix: caption} file, for meals with no photo>]
node scripts/numbers/study.mjs candidates --blind=<folder> [--max-minutes=10]      (needs FDC_API_KEY)
node scripts/numbers/study.mjs requery --blind=<folder> [--max-minutes=10]         (needs FDC_API_KEY)
```

Find:
```
  const required = { prepare: ['drafts', 'sample', 'blind', 'map'], candidates: ['blind'], total: ['blind'], compare: ['estimates', 'map', 'stored'] };
```
Replace:
```
  const required = { prepare: ['drafts', 'sample', 'blind', 'map'], candidates: ['blind'], requery: ['blind'], total: ['blind'], compare: ['estimates', 'map', 'stored'] };
```

Find:
```
    const map = {}, portions = [];
    drafts.forEach((draft, index) => {
```
Replace:
```
    const map = {}, portions = [];
    // A meal with no photo is studied from its caption only when one is given for it (#990, the caption-only meals).
    const captions = values.captions ? readJson(values.captions) : {};
    drafts.forEach((draft, index) => {
```

Find:
```
      const photos = readdirSync(path.join(values.sample, draft.meal)).filter(f => f.startsWith('photo-')).sort();
      if (!photos.length) throw new Error(`Meal ${index + 1} has no photo.`);
```
Replace:
```
      const folder = path.join(values.sample, draft.meal);
      const photos = existsSync(folder) ? readdirSync(folder).filter(f => f.startsWith('photo-')).sort() : [];
      if (!photos.length && typeof captions[draft.meal] === 'string' && captions[draft.meal].trim()) privateWrite(path.join(values.blind, name, 'caption.txt'), captions[draft.meal].trim() + '\n');
      else if (!photos.length) throw new Error(`Meal ${index + 1} has no photo.`);
```

Find:
```
  }
  if (step === 'total') {
```
Replace:
```
  }
  if (step === 'requery') {
    const key = process.env.FDC_API_KEY;
    if (!key) throw new Error('FDC_API_KEY is not set.');
    const file = path.join(values.blind, 'candidates.json');
    const candidates = readJson(file), portions = readJson(path.join(values.blind, 'portions.json'));
    const choices = Object.fromEntries(portions.map(p => [p.meal, path.join(values.blind, 'choices', `${p.meal}.json`)]).filter(([, f]) => existsSync(f)).map(([m, f]) => [m, readJson(f)]));
    const wanted = requeryWanted(portions, choices), deadline = Date.now() + maxMinutes * 60000, failed = [];
    for (const want of wanted) {
      if (Date.now() > deadline) { failed.push(`${want.key} (not tried: --max-minutes used up)`); continue; }
      const result = await search(want.query, { key, log: line => console.log(line) });
      if (!result.ok) failed.push(`${want.key} "${want.query}" (${result.attempts.join(', ')})`);
      candidates[want.key] = mergeCandidates(candidates[want.key], result);
      privateWrite(file, JSON.stringify(candidates, null, 1) + '\n');
    }
    const meals = [...new Set(wanted.flatMap(w => w.meals))].sort();
    console.log(`${wanted.length} second search(es); meals for a second reader: ${meals.join(', ') || 'none'}.${failed.length ? ` Failed: ${failed.join('; ')}.` : ''}`);
    return failed.length ? 1 : 0;
  }
  if (step === 'total') {
```


File `tests/numbers-study.test.mjs`.

Find:
```
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
```
Replace:
```
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
```

Find:
```
import { estimateMeal, compareStudy } from '../scripts/numbers/study.mjs';
```
Replace:
```
import { estimateMeal, compareStudy, requeryWanted, mergeCandidates } from '../scripts/numbers/study.mjs';
```

Find:
```
  const r = estimateMeal({ meal: 'meal-01', foods: Array.from({ length: 20 }, () => ({ key: 'rice', grams: 1 })) }, { foods: [{ key: 'rice', fdcId: 1 }] }, { rice: { ok: true, foods: [{ fdcId: 1, kcal_per_100g: 1e308 }] } });
  assert.equal(r.complete, false); assert.equal(r.kcal, null);
});
```
Replace:
```
  const r = estimateMeal({ meal: 'meal-01', foods: Array.from({ length: 20 }, () => ({ key: 'rice', grams: 1 })) }, { foods: [{ key: 'rice', fdcId: 1 }] }, { rice: { ok: true, foods: [{ fdcId: 1, kcal_per_100g: 1e308 }] } });
  assert.equal(r.complete, false); assert.equal(r.kcal, null);
});

// #990, Fleet 34: a reader that finds no fitting record names a better search; a meal with no photo uses its caption.
test('a second search is asked once per food and query, only for an unchosen food of that meal', () => {
  const portions = [{ meal: 'meal-01', foods: [{ key: 'coffee', grams: 120 }, { key: 'oil', grams: 5 }] }, { meal: 'meal-02', foods: [{ key: 'coffee', grams: 200 }] }];
  const choices = { 'meal-01': { foods: [{ key: 'coffee', fdcId: null, query: 'coffee with condensed milk' }, { key: 'oil', fdcId: 7, query: 'ignored' }] },
    'meal-02': { foods: [{ key: 'coffee', fdcId: null, query: 'Coffee with condensed milk ' }, { key: 'not_in_meal', fdcId: null, query: 'x' }] } };
  assert.deepEqual(requeryWanted(portions, choices), [{ key: 'coffee', query: 'coffee with condensed milk', meals: ['meal-01', 'meal-02'] }]);
  assert.deepEqual(requeryWanted(portions, { 'meal-01': { foods: [{ key: 'coffee', fdcId: null, query: '  ' }] } }), []);
});

test('second-search results join a food once each, after its first candidates, and a failed search changes nothing', () => {
  const existing = { ok: true, query: 'coffee', foods: [{ fdcId: 1, kcal_per_100g: 1 }] };
  const merged = mergeCandidates(existing, { ok: true, query: 'coffee with milk', attempts: [200], foods: [{ fdcId: 1, kcal_per_100g: 1 }, { fdcId: 2, kcal_per_100g: 60 }] });
  assert.deepEqual(merged.foods.map(f => f.fdcId), [1, 2]);
  assert.equal(merged.foods[1].requery, 'coffee with milk');
  assert.equal(merged.query, 'coffee');
  assert.deepEqual(merged.requeries, [{ query: 'coffee with milk', attempts: [200], added: 1 }]);
  assert.equal(mergeCandidates(existing, { ok: false, query: 'x', attempts: [500] }), existing);
});

test('prepare studies a meal with no photo from its caption, and still refuses one with neither', t => {
  const dir = fixture(t);
  mkdirSync(path.join(dir, 'sample', 'aaaaaaaa'), { recursive: true });
  writeFileSync(path.join(dir, 'drafts.json'), JSON.stringify([{ meal: 'aaaaaaaa', foods: [{ key: 'rice', grams: 150 }], storedNumbersRead: false }]));
  writeFileSync(path.join(dir, 'captions.json'), JSON.stringify({ aaaaaaaa: 'a plate of rice' }));
  const ok = run(['prepare', `--drafts=${path.join(dir, 'drafts.json')}`, `--sample=${path.join(dir, 'sample')}`, `--blind=${path.join(dir, 'blind')}`, `--map=${path.join(dir, 'map.json')}`, `--captions=${path.join(dir, 'captions.json')}`]);
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(readFileSync(path.join(dir, 'blind', 'meal-01', 'caption.txt'), 'utf8'), 'a plate of rice\n');
  const refused = run(['prepare', `--drafts=${path.join(dir, 'drafts.json')}`, `--sample=${path.join(dir, 'sample')}`, `--blind=${path.join(dir, 'blind2')}`, `--map=${path.join(dir, 'map2.json')}`]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /has no photo/);
});
```


Named test: `tests/numbers-study.test.mjs` (12). Red check: on main it fails to import `requeryWanted`.

### PR 2 — branch `fix34/portion` — #990

File `scripts/numbers/README.md`.

Find:
```
20-decaf.sql writes in place, like 15: it removes caffeine (nutrient 1057) from a current food that is an alcoholic drink (alcohol above zero, or an alcoholic category) and names no caffeine source, and queues an operator recompute (#456). Run it only through `reanalyse.mjs run --mode=decaf`, which takes the snapshot first, ledgers the removed caffeine as values_removed with its reason, and puts the meal back if anything else is lost; `restore` undoes it with 15-repair-undo.sql.
```
Replace:
```
20-decaf.sql writes in place, like 15: it removes caffeine (nutrient 1057) from a current food that is an alcoholic drink (alcohol above zero, or an alcoholic category) and names no caffeine source, and queues an operator recompute (#456). Run it only through `reanalyse.mjs run --mode=decaf`, which takes the snapshot first, ledgers the removed caffeine as values_removed with its reason, and puts the meal back if anything else is lost; `restore` undoes it with 15-repair-undo.sql.

21-portion.sql writes, like 18: it gives one current food the weight both reviewers judged right (#990) and queues an operator recompute, which rescales that food's retained nutrition, every value by the same ratio, and keeps the other foods exactly. Take the snapshot (08) first and ledger the food, its old and new weight and the reason; `reanalyse.mjs restore` undoes it. It refuses the same weight, a weight of zero, a food with a leftovers weight, and a meal with a job.

22-items.sql is read-only and takes `-v prefixes=<prefix,prefix,...>`: each meal's current foods with weight, calories, calories per 100 g, matched record, category, whether it is a match, a closest record or an estimate, and the record's description. It prints food names and prefixes only (#990).
```


New files (section 6): `scripts/numbers/21-portion.sql`, `scripts/numbers/22-items.sql`, `tests/numbers-portion.test.mjs`.

Named test: `tests/numbers-portion.test.mjs` (1). Red check: `21-portion.sql` does not exist on main. Also run B3's undo check (section 8) on the local stack, and run `21-portion.sql` once through your local worker on a meal you insert: papaya 210 g with three micronutrients, one of them 0, and one other food, with `grams=100`. Report the papaya's values against 100/210 of the old ones, and the other food unchanged.

## 6. The new files

### `scripts/numbers/21-portion.sql`

```
-- #990: one food of a meal is given the weight both reviewers judged right, and the worker sums the meal again.
-- Every current food is copied (each copy supersedes its original, as in 18-remove.sql). The chosen food's copy gets
-- the new weight; recompute then rescales that food's retained nutrition to it, every value by the same ratio
-- (src/lib/nutrition/portion.ts), and keeps the others exactly. Nothing is looked up and no model is asked. The
-- operator takes the meal's snapshot (08) first and ledgers the food, its old and new weight and the reason;
-- 13-restore.sql through `reanalyse.mjs restore` puts the meal back.
-- psql variables: post (the full meal id), item (the full id of the current food) and grams (the new weight, above 0).
begin;
-- Lock the meal's row first, as 18-remove.sql does (#1040).
select id from public.posts where id = :'post'::uuid for update \g /dev/null
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
    and exists (select 1 from public.post_items i where i.id = :'item'::uuid and i.post_id = p.id and i.superseded_at is null
                and i.portion_grams > 0 and :'grams'::numeric > 0 and i.portion_grams <> :'grams'::numeric
                -- A food with a leftovers weight is not rescaled here: its eaten share would no longer add up.
                and i.not_eaten_grams is null and i.not_eaten_calories is null)
), old as (
  update public.post_items i set superseded_at = now()
  where i.post_id in (select id from meal) and i.superseded_at is null
  returning i.*
), copies as (
  insert into public.post_items (post_id, name, portion_text, portion_grams, box, mask_path, confidence, source, gtin,
                                 not_eaten_grams, count_text, not_eaten_count_text, not_eaten_calories, supersedes)
  select o.post_id, o.name,
         case when o.id = :'item'::uuid then round(:'grams'::numeric) || ' g' else o.portion_text end,
         case when o.id = :'item'::uuid then :'grams'::numeric else o.portion_grams end,
         o.box, o.mask_path, o.confidence, o.source, o.gtin, o.not_eaten_grams, o.count_text, o.not_eaten_count_text,
         o.not_eaten_calories, o.id
  from old o
  returning post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from copies)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select distinct id, 'recompute', 200, 'queued', '{"operator":"portion"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
```


### `scripts/numbers/22-items.sql`

```
-- #990: each listed meal's current foods with the numbers a reviewer compares: weight, calories, calories per 100 g,
-- the matched record and its description (found as 03 finds it). Read-only, one SELECT. Prints prefixes and food
-- names only, never a caption or comment. psql variable: prefixes (comma-separated 8-character meal prefixes).
with meals as (
  select p.id from public.posts p
  where left(p.id::text, 8) = any (string_to_array(:'prefixes', ',')) and p.deleted_at is null
), items as (
  select i.post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text, i.created_at,
         n.calories, n.source_ref, n.food_category, coalesce(n.micronutrients, '[]'::jsonb) as micro
  from public.post_items i join meals m on m.id = i.post_id
  left join public.item_nutrition n on n.post_item_id = i.id
  where i.superseded_at is null
), cache_foods as (
  -- One description per record, chosen the same way every run and by the rule of 06-seafood.sql:
  -- a detail entry ('fdc_cache detail') wins over a search entry ('fdc_cache search'); then the first description in text order.
  select distinct on (fdc_id) fdc_id, description from (
    select (f->>'fdcId') as fdc_id, f->>'description' as description, 'fdc_cache search' as found_in
    from public.fdc_cache c
    cross join lateral jsonb_array_elements(case when jsonb_typeof(coalesce(c.response->'payload'->'foods', c.response->'foods')) = 'array'
                                             then coalesce(c.response->'payload'->'foods', c.response->'foods') else '[]'::jsonb end) f
    union all
    select coalesce(c.response->'payload'->>'fdcId', c.response->>'fdcId'), coalesce(c.response->'payload'->>'description', c.response->>'description'), 'fdc_cache detail'
    from public.fdc_cache c where c.query like 'fdc-detail:%'
  ) d
  where fdc_id in (select source_ref from items where source_ref ~ '^[1-9][0-9]*$') and description is not null
  order by fdc_id, found_in, description
)
select left(it.post_id::text, 8) as meal, row_number() over (partition by it.post_id order by it.created_at, it.item_id) as food,
       it.name, round(it.portion_grams, 1) as grams, round(it.calories, 1) as kcal,
       case when it.portion_grams > 0 and it.calories is not null then round(it.calories / it.portion_grams * 100, 1) end as kcal_per_100g,
       it.source_ref as record, it.food_category as category,
       coalesce((select m->'approximation'->>'kind' from jsonb_array_elements(case when jsonb_typeof(it.micro) = 'array' then it.micro else '[]'::jsonb end) m
                 where m->'approximation'->>'kind' in ('closest', 'estimate') limit 1), 'match') as how,
       left(cf.description, 90) as description
from items it left join cache_foods cf on cf.fdc_id = it.source_ref
order by meal, food;
```


### `tests/numbers-portion.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990: one food gets the weight both reviewers judged right; every other food is copied exactly.
const file = fileURLToPath(new URL('../scripts/numbers/21-portion.sql', import.meta.url));
test('21-portion.sql gives one food its new weight, copies every food with supersedes, queues one operator recompute, and refuses the rest', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const portion = (post, item, grams) => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${item}`, '-v', `grams=${grams}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), papaya = randomUUID(), melon = randomUUID(), leftover = randomUUID(), other = randomUUID();
  t.after(() => sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','portion-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now()),('${other}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${papaya}','${post}','papaya','model',210,'1 cup'),('${melon}','${post}','honeydew melon','model',150,'1 cup');
insert into post_items(id,post_id,name,source,portion_grams,not_eaten_grams)values('${leftover}','${other}','fried rice','model',300,100);`);
  assert.equal(portion(post, papaya, 210).trim(), '', 'the same weight is refused');
  assert.equal(portion(post, papaya, 0).trim(), '', 'a weight of zero is refused');
  assert.equal(portion(other, leftover, 200).trim(), '', 'a food with a leftovers weight is refused');
  assert.match(portion(post, papaya, 100), /recompute/);
  const rows = sql(`select name||'|'||portion_grams||'|'||portion_text||'|'||supersedes from post_items where post_id='${post}' and superseded_at is null;`).trim().split('\n').sort();
  assert.deepEqual(rows, [`honeydew melon|150|1 cup|${melon}`, `papaya|100|100 g|${papaya}`]);
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "portion"}');
  assert.equal(portion(post, papaya, 90).trim(), '', 'the old food is no longer current, and the meal has a job queued');
});
```


## 7. The stop

Stop when both code PRs and the docs PR are open, each reviewed or reported "written, not reviewed". Report to the PM, in one message: each PR's number, branch, final head (40 characters), tests and counts, red result, review; the two suites' counts; anything void under section 2; and the merge order this plan expects: PR 1, PR 2, then the docs PR. Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. After the PM's merge order

From a fresh worktree of the new main. New private ledger `state/build/fleet34-postmerge/private/ledger`, mode 0700, files 0600. Reads use a read-only session. Stop conditions: a command that exits 1 where the step does not say what follows; a restore that does not take; 45 minutes of waiting in all. A stop ends section 8; report what ran.

**A. Decide the six.**

- **A1, the facts.** `22-items.sql` with `-v prefixes=2a45c157,24b9b270,20512311,43753d2f,8fa8d835,231dfd5e` into `<ledger>/a1-items.tsv`. From the study's sealed `estimates.json` and `candidates.json`, through `blind-map.json`, take each meal's estimate foods: key, grams, chosen record, its description and kcal per 100 g.
- **A2, the sides.** For each deciding food of section 2's table, write `<ledger>/review/<n>/sides.json`, numbered 1, 2, … in table order. The form is `{"food":"<plain food name>","A":{…},"B":{…}}`. Each side holds `present` (true, or false where that reading has no such food), `grams`, `record` (description) and `kcal_per_100g`; for a recipe split, it lists each part. A is the stored reading when the first hex digit of `md5('<meal prefix>fleet34')` is even, and the estimate otherwise. Record that mapping only in `<ledger>/review-key.json`. Copy that meal's photos into the same folder as `photo-1.jpg`, `photo-2.jpg` and so on. Put nothing else there: no prefix, caption, total or note of which side is which.
- **A3, two reviewers per food.** With `<schema>` = `{"type":"object","properties":{"prefers":{"type":"string","enum":["A","B","neither"]},"seen":{"type":"string"},"why":{"type":"string"}},"required":["prefers","seen","why"],"additionalProperties":false}` and `<prompt>` = "Look at the photos in this folder and read sides.json. Two readings of one food in this meal, A and B, differ in whether it is there, its grams, or its USDA record. First say in one or two sentences what the photos show for that food: whether it is there, its size against the plate and other foods, cooked or raw, fried or not, what it is made of. Then say which reading the photos support: A, B or neither (neither when the photos cannot tell). Use only these files. Reply only with JSON matching the schema.":
  - **Reviewer 1:** `env -u SUPABASE_DB_URL -u SUPABASE_SECRET_KEY -u SUPABASE_ACCESS_TOKEN -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -u FDC_API_KEY timeout 300 codex exec --ephemeral --skip-git-repo-check -s read-only -C <folder> -i <each photo> --output-schema <schema> -o <folder>/codex.json "<prompt>" < /dev/null`.
  - **Reviewer 2 (AGY):** `timeout 300 agy --print "<prompt>" --add-dir <folder> --json-schema <schema> --output-format json --print-timeout 280s < /dev/null > <folder>/agy.json`, taking `structured_output`. Run it from the folder.

  A reviewer that fails or gives no valid JSON counts as "neither" for that food. Do not run it again.
- **A4, the verdicts.**
  - **Per food:** if both reviewers prefer the stored side, the estimate is wrong for that food. If both prefer the estimate side, the stored reading is wrong. Anything else is undecidable.
  - **Per meal:** a meal is **stored-wrong** when its stored-wrong foods explain more than half of its gap. It is **estimate-wrong** when its estimate-wrong foods do. Otherwise it is **undecidable**. A food's share of the gap is its kcal difference between the two sides, from A1.
  - **Report:** a table of meal, food, what each reviewer saw (its `seen` sentence), each reviewer's side as stored or estimate, the food verdict, and the meal verdict.

**B. Correct the stored-wrong meals** (only those; at most 6). For each, by the kind of its largest stored-wrong food:

- **B1, a weight** (same food, same record, other grams; for example, a papaya):
  1. Take a snapshot with `08-snapshot.sql`, appended to `<ledger>/snapshots.jsonl`.
  2. Run `psql … -v post=<meal id> -v item=<that food's id> -v grams=<the estimate's grams> -f scripts/numbers/21-portion.sql`. It must print one recompute job.
  3. Wake the worker (`/api/jobs/tick`) and read the meal's status every 10 seconds for at most 240 seconds, until it is ready.
  4. Take a second snapshot into `<ledger>/after.jsonl`.
  5. Run the loss check (`lostValues`, as Fleet 30's P2 did). It must list nothing.
  6. Append a ledger line: `{"meal","mode":"portion","food","item","grams_before","grams_after","reason":"both reviewers' reading of the photo (#990, Fleet 34 A4)","before":<totals>,"after":<totals>,"at"}`.

  Any loss, or a failure, means `reanalyse.mjs restore --meal=<prefix> --ledger=<ledger> --snapshot=last --wait-seconds=240`.
- **B2, a record or a recipe:** `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=reanalyse --meals=<prefix> --ledger=<ledger> --max-meals=1 --wait-seconds=240`. The tool already puts the meal back on any loss it cannot carry. If it keeps the new result, keep it only when the new stored total lies within 25% of the sealed estimate. Otherwise run `restore --snapshot=last`. A meal the guards refuse is listed with its reason.
- **B3, a stored food both reviewers find absent,** under the PM's ruling of section 1. All five conditions must hold, or the food stays listed with the condition that failed:
  1. **Both reviewers find it absent.** Both chose the side where `present` is false for that food, each in its own run.
  2. **The photo shows the whole plate.** Both reviewers' `seen` sentences describe the whole plate or meal, not a close-up or a part. If either says the photo shows only part of the meal, the food stays listed.
  3. **The owner does not name it.** Read, privately and read-only, the meal's caption and every comment the owner wrote (`post_comments` with `author = 'user'`, including reverted ones). If any of them names the food, or a word for it (for example "peanut", "kacang" or "nuts" for peanuts), it is never removed. Record only the answer, "named" or "not named", and never the text.
  4. **The snapshot comes first.** Follow Fleet 30's P2 steps 1 to 7 with `18-remove.sql`. The ledger line names the meal, the food, its values (calories, protein, carbs, fat, fibre, sugar, sodium and the micronutrient count) and the reason "both blind reviewers find it absent from a photo of the whole plate, and the owner's caption and comments do not name it (PM ruling 2026-11-18 01:24Z)", with the totals before and after.
  5. **The loss check is clean.** Every lost value it lists must be that food's (under "renamed foods"), and every other food must keep its numbers. Otherwise run restore at once and report it.

  The undo is `reanalyse.mjs restore --meal=<prefix> --ledger=<ledger> --snapshot=last --wait-seconds=240`. Check it once on the local stack before production, as PR 2's evidence: remove a food from a meal you insert, restore it, and see that the meal comes back.
- Estimate-wrong and undecidable meals: no write; listed with their verdict.

Report each meal: what ran, kcal before and after, ledger line, and any restore.

**D. The study again, the same 20 meals.**

- **D1, prepare.** Use `study.mjs prepare` with the revised drafts of section 2 (check the sha256 first), the study's `sample/` folder, a new blind folder `<ledger>/blind2` and a new map `<ledger>/blind2-map.json`. Then run `candidates` in batches of 5 meals (each command at most 10 minutes), as the study run did.
- **D2, the readers, v2,** one fresh process per meal, in its own folder with only that meal's photos, `portions.json` and candidates, exactly as the study run did.
  - The reader command: the one in Fleet 32's S3, with the env, the sandbox, `< /dev/null` and `-o <folder>/choices/meal-NN.json`.
  - The schema adds a required `"query":{"type":"string"}` to each food.
  - The prompt: "You are choosing USDA records for a nutrition study. Use only the attached photos and the files portions.json and candidates.json in this folder. For each food of meal meal-NN in portions.json, choose the one record listed under that key in candidates.json that best matches the food. The foods and their grams are fixed: the person named them, so keep each even if you cannot see it, and choose the record that best matches its name and the way the photos show it cooked. When a detail cannot be seen (which oil, which leaf, which onion), choose the plainest common record for it; for cooking oil, any vegetable oil. Give fdcId null only when every listed record contradicts what the photos show (for example a milky coffee against only black-coffee records), and then give in query a better USDA search for it; otherwise give query as an empty string. Use no network. Reply only with JSON that matches the schema."
- **D3, the second search and second readers.** Run `FDC_API_KEY=<the app's key> timeout 600 node scripts/numbers/study.mjs requery --blind=<ledger>/blind2`. For each meal it names, keep the first choice file as `meal-NN.pass1.json` and run D2's reader once more for that meal. If a food is still null after that, its meal stays incomplete.
- **D4, seal:** `study.mjs total --blind=<ledger>/blind2`. Record the sha256. No stored number of these meals is read before this line, apart from what A1 and B already read for the six.
- **D5, compare:** `cards.mjs --zone=Asia/Jakarta` over the 20 prefixes into `<ledger>/d5-cards.txt`, then `study.mjs compare`. Report its table and its last line. Also give the same count without the meals B changed: they were changed toward the estimate, so the full count leans its way. The closing rule is the same: at least 17 complete and at least 85% agreeing. Both counts go to the PM, who decides whether the passing-meal part closes.

**E. The five meals with no photo** (5c802394, d4971e89, ef87b543, 5df62149, e9a5660b).

- **E1, their drinks (read-only).** For the three with sheet intake rows, list each row's kind, ml and amount, and the meal's stored foods (`22-items.sql`). Compare them with the drink tiles' own figures (`src/lib/intake/intake.ts`: `DRINK_TILES` and `TILE_SIZES`): a tile's caffeine for its size, and 0 kcal for water. Met when each sheet row matches its tile. This checks the numbers exactly, with no estimate.
- **E2, their captions.** A caption is the only evidence, so a caption-only meal can be checked only against what its caption says, not against what was eaten.
  - **The draft:** one fresh `codex exec --ephemeral` per meal, with the same env and sandbox and no image. It reads the caption from a file in its own folder, and the draft schema and prompt are Fleet 32's replacement draft, with "caption" for "photo". This gives `<ledger>/caption-drafts.json` (`storedNumbersRead: false`).
  - **The study:** `study.mjs prepare --captions=<private {prefix: caption} file>` into `<ledger>/blind-captions`, then D1 to D5's steps. The reader prompt says "the caption in caption.txt" for "the attached photos".
  - **Report:** a separate result of five, never counted in the 20. Met as a check when each meal's estimate is complete and within 25%; a disagreement is listed for the PM, with no write.

**What section 8 reports.** A4's table and verdicts; B per meal; D's table, both counts and the seal; E1 per drink row; E2's five, with seal and table; model use (reader and reviewer invocations, application model calls) and the waits.
