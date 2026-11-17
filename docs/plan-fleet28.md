# Fleet 28 — the #989 revisit finished without losing a value, leftovers on a meal with a drink, and the checks that can finish (2026-11-17)

You are the coder. You have the filesystem, GitHub and local-stack access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-17 14:16Z and the Engineering backlog (`/home/opc/pm/my-food-ai/backlog/BACKLOG-web-current.md`, as of 14:16Z). It has four code PRs and one docs PR, one stop before the merges, and one production section after the PM's merge order. It starts from what Fleet 27's #989 run learned (`state/build/fleet27-postmerge/report.md` and `next-fleet-findings.md` in the shared build state).

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 8). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait in this plan is bounded and says its bound; none is longer than 10 minutes, and the waits of section 9 add up to at most 45 minutes (the PM's standing confirmation). Nothing in this plan is a long run under AGENTS.md.

**Nothing in this plan runs against production before the merge order.** Customer contact is forbidden. The owner's phone gets no notification from section 9: every job there is an operator job (#1001, merged in Fleet 27).

## 1. The items

| # | Item | What changes | Where |
|---|---|---|---|
| 1 | #989 | An operator re-match of a meal with no model comment (a barcode or label meal) no longer fails with "Nutrition summary could not be saved." | PR 1 (migration 0066) |
| 2 | #989 | Recompute keeps a barcode, label or typed row as it is, instead of searching USDA for its name. This is how a label's 140 kcal became NULL | PR 1 |
| 3 | #989 | The food matcher no longer accepts a record with no energy value, or with zero energy for a food that has energy (the butter packet, the sambal) | PR 1 |
| 4 | #989 | The operator tool reads each meal again after its run and puts it back at once if it failed, lost any available value (zeros and micronutrients included), or moved its calories by more than half. A repair mode sets an old negative value to zero | PR 2 |
| 5 | #989 | Three rules stop flagging numbers that are right: a drink measured in millilitres (rule e), a spirit whose energy is its alcohol (rule b), and a tea named sweet or a cookie named espresso (rule g1) | PR 2 |
| 6 | #989 | The next run, meal by meal, and the list of the meals that still fail, each with its reason | section 9 |
| 7 | #684 | A meal whose foods include a tea, a coffee or another drink can take a leftovers photo | PR 3 (migration 0067) |
| 8 | #615, #628 | The beer check waits for its own question in the strip; check K4 runs again | PR 4, section 7 |
| 9 | #323 | A written finding: each server request makes one sign-in call, and the fix is a project setting | docs, section 7 |
| 10 | #523, #703, #708 | What Fleet 26's checks already show, for the PM | section 7 |
| 11 | #990 | What it still needs | section 10 |

## 2. Facts the planner checked on 2026-11-17, and premises

Facts. Read on main `15f25c8d589149898e03618cdd1de2d13bf98099`, in the Fleet 27 build state and in its private ledger (`state/build/fleet26/private/ledger/snapshots.jsonl`, 16 meals before the run); do not check them again.

- The planner applied every edit of this plan to an export of main and compared the result with the tested copy byte for byte.
- **"Nutrition summary could not be saved."** `recompute` raises it when `refresh_owned_approximation_summary` returns an error (`src/lib/worker/jobs/recompute.ts`). In 0065 an operator job always takes the rewrite branch, which updates the comment that `feedback_revision` names; a meal with no model comment has none, so the update changes no row and the function raises "Nutrition summary is missing". Both failed meals, 1a901e4e and 89286fbf, are Pocari Sweat 500 ml, one barcode item each (`source_ref` `off:08997035563414`) and no model comment in the snapshot. Their recompute made no model call. An ordinary recompute of such a meal returns before the update, which is why only operator jobs failed.
- **140 kcal to NULL.** 1c18b87e is one item, "Packaged food", `source_ref` `label`, 140 kcal, protein and carbohydrate NULL, portion "220 ml" with no grams. 11-rematch.sql carries a label row over through `supersedes`; `resolvePortionNutrition` returns it, but recompute keeps a retained row only when it is complete (`nutritionUnavailable`), so it searched USDA for "Packaged food" with no grams and stored NULL calories.
- **Why re-matching cleared no rule.** 11-rematch.sql keeps every name and portion and only looks the nutrition up again, and a second look-up of the same name usually finds the same record. Rules e and g1 depend on the portion and the name, so a re-match cannot clear them; eight of the sixteen meals came back with the same totals. The per-meal causes are in section 9.1.
- The butter packet of f08e2e86 is matched to Branded record 789828, which has fat and calcium but no energy. Both sambals (e31fd9af, 509ef9bc) are matched to record 2016176, whose energy, protein, carbohydrate and fat are all 0. `hasNutrition` accepts a record with any one of energy, protein, fat or carbohydrate.
- 38de279e's lamb curry stores −0.7028 g carbohydrate. `scaleNutrition` already clamps a new carbohydrate value to zero; this row is older.
- The whisky highball of e6c8cfaf is in category "liquor and cocktails" with 20.4 g alcohol and 141.6 kcal, and protein, carbohydrate and fat are 0: rule b flags it. 8512685d is "Espresso chocolate brownie cookie", category "cookies and brownies": rule g1 flags it as a plain coffee. f1c1dc7d "sweet lemon iced tea" and e9a5660b "sweetened iced tea" are flagged by g1, whose exclusions have "sugar" but not "sweet".
- The plain "iced tea" items of f1439c72, d3b40213 and 5711e19c are matched to record 2710515 at 0.32 kcal per gram, a presweetened iced tea; d701fa08 "Indonesian iced tea" also reads 0.32 kcal per gram (Fleet 25 study).
- 1c4f16bf has "Vietnamese drip coffee" at 0.71 kcal per gram (record 171880, category "beverages", 12.6 g carbohydrate per 100 g) and a separate "sweetened condensed milk" item.
- **#684.** `prepare_post_photo_attachment` (0027, not redefined since) refuses a photo when the meal has any `intake_logs` row: "Drink amounts were recorded when posted". 0029 made a meal's own foods write intake rows (`source='item'`) and narrowed its own two checks to `source='sheet'`, but not this one. The owner's meal of Tue Nov 17 at 1:15 PM WIB is f1439c72; its iced tea wrote a caffeine row with `source` `item` at 06:17Z, so every leftovers photo on it is refused, on the first try and on every Try again. `markReady`, which ends a leftovers job, rebuilds item rows with `syncItemDrinks`.
- **#323.** The middleware calls `supabase.auth.getClaims()` on every page, RSC and API request it matches (`src/middleware.ts`). In `@supabase/auth-js` 2.118.0, `getClaims` verifies a token signed with a shared secret (an `HS` algorithm or no key id) by calling `getUser`, one request to `/auth/v1/user`. Fleet 26's corrected K5 counts were Home 19, Days 10 and Profile 20 `/user` calls, against 1 page + 18 RSC + 0 API, 1 + 8 + 1, and 1 + 19 + 0 requests: one call per request. The local stack signs with `GOTRUE_JWT_SECRET` (`scripts/test-stack.mjs`).
- **#615.** Fleet 26's K4 failed with "Strip row missing" after 23.6 s. The script looks for a button reading "A question about this meal"; the strip row reads "A quick question about your meal" over the question itself (`src/components/NeedsInputStrip.tsx`), and an idle Home looks for new questions every 60 seconds (`DISCOVERY_IDLE_MS`).
- With every change applied together, on the planner's own stack: `npx tsc --noEmit` reports nothing; `npx eslint` on the changed files reports one warning, `tickStop` in `scripts/run17-checks.mjs`, which main has too; the application suite passes 764 of 770 with 6 skips (main's), and the database suite 51 of 51. `tests/recompute-package-row.test.mjs` fails on main's recompute. The three rule files and `15-repair.sql` were run against fixture meals: the millilitre drink, the whisky, both sweet teas and the cookie leave the list, the salami, the plain iced tea, the zero-energy sambal and the negative carbohydrate stay; the repair sets −0.70 g to 0 in the column and in the micronutrient list, keeps NULL as NULL, queues one operator job, and does nothing on a second run.

Premises. From reports, not checked by the planner.

- P1: No operator run has touched the 21 meals since Fleet 27's recovery; all 21 are ready (Fleet 27 report, section 3).
- P2: The private ledger of Fleet 27 (`state/build/fleet26/private/ledger`) is kept, mode 0700, until the PM accepts the run. Section 9 writes a new ledger and does not touch the old one.
- P3: The owner's meals keep coming. Meals that start failing a rule after 2026-11-17 08:00Z are listed by section 9 and not worked this fleet.

## 3. Not in this run, and why

