# Fleet 32 — #990's blind study retry, the cocktail caffeine fix, two script fixes, the overlap check that exercises its routes, and a write-allowed proof run on test account 2 (2026-11-17)

You are the coder. You have the filesystem, GitHub, local-stack and production access this plan needs. Carry it out; do not return it, evaluate it or wait on anyone.

**What this plan is.** A new plan from the PM's packet of 2026-11-17 22:41Z, the backlog (`/home/opc/pm/my-food-ai/backlog/BACKLOG-web-current.md`, edited 2026-11-18 04:33 WIB), and the Fleet 31 production report (`state/build/fleet31-postmerge/report.md`). It has three code PRs and one docs PR, one local check, one stop before the merges, and two production sections after the PM's merge order. Planned from main `af86577bf5b5834b3e36737c6a40573b1ac06a81`.

**When done, stop.** Done means every numbered item below is reported done or not done. After the last item there is no new PR, no new reading and no new fix. A defect you find goes to the PM as one line for the backlog, and nothing more. A Find text that does not occur exactly once is skipped and reported, never rewritten.

**Stops: one**, before the merges (section 7). The only other halts are a review tool that is unavailable when its review is reached (report "written, not reviewed"), a fact below that turns out false (that item only is void; the rest continues), and an operation that would contact a customer.

