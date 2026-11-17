# Fleet 29 — #990's first bounded step: the 10 meals that still fail, a carry that keeps a fuller record, the micronutrient repair, and a census (2026-11-17)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** The ready part of the planner's Fleet 29 work, written at the PM's checkpoint of 2026-11-17 19:31Z. It has one code PR and one docs PR, one stop before the merges, and one production section after the PM's merge order. The other items of the 15:58Z packet are diagnosed in section 10 and carried to Fleet 30; nothing in section 10 is work for this fleet. Planned from main `45ea4cf7f190e9c01dd280e0d42f6e5f5dd07edd` and Fleet 28's production report (`state/build/fleet28-postmerge/report.md` and its private ledger).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and the waits of section 8 add up to at most 45 minutes (the PM's standing confirmation). Nothing here is a long run under AGENTS.md.

**Nothing runs against production before the merge order.** Every job of section 8 is an operator job, so the owner's phone gets no notification (#1001).

## 1. The items

| # | Item | What changes | Where |
|---|---|---|---|
| 1 | #990 | When a run's only losses are micronutrients of a food that is still there with the same name and weight, the operator tool adds the old entries to the new row (16-carry.sql) and keeps the meal, instead of putting it back. The butter of f08e2e86 gets its calories this way | PR 1 |
| 2 | #1029 | The repair also takes a row whose only negative value is a micronutrient; it is recorded and undone like any repair | PR 1 |
| 3 | #990 | Rule g1 no longer flags an iced tea at 0.40 kcal/g or less: an iced tea of unknown sweetness is counted as sweetened, Indonesia's default. Four meals leave the list; their numbers do not change | PR 1 |
| 4 | #990 | A read-only census of every account's ready meals, copies and saved meals (17-census.sql) | PR 1 |
| 5 | #990 | The 10 meals that still fail: what each needs, and the bounded run for the ones that can be fixed now | sections 2 and 8 |
| 6 | #990 | The sample frame for the meals that pass every rule, saved privately for Fleet 30's study | section 8 |

## 2. Facts the planner checked on 2026-11-17, and premises

Facts. Read on main `45ea4cf7` and in Fleet 28's private ledger (`state/build/fleet28-postmerge/private/ledger`); do not check them again.

- **The butter (f08e2e86).** Its packet is matched to Foundation record 789828 "Butter, stick, unsalted", which has fat and 13 micronutrients and no energy, so the meal shows no butter calories. Fleet 28's re-match found SR Legacy 173430 "Butter, without salt": 50.19 kcal for the 7 g, protein, carbohydrate, sugar and 111 micronutrients. That candidate lacked one value the old row had, iodine (nutrient 1100), so the PM's rule put the meal back. Comparing the meal as a whole, iodine is the only value it loses.
- **The coffee (1c4f16bf).** The re-analysis renamed the coffee "Vietnamese drip black coffee" and matched brewed coffee 2710375 (1.2 kcal), which ends the double count with the condensed milk. It also dropped the "partial background plate" of vegetables (85.2 kcal). Calories went 257 to 102 (−60.3%). Compared as a whole meal, it loses five minor values that came with the milk inside the old sweetened-coffee record 171880 (nutrients 1062, 1075, 1101, 1104, 1170). The tool's per-food comparison counted 84, because a renamed food is compared as a group. The caption names neither the vegetables nor the milk.
- **The label (1c18b87e).** Its one item, "Packaged food", 140 kcal, protein and carbohydrate NULL, comes from `readNutritionLabel` on the meal's first photo only (`src/lib/pipeline/analyze.ts`, the `named.nutritionLabel` branch). The meal has three photos. Fleet 28's re-analysis read the same first photo again (5 model calls) and stored the same partial panel.
- **The 3 g meals (a0e6b3bf, e7e1782c).** In each, the owner's comment contains a "3 g" figure, and the revision that answered it stored the food at 3 g (the planner read the comments privately and printed only the figures). The weight comes from the owner's own comment. It is not a count copied into grams, so no such backlog item is needed.
- **The iced teas (f1439c72, d3b40213, 5711e19c, d701fa08).** Each is matched to 2710515 at 0.32 kcal/g. None of their captions names sugar. d701fa08's owner comment gives volumes (530 mL, 250 mL) and a gram figure; its revision stored 250 mL at 80 kcal.
- **The salami (6fad4a16).** "1 bag", no gram weight, so its values are NULL. Two owner comments; 12-reanalyse.sql refuses a meal with an owner comment.
- **#1029.** `15-repair.sql` selects a row only when one of its seven scalar fields is negative; its micronutrient expression never runs for a row whose only negative value is a micronutrient. Rule f in 03, 04 and 14 has the same blind spot (unchanged here; R2 counts such rows directly).
- **Tested.** With PR 1 applied to an export of main, on the planner's own stack: `node --test tests/numbers-reanalyse.test.mjs` passes 20 of 20, the database tests included (the new micronutrient-only repair round trip among them). `npx eslint` on the two changed `.mjs` files is clean. `16-carry.sql` on a fixture row replaced the row's empty iodine entry with the old one, left calories and fat as they were, and changed nothing while a job was queued. 14-rule-failures.sql on fixtures drops plain iced teas at 0.32 kcal/g, and still flags an iced tea at 0.50 kcal/g and a hot tea at 0.32. 17-census.sql runs in a read-only session. The planner regenerated the plan's edits from the tested copy and re-applied them to main's text.