| Item | Why it is left out |
|---|---|
| #999 | Unchanged since Fleet 27: the live barcode loop runs only on the Barcode screen, so the black picture needs a phone reading (what to record is in Fleet 27's plan, section 3). |
| #1000 | A new feature with no design; what a merged meal keeps is a design decision. |
| #212, #594, #579, #571 | Each needs a real phone. |
| #373, #375 | Need the Supabase usage page's figures. |
| #368, #279 | Wait for CAPTCHA to be switched on. |
| #687 | The submission is already sent. |
| #689 | Needs the receipt contents. |
| #578 | Filing the 25 findings is the PM's work. |
| #60 | Waits for the last feature. |
| #683, #553, #552, #217 | Built; what remains is GrokBot's production look. |
| #694, #285, #617 | #694's study is Fleet 25's and section 9.1 adds a cause per meal; #285 and #617 are read-only studies with photos and need a person or GrokBot to judge the photos. #617's finding is merged in #994. |
| #937 | Needs a Regular 3G throttle that the builder's browser did not have in Fleet 27; an unthrottled run showed no qualifying not-found request. |
| #659 | Its open part is three findings: #648's inventory is stale (regenerating it is a docs task the PM can order), #637's retry gap is source-only, and #643's truncation is reproduced. The reproduced one needs its own backlog item: "A 30-character meal header is cut off at phone width". |
| #1018 | Filed by the builder in Fleet 27 and not on the backlog. It is small (a test that depends on the clock hour); the planner can plan it when it is added. |
| #323's setting | The fix is to switch the Supabase project to asymmetric JWT signing keys (section 7.2). It changes how production signs every session, so it is the PM's order, not part of this dispatch. |

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, under `/tmp/mfa-f28`. Before any test in a worktree: `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=60960 TEST_PG_PORT=55609 TEST_STACK_DIR=/tmp/mfa-f28/stack TEST_ENV_FILE=.env.test.fleet28`. Keep `TEST_STACK_DIR` short: Postgres refuses a socket path over 107 bytes. Never stop or touch a container that does not end in `-60960`.
3. **Test command.** `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC TEST_ENV_FILE=.env.test.fleet28 MFA_TEST_DISPOSABLE=1 npm test`, with the built app started (`node scripts/test-app.mjs build`, then `start`). Database suite: the same with `npm run test:db`. Bound: 10 minutes each (`timeout 600`). On a stack created before a migration of this plan existed, apply that migration file to the stack first.
4. **Build.** The build can end with `SecurityFatalError` after "Generating static pages"; a fresh `.next/BUILD_ID` means it built. Do not upgrade anything.
5. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`; the PR's named tests; the application and database suites once, on a worktree that holds all four PRs (merge them locally into one scratch branch; never push it).
6. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA, with main's runner (Fleet 27's #929). AGY when PPLX is unavailable. The docs PR needs no review.
7. **Checks** (section 7).
8. **Docs PR**, branch `docs/fleet28` from `origin/main`: commit this plan unchanged as `docs/plan-fleet28.md`, and the finding of section 7.2 as `docs/findings/auth-calls-2026-11-17.md`.
9. **Stop** (section 8).

## 5. The code PRs

### PR 1 — branch `fix28/summary-and-match` — #989

**Service:** the analysis worker's recompute job (`src/lib/worker/jobs/recompute.ts`), the USDA matcher (`src/lib/fdc/nutrients.ts`, `match.ts`, `approximate.ts`) and one database function.
**What changes:** (1) migration 0066 lets `refresh_owned_approximation_summary` return when the meal has no model comment, instead of raising "Nutrition summary is missing"; every other rule of 0065 stays. (2) Recompute keeps a retained row whose `source_ref` is a barcode, label or typed source (`barcode:`, `off:`, `label`, `user:`, the sources 11-rematch.sql carries over) even when a value is missing, and does not search USDA for its name. (3) A USDA record is eligible only when it has an energy value, and a zero energy only for the plain drinks rule b allows (water, plain tea or coffee, a diet or zero drink). Both selection paths check it: the matcher and the closest generic record.

New files, given whole in section 6: `supabase/migrations/0066_summary_without_comment.sql`, `supabase/rollbacks/0066_summary_without_comment.down.sql`, `tests/db/summary-without-comment.test.mjs`, `tests/recompute-package-row.test.mjs`, `tests/fdc-energy-fits.test.mjs`.

File `src/lib/worker/jobs/recompute.ts`.

Find:
```
import { toNumber, type CurrentItem, type NutritionLike, type StoredNutrient } from "@/lib/nutrition/totals";

```
Replace:
```
import { toNumber, type CurrentItem, type NutritionLike, type StoredNutrient } from "@/lib/nutrition/totals";

// The nutrition sources that scripts/numbers/11-rematch.sql carries over: a barcode, a label or the person's own numbers.
export const PACKAGE_SOURCE = /^(barcode:|off:|label|user:)/;

```

Find:
```
      if (retained && !nutritionUnavailable(retained)) return {...retained,post_item_id:item.id};
```
Replace:
```
      // #989: a barcode, label or typed row came from the package or the person, not from a USDA search. A search by
      // its name cannot do better (a label's 140 kcal became NULL under the name "Packaged food"), so it is kept as it is.
      if (retained && (!nutritionUnavailable(retained) || PACKAGE_SOURCE.test(retained.source_ref ?? ""))) return {...retained,post_item_id:item.id};
```

File `src/lib/fdc/nutrients.ts`.

Find:
```
  return food.foodNutrients.some(n => [1008, 2047, 2048, 1003, 1004, 1005].includes(n.nutrientId) && Number.isFinite(n.value));
}
```
Replace:
```
  return food.foodNutrients.some(n => [1008, 2047, 2048, 1003, 1004, 1005].includes(n.nutrientId) && Number.isFinite(n.value));
}

// #989: a record with no energy value gave "unsalted butter packet" no calories, and one with zero energy gave
// "Sambal" 0 kcal. Zero energy fits only the plain drinks that rule b of scripts/numbers/03-suspicious.sql allows.
export function energyFits(name: string, food: FdcFood): boolean {
  const energy = nutrientValue(food, ENERGY_IDS);
  if (!energy || !Number.isFinite(energy.value) || energy.value < 0) return false;
  if (energy.value > 0) return true;
  return /\b(water|tea|coffee|espresso|americano|diet|zero)\b/i.test(name) && !/\b(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\b/i.test(name);
}
```

File `src/lib/fdc/match.ts`.

Find:
```
import { gramBasis, hasNutrition } from "./nutrients";
```
Replace:
```
import { energyFits, gramBasis, hasNutrition } from "./nutrients";
```

Find:
```
      if(gramBasis(food)&&hasNutrition(food)&&!eligible.has(food.fdcId)&&!excludedComponents(food.description,`${name} ${caption}`).length&&!referenceProteinMismatch(name,food.description))eligible.set(food.fdcId,food);
```
Replace:
```
      if(gramBasis(food)&&hasNutrition(food)&&energyFits(name,food)&&!eligible.has(food.fdcId)&&!excludedComponents(food.description,`${name} ${caption}`).length&&!referenceProteinMismatch(name,food.description))eligible.set(food.fdcId,food);
```

File `src/lib/fdc/approximate.ts`.

Find:
```
import { gramBasis, hasNutrition } from "./nutrients";
```
Replace:
```
import { energyFits, gramBasis, hasNutrition } from "./nutrients";
```

Find:
```
    const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f) && !excludedComponents(f.description, `${name} ${caption}`).length && !referenceProteinMismatch(name, f.description)).slice(0, 30);
```
Replace:
```
    const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f) && energyFits(name, f) && !excludedComponents(f.description, `${name} ${caption}`).length && !referenceProteinMismatch(name, f.description)).slice(0, 30);
```

**Tests:** `tests/recompute-package-row.test.mjs` (fails on main: recompute asks the food cache for "Packaged food"), `tests/fdc-energy-fits.test.mjs`, `tests/db/summary-without-comment.test.mjs` (the migration, a meal with no comment, a meal with one, and the rollback), and `tests/fdc-match.test.mjs`, `tests/analysis-integrity.test.mjs`, `tests/fdc-reference-search.test.mjs`, `tests/correction-ready.test.mjs`, `tests/db/operator-revision.test.mjs`.

**Done when:** those pass.

### PR 2 — branch `fix28/numbers-tools` — #989

**Service:** none a person runs: `scripts/numbers/`, the operator's study and re-analysis files.
**What changes:** (1) `reanalyse.mjs` reads each meal again when its run has finished (08-snapshot.sql, into `<ledger>/after.jsonl`), compares every value of every current food with the snapshot before (`lostValues`), and puts the meal back at once with its own restore when it failed or asks a question, lost a value, lost its calories, or moved its calories by more than half (`restoreReason`). (2) A new mode, `repair`, runs the new `15-repair.sql`: a negative stored value of a current food becomes zero (NULL stays NULL), and an operator recompute sums the meal again with no look-up. (3) Rules b, e and g1 change the same way in 03, 04 and 14: e no longer flags a food with no grams whose portion is an exact millilitre volume and whose calories are known; b no longer flags a food in an alcohol category with calories; g1 no longer flags a name with sweet, sweetened, condensed, brownie, cookie or cake.

New file, given whole in section 6: `scripts/numbers/15-repair.sql`.

File `scripts/numbers/reanalyse.mjs`.

Find:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13) through psql and wakes the worker with /api/jobs/tick.
```
Replace:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15) through psql and wakes the worker with /api/jobs/tick.
```

Find:
```
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql' };
```
Replace:
```
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql', repair: '15-repair.sql' };
```

Find:
```
  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse
```
Replace:
```
  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair
```

Find:
```
  --mode=reanalyse    12-reanalyse.sql: the photos are read again from the start.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
```
Replace:
```
  --mode=reanalyse    12-reanalyse.sql: the photos are read again from the start.
  --mode=repair       15-repair.sql: a negative stored value becomes zero and the meal is summed again.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
```

Find:
```
  being worked when its wait runs out.

```
Replace:
```
  being worked when its wait runs out.
  When a meal has finished, its snapshot is taken again (into <ledger>/after.jsonl) and compared with the one
  before. The meal is put back at once, as restore --snapshot=last would, when it failed or asks a question, lost
  any nutrition value it had (a zero counts as a value, NULL does not; micronutrients included), or its calories
  moved by more than half. The ledger line says why.

```

Find:
```
Exit codes: 0 every meal changed, unchanged or skipped (restore: work was queued and the meal is ready);
```
Replace:
```
Exit codes: 0 every meal changed, unchanged, skipped or put back (restore: work was queued and the meal is ready);
```

Find:
```
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch or --mode=reanalyse is required.');
```
Replace:
```
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch, --mode=reanalyse or --mode=repair is required.');
```

Find:
```
  return Math.round(((Number(after) - Number(before)) / Number(before)) * 10000) / 10000;
}
```
Replace:
```
  return Math.round(((Number(after) - Number(before)) / Number(before)) * 10000) / 10000;
}

const VALUES = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g', 'sugar_g', 'sodium_mg'];

// Pure: each nutrition value that the current foods of snapshot "before" had and those of "after" do not, as
// "food <n>: <value>" (n counts the foods of "before" from 1; a micronutrient is its USDA nutrient id). A zero is a
// value and NULL is not. Foods pair up by name; the foods whose name is gone are compared as one group.
export function lostValues(before, after) {
  const current = (snapshot) => (snapshot?.items ?? []).filter((item) => item.superseded_at === null);
  const key = (item) => String(item.name ?? '').trim().toLowerCase();
  const counts = (items) => {
    const found = new Map();
    for (const item of items) {
      const nutrition = item.nutrition ?? {};
      const names = VALUES.filter((name) => nutrition[name] != null);
      for (const n of Array.isArray(nutrition.micronutrients) ? nutrition.micronutrients : []) if (n?.nutrientId != null && n.value != null) names.push(`nutrient ${n.nutrientId}`);
      for (const name of new Set(names)) found.set(name, (found.get(name) ?? 0) + 1);
    }
    return found;
  };
  const was = current(before), now = current(after), lost = [];
  const wasNames = new Set(was.map(key)), nowNames = new Set(now.map(key));
  const compare = (label, left, right) => { const a = counts(left), b = counts(right); for (const [name, count] of a) if ((b.get(name) ?? 0) < count) lost.push(`${label}: ${name}`); };
  for (const name of wasNames) if (nowNames.has(name)) compare(`food ${was.findIndex((item) => key(item) === name) + 1}`, was.filter((item) => key(item) === name), now.filter((item) => key(item) === name));
  compare('renamed foods', was.filter((item) => !nowNames.has(key(item))), now.filter((item) => !wasNames.has(key(item))));
  return lost;
}

// Pure: why a finished meal is put back, or null (the PM's rules of 2026-11-17 for #989).
export function restoreReason(row) {
  if (row.outcome === 'failed') return row.reason ?? 'the meal did not finish';
  if (row.values_lost?.length) return `${row.values_lost.length} nutrition value(s) lost: ${row.values_lost.slice(0, 3).join('; ')}${row.values_lost.length > 3 ? '; ...' : ''}`;
  if (row.before?.calories != null && row.after?.calories == null) return 'the calories became unavailable';
  if (row.calories_change != null && Math.abs(row.calories_change) > 0.5) return `the calories moved by ${(row.calories_change * 100).toFixed(1)}%`;
  return null;
}
```

Find:
```
        else { row.outcome = 'failed'; row.reason = waitResult.totals.status === 'needs_input' ? 'the meal now asks its owner a question (needs_input)' : 'the meal is failed'; }
      }
```
Replace:
```
        else { row.outcome = 'failed'; row.reason = waitResult.totals.status === 'needs_input' ? 'the meal now asks its owner a question (needs_input)' : 'the meal is failed'; }
        if (!waitResult.timedOut) {
          const afterLine = psql({ file: sqlFile('08-snapshot.sql'), vars: { prefixes: prefix } }).split('\n').find((line) => line && JSON.parse(line).post?.id === id);
          if (afterLine) { appendPrivate(ledger, 'after.jsonl', afterLine); row.values_lost = lostValues(JSON.parse(snapshot), JSON.parse(afterLine)); }
          else row.values_lost = ['the meal could not be read after its run'];
          const why = restoreReason(row);
          if (why) {
            row.restore_reason = why;
            let code;
            try { code = await restore({ meal: prefix, ledger: request.ledger, snapshot: 'last', waitSeconds: request.waitSeconds }); }
            catch (error) { code = EXIT.incomplete; row.restore_error = error.message; }
            row.restored = code === EXIT.ok;
            if (row.outcome !== 'failed') { row.outcome = row.restored ? 'restored' : 'failed'; if (!row.restored) row.reason = 'it was worse and could not be put back'; }
            if (row.restored) row.after = publicTotals(readTotals(id));
          }
        }
      }