**Long waits.** Every wait is bounded and says its bound; none is longer than 10 minutes, and the waits of sections 8 and 9 add up to at most 45 minutes (the PM's standing confirmation): section 8 at most 25, section 9 at most 20.

**Nothing runs against production before the merge order.** Section 8's jobs are operator jobs, so no phone gets a notification (#1001). Section 9 writes only on test account 2 and removes what it wrote.

## 1. The items

| # | Item | What changes | Where |
|---|---|---|---|
| 1 | #456 | A new `--mode=decaf` removes caffeine from alcoholic drinks that name no caffeine source, on the ledger, with a snapshot, an undo and the restore rule; then the three cocktails | PR 1, section 8, D1 to D4 |
| 2 | #1047 | The removal concurrency test ends both child processes when it fails | PR 2 |
| 3 | #1048 | `19-saved.sql` reads a saved number only when it is one, and lists the rest as rule x | PR 2 |
| 4 | #990 | The blind study retry: a new `study.mjs`, a fresh reader with no database access per meal, USDA lookups with retries and a named failure, and a set closing rule | PR 3, section 8, S1 to S6 |
| 5 | #990 | The three meals still failing a rule, and #990's disposition | section 8, F1 |
| 6 | #1049, #1041, #937 | The overlap check records which phase each response came from, and opens the uploading meal's own address on purpose | check K3 |
| 7 | #222, #372 | A cold-open photo measurement that records why it fails when it does | section 9, W15 |
| 8 | Backlog for GrokBot | A write-allowed proof run on test account 2 for the items the PM named | section 9 |

## 2. Facts the planner checked on 2026-11-17, and premises

- **The drafts are intact and blind.** `fleet31-postmerge/private/ledger/sample/blind-portion-drafts.json` has 20 meals and 78 foods (55 distinct food keys), each with grams, and every draft says `storedNumbersRead: false`. Its sha256 is `15903ba2269333dad2ed524715750ccaa84b52612253017552aee15ffdca6c8e`, as Fleet 31 reported. The 53 cached USDA result sets carry queries the builder wrote by hand, and nothing maps them to the keys. So the retry searches each key afresh and does not reuse them. All 27 sample photos are JPEG.
- **Why a fresh reader.** The builder's own context has since seen stored totals (Fleet 31 section 9). Only one judgment is left: which USDA record fits each drafted food. The reader that makes it is a new `codex exec --ephemeral` process. It runs in a read-only sandbox with no network, and the database and USDA variables are removed from its environment. It gets one meal's photos, the blind portions and the candidates, under names meal-01 to meal-20. Code adds up the calories. The map from names to prefixes stays in a private file the reader never gets. The planner ran one such reader on a generated plate (no user data). It exited 0 in 7 seconds and chose "cooked" rice and a "fried" egg against "raw" ones. Close its standard input (`< /dev/null`), or it waits for input and times out.
- **`study.mjs` was exercised on the planner's stack** against a fake USDA server. A search answered 503 twice was retried after 2 and 8 seconds and then succeeded. A 400 was not retried and was named with its code. A meal with a failed food came out incomplete, with no total. The estimates were sealed with a sha256. The compare step joined them to a `cards.mjs` file and applied the closing rule. `prepare` names each photo by its real type and refuses a file that is not JPEG, PNG or WebP.
- **The closing rule, set now.** A meal agrees when |stored − estimate| ≤ 25% of the estimate, #990's own figure. The passing-meal part closes when at least 17 of the 20 have a complete estimate and at least 85% of those agree; for 20 meals, that is 17. With 17 of 20, the lower 95% bound on the true agreement rate is about 66%. That is enough to say unflagged meals are mostly right, and no stronger claim is made. With fewer, the disagreeing meals are listed with the step that went wrong, and nothing is re-analysed in this fleet: Fleet 31's five re-analyses all lost values and were restored.
- **Decaf on the planner's stack.** `reanalyse.mjs run --mode=decaf` on a meal with a rum cocktail (alcohol 18.26 g, caffeine 15.4 mg) and peanuts made no model call and stayed at 376 kcal. It ledgered `values_removed: ["food 2: nutrient 1057"]` with its reason and no lost value, and left the cocktail with its alcohol. `restore --snapshot=last` brought the caffeine back. The test also shows that a rum and cola and a black coffee keep their caffeine, and that a wine (alcoholic category) loses its own.
- **What the numbers show after decaf.** Show all lists a food's stored micronutrients, so a cocktail with no 1057 shows no caffeine. The day's caffeine is `getDays`'s `intake.caffeine`, which counts an alcoholic drink's own caffeine (`src/lib/intake/intake.ts` line 36). `cards.mjs` now prints both, so D3 compares them with the app's own code.
- **#1047 on the planner's stack.** The lock-wait condition was forced to fail. With the fix, the test failed in 5.7 seconds, and no psql process or database session was left. On main's test, the same failure held the runner until `timeout` killed it (exit 124 after 60 seconds). Node runs `t.after` hooks in the order they are registered, so the hook that ends the children is registered before the one that deletes the fixture. Otherwise the delete would wait on the writer's lock.
- **#1048 on the planner's stack.** Main's `19-saved.sql` stops with `invalid input syntax for type numeric: ""` on a saved food whose calories are an empty string. The new one reports every saved meal. The unreadable food adds no calories and its meal lists `a2,x`; a saved meal whose items are not a list has no foods and `x`.
- **Why Fleet 31's K3 cohort was empty.** The builder ran the same helper bytes (sha256 `9f1731fe…`). During both uploads, the app makes no request under `/posts/` at all: the only responses the planner saw in Fleet 31 were the cards' own prefetches, made after a card turned ready. The helper stopped collecting as soon as both meals were ready, so whether it caught them was a race. The Fleet 32 helper (`/home/opc/.claude/plans/fleet32-k3.mjs`, sha256 `785350d9b669a3078d63c6ab6c3b7e1ac1cc2be637e8b1e55d73fd8daa77fe55`) labels every response with its phase. It keeps collecting for 5 seconds after both are ready, with both cards scrolled into view. And while the first upload is held, it opens that meal's own address in a second tab. Two runs on the planner's stack: `upload` 0 responses, `tail` 0, `directOpen` 1. The direct open answered **404** with a not-found page, while the card still showed "Uploading photo…". Both meals were ready within 8.5 seconds, and cleanup removed both.
- **Why B2 timed out (#222, #372).** Fleet 31's B2 gave Home up to 15 + 12 seconds to load and then 12 seconds for a loaded feed photo, on a cold, cache-disabled, slowed profile. Its guard blocked nothing but its own probes and one worker wake. All three runs reached the 12-second deadline, and at the deadline the instrument recorded nothing: not the images, their loading state, their position or the network rows. So the cause cannot be read from the evidence. A later DOM read of the same page found 8 cards and 3 loaded photos, so the photos do load eventually. W15 records the page state at a deadline, measures from the Performance timeline instead of a 12-second predicate, and runs an unthrottled open first as a control.
- **Selectors on main.** The drink tiles are `button[aria-label^="Post "]` and the size choice is `#drink-tile-sizes` (`src/components/IntakeSheet.tsx` lines 125 and 131). Each field's mic is a button labelled "Speak" (`src/components/VoiceButton.tsx` line 14). The Profile switch is `button[role="switch"][aria-label="Identify food with Muse Spark Open"]`. It renders only when the production key for the open model is set (`src/app/(tabs)/profile/page.tsx` line 47), so an absent switch means that key is absent, not that the feature is gone. A refused added photo shows its own sentence for five causes (`src/lib/posts/attach-photo.ts` lines 9 to 15), so #970 is a check of what is on main.
- **Verified on the planner's stack** with all three PRs together: `npx tsc --noEmit` clean; `npx eslint` on the changed files clean; the numbers tests 6 of 6 (decaf 2, saved 1, remove 2, rules 1), plus numbers-reanalyse 21 of 21; the database suite 51 of 51; the application suite 780 of 786 (6 skips, 0 failures). Each new test fails on main's files, as each PR says.

## 3. Not in this run, and why

Engineering backlog, unchanged from Fleet 31 (section 3 there has each reason): #999, #212, #594 and #579's camera part need a physical phone; #1000 needs a design; #373 and #375 need the usage page's byte figures; #368 and #279 need fast throwaway sign-ups and the owner's phone; #578 needs a ruling on each finding; #60 waits for the last feature; #553, #552 and #217 need a table of every control with a slowed processor (W-steps here make no votes); #571, #683 and #708 need failures made on purpose beyond this run's (#571's toast is watched in K3); #694, #285 and #617 are larger written findings, and #990's sample is #694's first measured part.

Backlog for GrokBot, outside this run's list: #323's server half (needs the server log), #615 (the notification needs a phone), #684 (the owner's phone), #1021, #988, #377, #454, #494 and #120 (met in Fleet 31), #512 (a local check), #688's swipe (needs a meal with a leftovers photo on test account 2; W4 makes one, so W4 records it), #695 (a busy resizer cannot be forced), #575 (needs a ready meal with an unavailable value; none can be made on purpose).

In flight: #1040 merged in #1044; #1021, #1041 and #937 are measured here; #990 is planned here.

## 4. How it runs

1. **Worktrees.** One fresh worktree per PR from `origin/main`, under `/tmp/mfa-f32`. Before any test in a worktree: `npm ci`.
2. **Your own stack.** `TEST_PORT_BASE=61360 TEST_PG_PORT=55649 TEST_STACK_DIR=/tmp/mfa-f32/stack TEST_ENV_FILE=.env.test.fleet32`. Keep `TEST_STACK_DIR` short. Never stop or touch a container that does not end in `-61360`. If the stack reports "Local service did not become ready", remove the stack directory and the env file and start it once more.
3. **Tests.** Load the env file (`set -a; . ./.env.test.fleet32; set +a`), then `PATH="$PWD/tests/bin:/usr/pgsql-17/bin:$PATH" TZ=UTC MFA_TEST_DISPOSABLE=1 timeout 600 node --import ./tests/fixtures/local-providers.mjs --import tsx --test <files>`.
4. **Suites.** The application suite (`npm test`, with the built app started) and the database suite (`npm run test:db`) once each, on a scratch branch that merges all three PRs locally (never pushed). Bound: 10 minutes each.
5. **Per PR:** apply the edits; `node --check` on each changed `.mjs`; `npx tsc --noEmit`; `npx eslint <changed files>`; the PR's named tests; and the PR's red check on main's files, reported.
6. **Reviews.** One PPLX review per code PR on its final head, full 40-character SHA, with main's runner. AGY when PPLX is unavailable. The docs PR needs no review.
7. **Check K3** (section 6.1), on the scratch branch of step 4.
8. **Docs PR**, branch `docs/fleet32` from `origin/main`: this plan unchanged as `docs/plan-fleet32.md`.
9. **Stop** (section 7).

## 5. The code PRs

### PR 1 — branch `fix32/decaf` — #456

A new operator mode, built like repair: it writes in place, so its snapshot records the nutrition, and restore puts it back with `15-repair-undo.sql`. The one difference from every other mode is deliberate. The caffeine it removes is ledgered as `values_removed`, with its reason, and is not counted as a loss. Any other lost value still puts the meal back. A food is an alcoholic drink when it holds alcohol (1018 above zero) or is in an alcoholic category. A name with a caffeine source (coffee, espresso, kahlua, cola, coke, pepsi, tea, matcha, energy, guarana, mate, cocoa, chocolate, mocha) keeps its caffeine. `20-decaf.sql` locks the meal's row first, as `18-remove.sql` does. `cards.mjs` gains the day's caffeine and the stored caffeine.

File `scripts/numbers/reanalyse.mjs`.

Find:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15, 15-repair-undo and 16) through psql and wakes the worker with /api/jobs/tick.
```
Replace:
```
// It runs the SQL files beside it (08, 09, 11, 12, 13, 15, 15-repair-undo, 16 and 20) through psql and wakes the worker with /api/jobs/tick.
```

Find:
```
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql', repair: '15-repair.sql' };
```
Replace:
```
export const MODE_FILES = { rematch: '11-rematch.sql', reanalyse: '12-reanalyse.sql', repair: '15-repair.sql', decaf: '20-decaf.sql' };
// Modes that write nutrition in place: their snapshot records it, and restore puts it back with 15-repair-undo.sql.
export const IN_PLACE_MODES = new Set(['repair', 'decaf']);
```

Find:
```
  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair
```
Replace:
```
  node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair|decaf
```

Find:
```
  --mode=repair       15-repair.sql: a negative stored value becomes zero and the meal is summed again.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
```
Replace:
```
  --mode=repair       15-repair.sql: a negative stored value becomes zero and the meal is summed again.
  --mode=decaf        20-decaf.sql: caffeine stored on an alcoholic drink that names no caffeine source is removed
                      and the meal is summed again (#456). That caffeine is ledgered as values_removed, not as a loss.
  --meals             comma-separated 8-character meal id prefixes, worked in the order given.
```

Find:
```
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch, --mode=reanalyse or --mode=repair is required.');
```
Replace:
```
  if (!Object.hasOwn(MODE_FILES, values.mode ?? '')) throw new UsageError('--mode=rematch, --mode=reanalyse, --mode=repair or --mode=decaf is required.');
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

// Pure: #456. A decaf run removes caffeine (nutrient 1057) on purpose from alcoholic drinks that name no caffeine
// source: a correction under the PM's ruling, ledgered with the snapshot taken before it. Those removals are not losses;
// any other value lost still puts the meal back.
export const DECAF_REASON = 'caffeine stored on an alcoholic drink that names no caffeine source (#456)';
export function deliberateRemovals(lost) {
  const removed = (lost ?? []).filter((value) => /^food [0-9]+: nutrient 1057$/.test(value));
  return { removed, kept: (lost ?? []).filter((value) => !removed.includes(value)) };
}

```

Find:
```
      appendPrivate(ledger, 'snapshots.jsonl', request.mode === 'repair' ? JSON.stringify({ ...JSON.parse(snapshot), operator_mode: 'repair' }) : snapshot);
```
Replace:
```
      appendPrivate(ledger, 'snapshots.jsonl', IN_PLACE_MODES.has(request.mode) ? JSON.stringify({ ...JSON.parse(snapshot), operator_mode: request.mode }) : snapshot);
```

Find:
```
          else row.values_lost = ['the meal could not be read after its run'];
          const why = restoreReason(row);
```
Replace:
```
          else row.values_lost = ['the meal could not be read after its run'];
          if (request.mode === 'decaf') {
            const { removed, kept } = deliberateRemovals(row.values_lost);
            row.values_lost = kept;
            if (removed.length) { row.values_removed = removed; row.removal_reason = DECAF_REASON; }
          }
          const why = restoreReason(row);
```

Find:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.values_carried ? ` [carried: ${row.values_carried.join('; ')}]` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```
Replace:
```
    console.log(`${prefix}  ${row.outcome}${row.reason ? ` (${row.reason})` : ''}${row.values_carried ? ` [carried: ${row.values_carried.join('; ')}]` : ''}${row.values_removed ? ` [removed: ${row.values_removed.join('; ')}]` : ''}${row.restore_reason ? ` [put back: ${row.restore_reason}${row.restored ? '' : '; the restore did not finish'}]` : ''}  kcal ${fmt(row.before?.calories)} -> ${fmt(row.after?.calories)}  waited ${row.seconds_waited} s`);
```

Find:
```
  const repairNutrition = snapshot.operator_mode === 'repair' ? (snapshot.items ?? [])
```
Replace:
```
  const repairNutrition = IN_PLACE_MODES.has(snapshot.operator_mode) ? (snapshot.items ?? [])
```


File `scripts/numbers/cards.mjs`.

Find:
```
// current foods. It only reads. It prints meal prefixes, dates and numbers: no name, caption or comment text.
```
Replace:
```
// current foods. Then the day's caffeine as the app counts it (#456), and the caffeine its foods store (Show all). It only reads. It prints meal prefixes, dates and numbers: no name, caption or comment text.
```

Find:
```
console.log('meal|day|card_kcal|first_comment_kcal|day_kcal|stored_kcal');
```
Replace:
```
console.log('meal|day|card_kcal|first_comment_kcal|day_kcal|stored_kcal|day_caffeine_mg|stored_caffeine_mg');
```

Find:
```
  const items = read(await db.from('post_items').select('item_nutrition(calories)').eq('post_id', post.id).is('superseded_at', null));
  const stored = items.reduce((sum, item) => sum + Number([item.item_nutrition].flat()[0]?.calories ?? 0), 0);
  console.log([prefix, day, card ? formatCalories(card.totals.calories) : `not listed (${post.status})`, stated,
    logged ? formatCalories(logged.totals.calories) : '', Math.round(stored * 10) / 10].join('|'));
```
Replace:
```
  const items = read(await db.from('post_items').select('item_nutrition(calories,micronutrients)').eq('post_id', post.id).is('superseded_at', null));
  const stored = items.reduce((sum, item) => sum + Number([item.item_nutrition].flat()[0]?.calories ?? 0), 0);
  const caffeine = items.reduce((sum, item) => sum + ([[item.item_nutrition].flat()[0]?.micronutrients].flat().filter(m => m && String(m.nutrientId) === '1057' && m.basis === 'portion')
    .reduce((s, m) => s + (Number(m.value) || 0), 0)), 0);
  console.log([prefix, day, card ? formatCalories(card.totals.calories) : `not listed (${post.status})`, stated,
    logged ? formatCalories(logged.totals.calories) : '', Math.round(stored * 10) / 10, logged ? Math.round(logged.intake.caffeine) : '',
    Math.round(caffeine * 10) / 10].join('|'));
```


File `scripts/numbers/README.md`.

Find:
```
cards.mjs only reads: for each meal prefix, the calories its card shows, the calories its first model comment states and its day's total, computed and rounded by the app's own code (getDays, formatCalories), beside the stored sum of its foods (#1021). Run it with `node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <prefix> ...` and NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set. It prints prefixes, dates and numbers only.
```
Replace:
```
cards.mjs only reads: for each meal prefix, the calories its card shows, the calories its first model comment states and its day's total, computed and rounded by the app's own code (getDays, formatCalories), beside the stored sum of its foods (#1021). Run it with `node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <prefix> ...` and NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set. It prints prefixes, dates and numbers only. Its last two columns are the day's caffeine as the app counts it and the caffeine the meal's foods store (#456).

20-decaf.sql writes in place, like 15: it removes caffeine (nutrient 1057) from a current food that is an alcoholic drink (alcohol above zero, or an alcoholic category) and names no caffeine source, and queues an operator recompute (#456). Run it only through `reanalyse.mjs run --mode=decaf`, which takes the snapshot first, ledgers the removed caffeine as values_removed with its reason, and puts the meal back if anything else is lost; `restore` undoes it with 15-repair-undo.sql.
```


New files (section 6): `scripts/numbers/20-decaf.sql`, `tests/numbers-decaf.test.mjs`.

Named tests: `tests/numbers-decaf.test.mjs` (2 tests) and `tests/numbers-reanalyse.test.mjs` (21, unchanged). Red check: on main, `numbers-decaf.test.mjs` fails to import `deliberateRemovals`, and `20-decaf.sql` does not exist. Also run once on the stack `reanalyse.mjs run --mode=decaf` and `restore` on a meal you insert (a rum cocktail with caffeine, and one other food), then `cards.mjs` on it. Report the ledger line and the caffeine before, after and after the restore, then delete the meal.

### PR 2 — branch `fix32/numbers-fixes` — #1047, #1048

File `tests/numbers-remove.test.mjs`.

Find:
```
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), app = `remove-${post.slice(0, 8)}`;
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
```
Replace:
```
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), app = `remove-${post.slice(0, 8)}`;
  // #1047: an unexpected error must not leave either psql running. Hooks run in the order they are registered, so
  // this one ends both children (and the writer's lock) before the fixture is deleted.
  let writer = null, removal = null;
  t.after(() => { for (const child of [writer, removal]) if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
```

Find:
```
  const writer = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { stdio: ['pipe', 'pipe', 'pipe'] });
```
Replace:
```
  writer = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { stdio: ['pipe', 'pipe', 'pipe'] });
```

Find:
```
  const removal = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${milk}`, '-f', file], { env: { ...process.env, PGAPPNAME: app } });
