# Numbers: study and re-analysis

The JavaScript tools that import the shared TypeScript record check need Node 22.18 or newer (native type stripping), or must run through `node --import tsx`.

Read-only queries that look for stored nutrition numbers that cannot be right, and operator statements that re-analyse one meal and put it back. Each file says what it needs. Written for Fleet 25 (docs/plan-fleet25.md), where every file was run on a database made from this repository's migrations.

Read-only files (02 to 09) are run with a read-only session:
PGOPTIONS='-c default_transaction_read_only=on' psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -v uid=<account id> -f scripts/numbers/<file>

Files 10 to 13, 15 and 16 write. They keep every old row, marked superseded (15 changes a negative value to zero in place, 16 adds micronutrient entries to a new row). Take the snapshot (08) first: it is the only way back.

Files 03 and 04 hold the same rules. Each must be one SELECT so that it runs in a read-only session. Change a rule in both.

## Re-analysing a list of meals: reanalyse.mjs

`node scripts/numbers/reanalyse.mjs run --mode=rematch|reanalyse|repair --meals=<prefix,...> --ledger=<private directory outside the repository>` works the meals one at a time with 11-rematch.sql, 12-reanalyse.sql or 15-repair.sql. Before it touches a meal it appends that meal's snapshot (08) to `<ledger>/snapshots.jsonl`, and afterwards one line per meal (prefix, before and after totals, seconds waited, model calls) to `<ledger>/ledger.jsonl`. It stops on its own at `--max-meals` (default 10), at `--max-minutes` (default 45), after two failed or timed-out meals in a row, or when more than one meal in ten has failed. When a meal has finished, it is read again (`<ledger>/after.jsonl`) and put back from its snapshot at once if it failed or asks a question, lost any nutrition value it had (a zero is a value, NULL is not; micronutrients count), or its calories moved by more than half (#989). When the only values lost are micronutrients of a food that is still there with the same name and weight (not water, caffeine or alcohol, and not on a meal with a saved meal), 16-carry.sql first adds the old entries to the food's new row, and the meal is kept when it then loses nothing; the ledger line lists them as `values_carried` (#990). `--dry-run` writes nothing. `restore --meal=<prefix> --ledger=<directory>` puts one meal back from its snapshot with 13-restore.sql. A `failed` or `needs_input` meal first regains the snapshot's ready state, question fields and analysis time. Repair must run through the CLI: before 15-repair.sql writes, the private snapshot records every original nutrition row and marks the snapshot as a repair. Restoring that snapshot runs 15-repair-undo.sql first, writing the original nutrition values (including NULLs, zeros and micronutrients) back onto the same item IDs; 13-restore.sql then restores the items and summary and queues the recompute. Run neither repair SQL file without its CLI snapshot and guards. `--help` gives every option. It needs `SUPABASE_DB_URL`, `APP_URL` and psql.

14-rule-failures.sql is read-only, like 02 to 09: one row per ready meal that fails rule a1, a2, b, d, e, f or g1 of 03, and whether 12-reanalyse.sql would accept it. It repeats those rules, so a rule change is made in 03, 04 and 14.

17-census.sql is read-only too and takes no variable: one row per account with a ready meal (its first 8 characters), with its ready meals, copies, saved meals and saved meals whose meal is gone (#990).

Rule g1 (plain coffee or tea above 0.25 kcal per gram) leaves out a coffee or tea whose matched record's description holds "milk" (#990), so 14 finds each record's description the way 03 does.

19-saved.sql is read-only and takes no variable: one row per saved meal and per copied meal, with its account and meal prefixes, its foods and calories against its source meal's current ones, and which of rules a2, d, e and f its saved foods fail (#990). It prints no name, caption or comment.

cards.mjs only reads: for each meal prefix, the calories its card shows, the calories its first model comment states and its day's total, computed and rounded by the app's own code (getDays, formatCalories), beside the stored sum of its foods (#1021). Run it with `node --import tsx scripts/numbers/cards.mjs --zone=<IANA zone> <prefix> ...` and NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY set. It prints prefixes, dates and numbers only. Its last two columns are the day's caffeine as the app counts it and the caffeine the meal's foods store (#456).

20-decaf.sql writes in place, like 15: it removes caffeine (nutrient 1057) from a current food that is an alcoholic drink (alcohol above zero, or an alcoholic category) and names no caffeine source, and queues an operator recompute (#456). Run it only through `reanalyse.mjs run --mode=decaf`, which takes the snapshot first, ledgers the removed caffeine as values_removed with its reason, and puts the meal back if anything else is lost; `restore` undoes it with 15-repair-undo.sql.

21-portion.sql writes, like 18: it gives one current food the weight both reviewers judged right (#990) and queues an operator recompute, which rescales that food's retained nutrition, every value by the same ratio, and keeps the other foods exactly. Take the snapshot (08) first and ledger the food, its old and new weight and the reason; `reanalyse.mjs restore` undoes it. It refuses the same weight, a weight of zero, a food with a leftovers weight, and a meal with a job.

22-items.sql is read-only and takes `-v prefixes=<prefix,prefix,...>`: each meal's current foods with weight, calories, calories per 100 g, matched record, category, whether it is a match, a closest record or an estimate, and the record's description. It prints food names and prefixes only (#990).

23-records.sql is read-only and takes no variable: every current food of every account's ready meals and every saved meal's food, one JSON line each, with its record, the record's description and category, and how it was chosen (#990). `node scripts/numbers/mismatch.mjs [--labels=<file>] [--out=<private directory>]` reads it in a read-only session and checks each matched or closest record with the matcher's own rules (`src/lib/fdc/record-kind.ts`): a record that is a fruit, sweet, drink, condiment or fat for a food with no word of that kind, or a raw record for a cooked food or dish, is a strong signal; a dish of several foods matched to one, or an energy density far outside the food's kind, is weak. It prints the flagged foods, ranked, and with `--labels` their precision and recall on foods whose verdict is known.

24-recheck.sql writes, like 11: it looks up again only the listed foods of one meal; every other food keeps its nutrition exactly. Run it only through `reanalyse.mjs run --mode=recheck --foods-file=<mismatch.mjs flagged.jsonl>`, which takes the snapshot first and works only meal foods with a strong signal. The listed foods' lost micronutrients are ledgered as values_removed; the calories may move by more than half only when every listed food's new record passes the record check or is an estimate. 25-resave.sql writes one saved meal in place from its meal's current foods, after a kept recheck; the meal's snapshot holds the old saved row.

25-resave.sql has no CLI snapshot guard of its own: before running it, retain and inspect the meal's 08-snapshot.sql output with its original `saved_meals` entry. Undo restores that saved row's original items by the same saved-meal ID. Duplicate current food names cannot be distinguished by the recheck outcome's name-only rows, so their micronutrient losses are retained and trigger the ordinary restore rule. Labelled detector precision is scoped to the supplied labels; it is not blind precision or proof that every unlabelled flag is wrong.

## Owner photo study (#694, Fleet 55)

This pipeline is read-only on production and writes recommendations, never corrections.
Production starts only after the PM's exact-head merge order and named reader choice.
Run `26-owner-study.sql` once for that owner in one explicit `BEGIN READ ONLY`
transaction, with the transaction/read-refusal guard, `lock_timeout='5s'` and
`statement_timeout='30s'`. Do not rely on `PGOPTIONS`: the transaction pooler can ignore it.
The query exports full meal/item ids and current evidence rows privately; it reads no
caption, comment, or search-cache rows.

All output directories must be dedicated private directories outside the repository.
Use `umask 077`. After the guarded query writes `owner-study.jsonl`:

```bash
node --import tsx scripts/numbers/mismatch.mjs --rows="$STUDY_PRIVATE/owner-study.jsonl" --out="$STUDY_PRIVATE/mismatch"
node scripts/numbers/sample.mjs --rows="$STUDY_PRIVATE/owner-study.jsonl" --mismatch="$STUDY_PRIVATE/mismatch/flagged.jsonl" --out="$STUDY_PRIVATE"
node scripts/numbers/photos.mjs --sample="$STUDY_PRIVATE/sample.json" --account="$STUDY_ACCOUNT" --out="$STUDY_PRIVATE"
node --import tsx scripts/numbers/read-photos.mjs --sample="$STUDY_PRIVATE/sample.json" --photos="$STUDY_PRIVATE/photos/ledger.json" --out="$STUDY_PRIVATE" --reader=app --reader-reason="PM's named production reader"
node scripts/numbers/causes.mjs --verdicts="$STUDY_PRIVATE/verdicts.json" --out="$STUDY_PRIVATE"
node scripts/numbers/causes.mjs --verdicts="$STUDY_PRIVATE/verdicts.json" --out="$STUDY_PRIVATE" --corrections
```

`--reader=agy` is a separate explicit choice, bounded to two minutes per meal (135s
hard subprocess cap). There is no default reader, automatic switch or second call.
Failed/malformed readings remain `cannot tell` with the reader, duration, error and
available token usage recorded. A missing photo is not sent to either reader.

Optionally add `--snapshots=/private/existing-snapshot.jsonl` to `sample.mjs`.
This must be an **existing** `08-snapshot.sql` ledger containing the selected meals;
no new production snapshot/read is taken by this study. Keep it outside `photos/`.
Snapshots for other meals are refused, and items link only by exact id or `supersedes`,
never by a guessed name. Only values and evidence ids go to the reader: snapshot
captions/comments and local source-file paths are not forwarded.

The reader's structured `findings` carry item id, cause, field, action, expected
value/basis, an explicit yes/no/unknown loss flag and evidence-row ids. Free-text
notes never choose an action. `corrections.json` contains `recommendations` and
`withheld`; `corrections.txt` has one complete JSON row per recommendation or
withheld proposal. Every recommendation includes the full meal/item ids, the
structured finding and its evidence ids. Unknowns/negations do not recommend an
action. Restore requires a current NULL, an affirmative lost value, the exact
available prior value and an existing matching snapshot file; otherwise the row
says `no restore evidence` with no script. A known zero is available data.

These are **WRITTEN, NEVER RUN** lists. The PM orders any later correction under the
snapshot/restore rule. Before deleting `photos/` after the finding, preserve its
`ledger.json` as a separate private JSON proof file. Keep the other JSON outputs and
existing snapshot ledger private; publish only prefixes, verdicts and short findings.

### Explicit record correction (`set-record`)

`node scripts/numbers/reanalyse.mjs run --mode=set-record --foods-file=<private.jsonl> --ledger=<private-directory> --dry-run`

Each JSONL line is `{ "meal": "<8-character prefix>", "item": "<current item UUID or 8-character prefix>", "fdc": 2709168, "description": "Lemon, raw" }`.
Choose and independently verify each public record before running. No model chooses the record. Remove `--dry-run` only under the packet's write order; `--max-meals`, `--max-minutes` and `--wait-seconds` bound the run as in the other modes.

Each meal is snapshotted first. `27-set-record.sql` copies every current food, preserving its name, weight and history. For the chosen food it inserts a superseded bridge whose nutrition contains the chosen record id and null amounts. The existing retained worker path fetches that record by id and scales it. The operator waits after each choice, takes the after-snapshot and follows the retained revision chains to find the next chosen food's current copy. A stale initial id is never sent to the SQL after an earlier copy superseded it.

A failed or questioning meal, a changed food count, a changed name or portion, any unlisted nutrition change, or a chosen record mismatch/unknown calories puts the entire meal back using the original snapshot. Two consecutive failures or put-backs stop the run. The prior wrong records' micronutrients are written with their old values as `values_removed`; nothing is carried from them. No food is deleted. A refused first SQL guard skips the meal; a refusal after a partial correction puts it back. A timeout with an active job stops the run and reports a refused restore rather than racing it.

This is a one-off data correction tool. It changes no matcher rule; the same wrong match can recur in a future meal (#990 remains open). Before any production write, compare the caption, food name and stored record and skip a food if its caption contradicts the correction.

An uncertain SQL completion (for example, a lost command response after commit) is a failed attempt, never a skip. The operator attempts the existing guarded restore; if a job is still queued or running, restore refuses and the run stops visibly. It does not retry the SQL or race the worker.

#1219 structured summaries: `cards.mjs` uses the named server-only marker loader
shown in its usage, and prints `first_structured_summary_kcal` directly from a
`mealSummary` message's numeric facts. Old text comments leave that field blank;
the tool does not parse English. `08-snapshot.sql` captures both the message and
the dedicated summary pointer. `reanalyse.mjs restore` supplies both to
`13-restore.sql` so a structured summary never becomes an empty text row. An old
snapshot has a null pointer and restores its original text, without a rebuild.