Premises. From reports, not checked by the planner.

- P1: No operator run has touched the 21 meals since Fleet 28's run; all are ready (Fleet 28 report).
- P2: Fleet 28's private ledger is kept, mode 0700. Section 8 writes a new ledger and does not touch the old one.
- P3: The owner's meals keep coming. A meal that starts failing a rule after 2026-11-17 16:00Z is listed by section 8 and not worked.

### 2.1 The 10 meals, and what each needs

| Meal | Rule | Needs | This fleet |
|---|---|---|---|
| f08e2e86 | a2 | Nothing new from anyone: a re-match with PR 1's carry | P2: re-match; expected kept at about 590.8 kcal (+9.3%) with iodine carried |
| f1439c72, d3b40213, 5711e19c, d701fa08 | g1 | A rule change (PR 1). The record already counts them sweet | They leave the list; numbers unchanged. If the owner's iced teas are usually unsweetened, one word from them reverses it |
| 1c18b87e | a2 | A code change: read the label from the meal's other photos too, then a photo re-analysis | Listed; carried to Fleet 30 (section 10) |
| 1c4f16bf | g1 | An owner comment, or a PM ruling: any correct fix removes the double-counted milk's values, and the re-analysis also dropped the vegetables | Listed. The owner sentence is in section 9 |
| 6fad4a16 | a2, e | An owner comment with the bag's weight | Listed: the known exception of #523 |
| a0e6b3bf, e7e1782c | e | Nothing: the 3 g comes from the owner's comment | Listed with that reason |

## 3. Not in this run, and why

| Item | Why it is left out |
|---|---|
| #1018, #1022, #703, #659, #937, and #990's label read | Diagnosed and designed (section 10), not yet written and tested as exact edits. Carried to Fleet 30 so this fleet can start now |
| #708 | Fleet 26's K2 met its done line locally (the failed chip was gone after the retake and after a second reload). What remains is GrokBot's production look |
| #523 | Closed on GitHub, open on the backlog. Its done line needs a browser look on production once this fleet's P2 has run; 6fad4a16 and 1c18b87e will still show a blank value, each listed with its reason |
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
| #988, #987 | In the GrokBot section of the backlog, not named in the packet |
| #323's setting | The PM's order (Fleet 28, section 7.2) |

## 4. How it runs

1. **Worktree.** One fresh worktree from `origin/main`, under `/tmp/mfa-f29`; `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61160 TEST_PG_PORT=55629 TEST_STACK_DIR=/tmp/mfa-f29/stack TEST_ENV_FILE=.env.test.fleet29`. Keep `TEST_STACK_DIR` short (a Postgres socket path over 107 bytes is refused). Never stop or touch a container that does not end in `-61160`.
3. **Tests.** `set -a; . ./.env.test.fleet29; set +a; PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC timeout 600 node --test tests/numbers-reanalyse.test.mjs`. PR 1 changes no app code, so no app build or full suite is needed for it.
4. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx eslint scripts/numbers/reanalyse.mjs tests/numbers-reanalyse.test.mjs`; the named tests.
5. **Review.** One PPLX review of PR 1 on its final head, full 40-character SHA, with main's runner. AGY when PPLX is unavailable. The docs PR needs no review.
6. **Docs PR**, branch `docs/fleet29` from `origin/main`: commit this plan unchanged as `docs/plan-fleet29.md`.
7. **Stop** (section 7).

## 5. The code PR

### PR 1 — branch `fix29/numbers-carry` — #990, #1029

**Service:** none a person runs: `scripts/numbers/`, the operator's study and re-analysis files.
**What changes:** (1) `reanalyse.mjs`: a new pure `carryPlan(before, after)`. When every value a run lost is a micronutrient of a food that is still there exactly once under the same name and the same grams, is not water (1051), caffeine (1057) or alcohol (1018), and the meal has no saved meal, the tool runs the new `16-carry.sql` for each such food, reads the meal again and compares once more. It keeps the meal when nothing is lost any more and lists the carried values as `values_carried`; otherwise it puts the meal back as before. (2) `15-repair.sql` also selects a row whose only negative value is a micronutrient (#1029). (3) Rule g1 skips an iced tea at 0.40 kcal/g or less, the same way in 03, 04 and 14. (4) New read-only `17-census.sql`. README and help text follow.

New files, given whole in section 6: `scripts/numbers/16-carry.sql`, `scripts/numbers/17-census.sql`.

File `scripts/numbers/reanalyse.mjs`.

Find:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15 and 15-repair-undo) through psql and wakes the worker with /api/jobs/tick.
```
Replace:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15, 15-repair-undo and 16) through psql and wakes the worker with /api/jobs/tick.
```

Find:
```
  moved by more than half. The ledger line says why.