```
Replace:
```
  removal = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${milk}`, '-f', file], { env: { ...process.env, PGAPPNAME: app } });
```


File `scripts/numbers/19-saved.sql`.

Find:
```
-- Prefixes only: no name, caption or comment is printed.
with saved as (
  select 'saved' as kind, s.user_id, s.id, s.source_post_id,
         (select count(*) from jsonb_array_elements(s.items)) as foods,
         (select sum((e->'nutrition'->>'calories')::numeric) from jsonb_array_elements(s.items) e) as kcal,
         (select string_agg(distinct r, ',' order by r) from jsonb_array_elements(s.items) e
            cross join lateral (values
              (case when e->'nutrition'->>'calories' is null or e->'nutrition'->>'protein_g' is null
                      or e->'nutrition'->>'carbs_g' is null or e->'nutrition'->>'fat_g' is null then 'a2' end),
              (case when (e->>'portion_grams')::numeric > 0 and ((e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric < 0
                      or (e->'nutrition'->>'calories')::numeric / (e->>'portion_grams')::numeric > 9) then 'd' end),
              (case when ((e->>'portion_grams') is null and not (e->'nutrition'->>'calories' is not null and e->>'portion_text' ~ '^[0-9]+([.][0-9]+)? ml$'))
                      or (e->>'portion_grams')::numeric < 5 or (e->>'portion_grams')::numeric > 1500 then 'e' end),
              (case when (e->'nutrition'->>'calories')::numeric < 0 or (e->'nutrition'->>'protein_g')::numeric < 0
                      or (e->'nutrition'->>'carbs_g')::numeric < 0 or (e->'nutrition'->>'fat_g')::numeric < 0 then 'f' end)) v(r)
            where r is not null) as rules
```
Replace:
```
-- #1048: a saved value is read as a number only when it is a JSON number or a numeric string. A string that is not a
-- number (empty, or text) is not turned into zero and does not stop the report: the value is unknown, and the meal's
-- row lists rule x, "a saved number cannot be read". A value that is absent, null or not a string or number counts as
-- missing (rule a2). A saved meal whose items is not a list has no foods and x.
-- Prefixes only: no name, caption or comment is printed.
with saved_foods as (
  select s.id, e.food, e.position,
         case when jsonb_typeof(e.food) <> 'object' then null when g.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then g.raw::numeric end as grams,
         case when c.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then c.raw::numeric end as kcal,
         case when pr.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then pr.raw::numeric end as protein,
         case when cb.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then cb.raw::numeric end as carbs,
         case when ft.raw ~ '^\s*-?[0-9]+([.][0-9]+)?\s*$' then ft.raw::numeric end as fat,
         -- x: a value that is present but is not a number.
         jsonb_typeof(e.food) <> 'object' or exists (select 1 from (values (g.raw), (c.raw), (pr.raw), (cb.raw), (ft.raw)) v(raw)
                where v.raw is not null and v.raw !~ '^\s*-?[0-9]+([.][0-9]+)?\s*$') as unreadable,
         c.raw is null or pr.raw is null or cb.raw is null or ft.raw is null as missing
  from public.saved_meals s
  cross join lateral jsonb_array_elements(case when jsonb_typeof(s.items) = 'array' then s.items else '[]'::jsonb end) with ordinality e(food, position)
  cross join lateral (select case when jsonb_typeof(e.food) = 'object' and jsonb_typeof(e.food->'portion_grams') in ('number', 'string') then e.food->>'portion_grams' end) g(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'calories') in ('number', 'string') then e.food->'nutrition'->>'calories' end) c(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'protein_g') in ('number', 'string') then e.food->'nutrition'->>'protein_g' end) pr(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'carbs_g') in ('number', 'string') then e.food->'nutrition'->>'carbs_g' end) cb(raw)
  cross join lateral (select case when jsonb_typeof(e.food->'nutrition') = 'object' and jsonb_typeof(e.food->'nutrition'->'fat_g') in ('number', 'string') then e.food->'nutrition'->>'fat_g' end) ft(raw)
), saved as (
  select 'saved' as kind, s.user_id, s.id, s.source_post_id,
         (select count(*) from saved_foods f where f.id = s.id) as foods,
         (select sum(f.kcal) from saved_foods f where f.id = s.id) as kcal,
         (select string_agg(distinct r, ',' order by r) from (
            select case when jsonb_typeof(s.items) <> 'array' then 'x' end
            union all
            select r from saved_foods f cross join lateral (values
              (case when f.missing or (not f.unreadable and (f.kcal is null or f.protein is null or f.carbs is null or f.fat is null)) then 'a2' end),
              (case when f.grams > 0 and (f.kcal / f.grams < 0 or f.kcal / f.grams > 9) then 'd' end),
              (case when (f.grams is null and not f.unreadable and not (f.kcal is not null and f.food->>'portion_text' ~ '^[0-9]+([.][0-9]+)? ml$'))
                      or f.grams < 5 or f.grams > 1500 then 'e' end),
              (case when f.kcal < 0 or f.protein < 0 or f.carbs < 0 or f.fat < 0 then 'f' end),
              (case when f.unreadable then 'x' end)) v(r)
            where f.id = s.id) rr(r) where r is not null) as rules
```


