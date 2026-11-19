# Fleet 61 coverage — 2026-11-19

Base: `b808dc5057bd71a3df248be29298d2a38747578b`. Every tracked path under `src`, `scripts`, `tests` and `supabase` is listed once below. Text lines are newline counts at that commit; binaries contribute zero text lines. A full read is source inspection, not execution or proof of runtime correctness.

**Total: 45,668 / 59,386 text lines read in full**; 883 files fully read, 40 skimmed, 14 not read. Cross-pass overlap is counted once in this total.

## Pass totals

| Pass | Files in pass | Full text lines / scope | Depth |
| --- | ---: | ---: | --- |
| P0 | 18 | 496 / 8,657 | Includes config outside 937-file denominator; lock dependency list only. |
| P1 | 33 | 1,033 / 1,033 | Source paths; schema policy/grant/function depth is recorded in P6, not credited twice. |
| P2 | 143 | 7,253 / 7,253 | Source read; binaries excluded from text lines. |
| P3 | 114 | 5,491 / 5,491 | Source read; binaries excluded from text lines. |
| P4 | 65 | 3,323 / 3,323 | Source read; binaries excluded from text lines. |
| P5 | 30 | 1,948 / 1,948 | Source read; binaries excluded from text lines. |
| P6 | 110 | 4,416 / 5,893 | Final replacement chains read statically; some superseded and rollback bodies skimmed. |
| P7 | 94 | 5,214 / 8,697 | Recorded fixtures skimmed; binaries not read. |
| P8 | 337 | 16,916 / 25,581 | All test/harness code fully read; recorded payloads skimmed. |
| P9 | Whole-tree grep | No additional full-file line credit | Shortcut and TODO ledgers; grep hits read in context. |
| P10 | src/scripts; 476 text files in copy scan | No additional full-file line credit | One copy scan and a reference sweep, candidates checked manually; same files credited above. |

P0 and P1 overlap later passes. P2 includes the photo route also read by P3. Summing pass numerators therefore overstates the unique total. A grep or tool scan is never promoted to a full read. The 93-line font license is an additional P0 skim.

## Complete file ledger

