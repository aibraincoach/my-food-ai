# MEXT reference preparation — UNAPPLIED

0085 is a file-first schema packet. Its merge applies nothing. There is no app
caller in this packet. #1221 remains open; its done line waits for #1219 slice B
to carry the author's locale and Japanese display name into the matcher.

Production schema apply and the night-time data import each require RT's written
yes and the PM's exact order. This document supplies neither. No automatic
migration runner or importer is added. Do not run production acceptance or model
calls as part of preparing these files.

## Sources and identity

The source manifest is [scripts/mext-sources.json](../scripts/mext-sources.json).
Download those exact files outside git once and keep the listed filenames. The
importer validates all five SHA256 digests before preparing any output. A changed
publication needs a fresh source review and manifest change; never disable the
checksum check. XLSX decoding uses Python 3's standard library, cached scalar
values and visible text runs, excluding phonetic ruby. Formulas are not evaluated.

Numeric facts come only from the corrected 2023 addendum published 2026-03-27.
English identities come from the official 2015 English edition and its 2016
supplement, joined by food number. English supplement text overrides the main
English name; a Japanese-only supplement cell does not erase an English name.
Group equality is a screen. The official 2015 Japanese name must also equal the
current Japanese name after NFKC, whitespace removal, middle-dot unification and
removal of the Japanese descriptor comma. The sole additional equivalence is
ささ身→ささみ, cited in the code to the eighth-edition meat notes. No synonym,
word-order, preparation, cut or similarity rule proves identity.

After that proof, the importer also requires each joined English identity to
identify one food number. It compares NFKC/lowercase names with collapsed
whitespace and excludes every member of a duplicate set, without choosing a
preferred row or translating the source. The official English name shared by
10346 (boiled squid) and 10347 (baked squid) is a source defect; both are excluded
as english_name_ambiguous. The scan of all 1,987 previously joined rows found
one duplicate-name group (these two rows), with no other duplicates.
Their exclusion can leave raw squid among retrieved candidates. The later app
packet must prove that the unchanged compatibility gates reject a raw/baked
mismatch; candidate order is never permission to substitute the raw food.

Full source result: 2,538 records, 1,985 joined, 227 identity_changed,
324 no_english, 2 english_name_ambiguous, zero group_mismatch. Excluded records retain their current facts
but cannot enter search results. The report lists each excluded ID and both names.
All seven positive acceptance IDs join: 01088, 11129, 11277, 11153, 10134–10136.
Generic miso soup is a composed dish outside this table's prepared-food scope;
instant powder, paste and concentrate must not substitute for a bowl. Its existing
ingredients/USDA path stays unchanged.

The MEXT numeric reuse and required attribution were checked on the official
terms and food-table pages. Credit both the 2023 nutrient source and the 2015/2016
name sources in the app integration. Use the requested 2023 credit:
「日本食品標準成分表（八訂）増補2023年から引用（又は出典）」.
Label our processing as our work. Raw workbooks, images and explanatory prose are
not committed. The fixture is a twenty-two-row numeric/name excerpt with provenance.

## Nutrients and corrections

`NUTRIENT_MAPPING` in [mext-import.mjs](../scripts/lib/mext-import.mjs) is the
mapping table: app nutrient ID → exact MEXT identifier and unit. Energy is
ENERC_KCAL (not ENERC/kJ); protein PROT-, fat FAT-, carbohydrate CHOCDF-, fibre
FIB-, sodium NA. Minerals and vitamins map only to their equivalent main-table
measure. In particular CHOAVL/CHOAVLM never become sugars, niacin equivalent NE
never becomes niacin, vitamin IU values are not invented, and absent main-table
fatty-acid values are unavailable. Choline, folic acid and DFE are unavailable.

Each mapped value retains the original token, a numeric value or null, its Tr/-
marker, estimated-parenthesis flag, source identifier and unit. Trace/unavailable
never become zero. The 03032 fibre dagger and its prescribed-method note are
retained. Refuse percentage is stored but not applied: values and later portions
refer to edible grams. Per-portion item storage is outside this schema packet.