New file (section 6): `tests/numbers-saved.test.mjs`.

Named tests: `tests/numbers-remove.test.mjs` (2) and `tests/numbers-saved.test.mjs` (1). Red checks:
- `numbers-saved.test.mjs` on main's `19-saved.sql` fails with `invalid input syntax for type numeric: ""`.
- #1047's bounded failure path: copy `tests/numbers-remove.test.mjs` to a scratch file in `tests/` with `application_name='${app}'` replaced by `application_name='no-such-app'`. Count `pgrep -xc psql`, run the copy under `timeout 120`, count again, and count `pg_stat_activity` rows whose `application_name` starts with `remove-`. With the fix, test 2 fails on "the removal waits on the meal row" within about 6 seconds, and both counts return to where they were. The same copy of main's test file runs until the `timeout` (exit 124). Delete the scratch copies.

### PR 3 — branch `fix32/study` — #990

One new file, `scripts/numbers/study.mjs` (section 6). It reads no database and no stored number. Only `compare` reads stored totals, and only from a file `cards.mjs` wrote after the estimates were sealed. No test: the contract asks for none for a study tool. The fake-server exercise in section 2 is its evidence. Repeat it in the PR: a local server that answers 503 twice and then succeeds for one query, and 400 for another, with `FDC_SEARCH_URL` pointed at it. Report the output.

## 6. The new files

### `scripts/numbers/20-decaf.sql`

```
-- #456: caffeine (nutrient 1057) stored on an alcoholic drink that names no caffeine source is removed from that
-- food's micronutrients, and the worker sums the meal again and rewrites its summary. It is an operator recompute:
-- every food keeps its other nutrition, so nothing is looked up again and no model is asked. A food is an alcoholic
-- drink when it holds alcohol (nutrient 1018 above zero) or its category is an alcoholic one (rule b of 03). A name
-- with a caffeine source keeps its caffeine: a rum and cola, a coffee liqueur, a Long Island iced tea.
-- psql variable: post (the full meal id). Run through reanalyse.mjs --mode=decaf only: it privately records the
-- original nutrition with 08 before this writes, so restore can run 15-repair-undo.sql on the same item IDs.
begin;
-- Lock the meal's row first, as 18-remove.sql does (#1040), so the check below sees every change committed before it.
select id from public.posts where id = :'post'::uuid for update \g /dev/null
with meal as (
  select p.id from public.posts p
  where p.id = :'post'::uuid and p.status = 'ready' and p.deleted_at is null
    and not exists (select 1 from public.jobs j where j.post_id = p.id and j.status in ('queued', 'running'))
), fixed as (
  update public.item_nutrition n set micronutrients = (
      select coalesce(jsonb_agg(m order by o), '[]'::jsonb)
      from jsonb_array_elements(n.micronutrients) with ordinality e(m, o)
      where m->>'nutrientId' is distinct from '1057')
  from public.post_items i
  where n.post_item_id = i.id and i.superseded_at is null and i.post_id in (select id from meal)
    and jsonb_typeof(n.micronutrients) = 'array'
    and exists (select 1 from jsonb_array_elements(n.micronutrients) e(m) where m->>'nutrientId' = '1057')
    and (exists (select 1 from jsonb_array_elements(n.micronutrients) e(m)
                 where m->>'nutrientId' = '1018' and jsonb_typeof(m->'value') = 'number' and (m->>'value')::numeric > 0)
         or lower(coalesce(n.food_category, '')) in ('alcoholic beverages', 'beer', 'wine', 'liquor and cocktails'))
    and i.name !~* '\m(coffee|espresso|kahlua|cola|coke|pepsi|tea|matcha|energy|guarana|mate|cocoa|chocolate|mocha)\M'
  returning i.post_id
), queued as (
  update public.posts p set status = 'queued', fail_reason = null
  where p.id in (select post_id from fixed)
  returning p.id
)
insert into public.jobs (post_id, kind, priority, status, payload)
select id, 'recompute', 200, 'queued', '{"operator":"decaf"}'::jsonb from queued
returning left(id::text, 8) as job, left(post_id::text, 8) as post, kind, priority;
commit;
```


### `tests/numbers-decaf.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { deliberateRemovals } from '../scripts/numbers/reanalyse.mjs';

// #456: caffeine on an alcoholic drink that names no caffeine source is removed on purpose; nothing else may change.
test('a decaf run counts only caffeine (nutrient 1057) as removed; any other lost value still restores the meal', () => {
  assert.deepEqual(deliberateRemovals(['food 2: nutrient 1057']), { removed: ['food 2: nutrient 1057'], kept: [] });
  assert.deepEqual(deliberateRemovals(['food 2: nutrient 1057', 'food 2: nutrient 1018', 'food 1: calories']),
    { removed: ['food 2: nutrient 1057'], kept: ['food 2: nutrient 1018', 'food 1: calories'] });
  assert.deepEqual(deliberateRemovals(['renamed foods: nutrient 1057']), { removed: [], kept: ['renamed foods: nutrient 1057'] });
  assert.deepEqual(deliberateRemovals(undefined), { removed: [], kept: [] });
});