```
Replace:
```
  moved by more than half. The ledger line says why.
  When the only values lost are micronutrients of a food that is still there with the same name and weight, and
  none is water, caffeine or alcohol, 16-carry.sql first adds the old entries to that food's new row and the meal
  is compared again; it is kept when nothing is lost any more. The ledger line lists them (values_carried).

```

Find:
```
  compare('renamed foods', was.filter((item) => !nowNames.has(key(item))), now.filter((item) => !wasNames.has(key(item))));
  return lost;
}

```
Replace:
```
  compare('renamed foods', was.filter((item) => !nowNames.has(key(item))), now.filter((item) => !wasNames.has(key(item))));
  return lost;
}

// Nutrients a carry never adds: they feed the day's alcohol, water and caffeine totals.
export const NOT_CARRIED = new Set([1018, 1051, 1057]);

// Pure: #990. When every value a run lost is a micronutrient of a food still there under the same name and weight,
// the steps that add the old entries to that food's new row with 16-carry.sql, as [{ item, entries, lost }]; null
// when any lost value cannot be carried so (then the meal is put back). A re-match that finds a fuller record keeps
// both: the butter of f08e2e86 gained energy, protein and 98 micronutrients from 173430 but had lost iodine (1100).
// A meal with a saved meal is never carried: the saved copy would not get the entries.
export function carryPlan(before, after) {
  const lost = lostValues(before, after);
  if (!lost.length || (before?.saved_meals ?? []).length) return null;
  const current = (snapshot) => (snapshot?.items ?? []).filter((item) => item.superseded_at === null);
  const key = (item) => String(item.name ?? '').trim().toLowerCase();
  const was = current(before), now = current(after), steps = new Map();
  for (const label of lost) {
    const match = /^food (\d+): nutrient (\d+)$/.exec(label);
    if (!match || NOT_CARRIED.has(Number(match[2]))) return null;
    const old = was[Number(match[1]) - 1], id = Number(match[2]);
    const same = (items) => items.filter((item) => key(item) === key(old));
    const fresh = same(now);
    if (fresh.length !== 1 || same(was).length !== 1 || old.portion_grams == null || Number(old.portion_grams) !== Number(fresh[0].portion_grams) || !fresh[0].nutrition) return null;
    const entry = (Array.isArray(old.nutrition?.micronutrients) ? old.nutrition.micronutrients : []).find((n) => Number(n?.nutrientId) === id && n.value != null);
    if (!entry) return null;
    const step = steps.get(fresh[0].id) ?? { item: fresh[0].id, entries: [], lost: [] };
    step.entries.push(entry); step.lost.push(label); steps.set(fresh[0].id, step);
  }
  return [...steps.values()];
}

```

Find:
```
          if (afterLine) { appendPrivate(ledger, 'after.jsonl', afterLine); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(afterLine)); }
```
Replace:
```
          if (afterLine) {
            appendPrivate(ledger, 'after.jsonl', afterLine); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(afterLine));
            const carry = row.outcome === 'failed' ? null : carryPlan(JSON.parse(snapshot), JSON.parse(afterLine));
            if (carry) {
              for (const step of carry) psql({ file: sqlFile('16-carry.sql'), vars: { post: id, item: step.item, entries: JSON.stringify(step.entries) } });
              const carried = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
              if (carried) { appendPrivate(ledger, 'after.jsonl', carried); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(carried)); }
              else row.values_lost = ['the meal could not be read after its carry'];
              if (!row.values_lost.length) row.values_carried = carry.flatMap((step) => step.lost);
            }
          }
```

Find:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```
Replace:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.values_carried ? ` [carried: ${row.values_carried.join('; ')}]` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```

File `scripts/numbers/15-repair.sql`.

Find:
```
    and (n.calories < 0 or n.protein_g < 0 or n.carbs_g < 0 or n.fat_g < 0 or n.fibre_g < 0 or n.sugar_g < 0 or n.sodium_mg < 0)
```
Replace:
```
    and (n.calories < 0 or n.protein_g < 0 or n.carbs_g < 0 or n.fat_g < 0 or n.fibre_g < 0 or n.sugar_g < 0 or n.sodium_mg < 0
         -- #1029: a row whose only negative value is a micronutrient is repaired too.
         or (jsonb_typeof(n.micronutrients) = 'array' and exists (
               select 1 from jsonb_array_elements(n.micronutrients) e(m)
               where jsonb_typeof(m->'value') = 'number' and (m->>'value')::numeric < 0)))