```

Find:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```
Replace:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```

File `scripts/numbers/03-suspicious.sql`.

Find:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
```
Replace:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text,
```

Find:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
```
Replace:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
    and not (calories > 0 and lower(coalesce(food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
  union all
```

Find:
```
  from described where portion_grams is null or portion_grams < 5 or portion_grams > 1500
```
Replace:
```
  from described where (portion_grams is null and not (calories is not null and portion_text ~ '^[0-9]+([.][0-9]+)? ml$')) or portion_grams < 5 or portion_grams > 1500
```

Find:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
```
Replace:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|sweetened|condensed|mocha|brownie|cookie|cake)\M'
```

File `scripts/numbers/04-summary.sql`.

Find:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
```
Replace:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text,
```

Find:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
```
Replace:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
    and not (calories > 0 and lower(coalesce(food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
  union all
```

Find:
```
  from described where portion_grams is null or portion_grams < 5 or portion_grams > 1500
```
Replace:
```
  from described where (portion_grams is null and not (calories is not null and portion_text ~ '^[0-9]+([.][0-9]+)? ml$')) or portion_grams < 5 or portion_grams > 1500
```

Find:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
```
Replace:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|sweetened|condensed|mocha|brownie|cookie|cake)\M'
```

File `scripts/numbers/14-rule-failures.sql`.

Find:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg
```
Replace:
```
  select p.id as post_id, i.id as item_id, i.name, i.portion_grams, i.portion_text,
         n.post_item_id is not null as has_row, n.calories, n.protein_g, n.carbs_g, n.fat_g,
         n.fibre_g, n.sugar_g, n.sodium_mg, n.food_category
```

Find:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
  union all
```
Replace:
```
    and not (name ~* '\m(water|tea|coffee|espresso|americano|diet|zero)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|mocha|bubble|boba)\M')
    and not (calories > 0 and lower(coalesce(food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
  union all
```

Find:
```
  select post_id, item_id, 'e' from items where portion_grams is null or portion_grams < 5 or portion_grams > 1500
```
Replace:
```
  select post_id, item_id, 'e' from items where (portion_grams is null and not (calories is not null and portion_text ~ '^[0-9]+([.][0-9]+)? ml$')) or portion_grams < 5 or portion_grams > 1500
```

Find:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|mocha)\M'
```
Replace:
```
  where name ~* '\m(coffee|espresso|americano|tea)\M' and name !~* '\m(milk|latte|cappuccino|sugar|sweet|sweetened|condensed|mocha|brownie|cookie|cake)\M'
```

File `scripts/numbers/README.md`.

Find:
```
Files 10 to 13 write. They keep every old row, marked superseded. Take the snapshot (08) first: it is the only way back.
```
Replace:
```
Files 10 to 13 and 15 write. They keep every old row, marked superseded (15 changes a negative value to zero in place). Take the snapshot (08) first: it is the only way back.
```

Find:
```
`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql or 12-reanalyse.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.
```
Replace:
```
`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql, 12-reanalyse.sql or 15-repair.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. When a meal has finished, it is read again (`<ledger>/after.jsonl`) and put back from its snapshot at once if it failed or asks a question, lost any nutrition value it had (a zero is a value, NULL is not; micronutrients count), or its calories moved by more than half (#989). `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.
```

File `tests/numbers-reanalyse.test.mjs`.

Find:
```
import { EXIT, HELP, UsageError, compareTotals, findSnapshot, isInside, ledgerRefusal, parseArgs, parseMealsFile, relativeChange, restoreParams, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';
```
Replace:
```
import { EXIT, HELP, UsageError, compareTotals, findSnapshot, isInside, ledgerRefusal, lostValues, parseArgs, parseMealsFile, relativeChange, restoreParams, restoreReason, stopReason, summaryTable } from '../scripts/numbers/reanalyse.mjs';
```

Find:
```
function cliFixture(t, { restore = false, usage = [] } = {}) {
```
Replace:
```
function cliFixture(t, { restore = false, usage = [], after = null } = {}) {
```

Find:
```
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: snapshot(A), restore, usage }));
```
Replace:
```
  writeFileSync(fixture, JSON.stringify({ id: A, snapshot: snapshot(A), restore, usage, after }));
```

Find:
```
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.snapshot));
```
Replace:
```
if (file === '08-snapshot.sql') console.log(JSON.stringify(fixture.after && previous.includes('11-rematch.sql') ? fixture.after : fixture.snapshot));
```

Find:
```
  assert.equal(ledger()[0].model_calls, kinds.length, 'legacy rows with no model name are still model calls');
});
```
Replace:
```
  assert.equal(ledger()[0].model_calls, kinds.length, 'legacy rows with no model name are still model calls');
});

// #989: the PM's rule of 2026-11-17 counts any lost value as worse, zeros and micronutrients included.
test('lost values are the values a food had before and has no longer, matched by name', () => {
  const food = (name, nutrition) => ({ id: name, name, superseded_at: null, nutrition });
  const meal = (...items) => ({ items });
  const label = food('Packaged food', { calories: 140, protein_g: null, fat_g: 3.5, micronutrients: [] });
  assert.deepEqual(lostValues(meal(label), meal(food('Packaged food', { calories: null, protein_g: null, fat_g: null }))), ['food 1: calories', 'food 1: fat_g']);
  assert.deepEqual(lostValues(meal(food('Pepsi Zero', { calories: 0 })), meal(food('Pepsi Zero', { calories: null }))), ['food 1: calories'], 'a zero is a value');
  assert.deepEqual(lostValues(meal(food('salami', { calories: null })), meal(food('salami', { calories: 0 }))), [], 'NULL becoming a number is no loss');
  const micro = (...ids) => ids.map((nutrientId) => ({ nutrientId, value: 1, basis: 'portion' }));
  assert.deepEqual(lostValues(meal(food('a', { micronutrients: micro(1087, 1089) }), food('b', { calories: 1 })),
    meal(food('a', { micronutrients: [...micro(1087), { nutrientId: 1089, value: null }] }), food('b', { calories: 1 }))), ['food 1: nutrient 1089']);
  assert.deepEqual(lostValues(meal(food('rice', { calories: 200 })), meal(food('steamed rice', { calories: 210 }))), [], 'a renamed food keeps its values');
  assert.deepEqual(lostValues(meal(food('rice', { calories: 200, fat_g: 1 })), meal(food('steamed rice', { calories: 210 }))), ['renamed foods: fat_g']);
  assert.deepEqual(lostValues(meal(food('egg', { calories: 70 }), food('egg', { calories: 70 })), meal(food('egg', { calories: 70 }), food('egg', { calories: null }))), ['food 1: calories']);
  assert.deepEqual(lostValues(meal({ ...label, superseded_at: '2026-11-17T00:00:00Z' }), meal()), [], 'only current foods count');
});

test('a meal is put back when it failed, lost a value or moved its calories by more than half', () => {
  assert.equal(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 100 }, after: { calories: 140 }, calories_change: 0.4 }), null);
  assert.match(restoreReason({ outcome: 'failed', reason: 'the meal is failed' }), /failed/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: ['food 1: nutrient 1089'], before: {}, after: {} }), /1 nutrition value\(s\) lost: food 1: nutrient 1089/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 140 }, after: { calories: null }, calories_change: null }), /unavailable/);
  assert.match(restoreReason({ outcome: 'changed', values_lost: [], before: { calories: 63.7 }, after: { calories: 98 }, calories_change: 0.5383 }), /53\.8%/);
  assert.deepEqual(parseArgs(['run', '--mode=repair', '--meals=38de279e', '--ledger=/l']).mode, 'repair');
});

test('the CLI puts back a re-matched meal that lost a value, and says why', t => {
  const worse = snapshot(A);
  worse.items = worse.items.map((item) => (item.superseded_at === null ? { ...item, nutrition: { calories: null } } : item));
  const { result, calls, ledger } = cliFixture(t, { after: worse });
  assert.equal(result.status, EXIT.ok, result.stdout + result.stderr);
  const line = ledger()[0];
  assert.equal(line.outcome, 'restored');
  assert.equal(line.restored, true);
  assert.match(line.restore_reason, /nutrition value\(s\) lost: food 1: calories/);
  assert.ok(calls.some((call) => call.sql?.includes('13-restore.sql')), 'the restore SQL ran');
  assert.match(result.stdout, /put back: /);
});
```

**Tests:** `tests/numbers-reanalyse.test.mjs` (expected 14 of 14). Then, on your stack's database, run each of 03, 04 and 14 once in a read-only session with any account id (`-v uid=00000000-0000-0000-0000-000000000000`): each must exit 0.

**Done when:** those pass.

### PR 3 — branch `fix28/leftovers-drinks` — #684

**Service:** one database function, `prepare_post_photo_attachment`, which reserves an added photo.
**What changes:** migration 0067 refuses a photo only when the meal has a drink typed in the drink sheet (`source='sheet'`), as 0029's own checks do. A meal whose foods wrote a drink or caffeine row (`source='item'`) takes the photo; when its leftovers job ends, `markReady` rebuilds those rows from the foods.

New files, given whole in section 6: `supabase/migrations/0067_leftovers_with_drinks.sql`, `supabase/rollbacks/0067_leftovers_with_drinks.down.sql`, `tests/db/leftovers-with-drinks.test.mjs`.

**Tests:** `tests/db/leftovers-with-drinks.test.mjs` (a meal with an item caffeine row passes the drink check, a drink-sheet meal is refused, the rollback refuses both), and the database suite.

**Done when:** those pass.

### PR 4 — branch `fix28/beer-check` — #615, #628

**Service:** none; a test script.
**What changes:** the beer check finds this post's own strip row by its question text and waits up to 70 seconds for it, since an idle Home looks for new questions once a minute.

File `scripts/run17-checks.mjs`.

Find:
```
    await evaluate(`(()=>{const row=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').includes('A question about this meal'));if(!row)throw Error('Strip row missing');row.click();return true;})()`);
```
Replace:
```
    // #615: the strip row reads "A quick question about your meal" over the question itself, and an idle Home
    // looks for new questions once a minute, so wait up to 70 seconds for this post's own row (by its question).
    const ownQuestion=`[...document.querySelectorAll('button')].find(b=>!b.getAttribute('aria-label')&&(b.textContent||'').includes(${JSON.stringify(settled.post.question.question)}))`;
    await until(`!!${ownQuestion}`,70000).catch(()=>{throw Error('Strip row missing');});
    await evaluate(`(()=>{const row=${ownQuestion};if(!row)throw Error('Strip row missing');row.click();return true;})()`);
```

**Tests:** `node --check scripts/run17-checks.mjs`; check K4 (section 7.1).

**Done when:** `node --check` passes; K4's result is reported either way.

## 6. The new files

Each is given whole. Create it with exactly this content.

### `supabase/migrations/0066_summary_without_comment.sql`

```
-- #989: an operator re-match of a meal that has no model comment (a barcode or label meal) failed with
-- "Nutrition summary could not be saved.": there was no comment to rewrite. Such a meal now keeps having none.
-- Only refresh_owned_approximation_summary changes; its other rules are those of 0065.
create or replace function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_summary text,p_expected jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer; expected_count integer; current_count integer; matched_count integer; revision_comment uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then
  raise exception 'Nutrition summary job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Current items are required' using errcode='22023';end if;
 expected_count:=jsonb_array_length(p_expected);
 select count(*) into current_count from public.current_post_items where post_id=p_post_id;
 select count(*) into matched_count from public.current_post_items i
 join public.item_nutrition n on n.post_item_id=i.id
 where i.post_id=p_post_id and exists(select 1 from jsonb_array_elements(p_expected) e
  where (e->>'id')::uuid=i.id and (e->>'source_ref') is not distinct from n.source_ref);
 if current_count<>expected_count or matched_count<>expected_count then
  raise exception 'Nutrition summary items changed' using errcode='PT409';
 end if;
 -- Resolve the same current model revision used by feedback, under the post lock.
 revision_comment:=(public.feedback_revision(p_post_id)->>'modelCommentId')::uuid;
 -- Older initial/correction comments stay untouched. Refresh on either side
 -- of the transition so removing the last approximate food clears its label.
 -- #985: an operator re-match (scripts/numbers/11-rematch.sql) always rewrites the comment.
 if not exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator')
  and position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 -- #989: a meal with no model comment (a barcode or label meal) has no summary to rewrite. Before 0066 an
 -- operator re-match of such a meal failed here with "Nutrition summary is missing".
 if revision_comment is null then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