const file = fileURLToPath(new URL('../scripts/numbers/20-decaf.sql', import.meta.url));
test('20-decaf.sql removes caffeine from a cocktail only, keeps a rum and cola and a coffee, and queues one operator recompute', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const decaf = post => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), tiki = randomUUID(), cuba = randomUUID(), coffee = randomUUID(), wine = randomUUID();
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  const micro = list => `'${JSON.stringify(list.map(([nutrientId, value]) => ({ nutrientId, value, unit: nutrientId === 1018 ? 'G' : 'MG', basis: 'portion' })))}'`;
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','decaf-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${tiki}','${post}','lime and rum tiki cocktail','model',220),
 ('${cuba}','${post}','rum and cola','model',250),('${coffee}','${post}','black coffee','model',240),('${wine}','${post}','red wine','model',150);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients,food_category)values
 ('${tiki}',196,0,17,0,${micro([[1018, 18.26], [1057, 15.4], [1092, 40]])},null),
 ('${cuba}',180,0,20,0,${micro([[1018, 14], [1057, 10]])},null),
 ('${coffee}',2,0.3,0,0,${micro([[1057, 72]])},null),
 ('${wine}',128,0.1,4,0,${micro([[1057, 1]])},'Alcoholic Beverages');`);
  assert.match(decaf(post), /recompute/);
  const ids = row => sql(`select string_agg(m->>'nutrientId',',' order by o) from item_nutrition n, jsonb_array_elements(n.micronutrients) with ordinality e(m,o) where n.post_item_id='${row}';`).trim();
  assert.equal(ids(tiki), '1018,1092', 'the cocktail keeps its alcohol and potassium, in order');
  assert.equal(ids(cuba), '1018,1057', 'a rum and cola keeps its caffeine');
  assert.equal(ids(coffee), '1057', 'a coffee keeps its caffeine');
  assert.equal(ids(wine), '', 'a wine (alcoholic category) loses its caffeine');
  assert.equal(sql(`select calories from item_nutrition where post_item_id='${tiki}';`).trim(), '196');
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "decaf"}');
  assert.equal(decaf(post).trim(), '', 'a meal with a job queued is refused');
  sql(`update jobs set status='finished',finished_at=now() where post_id='${post}';update posts set status='ready' where id='${post}';`);
  assert.equal(decaf(post).trim(), '', 'a second run changes nothing and queues nothing');
});
```


### `tests/numbers-saved.test.mjs`

```
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #1048: a saved value that is not a number neither stops 19-saved.sql nor becomes zero; it is listed as rule x.
const file = fileURLToPath(new URL('../scripts/numbers/19-saved.sql', import.meta.url));
test('19-saved.sql lists unreadable saved numbers as rule x and still reports every other saved meal', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), item = randomUUID(), good = randomUUID(), bad = randomUUID(), notList = randomUUID();
  t.after(() => sql(`delete from saved_meals where user_id='${user}';delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  const rice = { name: 'rice', portion_grams: 150, nutrition: { calories: 195, protein_g: 4, carbs_g: 42, fat_g: 0.4 } };
  const items = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','saved-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${item}','${post}','rice','model',150);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)values('${item}',195,4,42,0.4);
insert into saved_meals(id,user_id,name,source_post_id,items)values
 ('${good}','${user}','good','${post}',${items([rice])}),
 ('${bad}','${user}','bad',null,${items([rice, { name: 'sambal', portion_grams: 'about 100', nutrition: { calories: '', protein_g: '0', carbs_g: 1, fat_g: { value: 0 } } }])}),
 ('${notList}','${user}','not a list',null,'{"name":"rice"}'::jsonb);`);
  const rows = execFileSync('psql', ['-X', '-qAt', '-F', '|', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-f', file], { encoding: 'utf8', timeout: 10000 })
    .trim().split('\n').map(line => line.split('|')).filter(row => row[1] === user.slice(0, 8));
  const byMeal = Object.fromEntries(rows.map(row => [row[2], { foods: row[4], kcal: row[5], against: row[8], rules: row[9] }]));
  assert.deepEqual(byMeal[good.slice(0, 8)], { foods: '1', kcal: '195.0', against: 'matches source', rules: '' });
  assert.deepEqual(byMeal[bad.slice(0, 8)], { foods: '2', kcal: '195.0', against: 'no source', rules: 'a2,x' }, 'the unreadable food adds no calories and is flagged');
  assert.deepEqual(byMeal[notList.slice(0, 8)], { foods: '0', kcal: '', against: 'no source', rules: 'x' });
});
```


### `scripts/numbers/study.mjs`

```
#!/usr/bin/env node
// #990: the blind study of passing meals against an independent estimate. No step reads the database or any stored
// number of a meal; only `compare` reads stored totals, from a file that cards.mjs wrote, after the estimates are sealed.
//   prepare     the photos and drafted portions of each meal, renamed meal-01, meal-02, ... into a blind folder; the
//               map from those names to meal prefixes goes to a separate private file the reader never gets.
//   candidates  for every drafted food, USDA FoodData Central search results with their kcal per 100 g, retried on
//               a rate limit, a server error or a network error; a food that still fails is listed, never guessed.
//   total       each meal's calories from the reader's choices (blind/choices/meal-NN.json): grams x kcal per 100 g.
//               A meal with any food unchosen or unlooked-up is incomplete and has no total. Prints the sha256 seal.
//   compare     estimates against stored totals: agrees when |stored - estimate| <= 25% of the estimate, and the
//               passing-meal part closes when at least 17 meals have a complete estimate and 85% of them agree.
// Use: node scripts/numbers/study.mjs <step> --help
import { createHash } from 'node:crypto';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

export const AGREE_SHARE = 0.25, CLOSE_MIN_COMPLETE = 17, CLOSE_MIN_AGREE = 0.85;
export const RETRY_WAITS_SECONDS = [2, 8, 30];
const SEARCH_URL = process.env.FDC_SEARCH_URL ?? 'https://api.nal.usda.gov/fdc/v1/foods/search';
const DATA_TYPES = ['Foundation', 'SR Legacy', 'Survey (FNDDS)'];
const ENERGY_IDS = [1008, 2048, 2047];
const sha256 = text => createHash('sha256').update(text).digest('hex');
const privateDir = dir => { mkdirSync(dir, { recursive: true, mode: 0o700 }); chmodSync(dir, 0o700); };
const privateWrite = (file, text) => { writeFileSync(file, text, { mode: 0o600 }); chmodSync(file, 0o600); };
const readJson = file => JSON.parse(readFileSync(file, 'utf8'));
const blindName = index => `meal-${String(index + 1).padStart(2, '0')}`;
// Pure: a photo's file extension from its first bytes, so the reader receives it under its real type.
export function photoExtension(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  if (String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP') return 'webp';
  return null;
}

// Pure: kcal per 100 g of one search result, or null. Energy in kcal (1008) first, then the Atwater values.
export function kcalPer100g(food) {
  for (const id of ENERGY_IDS) {
    const n = (food.foodNutrients ?? []).find(x => Number(x.nutrientId) === id && String(x.unitName ?? '').toUpperCase() === 'KCAL');
    if (n && Number.isFinite(Number(n.value))) return Number(n.value);
  }
  return null;
}

// Pure: whether a failed search is worth another try.
export const retryable = status => status === 'network' || status === 429 || (status >= 500 && status <= 599);

// One search with its retries. fetcher and wait are injectable for the test of this step.
export async function search(query, { key, fetcher = fetch, wait = s => new Promise(r => setTimeout(r, s * 1000)), log = () => {} } = {}) {
  const attempts = [];
  for (let attempt = 0; attempt <= RETRY_WAITS_SECONDS.length; attempt++) {
    let status;
    try {
      const response = await fetcher(`${SEARCH_URL}?api_key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, dataType: DATA_TYPES, pageSize: 10 }), signal: AbortSignal.timeout(30000) });
      status = response.status;
      if (response.ok) {
        const body = await response.json();
        const foods = (body.foods ?? []).map(f => ({ fdcId: f.fdcId, description: f.description, dataType: f.dataType, kcal_per_100g: kcalPer100g(f) }))
          .filter(f => f.kcal_per_100g !== null);
        attempts.push(status);
        return { ok: true, query, attempts, foods };
      }
    } catch { status = 'network'; }
    attempts.push(status);
    log(`search "${query}": ${status}`);
    if (!retryable(status) || attempt === RETRY_WAITS_SECONDS.length) return { ok: false, query, attempts, status };
    await wait(RETRY_WAITS_SECONDS[attempt]);
  }
  return { ok: false, query, attempts, status: 'unreachable' };
}