| Path | Mark | Text lines | Pass / reason |
| --- | --- | ---: | --- |
| `scripts/README.md` | read in full | 22 | P7: Full source reading and caller tracing; no execution. |
| `scripts/activate-compact-nutrition.sql` | read in full | 30 | P7: Full source reading and caller tracing; no execution. |
| `scripts/auth-hammer.mjs` | read in full | 105 | P7: Full source reading and caller tracing; no execution. |
| `scripts/backlog.mjs` | read in full | 30 | P7: Full source reading and caller tracing; no execution. |
| `scripts/build-tokens.mjs` | read in full | 15 | P7: Full source reading and caller tracing; no execution. |
| `scripts/check.mjs` | read in full | 39 | P7: Full source reading and caller tracing; no execution. |
| `scripts/cleanup.sh` | read in full | 61 | P7: Full source reading and caller tracing; no execution. |
| `scripts/create-test-user.mjs` | read in full | 54 | P7: Full source reading and caller tracing; no execution. |
| `scripts/egress-report.mjs` | read in full | 43 | P7: Full source reading and caller tracing; no execution. |
| `scripts/eval.mjs` | read in full | 153 | P7: Full source reading and caller tracing; no execution. |
| `scripts/feed-probe.mjs` | read in full | 23 | P7: Full source reading and caller tracing; no execution. |
| `scripts/fixtures/ATTRIBUTION.md` | skimmed | 15 | P7: Recorded fixture inventory/shape and representative first/last entries skimmed. |
| `scripts/fixtures/food-matching.json` | skimmed | 296 | P7: Recorded fixture inventory/shape and representative first/last entries skimmed. |
| `scripts/fixtures/ham-resolution.json` | skimmed | 3172 | P7: Recorded fixture inventory/shape and representative first/last entries skimmed. |
| `scripts/fixtures/label.png` | not read | 0 | P7: Binary asset or fixture; not read as source. |
| `scripts/fixtures/plate1.jpg` | not read | 0 | P7: Binary asset or fixture; not read as source. |
| `scripts/fixtures/plate2.jpg` | not read | 0 | P7: Binary asset or fixture; not read as source. |
| `scripts/fixtures/plate3.jpg` | not read | 0 | P7: Binary asset or fixture; not read as source. |
| `scripts/fixtures/tone.wav` | not read | 0 | P7: Binary asset or fixture; not read as source. |
| `scripts/fleet14-metrics.mjs` | read in full | 17 | P7: Full source reading and caller tracing; no execution. |
| `scripts/font-codepoints.mjs` | read in full | 25 | P7: Full source reading and caller tracing; no execution. |
| `scripts/github-checks.mjs` | read in full | 25 | P7: Full source reading and caller tracing; no execution. |
| `scripts/lib/cdp.mjs` | read in full | 10 | P7: Full source reading and caller tracing; no execution. |
| `scripts/lib/schedule.mjs` | read in full | 19 | P7: Full source reading and caller tracing; no execution. |
| `scripts/lib/seed-week-dates.mjs` | read in full | 19 | P7: Full source reading and caller tracing; no execution. |
| `scripts/lib/session.mjs` | read in full | 46 | P7: Full source reading and caller tracing; no execution. |
| `scripts/load-test.mjs` | read in full | 170 | P7: Full source reading and caller tracing; no execution. |
| `scripts/make-tone.mjs` | read in full | 41 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/01-owner-check.sql` | read in full | 2 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/02-inventory.sql` | read in full | 42 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/03-suspicious.sql` | read in full | 106 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/04-summary.sql` | read in full | 116 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/05-leftovers.sql` | read in full | 29 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/06-seafood.sql` | read in full | 39 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/07-four-meals.sql` | read in full | 18 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/08-snapshot.sql` | read in full | 12 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/09-usage.sql` | read in full | 11 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/10-drink-sync.sql` | read in full | 7 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/11-rematch.sql` | read in full | 22 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/12-reanalyse.sql` | read in full | 21 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/13-restore.sql` | read in full | 16 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/14-rule-failures.sql` | read in full | 77 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/15-repair-undo.sql` | read in full | 19 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/15-repair.sql` | read in full | 41 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/16-carry.sql` | read in full | 25 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/17-census.sql` | read in full | 15 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/18-remove.sql` | read in full | 40 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/19-saved.sql` | read in full | 68 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/20-decaf.sql` | read in full | 37 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/21-portion.sql` | read in full | 41 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/22-items.sql` | read in full | 36 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/23-records.sql` | read in full | 44 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/24-recheck.sql` | read in full | 30 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/25-resave.sql` | read in full | 15 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/26-owner-study.sql` | read in full | 32 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/27-set-record.sql` | read in full | 40 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/README.md` | read in full | 102 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/cards.mjs` | read in full | 40 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/causes.mjs` | read in full | 35 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/consistency.mjs` | read in full | 46 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/correction-evidence.mjs` | read in full | 102 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/mismatch.mjs` | read in full | 86 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/photos.mjs` | read in full | 20 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/read-photos.mjs` | read in full | 49 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/reanalyse.mjs` | read in full | 753 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/sample.mjs` | read in full | 26 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/study-io.mjs` | read in full | 10 | P7: Full source reading and caller tracing; no execution. |
| `scripts/numbers/study.mjs` | read in full | 234 | P7: Full source reading and caller tracing; no execution. |
| `scripts/open-weights-trial.mjs` | read in full | 66 | P7: Full source reading and caller tracing; no execution. |
| `scripts/pplx-firefox.sh` | read in full | 11 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-correction-smoke.mjs` | read in full | 17 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-food-match-smoke.mjs` | read in full | 17 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-identify-smoke.mjs` | read in full | 96 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-label-smoke.mjs` | read in full | 22 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-remainder-smoke.mjs` | read in full | 29 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-same-meal-smoke.mjs` | read in full | 40 | P7: Full source reading and caller tracing; no execution. |
| `scripts/real-vision-quality-smoke.mjs` | read in full | 20 | P7: Full source reading and caller tracing; no execution. |
| `scripts/record-fixtures.mjs` | read in full | 54 | P7: Full source reading and caller tracing; no execution. |
| `scripts/recording-cap-probe.mjs` | read in full | 37 | P7: Full source reading and caller tracing; no execution. |
| `scripts/retention/run.mjs` | read in full | 87 | P7: Full source reading and caller tracing; no execution. |
| `scripts/review/agy-review.mjs` | read in full | 370 | P7: Full source reading and caller tracing; no execution. |
| `scripts/review/agy-review.test.mjs` | read in full | 145 | P7: Full source reading and caller tracing; no execution. |
| `scripts/rollback-compact-nutrition.sql` | read in full | 19 | P7: Full source reading and caller tracing; no execution. |
| `scripts/run-agy-pr.sh` | read in full | 37 | P7: Full source reading and caller tracing; no execution. |
| `scripts/run15-b-production.mjs` | read in full | 85 | P7: Full source reading and caller tracing; no execution. |
| `scripts/run17-checks.mjs` | read in full | 192 | P7: Full source reading and caller tracing; no execution. |
| `scripts/seed-week.mjs` | read in full | 25 | P7: Full source reading and caller tracing; no execution. |
| `scripts/test-app.mjs` | read in full | 9 | P7: Full source reading and caller tracing; no execution. |
| `scripts/test-stack.mjs` | read in full | 47 | P7: Full source reading and caller tracing; no execution. |
| `scripts/test.mjs` | read in full | 21 | P7: Full source reading and caller tracing; no execution. |
| `scripts/third-party.mjs` | read in full | 45 | P7: Full source reading and caller tracing; no execution. |
| `scripts/trace-rollout-smoke.mjs` | read in full | 17 | P7: Full source reading and caller tracing; no execution. |
| `scripts/wording-inventory.mjs` | read in full | 211 | P7: Full source reading and caller tracing; no execution. |
| `scripts/worker-local.mjs` | read in full | 44 | P7: Full source reading and caller tracing; no execution. |
| `src/app/(auth)/sign-in/page.tsx` | read in full | 40 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/(auth)/sign-up/page.tsx` | read in full | 41 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/(tabs)/days/loading.tsx` | read in full | 13 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/days/page.tsx` | read in full | 13 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/(tabs)/error.tsx` | read in full | 10 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/layout.tsx` | read in full | 13 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/page.tsx` | read in full | 169 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/(tabs)/profile/CameraModeSwitch.tsx` | read in full | 10 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/IdentifyProviderSwitch.tsx` | read in full | 9 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/about/page.tsx` | read in full | 42 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/deleted/DeletedPosts.tsx` | read in full | 12 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/deleted/page.tsx` | read in full | 11 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/loading.tsx` | read in full | 5 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/profile/page.tsx` | read in full | 53 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/(tabs)/search/loading.tsx` | read in full | 4 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/(tabs)/search/page.tsx` | read in full | 6 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/admin/page.tsx` | read in full | 55 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/admin/posts/[id]/page.tsx` | read in full | 48 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/api/agent/meals/[id]/route.ts` | read in full | 18 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/api/agent/meals/route.ts` | read in full | 19 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/api/barcode/[gtin]/correction/route.ts` | read in full | 16 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/days/route.ts` | read in full | 29 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/drinks/identify/route.ts` | read in full | 73 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/drinks/post/route.ts` | read in full | 58 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/fdc/barcode/route.ts` | read in full | 22 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/fdc/search/route.ts` | read in full | 23 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/feed/route.ts` | read in full | 43 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/health/route.ts` | read in full | 20 | P4: Full source reading and caller tracing; no execution. |
| `src/app/api/intake/post/route.ts` | read in full | 65 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/app/api/intake/tile-counts/route.ts` | read in full | 29 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/app/api/jobs/drain/route.ts` | read in full | 35 | P0,P4:  |
| `src/app/api/jobs/tick/route.ts` | read in full | 44 | P0,P4:  |
| `src/app/api/label/read/route.ts` | read in full | 21 | P5: Full source reading and caller tracing; no execution. |
| `src/app/api/media/avatar/[owner]/[media]/[variant]/route.ts` | read in full | 60 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts` | read in full | 66 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/media/feed/[owner]/[post]/[media]/v1.webp/route.ts` | read in full | 2 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/media/feed/[owner]/[post]/[media]/v2.webp/route.ts` | read in full | 2 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/media/sign-upload/route.ts` | read in full | 81 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/caption/route.ts` | read in full | 16 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/comments/[commentId]/revert/route.ts` | read in full | 17 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/comments/route.ts` | read in full | 24 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/discard/route.ts` | read in full | 17 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/eaten-at/route.ts` | read in full | 20 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/feedback/route.ts` | read in full | 30 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/items/route.ts` | read in full | 56 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/log-again/route.ts` | read in full | 25 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/media/route.ts` | read in full | 60 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/question/route.ts` | read in full | 15 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/restore/route.ts` | read in full | 12 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/retry/route.ts` | read in full | 35 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/route.ts` | read in full | 12 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/[id]/servings/route.ts` | read in full | 26 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/posts/food/route.ts` | read in full | 143 | P3: Source read in full in bounded batch; all six axes considered. |
| `src/app/api/posts/route.ts` | read in full | 78 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/profile/avatar/route.ts` | read in full | 87 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/api/profile/identify-provider/route.ts` | read in full | 13 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/api/push/subscribe/route.ts` | read in full | 38 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/saved/[id]/log/route.ts` | read in full | 21 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/saved/[id]/route.ts` | read in full | 7 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/saved/route.ts` | read in full | 6 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/search/route.ts` | read in full | 14 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/today/route.ts` | read in full | 19 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/api/transcribe/route.ts` | read in full | 33 | P4: Full source reading and caller tracing; no execution. |
| `src/app/auth/callback/route.ts` | read in full | 38 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/build.js/route.ts` | read in full | 10 | P0: Complete build-marker route read. |
| `src/app/days/[date]/page.tsx` | read in full | 21 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/error.tsx` | read in full | 10 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/favicon.ico` | not read | 0 | P2: Binary asset or fixture; not read as source. |
| `src/app/globals.css` | read in full | 115 | P2: Full source read in bounded batch; all six axes considered. |
| `src/app/layout.tsx` | read in full | 33 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/mcp/route.ts` | read in full | 62 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/app/not-found.tsx` | read in full | 9 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/p/[file]/route.ts` | read in full | 53 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/posts/[id]/loading.tsx` | read in full | 7 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/posts/[id]/page.tsx` | read in full | 14 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/app/profile/agents/AgentList.tsx` | read in full | 44 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/RevokeSheet.tsx` | read in full | 20 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/TokenShown.tsx` | read in full | 56 | P2: Full source read in bounded batch; all six axes considered. |
| `src/app/profile/agents/actions.ts` | read in full | 20 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/layout.tsx` | read in full | 4 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/new/NewAgentForm.tsx` | read in full | 38 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/new/page.tsx` | read in full | 16 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/profile/agents/page.tsx` | read in full | 23 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/app/shell/page.tsx` | read in full | 5 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/assets/fonts/Manrope-300.ttf` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-300.woff2` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-400.ttf` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-400.woff2` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-500.ttf` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-500.woff2` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-600.ttf` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/Manrope-600.woff2` | not read | 0 | unassigned binary asset: Binary asset or fixture; not read as source. |
| `src/assets/fonts/OFL.txt` | skimmed | 93 | P0: License attribution and opening terms scanned; full license not audited. |
| `src/components/Avatar.tsx` | read in full | 39 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/BarcodeScanner.tsx` | read in full | 56 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/BottomBar.tsx` | read in full | 37 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/BrandMark.tsx` | read in full | 9 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/CameraPreview.tsx` | read in full | 15 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/CaptureSheet.tsx` | read in full | 655 | P2: Read in full in four nontruncated ranges 1-155,156-340,341-505,506-655. |
| `src/components/Carousel.tsx` | read in full | 126 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/CleanFreshMarker.tsx` | read in full | 6 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/CommentComposer.tsx` | read in full | 28 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/ComposerDrinks.tsx` | read in full | 84 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ConnectAgentRow.tsx` | read in full | 14 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/CorrectProductAction.tsx` | read in full | 11 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/CorrectProductSheet.tsx` | read in full | 27 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/DayHeader.tsx` | read in full | 29 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/DayRings.tsx` | read in full | 71 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/DaysScreen.tsx` | read in full | 27 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/DaysView.tsx` | read in full | 204 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/DeletePostSheet.tsx` | read in full | 35 | P2: Full source printed in bounded small-file batch; six audit axes considered. |
| `src/components/DesktopDays.tsx` | read in full | 21 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/DesktopHomeFrame.tsx` | read in full | 5 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/DesktopToday.tsx` | read in full | 30 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/DesktopWorkspace.tsx` | read in full | 108 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/DoubleTap.tsx` | read in full | 32 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/DrinkPicture.tsx` | read in full | 13 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/EatenAtEditor.tsx` | read in full | 31 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/FacebookButton.tsx` | read in full | 14 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/Feed.tsx` | read in full | 599 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/FeedCacheMutations.tsx` | read in full | 8 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/FirstRunHint.tsx` | read in full | 88 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/FoodSearchPanel.tsx` | read in full | 59 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/GoToMonthSheet.tsx` | read in full | 14 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/HCaptcha.tsx` | read in full | 54 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/IntakeBar.tsx` | read in full | 4 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/IntakeSheet.tsx` | read in full | 151 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ItemEditSheet.tsx` | read in full | 100 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ItemRows.tsx` | read in full | 21 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/LightComposer.tsx` | read in full | 154 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/LiveNutritionCard.tsx` | read in full | 49 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/LocalTime.tsx` | read in full | 20 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/LocalTimeZone.tsx` | read in full | 17 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/LogAgainSheet.tsx` | read in full | 40 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ModeStrip.tsx` | read in full | 97 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/MonthGrid.tsx` | read in full | 52 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/NavigationControls.tsx` | read in full | 56 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/NeedsInputSheet.tsx` | read in full | 22 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/NeedsInputStrip.tsx` | read in full | 76 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/NutritionSummary.tsx` | read in full | 9 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/NutritionTable.tsx` | read in full | 26 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/OpenFoodFactsAttribution.tsx` | read in full | 3 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/OutlineOverlay.tsx` | read in full | 287 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/PhoneCalendar.tsx` | read in full | 99 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PlusMenu.tsx` | read in full | 60 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostActions.tsx` | read in full | 50 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/PostCaption.tsx` | read in full | 11 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostCard.tsx` | read in full | 107 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/PostCreatedListeners.tsx` | read in full | 5 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostDetail.tsx` | read in full | 33 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/PostDetailHeader.tsx` | read in full | 72 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostDetailSkeleton.tsx` | read in full | 7 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostHandle.tsx` | read in full | 66 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/PostMenu.tsx` | read in full | 36 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostOpenFrame.tsx` | read in full | 61 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostOpenTransition.tsx` | read in full | 63 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostPageShell.tsx` | read in full | 13 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PostReadinessListener.tsx` | read in full | 180 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/ProfileAvatarControl.tsx` | read in full | 107 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ProfileGrid.tsx` | read in full | 24 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ProfileNutritionTile.tsx` | read in full | 12 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/PushPrompt.tsx` | read in full | 84 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/QueueTicker.tsx` | read in full | 45 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/RealtimePost.tsx` | read in full | 80 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ResultsCard.tsx` | read in full | 88 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SavePhoto.tsx` | read in full | 50 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SavedMealListeners.tsx` | read in full | 30 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SavedMealsButton.tsx` | read in full | 3 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SavedMealsSheet.tsx` | read in full | 11 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SearchBox.tsx` | read in full | 33 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ServiceWorkerRegistration.tsx` | read in full | 30 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/ShellHome.tsx` | read in full | 44 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ShortcutsDialog.tsx` | read in full | 11 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/Sidebar.tsx` | read in full | 35 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/SignOutButton.tsx` | read in full | 45 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/StoryPlayer.tsx` | read in full | 163 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/Thread.tsx` | read in full | 87 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/ThumbsFeedback.tsx` | read in full | 38 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/UndoToast.tsx` | read in full | 8 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/UploadBar.tsx` | read in full | 2 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/UploadChip.tsx` | read in full | 38 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/UploadingPost.tsx` | read in full | 18 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/VoiceButton.tsx` | read in full | 15 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/VoiceRecorder.tsx` | read in full | 49 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/components/ui/Button.tsx` | read in full | 15 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/Field.tsx` | read in full | 21 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/Icon.tsx` | read in full | 40 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/Sheet.tsx` | read in full | 57 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/Shimmer.tsx` | read in full | 10 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/Tooltip.tsx` | read in full | 17 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/ui/TopBar.tsx` | read in full | 11 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/useCachedFeed.ts` | read in full | 28 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/useDrinkCard.ts` | read in full | 73 | P2: Source read; all six axes considered with connected callers where noted in pass. |
| `src/components/useRemovalMenus.ts` | read in full | 20 | P2: Full source read in bounded batch; all six axes considered. |
| `src/components/useUploads.ts` | read in full | 4 | P2: Full source read in bounded batch; all six axes considered. |
| `src/lib/admin/stats.ts` | read in full | 48 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/agents/kickoff.ts` | read in full | 7 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/agents/mcp-tools.ts` | read in full | 8 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/agents/ops.ts` | read in full | 84 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/agents/request-body.ts` | read in full | 22 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/agents/tokens.ts` | read in full | 46 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/audio/limits.ts` | read in full | 4 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/lib/audio/wav-encoder.ts` | read in full | 18 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/lib/auth/actions.ts` | read in full | 64 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/admin-access.ts` | read in full | 25 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/browser-user.ts` | read in full | 49 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/end-session.ts` | read in full | 8 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/media-session-epoch.ts` | read in full | 12 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/post-access.ts` | read in full | 15 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/session-cookies.ts` | read in full | 34 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/verified-cookie.ts` | read in full | 13 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/verified-user-header.ts` | read in full | 3 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/auth/verified-user.ts` | read in full | 8 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/fdc/approximate.ts` | read in full | 64 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/approximation-metadata.ts` | read in full | 36 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/barcode-product.ts` | read in full | 114 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/barcode-resolver.ts` | read in full | 23 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/barcode.ts` | read in full | 40 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/client.ts` | read in full | 280 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/estimate.ts` | read in full | 50 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/exclusions.ts` | read in full | 15 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/food-category.ts` | read in full | 9 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/gtin.ts` | read in full | 48 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/match.ts` | read in full | 122 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/nutrients.ts` | read in full | 206 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/open-food-facts.ts` | read in full | 50 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/protein-reference.ts` | read in full | 67 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/record-kind.ts` | read in full | 109 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/resolve-items.ts` | read in full | 36 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/serving.ts` | read in full | 11 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/unavailable.ts` | read in full | 26 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/fdc/version.ts` | read in full | 1 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/health/probe.ts` | read in full | 54 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/intake/alcohol.ts` | read in full | 34 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/drink-glyph.ts` | read in full | 9 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/drink-operation.ts` | read in full | 22 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/drink-volume.ts` | read in full | 7 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/drinks-from-items.ts` | read in full | 68 | P3: Source read in full in bounded batch; all six axes considered. |
| `src/lib/intake/hydration.ts` | read in full | 226 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/intake/identify-drinks.ts` | read in full | 36 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/intake.ts` | read in full | 78 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/intake/photo-drinks.ts` | read in full | 23 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/intake/post-drink.ts` | read in full | 75 | P3: Source read in full in bounded batch; all six axes considered. |
| `src/lib/limits/user-cap.ts` | read in full | 26 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/location/capture.ts` | read in full | 30 | P2: Full source read; Feed truncation gap repaired with overlapping bounded reads. |
| `src/lib/media/camera-mode.ts` | read in full | 9 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/camera.ts` | read in full | 120 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/media/media-url.ts` | read in full | 23 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/media/near-viewport.ts` | read in full | 14 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/pack-photo-upload.ts` | read in full | 55 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/media/paths.ts` | read in full | 11 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/photo-box.ts` | read in full | 16 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/put-with-progress.ts` | read in full | 23 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/media/read-cache.ts` | read in full | 19 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/media/reencode.ts` | read in full | 73 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/media/retained-image.ts` | read in full | 10 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/staged-photo.ts` | read in full | 12 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/media/storage.ts` | read in full | 52 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/media/upload-window.ts` | read in full | 8 | P3: Full source printed in bounded helper batch; six axes considered. |
| `src/lib/meta/client.ts` | read in full | 214 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/label.ts` | read in full | 101 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/open-weights.ts` | read in full | 44 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/remainder.ts` | read in full | 21 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/retry404.ts` | read in full | 14 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/sam.ts` | read in full | 133 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/same-meal.ts` | read in full | 29 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/spark.ts` | read in full | 173 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/meta/transcribe.ts` | read in full | 16 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/nutrition/available.ts` | read in full | 14 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/nutrition/portion.ts` | read in full | 59 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/nutrition/table.ts` | read in full | 38 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/nutrition/totals.ts` | read in full | 265 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/nutrition/units.ts` | read in full | 52 | P5: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/analyze.ts` | read in full | 273 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/card-data.ts` | read in full | 84 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/correction-ready.ts` | read in full | 27 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/correction-state.ts` | read in full | 33 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/history-budget.ts` | read in full | 16 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/leftovers.ts` | read in full | 21 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/masks.ts` | read in full | 67 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/needs-input.ts` | read in full | 11 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/pending-items.ts` | read in full | 14 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/persist.ts` | read in full | 177 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/prior-nutrition.ts` | read in full | 33 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/prior-version.ts` | read in full | 8 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/prior.ts` | read in full | 61 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/remainder-rule.ts` | read in full | 15 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/render-zone.ts` | read in full | 25 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/results-card.tsx` | read in full | 75 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/selected-masks.ts` | read in full | 37 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/wording-check.ts` | read in full | 5 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/pipeline/wording.ts` | read in full | 13 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/posts/attach-photo.ts` | read in full | 57 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/barcode-correction.ts` | read in full | 26 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/bubble.ts` | read in full | 9 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/caption-client.ts` | read in full | 12 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/caption.ts` | read in full | 15 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/comment-label.ts` | read in full | 5 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/copy-operation.ts` | read in full | 29 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/copy-request.ts` | read in full | 5 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/correction-feedback.ts` | read in full | 4 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/create.ts` | read in full | 111 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/day-total-changes.ts` | read in full | 16 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/day-totals-refresh.ts` | read in full | 48 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/posts/days.ts` | read in full | 284 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/delayed-action.ts` | read in full | 16 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/deleted.ts` | read in full | 24 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/drink-request.ts` | read in full | 6 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/eaten-at.ts` | read in full | 27 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/feed-cache-mutations.ts` | read in full | 108 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/feed-cache.ts` | read in full | 101 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/feed-cursor.ts` | read in full | 34 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/feed-order.ts` | read in full | 18 | P3: Full source read in bounded batch; all six axes considered. |
| `src/lib/posts/feed-photo-response.ts` | read in full | 63 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/feed-photo-url.ts` | read in full | 55 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/feed-photo.ts` | read in full | 70 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/feed.ts` | read in full | 433 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/feedback-errors.ts` | read in full | 16 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/feedback-optimistic.ts` | read in full | 20 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/feedback.ts` | read in full | 16 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/food-operation.ts` | read in full | 7 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/food-request.ts` | read in full | 2 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/grid.ts` | read in full | 88 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/home-today.ts` | read in full | 31 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/items.ts` | read in full | 161 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/media-session.ts` | read in full | 130 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/open-frame.ts` | read in full | 7 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/open-post.ts` | read in full | 19 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/pending-upload-line.ts` | read in full | 16 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/readiness-refresh.ts` | read in full | 8 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/posts/retry-kind.ts` | read in full | 6 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/retry.ts` | read in full | 21 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/save-optimistic.ts` | read in full | 7 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/saved-summary.ts` | read in full | 16 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/saved.ts` | read in full | 49 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/servings.ts` | read in full | 103 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/summary-line.ts` | read in full | 43 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/posts/tap.ts` | read in full | 49 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/timeline.ts` | read in full | 24 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/posts/today-view.ts` | read in full | 16 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/upload-draft.ts` | read in full | 66 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/upload-manager.ts` | read in full | 504 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/posts/upload-store.ts` | read in full | 88 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/upload-target.ts` | read in full | 5 | P3: Source read in full; all six axes considered. |
| `src/lib/posts/visible-month.ts` | read in full | 11 | P3: Source read in full; all six axes considered. |
| `src/lib/profile/avatar-url.ts` | read in full | 37 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/profile/avatar.ts` | read in full | 21 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/profile/hints.ts` | read in full | 26 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/prompts/index.ts` | read in full | 10 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/correct-schema.ts` | read in full | 28 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/correct.schema.json` | read in full | 92 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/correct.ts` | read in full | 1 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/identify.schema.json` | read in full | 98 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/identify.ts` | read in full | 38 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/label.schema.json` | read in full | 144 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/label.ts` | read in full | 1 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/remainder.schema.json` | read in full | 49 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/remainder.ts` | read in full | 1 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/same-meal.ts` | read in full | 2 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/prompts/spark/search-query.ts` | read in full | 3 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/push/leave.ts` | read in full | 31 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/push/lifecycle.ts` | read in full | 82 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/push/send.ts` | read in full | 60 | P3: Source read; all six axes considered with connected callers where noted in pass. |
| `src/lib/queue/claim.ts` | read in full | 37 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/queue/enqueue.ts` | read in full | 19 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/queue/lease.ts` | read in full | 50 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/queue/release.ts` | read in full | 10 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/queue/tick.ts` | read in full | 39 | P0,P4:  |
| `src/lib/queue/traffic.ts` | read in full | 31 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/search/dates.ts` | read in full | 67 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/search/operators.ts` | read in full | 16 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/search/query.ts` | read in full | 39 | P3: Source read in full with connected feed/detail callers. |
| `src/lib/supabase/admin.ts` | read in full | 15 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/supabase/client.ts` | read in full | 11 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/supabase/server.ts` | read in full | 30 | P1: Full source read; related schema security read is recorded separately in P6. |
| `src/lib/theme/font.ts` | read in full | 16 | P2: Full source read in bounded batch; all six axes considered. |
| `src/lib/theme/tokens.css` | read in full | 169 | P2: Final theme/time/UI batch read in full; generated tokens.css compared with authored tokens.ts. |
| `src/lib/theme/tokens.ts` | read in full | 72 | P2: Final theme/time/UI batch read in full; generated tokens.css compared with authored tokens.ts. |
| `src/lib/time/local.ts` | read in full | 12 | P2: Final theme/time/UI batch read in full; generated tokens.css compared with authored tokens.ts. |
| `src/lib/trace/context.ts` | read in full | 3 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/trace/record.ts` | read in full | 75 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/ui/scroll-lock.ts` | read in full | 16 | P2: Final theme/time/UI batch read in full; generated tokens.css compared with authored tokens.ts. |
| `src/lib/ui/use-desktop.ts` | read in full | 16 | P2: Final theme/time/UI batch read in full; generated tokens.css compared with authored tokens.ts. |
| `src/lib/worker/budget.ts` | read in full | 29 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/concurrency.ts` | read in full | 9 | P0,P4:  |
| `src/lib/worker/drain.ts` | read in full | 91 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/errors.ts` | read in full | 56 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/failure-message.ts` | read in full | 6 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/handlers.ts` | read in full | 25 | P0,P4:  |
| `src/lib/worker/jobs/analyze.ts` | read in full | 33 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/jobs/card_backfill.ts` | read in full | 13 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/jobs/correct.ts` | read in full | 125 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/jobs/media_cleanup.ts` | read in full | 69 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/jobs/recompute.ts` | read in full | 157 | P4: Full source reading and caller tracing; no execution. |
| `src/lib/worker/jobs/remainder.ts` | read in full | 53 | P4: Full source reading and caller tracing; no execution. |
| `src/middleware.ts` | read in full | 64 | P0:  |
| `supabase/migrations/0001_init.sql` | read in full | 202 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0002_fdc_cache.sql` | read in full | 9 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0003_pin_search_path.sql` | read in full | 10 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0004_persist_analysis.sql` | read in full | 84 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0005_jobs_retry.sql` | read in full | 53 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0005b_profile_role_guard.sql` | read in full | 8 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0006_post_locations.sql` | read in full | 12 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0007_post_items_supersede.sql` | skimmed | 195 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0007b_comment_corrections.sql` | read in full | 322 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0007c_feedback_revision.sql` | read in full | 48 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0008_post_media_kind.sql` | read in full | 101 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0009_posts_search.sql` | read in full | 72 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0010_post_media_phash.sql` | read in full | 22 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0011_posts_needs_input.sql` | read in full | 110 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0012_push_subscriptions.sql` | read in full | 14 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0013_profiles_hints.sql` | read in full | 13 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0014_model_calls.sql` | read in full | 27 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0015_posts_eaten_at_index.sql` | read in full | 2 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0016_intake_logs.sql` | read in full | 19 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0017_servings.sql` | read in full | 43 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0018_food_posts.sql` | read in full | 28 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0019_intake_logs_drink.sql` | read in full | 80 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0020_food_post_photo.sql` | read in full | 108 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0021_known_nutrition.sql` | read in full | 29 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0023_photo_publication.sql` | read in full | 104 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0024_worker_wake.sql` | read in full | 53 | P0,P6:  |
| `supabase/migrations/0025_barcode_corrections.sql` | read in full | 117 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0026_saved_meals.sql` | read in full | 121 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0027_not_eaten.sql` | skimmed | 264 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0028_multiple_leftovers.sql` | read in full | 169 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0029_drinks_from_items.sql` | skimmed | 442 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0030_delete_and_remove.sql` | read in full | 129 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0031_agent_tokens.sql` | read in full | 90 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0032_identify_provider.sql` | read in full | 68 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0033_pending_items.sql` | read in full | 23 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0034_renew_lease.sql` | read in full | 46 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0035_user_call_caps.sql` | read in full | 28 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0036_soft_delete_posts.sql` | read in full | 85 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0037_water_tile_labels.sql` | read in full | 22 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0038_unmark_not_eaten.sql` | read in full | 22 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0039_feedback_conflict.sql` | read in full | 16 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0040_composer_drinks.sql` | read in full | 104 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0041_saved_drink_snapshots.sql` | read in full | 81 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0042_modes_hint.sql` | read in full | 12 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0043_food_post_operations.sql` | read in full | 58 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0044_copy_post_operations.sql` | read in full | 85 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0045_drink_post_operations.sql` | read in full | 90 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0046_drink_identify_cap.sql` | read in full | 21 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0047_alcohol_intake.sql` | read in full | 7 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0048_feed_post_indexes.sql` | read in full | 3 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0049_feedback_revisions.sql` | read in full | 7 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0050_sugar_total_backfill.sql` | read in full | 49 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0051_approximation_summary.sql` | read in full | 66 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0052_estimate_summary.sql` | read in full | 66 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0053_estimate_reader_rollout.sql` | read in full | 63 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0054_unavailable_summary.sql` | skimmed | 67 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0055_approximation_once.sql` | skimmed | 20 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0056_visible_question.sql` | read in full | 4 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0057_today_summary.sql` | skimmed | 55 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0058_avatar.sql` | read in full | 20 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0059_question_atomic.sql` | read in full | 21 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0060_label_serving_unit.sql` | skimmed | 128 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0061_servings_floor.sql` | read in full | 39 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0062_today_summary_nulls.sql` | skimmed | 45 | P6: Policies, grants, schema changes and current replacement chains read; historical superseded function bodies not fully read. |
| `supabase/migrations/0063_photo_secret.sql` | read in full | 3 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0064_drop_today_summary.sql` | read in full | 3 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0065_operator_revision.sql` | read in full | 89 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0066_summary_without_comment.sql` | read in full | 41 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0067_leftovers_with_drinks.sql` | read in full | 34 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0068_leftovers_again.sql` | read in full | 34 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0069_upload_failures.sql` | read in full | 20 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0070_realtime_scope.sql` | read in full | 2 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0071_job_retention.sql` | read in full | 207 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0072_trace_retention.sql` | read in full | 56 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0073_cron_run_retention.sql` | read in full | 44 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/migrations/0074_soft_discard.sql` | read in full | 17 | P6: Complete migration read; final replacements and ownership/service-role fences traced in source, no schema execution. |
| `supabase/rollback/0028_pause_leftovers.sql` | skimmed | 42 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollback/0028_resume_leftovers.sql` | skimmed | 11 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollback/0036_soft_delete_posts.sql` | read in full | 59 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0037_water_tile_labels.sql` | skimmed | 21 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollback/0038_unmark_not_eaten.sql` | skimmed | 2 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollback/0039_feedback_conflict.sql` | read in full | 15 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0040_composer_drinks.sql` | read in full | 3 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0041_saved_drink_snapshots.sql` | read in full | 68 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0042_modes_hint.sql` | skimmed | 12 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollback/0043_food_post_operations.sql` | read in full | 5 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0044_copy_post_operations.sql` | read in full | 5 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0045_drink_post_operations.sql` | read in full | 5 | P6: Complete rollback source read; not applied. |
| `supabase/rollback/0073_cron_run_retention.down.sql` | read in full | 11 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0046_drink_identify_cap.down.sql` | skimmed | 20 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0047_alcohol_intake.down.sql` | skimmed | 5 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0048_feed_post_indexes.down.sql` | skimmed | 2 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0049_feedback_revisions.down.sql` | skimmed | 1 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0050_sugar_total_backfill.down.sql` | skimmed | 8 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0051_approximation_summary.down.sql` | skimmed | 4 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0052_estimate_summary.down.sql` | skimmed | 66 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0053_estimate_reader_rollout.down.sql` | read in full | 12 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0054_unavailable_summary.down.sql` | skimmed | 67 | P6: Target and statements scanned in rollback inventory; full body not read reliably (bounded output truncation). |
| `supabase/rollbacks/0055_approximation_once.down.sql` | read in full | 13 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0057_today_summary.down.sql` | read in full | 2 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0059_question_atomic.down.sql` | read in full | 1 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0062_today_summary_nulls.down.sql` | read in full | 55 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0065_operator_revision.down.sql` | read in full | 64 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0066_summary_without_comment.down.sql` | read in full | 36 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0067_leftovers_with_drinks.down.sql` | read in full | 30 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0068_leftovers_again.down.sql` | read in full | 34 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0069_upload_failures.down.sql` | read in full | 1 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0070_realtime_scope.down.sql` | read in full | 2 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0071_job_retention.down.sql` | read in full | 135 | P6: Complete rollback source read; not applied. |
| `supabase/rollbacks/0072_trace_retention.down.sql` | read in full | 5 | P6: Complete rollback source read; not applied. |
| `tests/added-photo.test.mjs` | read in full | 59 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/admin-access.test.mjs` | read in full | 48 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/agent-tokens.test.mjs` | read in full | 70 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/alcohol-name.test.mjs` | read in full | 14 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/analysis-integrity.test.mjs` | read in full | 63 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/analysis-replay.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/answer-readiness.test.mjs` | read in full | 12 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/attachment-stage-expiry.test.mjs` | read in full | 41 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/auth.test.mjs` | read in full | 42 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/barcode-consistency.test.mjs` | read in full | 134 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/barcode-corrections.test.mjs` | read in full | 129 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/barcode-post.test.mjs` | read in full | 152 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/barcode-resolver-outage.test.mjs` | read in full | 13 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/barcode.test.mjs` | read in full | 113 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/beer-check-outcome.test.mjs` | read in full | 42 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/beer-check-reload.test.mjs` | read in full | 17 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/blocked-tick-retick.test.mjs` | read in full | 23 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/browser-auth-cache.test.mjs` | read in full | 48 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/bubble.test.mjs` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/camera-flip.test.mjs` | read in full | 83 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/camera-frame.test.mjs` | read in full | 17 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/camera-recovery-actions.test.mjs` | read in full | 9 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/camera-recovery.test.mjs` | read in full | 27 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/caption-client.test.mjs` | read in full | 26 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/caption.test.mjs` | read in full | 18 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/card-backfill-failure.test.mjs` | read in full | 84 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/card-cleanup.test.mjs` | read in full | 120 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/card-failure-ready.test.mjs` | read in full | 60 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/card-io.test.mjs` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/card-polling.test.mjs` | read in full | 57 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/clarification-order.test.mjs` | read in full | 124 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/clarification-wording.test.mjs` | read in full | 9 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/client-body-timeout.test.mjs` | read in full | 27 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/client-retry-headers.test.mjs` | read in full | 40 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/client-retry.test.mjs` | read in full | 20 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/closest-food-bare-name.test.mjs` | read in full | 43 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/comment-label.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/comments-policy.test.mjs` | read in full | 152 | P8: Re-read completely to close earlier truncated-output gap; assertion behavior reviewed, no suite run. |
| `tests/composer-drinks-route.test.mjs` | read in full | 127 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/copy-operations-route.test.mjs` | read in full | 49 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/copy-post-queue.test.mjs` | read in full | 39 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/correction-pagination.test.mjs` | read in full | 20 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/correction-photo.test.mjs` | read in full | 53 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/correction-ready.test.mjs` | read in full | 78 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/correction-source-schema.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/correction-state.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/current-items-errors.test.mjs` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/day-rings-updates.test.mjs` | read in full | 58 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/day-total-changes.test.mjs` | read in full | 56 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/day-totals-refresh.test.mjs` | read in full | 37 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/days-range.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/days-reader-queries.test.mjs` | read in full | 90 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/days-summary.test.mjs` | read in full | 75 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/after.test.mjs` | read in full | 28 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/agent-tokens.test.mjs` | read in full | 74 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/alcohol-intake.test.mjs` | read in full | 32 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/approximation-once.test.mjs` | read in full | 63 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/approximation-summary.test.mjs` | read in full | 97 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/auth.test.mjs` | read in full | 12 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/composer-drinks.test.mjs` | read in full | 62 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/copy-operations.test.mjs` | read in full | 82 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/days-intake.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/delete-and-remove.test.mjs` | read in full | 28 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/drink-post-operations.test.mjs` | read in full | 44 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/drink-tile-labels.test.mjs` | read in full | 40 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/estimate-reader-rollout.test.mjs` | read in full | 95 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/estimate-summary.test.mjs` | read in full | 98 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/feed-indexes.test.mjs` | read in full | 9 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/feedback-revisions.test.mjs` | read in full | 22 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/feedback-route.test.mjs` | read in full | 36 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/food-post-operations.test.mjs` | read in full | 44 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/helpers.mjs` | read in full | 10 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/hints.test.mjs` | read in full | 42 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/identify-after.test.mjs` | read in full | 25 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/identify-identity.test.mjs` | read in full | 61 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/item-drinks.test.mjs` | read in full | 72 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/label-serving-unit.test.mjs` | read in full | 34 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/lease-renew.test.mjs` | read in full | 77 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/leftovers-again.test.mjs` | read in full | 52 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/leftovers-with-drinks.test.mjs` | read in full | 40 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/numbers-photo-study.test.mjs` | read in full | 7 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/numbers-set-record.test.mjs` | read in full | 124 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/open-identify.test.mjs` | read in full | 35 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/operator-revision.test.mjs` | read in full | 79 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/pending-items.sql` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/pending-items.test.mjs` | read in full | 24 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/provider-recovery.test.mjs` | read in full | 27 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/question-atomic.test.mjs` | read in full | 43 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/queue.test.mjs` | read in full | 117 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/realtime-scope.test.mjs` | read in full | 25 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/retention-cron-runs.test.mjs` | read in full | 39 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/retention-jobs.test.mjs` | read in full | 71 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/retention-traces.test.mjs` | read in full | 51 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/rls.test.mjs` | read in full | 53 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/db/saved-drink-snapshot.test.mjs` | read in full | 30 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/saved-meal-not-ready.test.mjs` | read in full | 35 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/servings-floor.test.mjs` | read in full | 31 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/soft-delete.test.mjs` | read in full | 51 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/sugar-backfill.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/summary-without-comment.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/unavailable-summary.test.mjs` | read in full | 73 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/unmark-not-eaten.test.mjs` | read in full | 38 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/db/user-cap.test.mjs` | read in full | 112 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/delayed-action.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/delete-post.test.mjs` | read in full | 16 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/desktop-review.test.mjs` | read in full | 36 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/desktop-today-lazy.test.mjs` | read in full | 4 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/detail-originals.test.mjs` | read in full | 26 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/detail-revision-count.test.mjs` | read in full | 41 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/discard-cleanup.test.mjs` | read in full | 64 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drain-lease.test.mjs` | read in full | 11 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-consistency.test.mjs` | read in full | 61 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-glyph.test.mjs` | read in full | 6 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-names.test.mjs` | read in full | 52 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-post-queue.test.mjs` | read in full | 31 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-post-route.test.mjs` | read in full | 33 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/drink-post.test.mjs` | read in full | 242 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/drink-tiles-route.test.mjs` | read in full | 68 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drink-volume.test.mjs` | read in full | 35 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/drinks-from-items.test.mjs` | read in full | 190 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/eaten-at-index.test.mjs` | read in full | 16 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/eaten-at.test.mjs` | read in full | 47 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/empty-job-claim.test.mjs` | read in full | 26 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/end-session.test.mjs` | read in full | 13 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/estimate-caffeine.test.mjs` | read in full | 95 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/estimate-rollout-compatibility.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fake-control.test.mjs` | read in full | 11 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fake-meta/fixtures/fdc.json` | skimmed | 7733 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/recording.json` | skimmed | 11 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/sam.sse` | skimmed | 26 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-closest_food.json` | skimmed | 16 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-correct.json` | skimmed | 125 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-identify.json` | skimmed | 127 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-label.json` | skimmed | 209 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-match.json` | skimmed | 5 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-nutrition_estimate.json` | skimmed | 18 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-remainder.json` | skimmed | 114 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-same_meal.json` | skimmed | 77 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-search_query.json` | skimmed | 121 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/spark-wording.json` | skimmed | 77 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/fixtures/transcribe.json` | skimmed | 6 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/fake-meta/harness.mjs` | read in full | 119 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fake-meta/scoped-claims.mjs` | read in full | 23 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fake-meta/server.mjs` | read in full | 34 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fake-meta/storage-cleanup.mjs` | read in full | 23 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fdc-cache-identity.test.mjs` | read in full | 18 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fdc-energy-fits.test.mjs` | read in full | 32 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fdc-item-concurrency.test.mjs` | read in full | 32 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fdc-match-response-budget.test.mjs` | read in full | 37 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fdc-match.test.mjs` | read in full | 65 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fdc-reference-search.test.mjs` | read in full | 154 | P8: Re-read completely to close earlier truncated-output gap; assertion behavior reviewed, no suite run. |
| `tests/fdc-resolution-trace.test.mjs` | read in full | 33 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fdc-retry-after.test.mjs` | read in full | 48 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-cache-lifecycle.test.mjs` | read in full | 237 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-cache-mutations.test.mjs` | read in full | 52 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-cache.test.mjs` | read in full | 80 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-nutrition.test.mjs` | read in full | 122 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-pagination.test.mjs` | read in full | 156 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-photo.test.mjs` | read in full | 112 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-removal.test.mjs` | read in full | 106 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-revision-availability.test.mjs` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-unavailable-retry.test.mjs` | read in full | 28 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feed-variant-cache.test.mjs` | read in full | 12 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feedback-optimistic.test.mjs` | read in full | 25 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feedback-revision.test.mjs` | read in full | 91 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/feedback-save-ownership.test.mjs` | read in full | 18 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/first-photo-upgrade.test.mjs` | read in full | 54 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/fixture-cleanup.test.mjs` | read in full | 12 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/absent-migration.mjs` | read in full | 10 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/async-local-storage.mjs` | read in full | 4 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/job-handlers.mjs` | read in full | 22 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/local-gateway.mjs` | read in full | 25 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/local-model.mjs` | read in full | 22 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/local-providers.mjs` | read in full | 17 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/fixtures/off-7622300761363.json` | skimmed | 0 | P8: Inspected first 650 characters, file size and recorded response shape; data not exhaustively reviewed. |
| `tests/food-estimate.test.mjs` | read in full | 69 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/food-post-queue.test.mjs` | read in full | 55 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/food-post-route.test.mjs` | read in full | 67 | P8: Re-read completely to close earlier truncated-output gap; assertion behavior reviewed, no suite run. |
| `tests/food-resolution-unavailable.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/food-search.test.mjs` | read in full | 101 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/health-probe.test.mjs` | read in full | 24 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/history-budget.test.mjs` | read in full | 24 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/home-day-totals.test.mjs` | read in full | 139 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/home-days-agreement.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/home-photo-preload.test.mjs` | read in full | 83 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/identify-provenance.test.mjs` | read in full | 52 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/identify-response-timeout.test.mjs` | read in full | 13 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/identify-retry.test.mjs` | read in full | 64 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/intake-rls.test.mjs` | read in full | 50 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/intake.test.mjs` | read in full | 72 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/integration/agent-api.test.mjs` | read in full | 64 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/is-retriable.test.mjs` | read in full | 14 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/item-food-selection.test.mjs` | read in full | 48 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/job-ownership.test.mjs` | read in full | 138 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/job-registry.test.mjs` | read in full | 41 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/label-orientation.test.mjs` | read in full | 62 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/label-photos.test.mjs` | read in full | 40 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/label-reading.test.mjs` | read in full | 25 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/leftovers-pause.test.mjs` | read in full | 41 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/load-test-schedule.test.mjs` | read in full | 41 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/local-time.test.mjs` | read in full | 24 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/meal-read-one-query.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/media-read-cache.test.mjs` | read in full | 28 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/media-session.test.mjs` | read in full | 65 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/micronutrient-coverage.test.mjs` | read in full | 21 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/multiple-leftovers.test.mjs` | read in full | 98 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/near-viewport.test.mjs` | read in full | 31 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/needs-input-batch.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/needs-input.test.mjs` | read in full | 34 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/no-quiet-timers.test.mjs` | read in full | 9 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/not-eaten.test.mjs` | read in full | 80 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-consistency.test.mjs` | read in full | 14 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-correction-evidence.test.mjs` | read in full | 18 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-decaf.test.mjs` | read in full | 47 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-mismatch.test.mjs` | read in full | 135 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-photo-study.test.mjs` | read in full | 49 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-portion.test.mjs` | read in full | 29 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-reanalyse.test.mjs` | read in full | 442 | P8: Complete source read in bounded chunks; assertion behavior reviewed, no suite run. |
| `tests/numbers-remove.test.mjs` | read in full | 72 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-rules.test.mjs` | read in full | 33 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-saved.test.mjs` | read in full | 32 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-set-record.test.mjs` | read in full | 44 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/numbers-study.test.mjs` | read in full | 96 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/nutrition-availability.test.mjs` | read in full | 118 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/nutrition-scaling.test.mjs` | read in full | 56 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/nutrition-table.test.mjs` | read in full | 12 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/nutrition-totals.test.mjs` | read in full | 40 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/one-posts-channel.test.mjs` | read in full | 29 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/open-food-facts.test.mjs` | read in full | 41 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/open-identify.test.mjs` | read in full | 43 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/overlay-post-events.test.mjs` | read in full | 35 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/owner-record-gaps.test.mjs` | read in full | 56 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/pending-items.test.mjs` | read in full | 5 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/pending-upload-line.test.mjs` | read in full | 34 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/persist-idempotent.test.mjs` | read in full | 164 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/photo-address.test.mjs` | read in full | 29 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/photo-download-bounds.test.mjs` | read in full | 29 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/photo-upload-grace.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/pipeline.test.mjs` | read in full | 35 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/portion-identity.test.mjs` | read in full | 27 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/post-access.test.mjs` | read in full | 25 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/post-cap-once.test.mjs` | read in full | 22 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/post-detail-reads.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/post-locations.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/pplx-model-label.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/prior-captions.test.mjs` | read in full | 70 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/prior-hint.test.mjs` | read in full | 94 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/prior-nutrition-trust.test.mjs` | read in full | 29 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/prior-signals.test.mjs` | read in full | 33 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/prior-version-rollout.test.mjs` | read in full | 13 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/profile-avatar.test.mjs` | read in full | 149 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/profile-current-nutrition.test.mjs` | read in full | 43 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/profile-role.test.mjs` | read in full | 23 | P8: Re-read completely to close earlier truncated-output gap; assertion behavior reviewed, no suite run. |
| `tests/push-completion.test.mjs` | read in full | 53 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/push-leave.test.mjs` | read in full | 37 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/push-lifecycle.test.mjs` | read in full | 182 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/push-operator.test.mjs` | read in full | 44 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/push-payload.test.mjs` | read in full | 41 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/question-channel-discovery.test.mjs` | read in full | 11 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/question-dismiss-route.test.mjs` | read in full | 16 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/queue.test.mjs` | read in full | 45 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/quiet-event-readers.test.mjs` | read in full | 19 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/readiness-cpu.test.mjs` | read in full | 33 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/readiness-refresh.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/reanalysis-prior.test.mjs` | read in full | 31 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/recompute-package-row.test.mjs` | read in full | 53 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/record-kind.test.mjs` | read in full | 64 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/release-parked.test.mjs` | read in full | 22 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/removal-after-reanalysis.test.mjs` | read in full | 81 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/removal-replay.test.mjs` | read in full | 73 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/removed-media-cleanup.test.mjs` | read in full | 22 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/render-zone.test.mjs` | read in full | 76 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/results-card-layout.test.mjs` | read in full | 27 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/retained-image.test.mjs` | read in full | 14 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/retention-runner.test.mjs` | read in full | 41 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/retry-enqueue.test.mjs` | read in full | 74 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/retry-policy.test.mjs` | read in full | 163 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/rls.test.mjs` | read in full | 78 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/same-meal-budget.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/save-meal-readiness.test.mjs` | read in full | 90 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/save-optimistic.test.mjs` | read in full | 5 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/saved-meals.test.mjs` | read in full | 48 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/saved-summary.test.mjs` | read in full | 13 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/scoped-fixture-claims.test.mjs` | read in full | 17 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/sdk-timeout-classification.test.mjs` | read in full | 35 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-dates.test.mjs` | read in full | 31 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-drink-summary.test.mjs` | read in full | 20 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-index.test.mjs` | read in full | 48 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-operators.test.mjs` | read in full | 24 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-or.test.mjs` | read in full | 17 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-size.test.mjs` | read in full | 49 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/search-timezone.sql` | read in full | 11 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/seed-week-dates.test.mjs` | read in full | 15 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/selected-masks.test.mjs` | read in full | 20 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/servings-input.test.mjs` | read in full | 46 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/servings-sql.test.mjs` | read in full | 46 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/servings-words.test.mjs` | read in full | 22 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/servings.test.mjs` | read in full | 72 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/session-refresh.test.mjs` | read in full | 64 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/sharp-feed-photo.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/sharp-image-identity.test.mjs` | read in full | 52 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/sharper-capture.test.mjs` | read in full | 17 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/sign-upload-shots.test.mjs` | read in full | 16 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/supersede.test.mjs` | read in full | 144 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/sw-media-cache.test.mjs` | read in full | 262 | P8: Complete source read in bounded chunks; assertion behavior reviewed, no suite run. |
| `tests/tap.test.mjs` | read in full | 111 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/tick-split.test.mjs` | read in full | 9 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/today-view.test.mjs` | read in full | 19 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/trace-redaction.test.mjs` | read in full | 61 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/traffic-due.test.mjs` | read in full | 24 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/transcribe-access.test.mjs` | read in full | 21 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/transcribe-retry.test.mjs` | read in full | 16 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/unavailable-reason.test.mjs` | read in full | 12 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/unknown-meal-totals.test.mjs` | read in full | 24 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-chip-retention.test.mjs` | read in full | 35 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-cleanup.test.mjs` | read in full | 36 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-draft.test.mjs` | read in full | 104 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-guard.test.mjs` | read in full | 253 | P8: Complete source read in two bounded chunks; assertion behavior reviewed, no suite run. |
| `tests/upload-lost-draft-notice.test.mjs` | read in full | 37 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-old-row.test.mjs` | read in full | 45 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-publication.test.mjs` | read in full | 77 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/upload-reservation.test.mjs` | read in full | 50 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/verified-cookie.test.mjs` | read in full | 21 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/verified-user.test.mjs` | read in full | 104 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/visible-question-push.test.mjs` | read in full | 44 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/voice-size.test.mjs` | read in full | 10 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/voice-submit-lifecycle.test.mjs` | read in full | 85 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/wav-native-rate.test.mjs` | read in full | 20 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/wording-inventory.test.mjs` | read in full | 34 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |
| `tests/wording.test.mjs` | read in full | 13 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-concurrency.test.mjs` | read in full | 18 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-execution-budget.test.mjs` | read in full | 85 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-recovery-wake.test.mjs` | read in full | 58 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-safety.test.mjs` | read in full | 40 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-timeouts.test.mjs` | read in full | 93 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/worker-wake.test.mjs` | read in full | 60 | P8: Complete source read; findings confirmed by reading only, no test run. |
| `tests/zone-links.test.mjs` | read in full | 14 | P8: Complete source read in continuation; assertion behavior reviewed, no suite run. |

## Outside the denominator

P0 read package.json, README.md, next.config.ts, vercel.json, tsconfig.json, eslint.config.mjs and .env.example; package-lock.json dependency lists only. public/sw.js was partially read, including install/control and navigation wiring, but its full private-media fetch path was not audited. Repository docs were read as context rather than included in the 937-file denominator. No physical device, browser, provider or production run occurred.