Every imported-field correction is checked before SQL output. The full-source
report verifies 22 individual corrected fields plus 155 fields from five corrected
whole rows. It compares both original source tokens and parsed mapped values.
Unclassified main-table correction labels fail visibly. The report lists scope
exclusions by sheet and reason: recipe methods (4), main-table non-imported fields
or whole-row redirects (45), and ancillary sheets 4–10 (12/4/1/8/20/3/6 entries).
Whole-row redirects are checked in sheet3; they are not omitted corrections.
This proves corrections for imported fields, not all fields in every MEXT table.

## Local preparation and rehearsal

Run from this checkout, with the public source files outside git:

```sh
node scripts/import-mext.mjs --source-dir /local/mext-files --report /local/mext-report.json --sql /local/mext-import.sql
node --test tests/mext-import.test.mjs tests/mext-reference-db.test.mjs
```

The preparation command makes zero network or database connections and refuses
existing output paths. `--report` alone prepares no SQL. Import SQL is one bounded
transaction, with 1s lock and 5s statement limits, and upserts only unequal record
hashes. An unchanged re-import preserves data and import timestamps. No deletes
are issued. The SQL file contains public reference data, never credentials.

The DB test starts its own isolated loopback PostgreSQL 17 with explicit
C.UTF-8/UTF8 (a C-locale database cannot build Japanese trigrams), using the standard
installation at /usr/pgsql-17/bin, with no environment/production URL loading.
It checks RLS/grants, trigram retrieval, excluded rows, repeat imports and rollback
guards, then stops and removes its database. Full stack reset through 0085 is a
separate local rehearsal. No browser proof is relevant to this packet's empty src
and messages diff.

## Apply, import and rollback (held)

After the explicit production orders, apply the exact reviewed 0085 from main
once using the established bounded operator wrapper. It creates only jp_foods,
two partial trigram indexes and a service-role-only invoker search function.
There are no anon/authenticated policies or grants. Service role reads; only the
database owner/import operator writes. pg_trgm may already exist and is retained.
Read back schema, RLS, grants and function definition. A failure rolls back and
requires a fresh PM order; no automatic retry.

Import only the locally checked, hash-pinned SQL by the separate night-time order,
using the direct database connection named in that order (not a pooled endpoint;
the prepared import is one approximately 16.9 MB statement).
Read back the ordered count and acceptance records once. The app matcher PR waits
for schema/import read-back and its own exact-head release order. Its gates must
remain unchanged and use only joined English identities plus food group.
The retrieval function's trigram word threshold is 0.4 for candidate discovery;
it is not an identity or compatibility acceptance threshold. Japanese-only tests
use English input `zzzz qqqq` to prevent the English arm from satisfying them.
Against the complete 2,538-row import in C.UTF-8, 精白米 finds 01088; ばら finds
11129, 11153 and 11277; しろさけ finds 10134–10136. Colloquial 白飯 alone finds
nothing; the English arm still supports the declared bilingual retrieval. In a
paired C-locale cluster the same Japanese queries find nothing.

The once-ordered apply read-back also records the actual database character
classification and encoding once:

```sql
select datctype as lc_ctype, datlocprovider,
       pg_encoding_to_char(encoding) as encoding,
       cardinality(show_trgm('精白米')) > 0 as japanese_trigrams
from pg_database where datname = current_database();
```

`SHOW lc_ctype` is not a supported setting in PostgreSQL 17; the catalog is the
read-back source. The local test proves C.UTF-8 behavior, not the current
production locale. If the recorded production setting differs or japanese_trigrams
is false, hold and report before assuming Japanese retrieval works there. No production read is performed
by these local tests.

Before any app has emitted mext: refs, the reviewed rollback drops the search
function and reference table while retaining shared pg_trgm. It refuses when
item_nutrition or saved-meal snapshots contain MEXT refs. After such refs exist,
keep the reference table for readers and portion edits, even if the new matcher
is disabled or the app is reverted. Do not erase reference data beneath stored
facts. The unchanged English USDA path and #1153 corpus are outside this packet.