// Pure: one meal's estimate from its drafted foods, the reader's choices and the candidates.
export function estimateMeal(portion, choice, candidates) {
  const foods = portion.foods.map(food => {
    const picked = choice?.foods?.find(c => c.key === food.key);
    const found = candidates[food.key];
    if (!found?.ok) return { key: food.key, grams: food.grams, missing: 'lookup failed' };
    const record = picked?.fdcId == null ? null : found.foods.find(f => f.fdcId === picked.fdcId);
    if (!record) return { key: food.key, grams: food.grams, missing: picked?.fdcId == null ? 'not chosen' : 'chosen record not among the candidates' };
    return { key: food.key, grams: food.grams, fdcId: record.fdcId, kcal_per_100g: record.kcal_per_100g, kcal: Math.round(food.grams * record.kcal_per_100g) / 100 };
  });
  const complete = foods.every(f => f.kcal !== undefined);
  return { meal: portion.meal, complete, kcal: complete ? Math.round(foods.reduce((sum, f) => sum + f.kcal, 0) * 10) / 10 : null, foods };
}

// Pure: the comparison and whether it closes the passing-meal part.
export function compareStudy(estimates, map, stored) {
  const rows = estimates.map(e => {
    const prefix = map[e.meal];
    const s = stored[prefix];
    const agrees = e.complete && s != null ? Math.abs(s - e.kcal) <= AGREE_SHARE * e.kcal : null;
    return { meal: prefix, estimate: e.kcal, stored: s ?? null, complete: e.complete, agrees };
  });
  const complete = rows.filter(r => r.complete && r.stored != null);
  const agree = complete.filter(r => r.agrees).length;
  const closes = complete.length >= CLOSE_MIN_COMPLETE && agree >= Math.ceil(CLOSE_MIN_AGREE * complete.length);
  return { rows, complete: complete.length, agree, closes };
}

async function main(argv) {
  const [step, ...rest] = argv;
  const { values } = parseArgs({ args: rest, options: { drafts: { type: 'string' }, sample: { type: 'string' }, blind: { type: 'string' }, map: { type: 'string' },
    cache: { type: 'string' }, estimates: { type: 'string' }, stored: { type: 'string' }, 'max-minutes': { type: 'string' }, help: { type: 'boolean' } } });
  if (values.help || !['prepare', 'candidates', 'total', 'compare'].includes(step)) {
    console.log(`node scripts/numbers/study.mjs prepare --drafts=<blind-portion-drafts.json> --sample=<folder of <prefix>/photo-* files> --blind=<new folder> --map=<private map file>
node scripts/numbers/study.mjs candidates --blind=<folder> [--max-minutes=10]      (needs FDC_API_KEY)
node scripts/numbers/study.mjs total --blind=<folder>
node scripts/numbers/study.mjs compare --estimates=<blind>/estimates.json --map=<private map file> --stored=<cards.mjs output>`);
    return step ? 0 : 4;
  }
  if (step === 'prepare') {
    const drafts = readJson(values.drafts);
    if (drafts.some(d => d.storedNumbersRead !== false)) throw new Error('A draft was written after stored numbers were read; it cannot be used.');
    if (existsSync(values.blind)) throw new Error('The blind folder exists; give a new one.');
    privateDir(values.blind);
    const map = {}, portions = [];
    drafts.forEach((draft, index) => {
      const name = blindName(index);
      map[name] = draft.meal;
      privateDir(path.join(values.blind, name));
      const photos = readdirSync(path.join(values.sample, draft.meal)).filter(f => f.startsWith('photo-')).sort();
      if (!photos.length) throw new Error(`Meal ${index + 1} has no photo.`);
      photos.forEach((photo, k) => {
        const from = path.join(values.sample, draft.meal, photo), ext = photoExtension(readFileSync(from));
        if (!ext) throw new Error(`Meal ${index + 1}, photo ${k + 1} is not a JPEG, PNG or WebP image.`);
        const to = path.join(values.blind, name, `photo-${k + 1}.${ext}`); copyFileSync(from, to); chmodSync(to, 0o600);
      });
      portions.push({ meal: name, foods: draft.foods.map(f => ({ key: f.key, grams: f.grams })) });
    });
    privateWrite(path.join(values.blind, 'portions.json'), JSON.stringify(portions, null, 1) + '\n');
    privateWrite(values.map, JSON.stringify(map) + '\n');
    console.log(`${portions.length} meals, ${portions.reduce((n, p) => n + p.foods.length, 0)} foods. Drafts sha256 ${sha256(readFileSync(values.drafts))}.`);
    return 0;
  }
  if (step === 'candidates') {
    const key = process.env.FDC_API_KEY;
    if (!key) throw new Error('FDC_API_KEY is not set.');
    const file = path.join(values.blind, 'candidates.json');
    const candidates = existsSync(file) ? readJson(file) : {};
    const keys = [...new Set(readJson(path.join(values.blind, 'portions.json')).flatMap(p => p.foods.map(f => f.key)))];
    const deadline = Date.now() + Number(values['max-minutes'] ?? 10) * 60000;
    for (const food of keys) {
      if (candidates[food]?.ok) continue;
      if (Date.now() > deadline) { console.log(`STOPPED: --max-minutes used up; ${keys.filter(k => !candidates[k]?.ok).length} food(s) not looked up.`); break; }
      candidates[food] = await search(food.replaceAll('_', ' '), { key, log: line => console.log(line) });
      privateWrite(file, JSON.stringify(candidates, null, 1) + '\n');
    }
    const failed = keys.filter(k => !candidates[k]?.ok);
    console.log(`${keys.length - failed.length} of ${keys.length} foods looked up.${failed.length ? ` Failed: ${failed.map(k => `${k} (${candidates[k]?.attempts?.join(', ') ?? 'not tried'})`).join('; ')}.` : ''}`);
    return failed.length ? 1 : 0;
  }
  if (step === 'total') {
    const portions = readJson(path.join(values.blind, 'portions.json'));
    const candidates = readJson(path.join(values.blind, 'candidates.json'));
    const estimates = portions.map(p => {
      const file = path.join(values.blind, 'choices', `${p.meal}.json`);
      return estimateMeal(p, existsSync(file) ? readJson(file) : null, candidates);
    });
    const text = JSON.stringify(estimates, null, 1) + '\n';
    privateWrite(path.join(values.blind, 'estimates.json'), text);
    console.log(`${estimates.filter(e => e.complete).length} of ${estimates.length} meals have a complete estimate. Sealed: sha256 ${sha256(text)}.`);
    return 0;
  }
  const stored = {};
  for (const line of readFileSync(values.stored, 'utf8').split('\n').slice(1)) {
    const [meal, , , , , kcal] = line.split('|');
    if (/^[0-9a-f]{8}$/.test(meal ?? '') && kcal !== undefined && kcal !== '') stored[meal] = Number(kcal);
  }
  const result = compareStudy(readJson(values.estimates), readJson(values.map), stored);
  console.log('meal|estimate_kcal|stored_kcal|agrees');
  for (const r of result.rows) console.log([r.meal, r.estimate ?? 'incomplete', r.stored ?? '', r.agrees === null ? '' : r.agrees ? 'yes' : 'no'].join('|'));
  console.log(`${result.agree} of ${result.complete} complete estimates agree within ${AGREE_SHARE * 100}%. The passing-meal part ${result.closes ? 'closes' : 'does not close'} (it needs at least ${CLOSE_MIN_COMPLETE} complete and ${CLOSE_MIN_AGREE * 100}% agreeing).`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2)).then(code => { process.exitCode = code; }, error => { console.error(error.message); process.exitCode = 1; });
