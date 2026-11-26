# #1416 feedback reads shared across cards and the thread

Mounted meal cards now collect feedback ids for the next macrotask and make one owner-session `post_feedback` read per 50 ids. Duplicate ids share the request. Every waiter gets its own row or null. Dispatch deletes the pending map before reading; later ticks read again, including while an earlier query is in flight. There is no result cache or retry.

ThumbsFeedback keeps its revision, saving, stale-response and own-event guards. A batch error maps to its previous guarded null state. Thread uses the same reader; its existing error catch and accepted-revision check remain. This also deduplicates the same post requested by the thread and its card. The `(post_id,user_id)` primary key and owner RLS already ensure at most one visible row per post. Writes, routes and schema are unchanged.

## Local browser counts

Same fixture and instrument on application-identical main and the change, Chromium and WebKit, English and Japanese, 390×844. The first Home page has five meal cards and one sheet drink. The five meal cards have model-comment fixtures so feedback is enabled. The detail has a model comment and the inherent terminating empty timeline page. Each row below was observed in all four engine/locale cells.

| Screen / event | Feedback GETs before | After | All instrumented app reads before | After |
| --- | ---: | ---: | ---: | ---: |
| Home cold mount | 5 | 1 | 11 | 7 |
| Home tab return | 5 | 1 | 11 | 7 |
| Detail cold mount | 2 | 1 | 7 | 6 |
| Detail tab return | 2 | 1 | 7 | 6 |

The plan initially counted one detail reader; the baseline source and browser showed two: Thread and ThumbsFeedback, both on mount and return. The planner directed both through the shared reader. This is why detail also improves. Every non-feedback app-read multiset (path, method and select) is identical across base and head in all 16 comparisons.

The instrument counts browser fetches for REST, feed/intake reads and RSC, not server-render queries or elapsed performance. Next-Router-Prefetch rows are kept separately and the raw rows are retained: eight on the first detail mount, ten on the base Home mount and nine or ten on the head Home mount; zero on these returns. They are not silently filtered from the receipts. This is the existing #1411 prefetch behavior, not a new request from batching.

The served base was a4d3213b; its entire src tree is identical to main fc47a172 (the intervening changes are migration/tests/docs). These are local production builds and synthetic fixtures. The local Realtime transport is a stand-in; its connection notice is present on both versions. No claim about production, real phones or Realtime transport correctness is made.

## Contract checks

Unit/VM checks cover per-tick sharing, dedupe, 120 ids in three reads, per-waiter rows/null, a fresh later tick, rejection of all waiters and recovery in the next batch, stale revisions, own events without reads, guarded null on error without retry, and Thread's loadFailed/accepted checks. Five actual ThumbsFeedback effects share the real batch module on mount and return. Six mutants are caught: wrong chunk size, retaining the dispatched batch, ignoring query errors, accepting a stale thumbs response, hiding Thread's read error and accepting a wrong Thread fingerprint.

In each engine and locale, the browser also checks none, saving, up, down-own-event and handled save-error states. Save requests are intercepted locally, so no feedback DB rows are changed. Five added local model comments are removed afterwards. The initial count receipts without model comments and the interrupted runners are retained as such; final counts use the complete revision fixture.

The held #1392 rebase must preserve requestFeedback as the single read path in both components (planner R8.3 addendum). No held branch is modified here.