```

File `scripts/numbers/03-suspicious.sql`.

Find:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
  union all
```
Replace:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
    -- #990: an iced tea of unknown sweetness is counted as sweetened, Indonesia's default (es teh manis), up to 0.40 kcal/g.
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
  union all
```

File `scripts/numbers/04-summary.sql`.

Find:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
  union all
```
Replace:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
    -- #990: an iced tea of unknown sweetness is counted as sweetened, Indonesia's default (es teh manis), up to 0.40 kcal/g.
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
  union all
```

File `scripts/numbers/14-rule-failures.sql`.

Find:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
), failing as (
```
Replace:
```
    and portion_grams > 0 and calories / portion_grams > 0.25
    and not (name ~* '\miced\M' and name ~* '\mtea\M' and calories / portion_grams <= 0.40)
), failing as (
```

File `scripts/numbers/README.md`.

Find:
```
Files 10 to 13 and 15 write. They keep every old row, marked superseded (15 changes a negative value to zero in place). Take the snapshot (08) first: it is the only way back.
```
Replace:
```
Files 10 to 13, 15 and 16 write. They keep every old row, marked superseded (15 changes a negative value to zero in place, 16 adds micronutrient entries to a new row). Take the snapshot (08) first: it is the only way back.
```

Find:
```
`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql, 12-reanalyse.sql or 15-repair.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. When a meal has finished, it is read again (`<ledger>/after.jsonl`) and put back from its snapshot at once if it failed or asks a question, lost any nutrition value it had (a zero is a value, NULL is not; micronutrients count), or its calories moved by more than half (#989). `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. A `failed` or `needs_input` meal first regains the snapshot's ready state, question fields and analysis time. Repair must run through the CLI: before 15-repair.sql writes, the private snapshot records every original nutrition row and marks the snapshot as a repair. Restoring that snapshot runs 15-repair-undo.sql first, writing the original nutrition values (including NULLs, zeros and micronutrients) back onto the same item IDs; 13-restore.sql then restores the items and summary and queues the recompute. Run neither repair SQL file without its CLI snapshot and guards. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.
```
Replace:
```
`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql, 12-reanalyse.sql or 15-repair.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. When a meal has finished, it is read again (`<ledger>/after.jsonl`) and put back from its snapshot at once if it failed or asks a question, lost any nutrition value it had (a zero is a value, NULL is not; micronutrients count), or its calories moved by more than half (#989). When the only values lost are micronutrients of a food that is still there with the same name and weight (not water, caffeine or alcohol, and not on a meal with a saved meal), 16-carry.sql first adds the old entries to the food's new row, and the meal is kept when it then loses nothing; the ledger line lists them as `values_carried` (#990). `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. A `failed` or `needs_input` meal first regains the snapshot's ready state, question fields and analysis time. Repair must run through the CLI: before 15-repair.sql writes, the private snapshot records every original nutrition row and marks the snapshot as a repair. Restoring that snapshot runs 15-repair-undo.sql first, writing the original nutrition values (including NULLs, zeros and micronutrients) back onto the same item IDs; 13-restore.sql then restores the items and summary and queues the recompute. Run neither repair SQL file without its CLI snapshot and guards. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.

17-census.sql is read-only too and takes no variable: one row per account with a ready meal (its first 8 characters), with its ready meals, copies, saved meals and saved meals whose meal is gone (#990).
```

File `tests/numbers-reanalyse.test.mjs`.

Find:
```
import { EXIT, HELP, UsageError, compareTotals, findSnapshot, isInside, ledgerRefusal, lostValues, parseArgs, parseMealsFile, relativeChange, restoreParams, restoreReason, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';
```
Replace:
```
import { EXIT, HELP, UsageError, carryPlan, compareTotals, findSnapshot, isInside, ledgerRefusal, lostValues, parseArgs, parseMealsFile, relativeChange, restoreParams, restoreReason, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';
```

Find:
```
function cliFixture(t, { restore = false, usage = [], after = null } = {}) {
```
Replace:
```
function cliFixture(t, { restore = false, usage = [], after = null, before = null, carried = null } = {}) {
```

Find:
```
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: snapshot(A), restore, usage, after }));
```
Replace:
```
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: before ?? snapshot(A), restore, usage, after, carried }));
```

Find:
```
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.after && previous.includes('11-rematch.sql') ? fixture.after : fixture.snapshot));
```
Replace:
```
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.carried && previous.includes('16-carry.sql') ? fixture.carried : fixture.after && previous.includes('11-rematch.sql') ? fixture.after : fixture.snapshot));
```

Find:
```
} else if (file === '11-rematch.sql') console.log('queued');
else if (sql.includes('select left(id::text, 8)')) console.log(fixture.id.slice(0, 8) + ' ' + fixture.id);
```
Replace:
```
} else if (file === '11-rematch.sql') console.log('queued');
else if (file === '16-carry.sql') console.log('carried');
else if (sql.includes('select left(id::text, 8)')) console.log(fixture.id.slice(0, 8) + ' ' + fixture.id);
```

Find:
```

