# PR #587: current-head review receipt

Observed2026-11-04T13:49:06Z. Head `2195a5cd4c5d6b66d81b33c3eb710fb2c95c498f`; stateOPEN; draftFalse; mergeabilityMERGEABLE. Vercel and Vercel Preview Comments report SUCCESS at this head. Receipt source: https://github.com/aibraincoach/my-food-ai/pull/587#issuecomment-6630905849. Public comment text follows; no new review was run for packaging.

AGY receipt — head `2195a5cd4c5d6b66d81b33c3eb710fb2c95c498f`, base `376e3306942161a5e659e8d99c85154c8ac26a35`, PR #587.

Invocation: `agy --model gemini-3.8-flash-high --effort high --sandbox --dangerously-skip-permissions --disable-slash-commands --output-format json --json-schema /home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-2195a5c/schema.json --print-timeout 10m --print` (prompt omitted), cwd `/home/opc/Projects/my-food-ai-wt/run15-core/uploads/run15/reviews/agy-2195a5c`, started 2026-11-04T12:33:09.934Z, finished 2026-11-04T12:41:45.936Z, agy exit 0.
Delivery: 20 changed paths as 20 on-disk patch parts (≤ 40000 bytes each), read via view_file only; deletions carry full removed content.

Completeness check: PASS — 20/20 paths, 20/20 parts complete, all via view_file.

Verdict: **BLOCKERS: NONE**
Tool exit code: 0 (0 clean, 2 coverage gap, 3 blockers found, 4 agy failure).