```

### `supabase/rollbacks/0066_summary_without_comment.down.sql`

```
-- Restore refresh_owned_approximation_summary as 0065 wrote it: a meal with no model comment fails again.
create or replace function public.refresh_owned_approximation_summary(
 p_post_id uuid,p_job_id uuid,p_summary text,p_expected jsonb
) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare changed integer; expected_count integer; current_count integer; matched_count integer; revision_comment uuid;
begin
 perform 1 from public.posts where id=p_post_id for update;
 if not found or not public.post_work_matches(p_post_id,p_job_id) then
  raise exception 'Nutrition summary job no longer owns this meal' using errcode='PT409';
 end if;
 if p_expected is null or jsonb_typeof(p_expected)<>'array' then raise exception 'Current items are required' using errcode='22023';end if;
 expected_count:=jsonb_array_length(p_expected);
 select count(*) into current_count from public.current_post_items where post_id=p_post_id;
 select count(*) into matched_count from public.current_post_items i
 join public.item_nutrition n on n.post_item_id=i.id
 where i.post_id=p_post_id and exists(select 1 from jsonb_array_elements(p_expected) e
  where (e->>'id')::uuid=i.id and (e->>'source_ref') is not distinct from n.source_ref);
 if current_count<>expected_count or matched_count<>expected_count then
  raise exception 'Nutrition summary items changed' using errcode='PT409';
 end if;
 -- Resolve the same current model revision used by feedback, under the post lock.
 revision_comment:=(public.feedback_revision(p_post_id)->>'modelCommentId')::uuid;
 -- Older initial/correction comments stay untouched. Refresh on either side
 -- of the transition so removing the last approximate food clears its label.
 -- #985: an operator re-match (scripts/numbers/11-rematch.sql) always rewrites the comment.
 if not exists(select 1 from public.jobs where id=p_job_id and payload ? 'operator')
  and position(' is taken from the closest USDA record, ' in p_summary)=0 and position(' is a model estimate, ' in p_summary)=0 and position('The model did not treat “' in p_summary)=0 and position('No USDA record matched “' in p_summary)=0
  and not exists(select 1 from public.post_comments where id=revision_comment
   and (position(' is taken from the closest USDA record, ' in body)>0 or position(' is a model estimate, ' in body)>0 or position('The model did not treat “' in body)>0 or position('No USDA record matched “' in body)>0)) then return;end if;
 update public.post_comments set body=p_summary
 where id=revision_comment;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'Nutrition summary is missing' using errcode='22023';end if;
end $$;
revoke all on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb) to service_role;
```

### `tests/db/summary-without-comment.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #989: an operator re-match of a barcode meal, which has no model comment, failed with "Nutrition summary
// could not be saved." Under 0066 the summary refresh leaves such a meal without a comment and does not fail;
// a meal that has a comment still has it rewritten. The rollback brings the failure back.
test('the summary refresh of a meal with no model comment succeeds, and the rollback restores the old failure',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0066_summary_without_comment.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0066_summary_without_comment.down.sql',import.meta.url),'utf8');
 const input=`begin;
 ${migration}
 create temp table fixture(p uuid,job uuid,expected jsonb) on commit drop;
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();job uuid:=gen_random_uuid();item uuid;expected jsonb;comment uuid;
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'summary-without-comment-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into post_items(post_id,name,source,portion_text,gtin)values(p,'Pocari Sweat 500 ml','user','500 ml','08997035563414')returning id into item;
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values(item,140,0,34,0,'off:08997035563414');
 insert into jobs(id,post_id,kind,status,payload)values(job,p,'recompute','running','{"operator":"rematch"}');
 update posts set active_job_id=job where id=p;
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 insert into fixture values(p,job,expected);

 perform refresh_owned_approximation_summary(p,job,'Consumed: 140 kcal',expected);
 if exists(select 1 from post_comments where post_id=p) then raise exception 'The refresh wrote a comment on a meal that had none';end if;

 insert into post_comments(post_id,author,body)values(p,'model','Consumed: 139 kcal')returning id into comment;
 perform refresh_owned_approximation_summary(p,job,'Consumed: 140 kcal',expected);
 if (select body from post_comments where id=comment)<>'Consumed: 140 kcal' then raise exception 'The operator refresh did not rewrite the existing comment';end if;
 delete from post_comments where id=comment;
 end $test$;
 ${rollback}
 do $down$
 declare f record;failed boolean:=false;
 begin
 select * into f from fixture;
 begin perform refresh_owned_approximation_summary(f.p,f.job,'Consumed: 140 kcal',f.expected);
 exception when others then failed:=sqlerrm='Nutrition summary is missing';end;
 if not failed then raise exception 'The rollback did not restore the 0065 refresh';end if;
 end $down$;
 select 'summary-without-comment-ok';rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/summary-without-comment-ok/);
});
```

### `tests/recompute-package-row.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

// #989: an operator re-match copied a label row that had no protein or carbs. Recompute then searched USDA for
// "Packaged food" and stored a row with no calories, so the meal lost its label's 140 kcal. A barcode, label or
// typed row is now kept as it is, and no model is asked.
test('recompute keeps a label row that lacks a value instead of searching for its name',async(t)=>{
 const savedFetch=globalThis.fetch;
 // Trace storage may also use fetch when a stack is configured; only a model or USDA request counts.
 let modelCalls=0;
 globalThis.fetch=async input=>{
  const url=String(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(/\/v1\/responses|fdc|usda/i.test(url)){modelCalls++;throw Error('No model or USDA request is expected');}
  return new Response(null,{status:204});
 };
 t.after(()=>{globalThis.fetch=savedFetch;});
 const {default:recompute,PACKAGE_SOURCE}=await import('../src/lib/worker/jobs/recompute.ts');
 for(const ref of ['label','barcode:0123','off:08997035563414','user:typed'])assert.ok(PACKAGE_SOURCE.test(ref),ref);
 for(const ref of ['174195','estimate:Salami','unavailable:no_match',''])assert.ok(!PACKAGE_SOURCE.test(ref),ref);
 const label={calories:140,protein_g:null,carbs_g:null,fat_g:3.5,fibre_g:null,sugar_g:11,sodium_mg:115,micronutrients:[],source_ref:'label',food_category:null};
 const current={id:'copy',name:'Packaged food',portion_grams:null,portion_text:'220 ml',supersedes:'original',source:'user'};
 const stored=new Map([['original',{post_item_id:'original',...label}]]);
 let batch=null,summary=null;
 const reply=(init,rows)=>(new Headers(init?.headers).get('Accept')??'').includes('vnd.pgrst.object')?Response.json(rows[0]??null):Response.json(rows);
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(input);const path=url.pathname;
  if(path.endsWith('/current_post_items'))return reply(init,[current]);
  if(path.endsWith('/post_items'))return reply(init,[{id:'original',name:'Packaged food',portion_grams:null,portion_text:'220 ml',supersedes:null}]);
  if(path.endsWith('/item_nutrition')){
   if(init?.method==='POST'){batch=JSON.parse(init.body);for(const row of batch)stored.set(row.post_item_id,row);return new Response(null,{status:201});}
   const filter=url.searchParams.get('post_item_id')??'';
   const ids=filter.startsWith('in.(')?filter.slice(4,-1).split(','):[filter.replace(/^eq\./,'')];
   return reply(init,ids.map(id=>stored.get(id)).filter(Boolean));
  }
  if(path.endsWith('/posts'))return reply(init,[{caption:'',status:'processing'}]);
  if(path.endsWith('/rpc/sync_item_drinks'))return new Response(null,{status:204});
  if(path.endsWith('/rpc/refresh_owned_approximation_summary')){summary=JSON.parse(init.body);return new Response(null,{status:204});}
  if(path.endsWith('/rpc/results_card_snapshot'))return Response.json(null);
  if(path.endsWith('/rpc/mark_post_ready'))return Response.json(false);
  if(path.endsWith('/rpc/refresh_operator_saved_meal'))return Response.json(0);
  throw new Error(`Unexpected request: ${path}`);
 }}});
 await recompute(db,{id:'operator-job',post_id:'post',kind:'recompute',status:'running',payload:{operator:'rematch'}});
 assert.equal(modelCalls,0);
 assert.ok(batch,'recompute writes the copy its nutrition');
 assert.equal(batch.length,1);
 assert.equal(batch[0].post_item_id,'copy');
 assert.equal(batch[0].calories,140);
 assert.equal(batch[0].fat_g,3.5);
 assert.equal(batch[0].source_ref,'label');
 assert.deepEqual(summary.p_expected,[{id:'copy',source_ref:'label'}]);
});
```

### `tests/fdc-energy-fits.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFits} from '../src/lib/fdc/nutrients.ts';
import {matchFood} from '../src/lib/fdc/match.ts';