// PM 2026-11-17 14:56: the tool must actually put a needs_input meal back, including its question state.
```
Replace:
```

// #990: a re-match that finds a fuller record but lacks one micronutrient keeps both, instead of being put back.
const butterMeal = (nutrition, extra = {}) => ({ post: { id: A, status: 'ready' }, saved_meals: [], comments: [], items: [
  { id: 'aaaaaaaa-0000-4000-8000-000000000009', name: 'sliced apple', portion_grams: 60, superseded_at: null, nutrition: { calories: 36.6, micronutrients: [] } },
  { id: 'aaaaaaaa-0000-4000-8000-00000000000b', name: 'unsalted butter packet', portion_grams: 7, superseded_at: null, nutrition }], ...extra });
const foundation = { calories: null, fat_g: 5.705, micronutrients: [{ nutrientId: 1100, value: 0.0001, basis: 'portion' }, { nutrientId: 1087, value: 1.68, basis: 'portion' }] };
const legacy = { calories: 50.19, protein_g: 0.06, fat_g: 5.677, micronutrients: [{ nutrientId: 1087, value: 1.68, basis: 'portion' }, { nutrientId: 1100, value: null }, { nutrientId: 1092, value: 1.68, basis: 'portion' }] };
const fresh = (meal) => ({ ...meal, items: meal.items.map((i) => ({ ...i, id: i.id.replace('aaaaaaaa', 'bbbbbbbb') })) });

test('a lost micronutrient of the same food is carried, and nothing else is', () => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  assert.deepEqual(carryPlan(before, after), [{ item: 'bbbbbbbb-0000-4000-8000-00000000000b', entries: [foundation.micronutrients[0]], lost: ['food 2: nutrient 1100'] }]);
  assert.equal(carryPlan(before, fresh(butterMeal({ ...legacy, micronutrients: [...legacy.micronutrients.slice(0, 1), { nutrientId: 1100, value: 0.0002 }] }))), null, 'nothing lost, nothing to carry');
  assert.equal(carryPlan(before, fresh(butterMeal({ ...legacy, fat_g: null }))), null, 'a lost scalar value is never carried');
  const renamed = fresh(butterMeal(legacy)); renamed.items[1].name = 'butter';
  assert.equal(carryPlan(before, renamed), null, 'a renamed food is never carried');
  const heavier = fresh(butterMeal(legacy)); heavier.items[1].portion_grams = 14;
  assert.equal(carryPlan(before, heavier), null, 'a food whose weight changed is never carried');
  const caffeine = butterMeal({ ...foundation, micronutrients: [{ nutrientId: 1057, value: 40, basis: 'portion' }] });
  assert.equal(carryPlan(caffeine, after), null, 'caffeine, water and alcohol feed day totals and are never carried');
  assert.equal(carryPlan({ ...before, saved_meals: [{ id: 's' }] }, after), null, 'a meal with a saved meal is never carried');
});

test('the CLI carries a lost micronutrient and keeps the re-match', t => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  const carried = fresh(butterMeal({ ...legacy, micronutrients: [legacy.micronutrients[0], legacy.micronutrients[2], foundation.micronutrients[0]] }));
  const { result, calls, ledger } = cliFixture(t, { before, after, carried });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'unchanged', 'the fake totals do not move; the meal is kept');
  assert.deepEqual(line.values_carried, ['food 2: nutrient 1100']);
  assert.deepEqual(line.values_lost, []);
  assert.equal(line.restore_reason, undefined);
  const carry = calls.filter((call) => call.file === '16-carry.sql');
  assert.equal(carry.length, 1);
  assert.ok(!calls.some((call) => call.sql?.includes('13-restore.sql')), 'nothing is put back');
  assert.match(result.stdout, /carried: food 2: nutrient 1100/);
});

test('the CLI puts the meal back when the carry did not take', t => {
  const before = butterMeal(foundation), after = fresh(butterMeal(legacy));
  const { result, calls, ledger } = cliFixture(t, { before, after, carried: after });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'restored');
  assert.equal(line.values_carried, undefined);
  assert.ok(calls.some((call) => call.file === '16-carry.sql'));
  assert.ok(calls.some((call) => call.sql?.includes('13-restore.sql')), 'the restore SQL ran');
});

