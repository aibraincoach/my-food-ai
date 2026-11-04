# PR #588: current-head review receipt

Observed2026-11-04T13:49:06Z. Head `223bf70eb7b682a1a06a7d6bdcf33c79b9d36212`; stateOPEN; draftFalse; mergeabilityMERGEABLE. Vercel and Vercel Preview Comments report SUCCESS at this head. Receipt source: https://github.com/aibraincoach/my-food-ai/pull/588#issuecomment-6630756566. Public comment text follows; no new review was run for packaging.

AGY receipt — head `223bf70eb7b682a1a06a7d6bdcf33c79b9d36212`, base `376e3306942161a5e659e8d99c85154c8ac26a35`, PR #588.

Invocation: `agy --model gemini-3.8-flash-high --effort high --sandbox --dangerously-skip-permissions --disable-slash-commands --output-format json --json-schema /home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-223bf70/schema.json --print-timeout 10m --print` (prompt omitted), cwd `/home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-223bf70`, started 2026-11-04T12:26:08.953Z, finished 2026-11-04T12:35:15.752Z, agy exit 0.
Delivery: 33 changed paths as 33 on-disk patch parts (≤ 40000 bytes each), read via view_file only; deletions carry full removed content.

Completeness check: PASS — 33/33 paths, 33/33 parts complete, all via view_file.

Verdict: **BLOCKERS: NONE**
Tool exit code: 0 (0 clean, 2 coverage gap, 3 blockers found, 4 agy failure).

| # | path | status | parts | reported bytes | complete |
| --- | --- | --- | --- | --- | --- |
| 1 | .env.example | M | 1 | 421 | yes |
| 2 | scripts/activate-compact-nutrition.sql | A | 1 | 1982 | yes |
| 3 | scripts/rollback-compact-nutrition.sql | A | 1 | 1371 | yes |
| 4 | scripts/run15-unavailable-stack.mjs | A | 1 | 9225 | yes |
| 5 | scripts/test-stack.mjs | M | 1 | 1969 | yes |
| 6 | src/components/NutritionTable.tsx | M | 1 | 1598 | yes |
| 7 | src/lib/fdc/approximate.ts | M | 1 | 1772 | yes |
| 8 | src/lib/fdc/approximation-metadata.ts | M | 1 | 1154 | yes |
| 9 | src/lib/fdc/estimate.ts | M | 1 | 1371 | yes |
| 10 | src/lib/fdc/match.ts | M | 1 | 4827 | yes |
| 11 | src/lib/fdc/nutrients.ts | M | 1 | 2432 | yes |
| 12 | src/lib/fdc/unavailable.ts | A | 1 | 1934 | yes |
| 13 | src/lib/pipeline/persist.ts | M | 1 | 2236 | yes |
| 14 | src/lib/pipeline/wording.ts | M | 1 | 2736 | yes |
| 15 | src/lib/queue/claim.ts | M | 1 | 826 | yes |
| 16 | src/lib/worker/jobs/correct.ts | M | 1 | 3070 | yes |
| 17 | src/lib/worker/jobs/recompute.ts | M | 1 | 2633 | yes |
| 18 | supabase/migrations/0053_estimate_reader_rollout.sql | A | 1 | 3964 | yes |
| 19 | supabase/migrations/0054_unavailable_summary.sql | A | 1 | 5614 | yes |
| 20 | supabase/migrations/0055_approximation_once.sql | A | 1 | 1564 | yes |
| 21 | supabase/rollbacks/0053_estimate_reader_rollout.down.sql | A | 1 | 886 | yes |
| 22 | supabase/rollbacks/0054_unavailable_summary.down.sql | A | 1 | 5209 | yes |
| 23 | supabase/rollbacks/0055_approximation_once.down.sql | A | 1 | 1230 | yes |
| 24 | tests/db/approximation-once.test.mjs | A | 1 | 5305 | yes |
| 25 | tests/db/estimate-reader-rollout.test.mjs | A | 1 | 6669 | yes |
| 26 | tests/db/unavailable-summary.test.mjs | A | 1 | 6126 | yes |
| 27 | tests/estimate-rollout-compatibility.test.mjs | A | 1 | 3061 | yes |
| 28 | tests/fake-meta/fixtures/spark-closest_food.json | A | 1 | 616 | yes |
| 29 | tests/fake-meta/server.mjs | M | 1 | 1331 | yes |
| 30 | tests/fdc-reference-search.test.mjs | M | 1 | 940 | yes |
| 31 | tests/food-estimate.test.mjs | M | 1 | 5050 | yes |
| 32 | tests/food-resolution-unavailable.test.mjs | A | 1 | 3496 | yes |
| 33 | tests/unavailable-reason.test.mjs | A | 1 | 1011 | yes |