const food=(fdcId,description,nutrients)=>({fdcId,description,dataType:'Branded',foodNutrients:nutrients.map(([nutrientId,value,unitName='G'])=>({nutrientId,nutrientName:String(nutrientId),unitName,value}))});
const butterWithoutEnergy=food(789828,'UNSALTED BUTTER',[[1004,81.5],[1087,24,'MG']]);
const sambalAtZero=food(2016176,'SAMBAL',[[1008,0,'KCAL'],[1003,0],[1005,0],[1004,0]]);
const sambal=food(2016177,'SAMBAL OELEK',[[1008,120,'KCAL'],[1003,1.5],[1005,15],[1004,5]]);
const pepsiZero=food(173656,'Pepsi Zero',[[1008,0,'KCAL'],[1003,0],[1005,0],[1004,0]]);

// #989: the records that gave the butter packet no calories and the sambal 0 kcal are not eligible matches.
test('a record with no energy, or zero energy for a food that has energy, does not fit',()=>{
 assert.equal(energyFits('unsalted butter packet',butterWithoutEnergy),false);
 assert.equal(energyFits('Sambal',sambalAtZero),false);
 assert.equal(energyFits('Sambal',sambal),true);
 assert.equal(energyFits('Pepsi Zero',pepsiZero),true);
 assert.equal(energyFits('water',food(1,'Water',[[1008,0,'KCAL']])),true);
 assert.equal(energyFits('iced tea with sugar',food(2,'Tea',[[1008,0,'KCAL']])),false);
 assert.equal(energyFits('kJ only',food(3,'X',[[1008,500,'KJ']])),true);
 assert.equal(energyFits('negative',food(4,'X',[[1008,-1,'KCAL']])),false);
});

test('the matcher offers the model only records whose energy fits',async()=>{
 let offered=[];
 const result=await matchFood('Sambal','',{
  search:async()=>[sambalAtZero,sambal],
  choose:async(_name,_caption,foods)=>{offered=foods.map(f=>f.fdcId);return {id:foods[0]?.fdcId??null,query:null,query_food:null,reason:'same food'};},
 });
 assert.deepEqual(offered,[2016177]);
 assert.equal(result.food?.fdcId,2016177);
});
```

### `scripts/numbers/15-repair.sql`

```
-- #989: a stored negative nutrition value of one meal's current foods becomes zero, and the worker sums the meal
-- again and rewrites its summary. It is an operator recompute: every food keeps its nutrition, so nothing is looked
-- up again and no model is asked. Rows written since the matcher clamps carbohydrate to zero are not negative;
-- this repairs older rows (rule f of 03-suspicious.sql). NULL stays NULL. The micronutrient list is repaired the same way.
-- psql variable: post (the full meal id). It writes; take the snapshot (08) first, or run it through reanalyse.mjs.
begin;
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
), fixed as (
  update public.item_nutrition n set
    calories = case when n.calories < 0 then 0 else n.calories end,
    protein_g = case when n.protein_g < 0 then 0 else n.protein_g end,
    carbs_g = case when n.carbs_g < 0 then 0 else n.carbs_g end,
    fat_g = case when n.fat_g < 0 then 0 else n.fat_g end,
    fibre_g = case when n.fibre_g < 0 then 0 else n.fibre_g end,
    sugar_g = case when n.sugar_g < 0 then 0 else n.sugar_g end,
    sodium_mg = case when n.sodium_mg < 0 then 0 else n.sodium_mg end,
    micronutrients = case when jsonb_typeof(n.micronutrients) = 'array' then (
      select coalesce(jsonb_agg(case when jsonb_typeof(m->'value') = 'number' and (m->>'value')::numeric < 0
                                     then jsonb_set(m, '{value}', '0'::jsonb) else m end order by o), '[]'::jsonb)
      from jsonb_array_elements(n.micronutrients) with ordinality e(m, o)) else n.micronutrients end
  from public.post_items i
  where n.post_item_id = i.id and i.superseded_at is null and i.post_id in (select id from meal)
    and (n.calories < 0 or n.protein_g < 0 or n.carbs_g < 0 or n.fat_g < 0 or n.fibre_g < 0 or n.sugar_g < 0 or n.sodium_mg < 0)
  returning i.post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from fixed)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select id, 'recompute', 200, 'queued', '{"operator":"repair"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
```

### `supabase/migrations/0067_leftovers_with_drinks.sql`

```
-- #684: a meal whose foods include a tea, a coffee or another drink could never take a leftovers photo. 0029 made
-- its foods write intake rows (source 'item'), and 0027's attachment check refused a meal with any intake row.
-- Only a drink typed in the drink sheet (source 'sheet') is refused now, as 0029's own checks do.
create or replace function public.prepare_post_photo_attachment(p_post_id uuid,p_user_id uuid,p_stage_path text,p_not_eaten boolean)
returns public.post_photo_attachments language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; pos integer; cleanup uuid; stage_cleanup public.jobs;
begin
 select status into current_status from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 -- #684: only drinks typed in the drink sheet are fixed when posted (0029). A drink or a caffeine row that the
 -- meal's own foods produce is rebuilt from them, so a leftovers photo may change it.
 if exists(select 1 from public.intake_logs where post_id=p_post_id and source='sheet') then raise exception 'Drink amounts were recorded when posted' using errcode='55000';end if;
 select * into row from public.post_photo_attachments where stage_path=p_stage_path for update;
 if found then
  if row.post_id<>p_post_id or row.user_id<>p_user_id or row.not_eaten<>p_not_eaten then raise exception 'Photo already claimed' using errcode='22023';end if;
  return row;
 end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 if p_not_eaten is null then raise exception 'Photo type required' using errcode='22023';end if;
 if p_stage_path !~ ('^'||p_user_id::text||'/[0-9a-f-]{36}/0[.]jpg$') then raise exception 'Invalid staged photo' using errcode='22023';end if;
 select * into stage_cleanup from public.jobs where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text and payload->>'deleted_post_id'=split_part(p_stage_path,'/',2) for update;
 if not found or stage_cleanup.status<>'queued' or stage_cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=p_stage_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(p_stage_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if p_not_eaten and (not exists(select 1 from public.post_media where post_id=p_post_id and kind='photo') or exists(select 1 from public.post_media where post_id=p_post_id and not_eaten)) then raise exception 'The first photo is the meal; only one later photo can be not eaten' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=p_post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 select coalesce(max(position),-1)+1 into pos from (select position from public.post_media where post_id=p_post_id and kind='photo' union all select position from public.post_photo_attachments where post_id=p_post_id) positions;
 insert into public.post_photo_attachments(post_id,user_id,stage_path,target_path,position,not_eaten)
 values(p_post_id,p_user_id,p_stage_path,p_user_id::text||'/'||p_post_id::text||'/'||pos::text||'.jpg',pos,p_not_eaten) returning * into row;
 insert into public.jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',jsonb_build_object('owner_id',p_user_id,'deleted_post_id',p_post_id,'paths',jsonb_build_array(row.target_path,replace(row.target_path,'.jpg','.feed.jpg')),'exact',true,'attachment_id',row.id)) returning id into cleanup;
 update public.post_photo_attachments set cleanup_job_id=cleanup where id=row.id returning * into row;
 return row;
end $$;
revoke all on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) to service_role;
```

### `supabase/rollbacks/0067_leftovers_with_drinks.down.sql`

```
-- Restore prepare_post_photo_attachment as 0027 wrote it: any intake row refuses a photo again.
create or replace function public.prepare_post_photo_attachment(p_post_id uuid,p_user_id uuid,p_stage_path text,p_not_eaten boolean)
returns public.post_photo_attachments language plpgsql security definer set search_path=public,pg_temp as $$
declare row public.post_photo_attachments; current_status text; pos integer; cleanup uuid; stage_cleanup public.jobs;
begin
 select status into current_status from public.posts where id=p_post_id and user_id=p_user_id for update;
 if not found then raise exception 'Post not found' using errcode='42501';end if;
 if exists(select 1 from public.intake_logs where post_id=p_post_id) then raise exception 'Drink amounts were recorded when posted' using errcode='55000';end if;
 select * into row from public.post_photo_attachments where stage_path=p_stage_path for update;
 if found then
  if row.post_id<>p_post_id or row.user_id<>p_user_id or row.not_eaten<>p_not_eaten then raise exception 'Photo already claimed' using errcode='22023';end if;
  return row;
 end if;
 if current_status<>'ready' then raise exception 'Wait for this meal to be ready' using errcode='55000';end if;
 if p_not_eaten is null then raise exception 'Photo type required' using errcode='22023';end if;
 if p_stage_path !~ ('^'||p_user_id::text||'/[0-9a-f-]{36}/0[.]jpg$') then raise exception 'Invalid staged photo' using errcode='22023';end if;
 select * into stage_cleanup from public.jobs where kind='media_cleanup' and payload->>'owner_id'=p_user_id::text and payload->>'deleted_post_id'=split_part(p_stage_path,'/',2) for update;
 if not found or stage_cleanup.status<>'queued' or stage_cleanup.run_after<=clock_timestamp() then raise exception 'Photo stage expired' using errcode='22023';end if;
 if not exists(select 1 from storage.objects where bucket_id='media' and name=p_stage_path) or not exists(select 1 from storage.objects where bucket_id='media' and name=replace(p_stage_path,'.jpg','.feed.jpg')) then raise exception 'Photo upload incomplete' using errcode='22023';end if;
 if p_not_eaten and (not exists(select 1 from public.post_media where post_id=p_post_id and kind='photo') or exists(select 1 from public.post_media where post_id=p_post_id and not_eaten)) then raise exception 'The first photo is the meal; only one later photo can be not eaten' using errcode='22023';end if;
 if (select count(*) from public.post_media where post_id=p_post_id and kind='photo')>=8 then raise exception 'A meal has at most eight photos' using errcode='22023';end if;
 select coalesce(max(position),-1)+1 into pos from (select position from public.post_media where post_id=p_post_id and kind='photo' union all select position from public.post_photo_attachments where post_id=p_post_id) positions;
 insert into public.post_photo_attachments(post_id,user_id,stage_path,target_path,position,not_eaten)
 values(p_post_id,p_user_id,p_stage_path,p_user_id::text||'/'||p_post_id::text||'/'||pos::text||'.jpg',pos,p_not_eaten) returning * into row;
 insert into public.jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',jsonb_build_object('owner_id',p_user_id,'deleted_post_id',p_post_id,'paths',jsonb_build_array(row.target_path,replace(row.target_path,'.jpg','.feed.jpg')),'exact',true,'attachment_id',row.id)) returning id into cleanup;
 update public.post_photo_attachments set cleanup_job_id=cleanup where id=row.id returning * into row;
 return row;