// PM 2026-11-17 14:56: the tool must actually put a needs_input meal back, including its question state.
```

Find:
```
test('repair records original nutrition before writing and restore undoes it on the same item IDs', { skip: !process.env.TEST_SQL_DATABASE_URL }, async t => {
```
Replace:
```
async function repairRoundTrip(t, { carbs }) {
```

Find:
```
values('${item}',50,2,-0.7,1,null,0,5,'[{"nutrientId":1005,"value":-0.7,"basis":"portion"},{"nutrientId":1087,"value":null},{"nutrientId":1089,"value":0}]');`);
```
Replace:
```
values('${item}',50,2,${carbs},1,null,0,5,'[{"nutrientId":1005,"value":-0.7,"basis":"portion"},{"nutrientId":1087,"value":null},{"nutrientId":1089,"value":0}]');`);
```

Find:
```
 assert.equal(old.carbs_g,-0.7);assert.equal(old.micronutrients[0].value,-0.7);
```
Replace:
```
 assert.equal(old.carbs_g,Number(process.env.REPAIR_CARBS));assert.equal(old.micronutrients[0].value,-0.7);
```

Find:
```
  const env = {...process.env, PATH: bin+path.delimiter+process.env.PATH, SUPABASE_DB_URL: url, APP_URL: 'http://127.0.0.1:1', REPAIR_REAL_PSQL: realPsql, REPAIR_LEDGER: ledger, REPAIR_ITEM: item, REPAIR_POST: post, REPAIR_RECORDED: path.join(directory,'recorded')};
```
Replace:
```
  const env = {...process.env, PATH: bin+path.delimiter+process.env.PATH, SUPABASE_DB_URL: url, APP_URL: 'http://127.0.0.1:1', REPAIR_REAL_PSQL: realPsql, REPAIR_LEDGER: ledger, REPAIR_ITEM: item, REPAIR_POST: post, REPAIR_RECORDED: path.join(directory,'recorded'), REPAIR_CARBS: String(carbs)};
```

Find:
```
  assert.equal(repaired.carbs_g,0);
```
Replace:
```
  assert.equal(repaired.carbs_g,Math.max(carbs,0));
```

Find:
```
  assert.equal(sql(`select string_agg(id::text,',')from current_post_items where post_id='${post}';`).trim(),item,'the same item ID remains current');
});
```
Replace:
```
  assert.equal(sql(`select string_agg(id::text,',')from current_post_items where post_id='${post}';`).trim(),item,'the same item ID remains current');
}

test('repair records original nutrition before writing and restore undoes it on the same item IDs', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => repairRoundTrip(t, { carbs: -0.7 }));

// #1029: a row whose only negative value is a micronutrient is repaired and undone the same way.
test('repair also takes a row whose only negative value is a micronutrient', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => repairRoundTrip(t, { carbs: 2 }));
```

**Tests:** `tests/numbers-reanalyse.test.mjs`, 20 tests with the stack's environment loaded (the two database round trips run only with `TEST_SQL_DATABASE_URL`, which the stack's env file sets). New: the carry rules (same food, scalar never, renamed never, weight changed never, caffeine never, saved meal never), the CLI keeping a carried re-match, the CLI putting a meal back when the carry did not take, and the micronutrient-only repair round trip.

**Fixture checks, on your stack, recorded in the stop report:** (a) `16-carry.sql` on one fixture row (an item with `[{"nutrientId":1087,"value":1.68},{"nutrientId":1100,"value":null}]` and entries `[{"nutrientId":1100,"value":0.0001,"basis":"portion"}]`): one row updated, two entries, 1100 holds 0.0001, calories and fat unchanged. With a queued job for the meal, the same call updates no row. (b) 14-rule-failures.sql on four fixture meals ("iced tea" at 96 kcal per 300 g, "Indonesian iced tea" at 96 per 300 g, "iced tea" at 150 per 300 g, "hot tea" at 96 per 300 g): exactly the last two are listed under g1. Delete every fixture row afterwards.

**Done when:** those pass.

## 6. The new files

### `scripts/numbers/16-carry.sql`

```
-- #990: add micronutrient entries that a run's new nutrition row lacks, taken from the same food's old row, so a
-- re-match that finds a fuller record loses nothing (the butter of f08e2e86 gained energy and protein but had no
-- iodine). Only reanalyse.mjs runs it, after its own checks: the food has the same name and weight before and after,
-- and the entry is not water, caffeine or alcohol, which feed the day's totals. An entry for the same nutrient that
-- the new row holds with no value is replaced; every other entry stays as it is. Nothing else in the row changes.
-- psql variables: post (the full meal id), item (the new current item id) and entries (a JSON array of entries).
begin;
update public.item_nutrition n set micronutrients = (
  select coalesce(jsonb_agg(m order by o), '[]'::jsonb)
  from jsonb_array_elements(case when jsonb_typeof(n.micronutrients) = 'array' then n.micronutrients else '[]'::jsonb end) with ordinality e(m, o)
  where not exists (select 1 from jsonb_array_elements(:'entries'::jsonb) c where c->>'nutrientId' = m->>'nutrientId')
) || :'entries'::jsonb
from public.post_items i, public.posts p
where n.post_item_id = :'item'::uuid and i.id = n.post_item_id and i.superseded_at is null and i.post_id = :'post'::uuid
  and p.id = i.post_id and p.status = 'ready' and p.deleted_at is null
  and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
  and jsonb_typeof(:'entries'::jsonb) = 'array'
