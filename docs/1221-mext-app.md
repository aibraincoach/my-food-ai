# MEXT app integration — held behind the locale and schema rollout

This is the #1221 app packet. It composes the held #1392 structured-summary app
with current main. It must merge after #1392, never before it. The temporary
local resolution of #1392's two wording guards is not a change to #1392's remote
reviewed head: #1392 must receive and review its own explicit English/Japanese
checks. When that rebase lands, rebase this packet onto its exact head, discard
the temporary resolution and return the resulting #1221-only delta for review.

0085 and 0086 are canonical files from main and remain UNAPPLIED. Their apply
requires RT's written database yes and the PM's exact orders, with read-backs;
the reference import is a separate night-time order. The app merge additionally
needs those receipts, #1392 deployed green and its own exact-head order. Nothing
in this packet applies SQL or imports production data. #1221 stays open.

## Source selection

NutritionReference distinguishes USDA FdcFood from a gated MextFood. No synthetic
USDA id is assigned. SourceContext is required. The current analysis, correction
and recompute callers explicitly choose usda-only. #1219 slice B will supply the
author's Japanese locale and separate display name. Until then MEXT is exercised
only by scripted local tests; the done line is not claimed.

For the Japanese locale arm, retrieval uses the Japanese display name and the
English matcher name. Eligibility uses the official English identity and the
single 18-group map, then the existing English species, protein, exclusion and
record signals. MEXT additionally refuses the existing weak part signal; USDA
keeps its existing decision. Only the resolver constructs the gated type that
the MEXT scaler accepts. English/no-marker results stay unchanged; scaleNutrition's
body, the USDA mismatch program and its corpus are unchanged.

A Japanese-script matcher name without an English identity is unclassified.
The no-selection steps mext_none, mext_incompatible and mext_unclassified carry
fixed keys and candidate numbers on the existing final USDA-resolution trace.
They fall back to the existing USDA path; its weak gates for Japanese-script
names are pre-existing behavior. A reference read error throws a visible I/O
error and writes a MEXT error trace with no invented reference or HTTP status.
Successful selected/reused MEXT traces carry their real reference_ref and no
fdc_id. A stored reference missing from jp_foods fails visibly.

The source identities are the proved, unique 2015/2016 English names joined to
the corrected 2023 facts, as documented in the schema/importer runbook. Generic
miso soup is outside the table's prepared-bowl scope: neither instant powder
17049 nor paste 17050 may substitute for it. Raw squid cannot substitute for
baked squid; the ambiguously named boiled/baked pair remains excluded.

## Amounts, markers and displays

MEXT scales only per-100-edible-gram facts to grams. Refuse ratio is not applied;
no ml, cup or piece conversion is invented. Portion edits re-read the exact
mext:five-digit reference. Cup/piece edits and product conversion cannot coerce
that reference into a USDA id.

Stored trace and not_measured markers require null values. Trace contributes
zero to an aggregate without changing the stored null or becoming missing.
Totals retain the food names in trace; traceOnly means every known contribution
was trace. Any measured contribution, including zero, clears traceOnly. Nested
day/month totals and compact receipts retain that distinction. A trace-only
value displays trace; mixed values display the number plus Includes trace amounts.
Not-measured remains a gap. Copies preserve the source and markers verbatim.

Feed projection adds only the MEXT source reference and macro marker entries;
ordinary USDA-only payload bytes match the frozen main fixture. The same marker
semantics apply in cards, per-item rows, Search, Saved, post and day summaries,
calendars and structured mealSummary values. No stored English is parsed.

Closest MEXT approximations retain the official English basis. Source is derived
once from source_ref by approximationLabels; structured message values keep
source=mext so rendering is self-contained. Absent source retains USDA wording;
unknown sources are refused. Five new keys are PM-drafted in Japanese, reviewer
double-read, not native-reviewed. The attribution credits both editions and
identifies portion calculations as My Food AI's work. ResultsCard keeps its
credit inline inside the meal link; the nutrition table has the actual MEXT link,
so no nested anchor is introduced.

## Operator reports and verification

23-records.sql labels MEXT rows how=mext, joins jp_foods by the exact source
string, reports the official English identity and raw mext_group. It does not
invent a USDA category or duplicate the group map. The unchanged mismatch
program excludes that how value and counts the exclusion. A differential SQL
test preserves each USDA report row's JSON bytes, and a ranking test preserves
all USDA results when a MEXT row is added.

Focused tests cover the source boundary, eligibility, scripted resolution,
real local reference reads and portion editing, copying, markers, summary
protocol, all day/month projections, source credits and unchanged USDA cases.
The real Next build exercises server-only enforcement; the marker resolver is
used only by Node tests/operator tooling, never by Next. A local browser receipt
checks English/Japanese cards and details in Chromium and WebKit, including exact
Japanese credit text and clipping. These are emulated browsers; real phones are
unproven. The full root suite is not a prerequisite invented by this document;
it remains skipped under the hours-long-run rule unless separately authorized.

Keep 0085/0086 and existing MEXT provenance when reverting the app. Their reviewed
rollback guards refuse stored references/traces. Do not erase facts or traces to
make a down migration pass. Import/source changes require their own review and
orders; this app packet grants none.