Raw reviewer response follows unchanged.

```json
{
  "base": "376e3306942161a5e659e8d99c85154c8ac26a35",
  "blockers": [],
  "files": [
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 421,
          "complete": true,
          "name": "patches/001-.env.example.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": ".env.example",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1982,
          "complete": true,
          "name": "patches/002-scripts__activate-compact-nutrition.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/activate-compact-nutrition.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1371,
          "complete": true,
          "name": "patches/003-scripts__rollback-compact-nutrition.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/rollback-compact-nutrition.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 9225,
          "complete": true,
          "name": "patches/004-scripts__run15-unavailable-stack.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/run15-unavailable-stack.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1969,
          "complete": true,
          "name": "patches/005-scripts__test-stack.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/test-stack.mjs",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1598,
          "complete": true,
          "name": "patches/006-src__components__NutritionTable.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/NutritionTable.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1772,
          "complete": true,
          "name": "patches/007-src__lib__fdc__approximate.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/approximate.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1154,
          "complete": true,
          "name": "patches/008-src__lib__fdc__approximation-metadata.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/approximation-metadata.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1371,
          "complete": true,
          "name": "patches/009-src__lib__fdc__estimate.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/estimate.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 4827,
          "complete": true,
          "name": "patches/010-src__lib__fdc__match.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/match.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 2432,
          "complete": true,
          "name": "patches/011-src__lib__fdc__nutrients.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/nutrients.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1934,
          "complete": true,
          "name": "patches/012-src__lib__fdc__unavailable.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/fdc/unavailable.ts",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 2236,
          "complete": true,
          "name": "patches/013-src__lib__pipeline__persist.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/pipeline/persist.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 2736,
          "complete": true,
          "name": "patches/014-src__lib__pipeline__wording.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/pipeline/wording.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 826,
          "complete": true,
          "name": "patches/015-src__lib__queue__claim.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/queue/claim.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3070,
          "complete": true,
          "name": "patches/016-src__lib__worker__jobs__correct.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/worker/jobs/correct.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 2633,
          "complete": true,
          "name": "patches/017-src__lib__worker__jobs__recompute.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/worker/jobs/recompute.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3964,
          "complete": true,
          "name": "patches/018-supabase__migrations__0053_estimate_reader_rollout.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/migrations/0053_estimate_reader_rollout.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5614,
          "complete": true,
          "name": "patches/019-supabase__migrations__0054_unavailable_summary.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/migrations/0054_unavailable_summary.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1564,
          "complete": true,
          "name": "patches/020-supabase__migrations__0055_approximation_once.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/migrations/0055_approximation_once.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 886,
          "complete": true,
          "name": "patches/021-supabase__rollbacks__0053_estimate_reader_rollout.down.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/rollbacks/0053_estimate_reader_rollout.down.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5209,
          "complete": true,
          "name": "patches/022-supabase__rollbacks__0054_unavailable_summary.down.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/rollbacks/0054_unavailable_summary.down.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1230,
          "complete": true,
          "name": "patches/023-supabase__rollbacks__0055_approximation_once.down.sql.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "supabase/rollbacks/0055_approximation_once.down.sql",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5305,
          "complete": true,
          "name": "patches/024-tests__db__approximation-once.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/db/approximation-once.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 6669,
          "complete": true,
          "name": "patches/025-tests__db__estimate-reader-rollout.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/db/estimate-reader-rollout.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 6126,
          "complete": true,
          "name": "patches/026-tests__db__unavailable-summary.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/db/unavailable-summary.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3061,
          "complete": true,
          "name": "patches/027-tests__estimate-rollout-compatibility.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/estimate-rollout-compatibility.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 616,
          "complete": true,
          "name": "patches/028-tests__fake-meta__fixtures__spark-closest_food.json.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/fake-meta/fixtures/spark-closest_food.json",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1331,
          "complete": true,
          "name": "patches/029-tests__fake-meta__server.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/fake-meta/server.mjs",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 940,
          "complete": true,
          "name": "patches/030-tests__fdc-reference-search.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/fdc-reference-search.test.mjs",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5050,
          "complete": true,
          "name": "patches/031-tests__food-estimate.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/food-estimate.test.mjs",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3496,
          "complete": true,
          "name": "patches/032-tests__food-resolution-unavailable.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/food-resolution-unavailable.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1011,
          "complete": true,
          "name": "patches/033-tests__unavailable-reason.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/unavailable-reason.test.mjs",
      "status": "A"
    }
  ],
  "head": "223bf70eb7b682a1a06a7d6bdcf33c79b9d36212",
  "summary": "The pull request implements two coordinated capabilities: compact nutrition provenance storage (#573) and structured unavailable food reasons (#575). Review through runtime correctness, data/privacy requirements, and cross-PR integration shows no blockers:\n1. Runtime correctness: Dual-reader logic in storedEstimateFood correctly handles both legacy repeated approximation objects and compact single-label entries with per-nutrient per100 keys. The staged activation script scripts/activate-compact-nutrition.sql safely locks jobs and item_nutrition under ACCESS EXCLUSIVE NOWAIT, verifies zero running jobs, updates the format barrier, and fences legacy claims by replacing claim_owned_job() and claim_job(). Unavailable reasons ('not_food', 'no_match', 'no_estimate') are durably encoded on source_ref, formatted into user-facing copy without exposing unsanitized control characters, and refreshed atomically in post comments behind meal ownership locks.\n2. Privacy, data isolation, and authorization: Format table public.nutrition_provenance_format has RLS enabled, all privileges revoked from public, anon, and authenticated, and update operations forbidden to service_role. Stored procedures persist_approximated_analysis and refresh_owned_approximation_summary enforce meal ownership and job match checks under row locks, with execute privileges restricted to service_role. Model call traces record only authorized high-level metadata (queries, reasons, source references, timing) without image/audio bytes or credentials.\n3. Cross-PR integration: Backwards-compatible resolveFoodMatch export is retained alongside resolveFoodMatchDetailed. The claim worker explicitly supplies { p_reader_format: 2 } matching the 0053 migration overload. Comprehensive rollback scripts (down migrations and rollback-compact-nutrition.sql) allow safe reversion below the reader floor.",
  "verdict": "BLOCKERS: NONE"
}
```