```


### 6.1 The check

- **K3, #1049, #1041 and #937.** Copy `/home/opc/.claude/plans/fleet32-k3.mjs` (check its sha256 in section 2) outside Git. With the scratch branch's app built and started, run `MFA_TEST_DISPOSABLE=1 K3_OUT=<a private folder, mode 0700, with an empty private/ inside> timeout 600 node fleet32-k3.mjs K3 <scratch worktree> <its .env.test.fleet32> <the build marker>` once. Report: `firstCardMs`, `secondStartedWhileFirstUploading`, `firstStillUploadingAfterSecondPost`, `bothReady`, `elapsedUntilBothReadyMs`, `phases` (responses in `upload`, `directOpen` and `tail`), every response with its phase, 8-character path, status, time and type, `directOpen` (its status, whether the first card was still uploading, whether a not-found page showed), and the cleanup rows. The helper's `pass` is false whenever the direct open answers 404: read the phases, not `pass`. The route cohort counts as exercised only when `directOpen` has a response. An `upload` count of 0 with a non-empty `directOpen` means the app itself sends nothing for an uploading meal. If the helper fails, report its `firstError` and do not run it again.

## 7. The stop

Stop when the three code PRs and the docs PR are open, each code PR reviewed or reported "written, not reviewed", and K3 is reported. Report to the PM, in one message:

1. Each PR: number, branch, final head (40 characters), tests and their counts, the red result on main, and the review's result.
2. The two suites' counts.
3. K3, with the numbers it asks for. On the planner's stack the direct open answered 404 while the card showed "Uploading photo…". Say whether it did again. That 404 is #937's open question: the app never asks for that address during an upload, and only a typed or shared address reaches it. The PM decides whether that result is acceptable or needs a pending page.
4. Anything void under section 2.
5. The merge order this plan expects: PR 1, PR 2, PR 3, then the docs PR. Section 8 needs PR 1 and PR 3 on main; neither section needs a new deployment.

Then wait for the PM's merge order. It names each PR and its full head SHA.

## 8. After the PM's merge order: #456 and #990

Run this only after every PR of the merge order has merged, from a fresh worktree of the new main. Keep every private file in a new ledger, `state/build/fleet32-postmerge/private/ledger`, mode 0700, files 0600. Print and commit meal prefixes only, never a caption, comment or photo. Reads use a read-only session (`PGOPTIONS='-c default_transaction_read_only=on'`). Stop conditions: a command that exits 1 (except S2, which says what it does); a restore that does not take; 25 minutes of waiting in all. A stop ends section 8; report what ran.

**#456, the cocktails:**

- **D1, before.** `node --import tsx scripts/numbers/cards.mjs --zone=Asia/Jakarta 8535b793 8ab2eccb 8b728c7e` into `<ledger>/d1-cards.txt`.
- **D2, decaf.** `timeout 600 node scripts/numbers/reanalyse.mjs run --mode=decaf --meals=8535b793,8ab2eccb,8b728c7e --ledger=<ledger> --max-meals=3 --wait-seconds=240`. Expected for each: outcome unchanged, kcal unchanged, `values_removed` one `food N: nutrient 1057` with the reason, `values_lost` empty, 0 model calls. A meal the guards refuse is listed with its reason. A meal put back is reported with its `restore_reason`.
- **D3, after.** `cards.mjs` as D1 into `<ledger>/d3-cards.txt`. For each meal, met when `stored_caffeine_mg` is 0. Also met when the day's `day_caffeine_mg` fell by the caffeine that meal stored before (from D1), or by none if the day did not count it. And the card, first-comment and day calories must be as in D1.
- **D4, the undo, if needed.** `node scripts/numbers/reanalyse.mjs restore --meal=<prefix> --ledger=<ledger> --snapshot=last --wait-seconds=240` for any meal the PM asks to put back. Not run otherwise.

**#990, the blind study** (the Fleet 31 drafts; nothing new is drafted):

- **S1, prepare.** Check the drafts' sha256 (section 2). Then `node scripts/numbers/study.mjs prepare --drafts=<fleet31-postmerge/private/ledger/sample/blind-portion-drafts.json> --sample=<fleet31-postmerge/private/ledger/sample> --blind=<ledger>/blind --map=<ledger>/blind-map.json`. The map file is never shown to the reader.
- **S2, candidates.** `FDC_API_KEY=<the app's key> timeout 900 node scripts/numbers/study.mjs candidates --blind=<ledger>/blind --max-minutes=12`. It retries a 429, a 5xx or a network error after 2, 8 and 30 seconds, then names the food and its status codes. If it exits 1, run it once more after 5 minutes; it resumes from its file. A food that still fails leaves its meals incomplete, and the run goes on. These waits count toward section 8's 25 minutes.
- **S3, the reader, one fresh process per meal.** For each meal-NN of `<ledger>/blind/portions.json`, with `<ledger>/blind/choices/` made first and `<schema>` the file below:
  ```
  env -u SUPABASE_DB_URL -u SUPABASE_SECRET_KEY -u SUPABASE_ACCESS_TOKEN -u NEXT_PUBLIC_SUPABASE_URL -u NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY -u FDC_API_KEY \
    timeout 300 codex exec --ephemeral --skip-git-repo-check -s read-only -C <ledger>/blind \
    -i <each photo of <ledger>/blind/meal-NN, in order> --output-schema <schema> -o <ledger>/blind/choices/meal-NN.json \
    "You are choosing USDA records for a nutrition study. Use only the attached photos and the files portions.json and candidates.json in this folder. For each food of meal meal-NN in portions.json (its key and grams are fixed; do not change them), choose the one record listed under that key in candidates.json that best matches what the photos show: cooked or raw, fried or not, with or without skin, sweetened or not. If none fits, give fdcId null. Use no network. Reply only with JSON that matches the schema." < /dev/null
  ```
  Schema: `{"type":"object","properties":{"meal":{"type":"string"},"foods":{"type":"array","items":{"type":"object","properties":{"key":{"type":"string"},"fdcId":{"type":["integer","null"]},"why":{"type":"string"}},"required":["key","fdcId","why"],"additionalProperties":false}}},"required":["meal","foods"],"additionalProperties":false}`. A run that exits non-zero or writes no file leaves that meal incomplete: record it and go on. Do not look at any stored number of these meals until S4 has printed its seal.
- **S4, total and seal.** `node scripts/numbers/study.mjs total --blind=<ledger>/blind`. Record the sha256 it prints.
- **S5, stored totals.** Read the 20 prefixes from the map file. Run `cards.mjs --zone=Asia/Jakarta <the 20 prefixes>` into `<ledger>/s5-cards.txt`.
- **S6, compare.** `node scripts/numbers/study.mjs compare --estimates=<ledger>/blind/estimates.json --map=<ledger>/blind-map.json --stored=<ledger>/s5-cards.txt`. Report its table and its last line. If it says "closes", #990's passing-meal part is done. If not, list the disagreeing meals with, for each, the food whose estimate differs most and why (record chosen, grams, or stored value). Re-analyse nothing.

**F1, the rest of #990.**
- 6fad4a16 stays listed: the salami bag's printed weight is needed from the owner (section 10).
- a0e6b3bf and e7e1782c stay listed: the owner gave 3 g in a comment, and rule e's 5 g floor is a guess.
- 1c4f16bf is cleared by Fleet 31's rule.
- The other accounts: fe79cc4a's five re-analyses were all restored for lost values in Fleet 31, and two are refused by a leftovers photo. They stay listed with those reasons.
- The saved meals and copies all match their sources.
- With S6, #990's done line is met when S6 closes; the PM decides the issue.

**What section 8 reports.** D1 to D3 per meal (prefix, caffeine stored before and after, day caffeine before and after, kcal before and after, ledger line); S2's lookups (looked up, failed with codes); S3's runs (meals with a choice file); S4's seal; S6's table and result; F1.

## 9. The write-allowed proof run on test account 2