returning left(n.post_item_id::text, 8) as item, jsonb_array_length(n.micronutrients) as micronutrients;
commit;
```

### `scripts/numbers/17-census.sql`

```
-- #990: what the other accounts and the saved meals hold, before any of them is worked. Read-only, one SELECT, no
-- psql variable. One row per account with at least one ready meal: the account's first 8 characters only, its ready
-- meals, the copies among them (a meal logged again from another, source_post_id), its saved meals, and the saved
-- meals whose meal is deleted or gone. Run 14-rule-failures.sql with each account's id for its failing meals.
select left(u.id::text, 8) as account,
       count(p.id) filter (where p.status = 'ready' and p.deleted_at is null) as ready_meals,
       count(p.id) filter (where p.status = 'ready' and p.deleted_at is null and p.source_post_id is not null) as copies,
       (select count(*) from public.saved_meals s where s.user_id = u.id) as saved_meals,
       (select count(*) from public.saved_meals s where s.user_id = u.id
          and not exists (select 1 from public.posts q where q.id = s.source_post_id and q.deleted_at is null)) as saved_without_meal
from public.profiles u
join public.posts p on p.user_id = u.id
group by u.id
having count(p.id) filter (where p.status = 'ready' and p.deleted_at is null) > 0
order by ready_meals desc, account;
```

## 7. The stop

Stop when PR 1 and the docs PR are open, and PR 1 is reviewed or reported "written, not reviewed". Report to the PM, in one message: PR 1's number, branch, final head (40 characters), its test count and the fixture checks of section 5, the review's result, the docs PR's number and head, and anything void under section 2. The merge order this plan expects: PR 1, then the docs PR. Then wait for the PM's merge order, which names each PR and its full head SHA.

## 8. After the PM's merge order: #990's first bounded step

Run this only after both PRs have merged. PR 1 changes no deployed code: the operator tool runs from your worktree at the merged main. Keep every private file in a new ledger, `state/build/fleet29-postmerge/private/ledger`, mode 0700, files 0600. Print and commit meal and account prefixes only, never a caption or comment text.

Reads use a read-only session: `PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 ...`. The owner's account id is derived and checked as in Fleet 28, never printed.

- **R1, the list.** `14-rule-failures.sql` with the owner's id. Save it privately. Expected: the four iced teas are gone, and the six other meals of section 2.1 remain. Report any other meal (P3) by prefix and rules, and do not work it.
- **R2, micronutrient-only negatives.** On the owner's account: `select left(i.post_id::text,8) from post_items i join item_nutrition n on n.post_item_id=i.id join posts p on p.id=i.post_id where p.user_id=:'uid' and p.status='ready' and p.deleted_at is null and i.superseded_at is null and jsonb_typeof(n.micronutrients)='array' and exists(select 1 from jsonb_array_elements(n.micronutrients) m where jsonb_typeof(m->'value')='number' and (m->>'value')::numeric<0) group by 1 order by 1;`. Each prefix it prints goes to P3, at most five; any more are listed.
- **P1, dry run.** `node scripts/numbers/reanalyse.mjs run --mode=rematch --meals=f08e2e86 --ledger=<new ledger> --dry-run`. It must read "would snapshot". Bound: 60 seconds.

Every write below is one command per meal: `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=<mode> --meals=<prefix> --ledger=<new ledger> --max-meals=1 --wait-seconds=240`. Two meals in a row that end "failed" stop section 8.

- **P2, the butter.** Mode `rematch`, meal f08e2e86. Expected: about 8 model calls; outcome "changed" with `values_carried` ["food 4: nutrient 1100"], calories about 540.6 to 590.8. If the re-match finds another record and the ledger line says "put back", that is the result: report it with the reason, and do not run the meal again. Undo for a kept meal: `node scripts/numbers/reanalyse.mjs restore --meal=f08e2e86 --ledger=<new ledger> --snapshot=last --wait-seconds=240`.
- **P3, repairs.** Mode `repair`, each meal from R2. Expected: "changed", calories the same, no model call. Undo: restore, as P2.
- **R3, the census.** `17-census.sql`, then `14-rule-failures.sql` once for each account it lists, counting the rows only. Report one table: account prefix, ready meals, copies, saved meals, saved meals without a meal, failing meals. Bound: 60 seconds per query.
- **R4, the sample frame.** On the owner's account, the ready meals that 14-rule-failures does not list, in a fixed order: `select left(p.id::text,8) from posts p where p.user_id=:'uid' and p.status='ready' and p.deleted_at is null and p.source_post_id is null order by md5(p.id::text||'fleet29');`. Remove the R1 prefixes, keep the first 20, and save them privately as `sample-frame.txt`. Report the count only. Nothing is written to the database.
- **R5, the final list and the usage.** `14-rule-failures.sql` again, and `09-usage.sql` for the meals of P2 and P3 since P2 began.

Stop conditions: two meals in a row that end "failed"; a command that exits 1 for any other reason; 45 minutes of waiting in all, counted from P2. A stop ends section 8; report what ran.

**What section 8 reports.** One table with the 10 meals of section 2.1 and any meal from R1, R2 or P3: prefix, rules before, what ran, outcome, rules after, and the reason for each meal that still fails. Add R3's table and R4's count. Ask GrokBot, through the PM, to read the card and day total of f08e2e86 if it changed. #990 stays open: the study of the sample, the other accounts and the saved meals is Fleet 30's.

## 9. For RT

Nothing here waits on you. Two optional sentences, if you want these meals changed:

1. Four meals hold a plain "iced tea", counted as sweetened. If your iced teas are usually unsweetened, say so, and they are recounted.
2. The Vietnamese coffee of your meal 1c4f16bf is counted twice, once as sweetened coffee and once as condensed milk. A comment on that meal such as "The coffee is black; the sweetness is the condensed milk" corrects it.

## 10. Carried to Fleet 30: what the planner found

Each item below is diagnosed on main `45ea4cf7` and designed, but not yet written as tested exact edits. None of it is work for this fleet.

- **#1018, the hour boundary.** Confirmed from code: `tests/composer-drinks-route.test.mjs` fixes its hour bucket once at the start (`hour.setUTCMinutes(0,0,0)`) and caps and reads that bucket, while `increment_user_call` counts into `date_trunc('hour', clock_timestamp())` at the moment of each call (migration 0046). Crossing the hour, the route's one hit lands in the new bucket and the test reads 0 from the old one: exactly the recorded failure. Design: `cap` writes the same value to this hour's and the next hour's bucket, and `hits` returns the larger of the two buckets the last `cap` wrote; cleanup removes both.
- **#1022, the long header.** The handle is `truncate` in `src/components/PostCard.tsx` (a fixed `h-[52px]` row) and in `src/components/PostDetailHeader.tsx`. Engineering default: wrap, as the packet asks. Replace `truncate` with `[overflow-wrap:anywhere]` in both, and make the card row `min-h-[52px]`. Check at 390 wide with a 30-character handle: the whole handle shows, scroll width equals client width, and the menu stays 44 by 44.
- **#703, the test.** The fix is on main (`attempt` is in the effect's dependencies, `src/components/PostOpenTransition.tsx`), and Fleet 26's K1 showed the second failure and the release. No test covers it, which the done line asks for. Design: move the two timers into a small helper, `src/lib/posts/open-watch.ts`, test it with fake timers, and assert that the component's effect depends on `attempt`.
- **#990, the label.** `readNutritionLabel` reads only the first photo. Design: when the panel lacks protein, carbohydrate or fat and the meal has more photos, read up to two more and merge with `mergeLabelReading` when it adds a macronutrient. Then re-analyse 1c18b87e once.
- **#937.** PR #952 (Fleet 22, `74b65ace`) stopped prefetching an unfinished meal's Comment and Details links, after Fleet 21's 16 not-found responses. Nobody has measured since. What remains is one local overlap check: two uploads, counting not-found responses under `/posts/` until both are ready.
- **#659, the unchecked findings, read on main:** #641's `serving` unit is accepted since migration 0060 (dismissed). #638's Feed polling resumes on a return to the tab (`Feed.tsx` lines 426 to 432) (dismissed). `today_summary` no longer exists in `src` (dismissed). #639's question strip keeps an idle discovery poll after an empty poll (`NeedsInputStrip.tsx` line 36) and listens for a return to the tab (line 90) (dismissed). RealtimePost listens for visibility and focus (lines 114 to 115) (dismissed). #637's Thread polls with backoff and resets on a return to the tab (`Thread.tsx` lines 53 to 59); the original finding's text is not held. #643 is reproduced and filed as #1022. Of the blockers, #647's avatar route now sends a private cache and refuses another user by design (`route.ts` lines 8 and 34), and the header uses the post's author, not the viewer (`usePostAuthor`) (dismissed). #648's inventory no longer embeds a commit hash (dismissed); whether `docs/wording/inventory.md` is current needs one regeneration. Fleet 30 writes this as a finding with line references and closes the list.