## Supplementary Muse watch review

Source: https://github.com/aibraincoach/my-food-ai/pull/588#issuecomment-6631002701

<!-- watch-review -->
Watch review of head 223bf70eb7b682a1a06a7d6bdcf33c79b9d36212 by muse-spark-1.3, including migration 0054 (and 0055, also beyond the plan).

Verdict: zero blockers.

Earlier finding "the new estimate format and migration 0053 break workers still on the old code": FIXED at this head (read in code). 0053 only adds (overload claim_owned_job(integer,timestamptz), format table defaulting compact=false, normalizing trigger); the old no-arg claim path is untouched, writers default to the legacy format unless NUTRITION_COMPACT_WRITE=1 (src/lib/fdc/nutrients.ts), the reader is dual-format (src/lib/fdc/approximation-metadata.ts), activation fences legacy claims behind a zero-running-jobs lock plus reader floor, and tests/db/estimate-reader-rollout.test.mjs drives activation plus compact rollback plus 0053 removal against the frozen pre-rollout reader.

Non-blocking notes (read in code): deploy order matters, apply 0053 before deploying this code, since new claimJob passes p_reader_format and refresh_owned_approximation_summary is new (documented in the 0053 header; persist.ts keeps a missing-RPC fallback for the persist path). 0053 is not safe to run twice (plain CREATEs; a rerun errors loudly inside its transaction, no corruption). 0054 header references a "0052" that exists nowhere in the repo (comment-only). 0054-down exists but no test executes it (not verified). 0055 intentionally fails under a standard push until activation runs; scripts/test-stack.mjs already excludes it from bootstrap.

Other checks (read in code): unavailable source_refs flow through existing opaque-string consumers (Number() coercions degrade to null/0, unavailable rows have empty micronutrients so the legacy rescale path never triggers); same model-call count and RPC count per meal; all referenced RPCs exist in prior migrations.

Not checked: live migration run, real-provider estimate behavior, test-suite execution.