Production, test account 2 only, in fresh native Chromium with CDP at 390 by 844, DPR 3, unless a step says otherwise. Use a fresh profile per step and Fleet 31's browser core. Its request guard changes in one way: requests from the app to its own origin may write, and nothing to another origin may (the Supabase storage upload the app makes is allowed). Photos are generated (`sharp`) and given to the capture sheet through its `capture-files` event, as K3 does: wait for `[aria-label="Capture content"]` first, and 600 ms after "Post a meal" before tapping Camera. Record every post id you create in a private ledger before the next action. At the end of section 9, delete every one with the service key: the post, its `post_upload_drafts` row, its `post_photo_attachments` rows and its stored files under `<user id>/<post id>/`. Read each back as absent, and report the count. Model calls on these posts need no ask. Each step's bound is 10 minutes, and the waits of all steps at most 20 minutes in all. Record each step as met, not met or not checked, with its numbers. Print prefixes only.

| Item | On test account 2? | What stays with the owner or a phone |
|---|---|---|
| #628 | Yes, W1 | Nothing |
| #970 | Yes, W2 | Nothing |
| #969 | Yes, W3 | Nothing |
| #570 | Yes, W4 | The owner's own 11-second phone timing |
| #968 | Yes, W5 | Nothing |
| #449 | Yes, W6 | Nothing |
| #452 | No | The label flow opens only after a scanned barcode misses, and the camera cannot be made to read one here. Needs a phone |
| #938 | Yes, W7 (1280 by 800) | Nothing |
| #973 | Partly, W8 | A meal with no photo that fails its first analysis cannot be made on purpose; W8 records whether a text post fails |
| #987 | Partly, W9 | Whether a coffee is estimated is the matcher's choice; W9 tries once |
| #351 | Yes, W10 | Nothing |
| #936 | Test account half, W11 | The owner's account |
| #693 | Yes, W12 (mic shown, no speech) | Speech into a real microphone |
| #972 | Partly, W13 | Opening offline needs the service worker, which the run bypasses |
| #955 | Approximately, W14 | The phone's largest text size; CDP font sizes stand in |
| #222, #372 | Yes, W15 | A real phone on mobile data |

- **W1, #628.** Run the two script modes once each against production as test account 2, under `timeout 600`, each in its own fresh browser: `node --env-file=<env with production APP_URL and test account 2> scripts/run17-checks.mjs --mode=post-close --cdp=<a fresh headless Chromium's CDP URL> --url=<production URL> --out=<ledger>/w1-post-close.json`, and the same with `--mode=beer --bidi=<a fresh Firefox BiDi URL>`. Report each exit code and its first error. Met when both exit 0 and the push fixture row is gone afterwards.
- **W2, #970.** Post one meal with a generated photo and wait for it to be ready (at most 240 seconds). Then add a photo four ways, recording the sentence each shows:
  1. To a second meal you post, before it is ready (expected: "This meal is still being analysed, so try again a little later.").
  2. With `Fetch` failing the photo's storage upload. The app may fail it itself before it asks to attach; record which sentence shows (the attach refusal for this case is "The photo did not finish reaching the app, so try again to send it.").
  3. To a ready meal until it holds eight photos, then a ninth (expected: "This meal already has eight photos, so remove one before trying again."). Bound: eight attachments.
  4. To a meal you delete after the sheet opens and before it sends (expected: "This meal was deleted, so remove this photo or log it as a new meal.").

  The drink refusal needs a meal with drinks: post one drink through the drink sheet, then add a photo to it (expected: "Photos cannot be added to meals with drinks, so log this as a new meal instead."). Met when each says what happened and what the person can do, and no two causes share a sentence.
- **W3, #969.** Add a photo to a ready meal with `Fetch` holding its `POST /api/posts/<id>/media` request, unanswered, for 150 seconds. Record what the chip says and its title at 30, 90 and 150 seconds. Then release the request. Met when the chip shows a failure by 150 seconds and its title does not say uploading.
- **W4, #570 (and #688's swipe).** Time a regular photo post from the Post tap to the sheet closing and to its card in the feed. Then time a leftovers photo added to that meal from its tap to the sheet closing and to the leftovers photo on the card. Three of each, alternating. Met when the leftovers medians are within 1 second of the regular ones. Then on Home, swipe that meal's photos once and check that only its photos move (#688).
- **W5, #968.** Open a ready meal's page and change its servings, so it shows that it is updating. At once set the page hidden for 20 seconds (`Emulation.setFocusEmulationEnabled` false and `Page.setWebLifecycleState` frozen), then active again. Record the time from active to the first request the page makes for that meal. Met when it is 1 second or less.
- **W6, #449.** Post a meal with a generated photo of two foods. Read its card every 250 ms until it is ready (at most 240 seconds). Record whether food names show before any kcal, and when each appears. Met when the names show first, or report that they arrive together.
- **W7, #938.** At 1280 by 800, add a photo to a ready meal with `Fetch` failing its storage upload. Record the chip's box and its Remove button's box, then tap Remove. Reload, and record whether the chip is gone. Met when Remove lies inside the chip, the tap removes it, and it stays gone.
- **W8, #973.** Post a text meal "zzzz qqqq" (no photo). Wait at most 120 seconds. If it ends failed, record the photo area's sentence and the card's sentence; met when they are the same. If it ends "No food found" or ready, record that and mark #973 not checked: no failed no-photo meal could be made.
- **W9, #987.** Post a text meal "a cup of kopi tubruk". When it is ready, read with read-only SQL whether its coffee's micronutrients carry an approximation of kind `estimate`, and its caffeine (1057). If it was matched to a record, mark #987 not checked, with the record. If it was estimated, it is met when a caffeine value is stored or the meal says it is an estimate with no caffeine figure.
- **W10, #351.** Open the drink sheet from "Post a meal". Wait at most 10 seconds for `button[aria-label^="Post "]`. Record their count and labels in order. Hold the first tile 700 ms with touch events, and record whether `#drink-tile-sizes` opens. Close the sheet with its close control. Met when there are six tiles, the most used first, and a size choice opens.
- **W11, #936.** A cold Home open, 15 seconds: count `/api/feed?ids=` requests. Met when there are none.
- **W12, #693.** Record whether a `button[aria-label="Speak"]` shows in each place: a meal's comment box, the new-post caption, the drink description and Search. Also record whether Profile shows the Muse Spark Open switch (section 2 says what its absence means). Do not record.
- **W13, #972.** On W11's cold open: the total encoded bytes of script responses. Then tap "Post a meal": list the script responses that start only now. Close the sheet.
- **W14, #955.** Open a ready meal. Read the date line under the header (`p` after the handle in the 52-pixel header row): its `scrollHeight` and `clientHeight`, and its box against the header's. Then `Page.setFontSizes` with standard 24 and fixed 20, reload, and read them again. Met when the line is whole both times.
- **W15, #222 and #372.** Four cold Home opens in fresh profiles with `Network.setCacheDisabled`:
  - **The control:** one unthrottled open.
  - **Three slowed opens:** 150 ms latency, 1.6 Mbit/s down, 0.75 Mbit/s up.

  For each:
  - **Before navigating,** add a script that records every `article img` load event with `performance.now()`, and a `PerformanceObserver` for `largest-contentful-paint`.
  - **Wait up to 60 seconds** for the first `article img` whose box lies inside the viewport to load.
  - **If it loads:** record its load time from navigation start, its `encodedDataLength`, `cache-control`, file name, and natural width against its rendered width × 3.
  - **If it does not load in 60 seconds:** record every `article img` (whether `complete`, its `naturalWidth`, its `loading` attribute, its `top`), every pending request with its URL path and start time, and the LCP entries. That is the evidence Fleet 31 lacked.

  Met for #222 when each slowed time is 2 seconds or less. For #372, also met when the width ratio is 2 or more; say whether the photo was captured before the sharper camera.

**What section 9 reports.** One row per item of the table, met, not met or not checked, with its numbers. Also the cleanup count, and each created post read back as absent.

## 10. For the owner (optional)

Written for the owner, in the style the owner asked for. Send it only if the PM chooses to:

"Your salami meal (6fad4a16) has no weight for the salami, so its calories are a guess. What weight is printed on the bag?"