| # | path | status | parts | reported bytes | complete |
| --- | --- | --- | --- | --- | --- |
| 1 | scripts/run15-b-production.mjs | A | 1 | 15226 | yes |
| 2 | src/app/api/posts/[id]/media/route.ts | M | 1 | 1636 | yes |
| 3 | src/app/api/saved/route.ts | M | 1 | 1713 | yes |
| 4 | src/components/CaptureSheet.tsx | M | 1 | 1678 | yes |
| 5 | src/components/Feed.tsx | M | 1 | 1762 | yes |
| 6 | src/components/OutlineOverlay.tsx | M | 1 | 1088 | yes |
| 7 | src/components/PostActions.tsx | M | 1 | 5018 | yes |
| 8 | src/components/PostCard.tsx | M | 1 | 1530 | yes |
| 9 | src/components/PostDetail.tsx | M | 1 | 1484 | yes |
| 10 | src/components/PostDetailHeader.tsx | M | 1 | 1974 | yes |
| 11 | src/components/PostMenu.tsx | M | 1 | 2318 | yes |
| 12 | src/components/UploadChip.tsx | M | 1 | 5299 | yes |
| 13 | src/lib/posts/attach-photo.ts | M | 1 | 3272 | yes |
| 14 | src/lib/posts/saved.ts | M | 1 | 1003 | yes |
| 15 | src/lib/posts/upload-manager.ts | M | 1 | 9605 | yes |
| 16 | src/lib/posts/upload-store.ts | M | 1 | 600 | yes |
| 17 | tests/attachment-stage-expiry.test.mjs | A | 1 | 3039 | yes |
| 18 | tests/db/saved-meal-not-ready.test.mjs | A | 1 | 1898 | yes |
| 19 | tests/save-meal-readiness.test.mjs | A | 1 | 6238 | yes |
| 20 | tests/upload-guard.test.mjs | M | 1 | 7709 | yes |

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
          "bytes_read": 15226,
          "complete": true,
          "name": "patches/001-scripts__run15-b-production.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "scripts/run15-b-production.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1636,
          "complete": true,
          "name": "patches/002-src__app__api__posts__id__media__route.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/app/api/posts/[id]/media/route.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1713,
          "complete": true,
          "name": "patches/003-src__app__api__saved__route.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/app/api/saved/route.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1678,
          "complete": true,
          "name": "patches/004-src__components__CaptureSheet.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/CaptureSheet.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1762,
          "complete": true,
          "name": "patches/005-src__components__Feed.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/Feed.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1088,
          "complete": true,
          "name": "patches/006-src__components__OutlineOverlay.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/OutlineOverlay.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5018,
          "complete": true,
          "name": "patches/007-src__components__PostActions.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostActions.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1530,
          "complete": true,
          "name": "patches/008-src__components__PostCard.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostCard.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1484,
          "complete": true,
          "name": "patches/009-src__components__PostDetail.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostDetail.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1974,
          "complete": true,
          "name": "patches/010-src__components__PostDetailHeader.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostDetailHeader.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 2318,
          "complete": true,
          "name": "patches/011-src__components__PostMenu.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/PostMenu.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 5299,
          "complete": true,
          "name": "patches/012-src__components__UploadChip.tsx.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/components/UploadChip.tsx",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3272,
          "complete": true,
          "name": "patches/013-src__lib__posts__attach-photo.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/attach-photo.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1003,
          "complete": true,
          "name": "patches/014-src__lib__posts__saved.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/saved.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 9605,
          "complete": true,
          "name": "patches/015-src__lib__posts__upload-manager.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/upload-manager.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 600,
          "complete": true,
          "name": "patches/016-src__lib__posts__upload-store.ts.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "src/lib/posts/upload-store.ts",
      "status": "M"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 3039,
          "complete": true,
          "name": "patches/017-tests__attachment-stage-expiry.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/attachment-stage-expiry.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 1898,
          "complete": true,
          "name": "patches/018-tests__db__saved-meal-not-ready.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/db/saved-meal-not-ready.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 6238,
          "complete": true,
          "name": "patches/019-tests__save-meal-readiness.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/save-meal-readiness.test.mjs",
      "status": "A"
    },
    {
      "findings": [],
      "parts": [
        {
          "bytes_read": 7709,
          "complete": true,
          "name": "patches/020-tests__upload-guard.test.mjs.part1.patch",
          "read_method": "view_file"
        }
      ],
      "path": "tests/upload-guard.test.mjs",
      "status": "M"
    }
  ],
  "head": "2195a5cd4c5d6b66d81b33c3eb710fb2c95c498f",
  "summary": "Pull request #587 introduces background photo attachment for existing posts and reinforces meal save readiness constraints across UI and backend surfaces. In CaptureSheet, photo attachment now delegates to UploadManager.postAttachment, keeping the photo durable on the device and allowing the capture sheet to close immediately while upload and attachment proceed in the background. In upload-manager, attachment stage expiry is handled by catching 409 attachment_stage_expired and regenerating stages with renewal retry logic. UploadChip displays progress and navigation for background attachments without ghosting in the Feed cards. Save meal readiness is enforced across PostActions, PostCard, PostDetailHeader, OutlineOverlay, and PostDetail, disabling and dimming save controls when analysis is not ready while preserving unsave capability for already-saved meals. The backend returns 409 when attempting to save an unready meal. All data and privacy requirements, owner isolation checks, and cross-PR integration points are properly maintained with comprehensive test coverage. No blockers found.",
  "verdict": "BLOCKERS: NONE"
}
```


## Supplementary Muse watch review

Source: https://github.com/aibraincoach/my-food-ai/pull/587#issuecomment-6630999433

<!-- watch-review -->
Watch review of head 2195a5cd4c5d6b66d81b33c3eb710fb2c95c498f by muse-spark-1.3.

Verdict: zero blockers.

Scope: title says attach leftovers photos durably in the background. The attachment pipeline (postAttachment/submitAttachment, media route 409 mapping, Feed/UploadChip filtering, expiry renewal) serves that. Bundled beyond the title is a second fix, save-readiness gating across PostActions/PostCard/PostMenu/PostDetail/PostDetailHeader/OutlineOverlay plus the saved route 409 mapping; it works correctly (disabled save/unsave-gated controls, server RPC already required ready since migration 0026, all three save-meal dispatch sites covered) so this is a non-blocking scope note, not a blocker (read in code).

Earlier finding "an expired upload stage is never re-uploaded": FIXED at this head (read in code). The server proves expiry with attachment_stage_expired (supabase/migrations/0027_not_eaten.sql:186, 0028:128), attach-photo reconciles under the completion locks before allowing renewal (src/lib/posts/attach-photo.ts), and the client clears only server-proven-expired stages before preparing a fresh one (src/lib/posts/upload-manager.ts submitAttachment). A lost response keeps the original stage path and the server deduplicates by stage path.

Earlier finding "a failed local save can queue the same photo twice": FIXED at this head (read in code). postAttachment persist failure now removes the operation so only the sheet owns the retry, and retry() flags rerun instead of spawning a concurrent run (src/lib/posts/upload-manager.ts).

Other checks (read in code): media attach route keeps the RLS read plus user-id stage-path check (no cross-account path); per-request failure handling with no persistent disable flag; attachment completion refreshes the card and day totals through the existing post-created path; no migration; small extra lease read per attach.

Not checked: on-device background upload behavior, production RPC timing, execution of the run15-b browser script or the test suite.