end $$;
revoke all on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.prepare_post_photo_attachment(uuid,uuid,text,boolean) to service_role;
```

### `tests/db/leftovers-with-drinks.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #684: a meal whose iced tea wrote a caffeine row (source 'item') refused every leftovers photo with "Drink amounts
// were recorded when posted". Under 0067 only a drink typed in the drink sheet refuses a photo; the rollback restores 0027.
test('a leftovers photo is refused only for a drink typed in the drink sheet, and the rollback restores the old refusal',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0067_leftovers_with_drinks.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0067_leftovers_with_drinks.down.sql',import.meta.url),'utf8');
 // No photo is staged, so a call that passes the drink check stops at the next check, "Photo stage expired".
 const input=`begin;
 ${migration}
 create function public.__refusal(p uuid,u uuid) returns text language plpgsql as $f$
 begin perform public.prepare_post_photo_attachment(p,u,u::text||'/'||gen_random_uuid()::text||'/0.jpg',true);return null;
 exception when others then return sqlerrm;end $f$;
 create temp table fixture(u uuid,tea uuid,sheet uuid) on commit drop;
 do $test$
 declare u uuid:=gen_random_uuid();tea uuid:=gen_random_uuid();sheet uuid:=gen_random_uuid();item uuid;
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'leftovers-drinks-'||u);
 insert into posts(id,user_id,status)values(tea,u,'ready'),(sheet,u,'ready');
 insert into post_items(post_id,name,source,portion_grams,portion_text)values(tea,'iced tea','model',350,'1 glass')returning id into item;
 insert into intake_logs(user_id,post_id,kind,amount,source,post_item_id)values(u,tea,'caffeine',63,'item',item);
 insert into intake_logs(user_id,post_id,kind,amount,ml,source)values(u,sheet,'water',250,250,'sheet');
 insert into fixture values(u,tea,sheet);
 end $test$;
 select 'item:'||coalesce(public.__refusal(tea,u),'none') from fixture;
 select 'sheet:'||coalesce(public.__refusal(sheet,u),'none') from fixture;
 ${rollback}
 select 'rolled-back-item:'||coalesce(public.__refusal(tea,u),'none') from fixture;
 rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/^item:Photo stage expired$/m,'a meal with only item drink rows passes the drink check');
 assert.match(output,/^sheet:Drink amounts were recorded when posted$/m,'a drink-sheet meal is still refused');
 assert.match(output,/^rolled-back-item:Drink amounts were recorded when posted$/m,'the rollback restores the 0027 refusal');
});
```

### `docs/findings/auth-calls-2026-11-17.md`

```
# Finding: each server request makes one sign-in call (#323)

Fleet 28, 2026-11-17. A read of main `15f25c8d` and of Fleet 26's check K5. No code was changed.

## What was measured

Fleet 26's check K5 opened each page on a fresh local profile and counted, for ten seconds, the requests to the sign-in service's `/auth/v1/user` and the browser's own requests:

| Page | `/user` calls | Page | RSC | API | Page + RSC + API |
|---|---:|---:|---:|---:|---:|
| Home | 19 | 1 | 18 | 0 | 19 |
| Days | 10 | 1 | 8 | 1 | 10 |
| Profile | 20 | 1 | 19 | 0 | 20 |

The browser made no sign-in call. On every page the server's `/user` calls equal the number of requests that reached the server.

## Why

`src/middleware.ts` runs on every page, RSC (React Server Components) and API request under `/`, `/search`, `/days`, `/profile`, `/posts` and `/admin`. It calls `supabase.auth.getClaims()` once per request. `getClaims` in `@supabase/auth-js` 2.118.0 verifies a token itself only when the token is signed with an asymmetric key that has a key id. A token signed with the project's shared JWT secret (an `HS` algorithm) is verified by calling `getUser`, which is one request to `/auth/v1/user`. The local stack signs with a shared secret (`GOTRUE_JWT_SECRET` in `scripts/test-stack.mjs`). Most RSC requests are prefetches of the meal links on each card, so a page with more cards makes more calls.

## What would fix it

Switch the Supabase project to asymmetric JWT signing keys. The middleware's `getClaims` then checks each token against the project's public key, which it fetches once and caches, and makes no `/user` call. A forged or expired token is still refused, so an unsigned request still cannot reach a protected page. Sessions signed with the old secret stay valid while it is kept as a previous key, and the change can be undone by rotating back. Supabase's guide "JWT signing keys" describes the steps.

Turning off link prefetching would also cut the count, but it would slow opening a meal (#494), so it is not recommended.

## Not established

The count on production was not measured. Production's signing method was not read; the finding assumes it uses the shared secret, as the local stack does. The dashboard's JWT Keys page shows which one signs. Route handlers that call `getUser` themselves (for example `src/app/api/posts/[id]/media/route.ts`) keep their one call each.
```

## 7. Checks and findings

### 7.1 K4 again: #615 and #628

On PR 4's build, on your stack, run the beer check once, as Fleet 26 ran it (`state/build/fleet26/verification/K4.json`): set the scripted model to the beer mode, then

```
timeout 600 node scripts/run17-checks.mjs --mode=beer --bidi=<your BiDi session> --url=$APP_URL --out=/tmp/mfa-f28/K4-private.json --ledger=/tmp/mfa-f28/K4-private-ledger.json
```

Report its exit code, its first error if any, `dismissCalls`, the server log's count of "Your meal needs a reply", and the Days total for the day before the script's own cleanup (read it while the post exists, in a second tab). #615's done line also needs the live app with test account 2; that is GrokBot's, after the merge. #628's done line also needs the post-close command on a stable browser: run `--mode=post-close` once, bound 10 minutes, and report the same.

### 7.2 #323: one sign-in call per server request

Commit this finding (given whole in section 6 as `docs/findings/auth-calls-2026-11-17.md`). No code changes. The setting is the PM's order: in the Supabase dashboard of the production project, Project Settings, JWT Keys: "Migrate JWT secret", then "Rotate keys" so the new asymmetric key signs. Sessions signed with the old secret stay valid while it is a previous key. Undo: rotate back to the previous key. Supabase's guide "JWT signing keys" names the exact buttons. After it, the middleware verifies a token locally and the `/user` count of a Home open falls from about 19 to the page's own checks.

### 7.3 What Fleet 26's checks already show

For the PM, from `state/build/fleet26/stop-report.md`; no new run.

- #703: K1 showed both failure states after a retry and no overlay left after release. That is the done line's behaviour; the test is Fleet 26's. The extra Back step K1 also tried is not in the done line.
- #708: K2 showed the retake removing the failed upload and the chip absent after a second reload, locally. The done line is met locally; the phone camera is not.
- #523: K3 showed the expanded row naming the foods with an unavailable fibre value and no broad warning. What remains is the done line's look on the live app, which is GrokBot's.

## 8. The stop

Stop when the four code PRs and the docs PR are open, reviewed or reported "written, not reviewed", and section 7 is reported. Report to the PM, in one message:

1. Each PR: number, branch, final head (40 characters), tests and their counts, and the review's result.
2. K4 and the post-close command: exit codes, first errors, and the numbers 7.1 asks for.
3. Anything void under the facts of section 2.
4. The merge order this plan expects: PR 1, PR 2, PR 3, PR 4, then the docs PR. PR 2's tool needs PR 1 on production before section 9 runs; PR 3 is independent.

Then wait for the PM's merge order. It names each PR and its full head SHA.

## 9. After the PM's merge order: the #989 run

Run this only after every PR of the merge order has merged and production serves the last merge (the deployment gate of Fleet 27's section 9). Production writes are numbered P1 to P7; each says its bound and its undo. Keep every private file in a new ledger, `state/build/fleet28-postmerge/private/ledger`, mode 0700, files 0600. Print and commit meal prefixes only.

### 9.1 The 21 meals, their causes and what happens to each

Rules as in `scripts/numbers/14-rule-failures.sql`. "Clears" means the rule fix of PR 2 stops flagging a number that is right; no write is made.

| Meal | Rule | Cause | What happens |
|---|---|---|---|
| 1c18b87e | a2, e | A label read without protein or carbohydrate; portion "220 ml" | e clears. a2: re-analysis of the photo (P6), so the label is read again |
| 6fad4a16 | a2, e | The salami's portion "1 bag" has no gram weight, so its values are NULL | Listed: the owner's two comments block a re-analysis, and only the bag's weight can fix it |
| f1439c72 | g1 | "iced tea" matched a presweetened iced tea, 0.32 kcal/g | Listed: in Indonesia an iced tea is sweet unless ordered without sugar, and a photo cannot show sugar |
| 38de279e | f | An older row with −0.70 g carbohydrate | Repair (P3): the value becomes 0; no model call |
| e31fd9af | b | The sambal matched a record at 0 kcal and no macronutrients | Re-match (P4) with PR 1's matcher |
| d3b40213 | g1 | Iced tea, as f1439c72 | Listed, as f1439c72 |
| f08e2e86 | a2 | The butter packet matched a record with no energy | Re-match (P4) |
| e6c8cfaf | b | Whisky highball: 141.6 kcal from 20.4 g alcohol | Clears |
| 5711e19c | g1 | Iced tea | Listed, as f1439c72 |
| 8512685d | g1 | A brownie cookie named "Espresso", not a drink | Clears |
| 1c4f16bf | g1 | A sweetened coffee record (0.71 kcal/g) and a separate condensed milk: the milk may be counted twice | Re-analysis (P6) |
| 509ef9bc | b | The sambal at 0 kcal, as e31fd9af | Re-match (P4) |
| f1c1dc7d | g1 | "sweet lemon iced tea" | Clears |
| e9a5660b | g1 | "sweetened iced tea" | Clears |
| 1a901e4e | e | Pocari Sweat 500 ml, measured in millilitres | Clears |
| 89286fbf | e | The same drink, posted again | Clears |
| 35d5edb8 | e | Not read by the planner | Read (P5), then as P5 says |
| d701fa08 | g1 | "Indonesian iced tea", 0.32 kcal/g | Listed, as f1439c72 |
| 14f4761d | e | "Hydro Coco Original", no gram weight | Read (P5): a millilitre portion clears; otherwise as P5 says |
| a0e6b3bf | e | A puffed rice cake stored at 3 g; the owner commented | Read (P5); listed with what the read shows |
| e7e1782c | e | Bakpia stored at 3 g; the owner commented | Read (P5); listed with what the read shows |

### 9.2 The steps

Reads use a read-only session: `PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 ...`. The owner's account id is derived and checked as in Fleet 27, never printed.

- **P1, migrations.** `psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -1 -f supabase/migrations/0066_summary_without_comment.sql`, the same for `0067_leftovers_with_drinks.sql`, then `psql "$SUPABASE_DB_URL" -X -c "notify pgrst, 'reload schema';"`. Read back: `select prosrc like '%if revision_comment is null then return;%' from pg_proc where proname='refresh_owned_approximation_summary'` and `select prosrc like '%source=''sheet''%' from pg_proc where proname='prepare_post_photo_attachment'`, both `t`. Bound: 60 seconds each. Undo: the matching file in `supabase/rollbacks/`, then the same notify.
- **R1, the list.** `14-rule-failures.sql` with the owner's id. Save it privately. Expected: the six meals that "clear" in 9.1, and 1c18b87e's e, are gone; the rest are there. Report any other meal on the list (P3) by prefix and rules, and do not work it.
- **P2, the dry run.** `node scripts/numbers/reanalyse.mjs run --mode=rematch --meals=e31fd9af,509ef9bc,f08e2e86 --ledger=<new ledger> --dry-run`. All three must read "would snapshot". Bound: 60 seconds.
Every write below is one command per meal, `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=<mode> --meals=<prefix> --ledger=<new ledger> --max-meals=1 --wait-seconds=240`, so the outer bound can never cut a meal off: a meal's wait and its put-back wait are each at most 240 seconds. Track the tool's stop conditions across the commands yourself: two meals in a row that end "failed" stop section 9.

- **P3, repair.** Mode `repair`, meal 38de279e. Expected: outcome "changed" (carbohydrate −0.70 to 0, calories the same), no model call, the comment rewritten. Undo: `node scripts/numbers/reanalyse.mjs restore --meal=38de279e --ledger=<new ledger> --snapshot=last --wait-seconds=240`.
- **P4, re-match.** Mode `rematch`, meals e31fd9af, then 509ef9bc, then f08e2e86. Expected: about 17 model calls and 60,000 tokens in all (Fleet 27 used 6, 4 and 7 calls on these three). The tool puts any meal back that got worse, and its ledger line says why. Undo for a kept meal: restore, as P3.
- **P5, read the five unstarted meals.** One read-only query: for 35d5edb8, 14f4761d, a0e6b3bf, e7e1782c and d701fa08, each current item's name, `portion_text`, `portion_grams`, `count_text`, `source`, `source_ref`, its calories, and whether a user comment exists; for a0e6b3bf and e7e1782c, the owner's comment text is read and not printed. Decide each meal:
  - a portion that is an exact millilitre volume with calories: R1 already dropped it; say so;
  - a count stored as grams (for example "3 pieces" stored as 3 g): listed, and one line to the PM for the backlog, "A portion given as a count is stored as that many grams";
  - 35d5edb8, if it is none of those and 14-rule-failures says `can_reanalyse` is true: add it to P6;
  - anything else: listed with what the read shows.
- **P6, re-analysis.** Mode `reanalyse`, meals 1c18b87e, then 1c4f16bf, then 35d5edb8 if P5 added it. At most about 15 model calls a meal, so at most about 45 calls and 150,000 tokens. Undo: restore, as P3.
- **P7, the final list and the usage.** `14-rule-failures.sql` again and `09-usage.sql` for the run's meals since P3 began. No money cost is available from the usage table; report none.

Stop conditions: two meals in a row that end "failed"; a command that exits 1 for any other reason; 45 minutes of waiting in all, counted from P3. A stop ends section 9; report what ran.

### 9.3 What section 9 reports

One table with every meal of 9.1 and any new one from R1: prefix, rules before, what ran, outcome, rules after, and, for each meal that still fails, its reason from 9.1 or P5. That table meets #989's done line ("passes it, or is listed with its reason"). Ask GrokBot, through the PM, to read the card and day total of each meal whose numbers changed.

## 10. #990: what it still needs

Its design is Fleet 27's (`docs/plan-fleet27.md`, section 10): a sample of meals that pass every rule checked against an independent estimate, the other accounts' failing meals, and the saved meals. Two things wait on this fleet. First, section 9's table, which closes #989. Second, PR 2's tool: every #990 write must go through `reanalyse.mjs`, so that a meal that loses a value or fails is put back at once. The sample needs no write: it compares stored numbers with a second estimate and lists the differences. The other accounts need the same rule query with each account's id, and the PM's word on which accounts are in scope.

## 11. Blast radius, by PR

| PR | What a person using the app can notice | What else |
|---|---|---|
| 1 | A barcode or label food keeps its numbers through a recompute. A new food whose best record has no energy, or zero energy, gets another record or the model's estimate instead of a blank or a 0 | The summary refresh no longer fails on a meal with no model comment; such a meal still gets none |
| 2 | Nothing | The operator tool, three rule files and a new repair file |
| 3 | A meal with a tea, coffee or another drink item takes a leftovers photo; its drink rows are rebuilt from the foods afterwards | A drink typed in the drink sheet still refuses one |
| 4 | Nothing | A test script |

## 12. For RT

Nothing here waits on you. Three things you may want to know:

1. The leftovers failure you saw at 1:24 PM is explained: the app refused a leftovers photo on any meal with a drink in it, including the iced tea of that meal. PR 3 fixes it. The chip you still see can then be retried.
2. Four meals with a plain "iced tea" stay on the list with the reason that the tea is taken as sweet. If your iced teas are usually unsweetened, one word from you changes that.
3. Every app page and its background requests check sign-in once each, which is why a Home open makes about 19 checks. One setting in the database service fixes it; the PM decides when.
