Reviewer: Gemini 4 Hydrogen via Perplexity (PPLX); version reviewed: 0ea7acbddbc199137b2563abeec85a5d5b86070e
Head reviewed: 0ea7acbddbc199137b2563abeec85a5d5b86070e
Model proof: model_preference = gemini4hydrogen; picker = Gemini 4 Hydrogen; completed answer footer = Gemini 4 Hydrogen
Thread: https://www.perplexity.ai/session/750e5b3b-b559-47a5-8a9b-ca0c139d50b2
Prompt submitted: code review https://github.com/aibraincoach/my-food-ai/pull/921
Completion re-inspected: 2026-11-15T13:58:47.330906+00:00; answer Copy/Helpful controls present; Stop response absent.
Evidence note: complete recapture of the same live thread supersedes the runner's earlier truncated capture; no resubmission.

Answer
Links
Images
Share
6:54 AM

code review 
 aibraincoach/my-food-ai#921

Finished
15s

PR #921 (fix21/test-repairs) is a clean, well-scoped set of test repairs paired with one targeted product fix in OutlineOverlay.tsx and a minor copy update. The changes are safe to merge once CI checks and the required visual check pass.

Product Changes (OutlineOverlay.tsx)

Stale sharp-image state fix: DetailImage now stores loaded as { of: string; url: string } | null and derives originalUrl only when loaded.of === photo.url. This prevents a previously loaded sharp image from flashing when photo.url changes while the component stays mounted, without needing an extra useEffect reset.

Copy update: The needs_input status text changes from "A question about this meal" to "A quick question about your meal".

Test Repairs

Timer & VM stub updates (card-polling, desktop-review, feed-removal, feed-unavailable-retry, needs-input-batch): Replaced setInterval/clearInterval mocks with setTimeout/clearTimeout and added missing document/window event listener and AbortSignal stubs to match the components' current timer and visibility handling.

Polling & response assertions (card-polling, desktop-review): Updated card-polling.test.mjs to assert the 2-second initial poll followed by backed-off polling (6–12 reads over 120s), and updated desktop-review.test.mjs to match the flattened { date } response shape.

Missing module stubs (feed-cache-lifecycle, feed-removal): Added stubs for @/lib/posts/home-today and @/lib/posts/upload-target.

Locale, range, and prop updates (local-time, servings-sql, sharp-image-identity): Updated local-time.test.mjs regexes to accept both AM/PM and a.m./p.m., changed the out-of-range serving size in servings-sql.test.mjs from 0.1 to 0.05, and passed sharp: true in sharp-image-identity.test.mjs.

DB test fixes (tests/db/today-summary, tests/db/user-cap): Removed duplicate revoke/drop cleanup statements after ${rollback} in today-summary.test.mjs, and removed the /api/posts row from user-cap.test.mjs since that route validates the body (400) before checking the meal cap.

Minor Observations

setTimeout return value in tests/feed-removal.test.mjs: The mock returns 0 for non-1000ms timers (discoverTick = fn; return 0;). Because 0 is falsy, any future code checking if (timerId) before calling clearTimeout would skip cleanup; returning a non-zero ID (e.g., 1) is safer.

Explain the timer mock fix in discoverTick
Check the security implications of this PR
Draft a polite review comment for OutlineOverlay
Summarize potential edge cases for these tests
Show me how to run these tests locally
⠙
You're incognito.
Exit incognito




Ask a follow-up
Search
Computer
Gemini 4 Hydrogen
