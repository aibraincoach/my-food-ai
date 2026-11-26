# Profile refresh proof (#1427)

An unchanged Profile open re-rendered its server page immediately: the shared readiness listener refreshed after its initial pending-status seed. Each render called getProfileGrid and signed every photo again. An unchanged return refreshed immediately and again after the seed. The same complete grid appears on About.

Profile and About now declare a complete status listing with `data-lists-all`. Their existing grid query also returns created_at, and cells expose id, status and created time. An empty About grid declares the same capability without adding visible layout. The existing discovery query selects created_at, excludes soft-deleted rows and orders by created_at then id, descending. No new data query, migration, signed-URL cache or fallback was added.

The pure staleView comparison refreshes a complete view when a read status differs, a successful all-pending seed omits a rendered queued/processing post, a discovered post is not rendered, or a rendered post is missing within the discovery window. The window uses the exact created_at/id tuple; rows tied in time below its id cutoff are not falsely deleted. Failed reads make no absence inference. Deletion inference is bounded by the latest-20 window (or every rendered row when fewer than 20 are returned).

Seed/discovery completions coalesce a refresh for the same rendered snapshot. A later explicit tab return can reconcile again. If a streamed listing marker has not arrived and the document is loading, the initial decision waits for load once; its listener is removed on unmount. Existing live events, account fencing and pending reconciliation remain.

**Scope:** this rule applies only to the complete Profile/About grid. Days renders pending counts rather than pending post rows, so its existing mount/return/subscription reconciliation stays intact; Home remains unchanged. No Days row attributes or reader change. **Accepted freshness tradeoff:** a tab return alone no longer detects caption, photo or nutrition edits. Edits not delivered by existing live updates appear on the next navigation. Status transitions and new posts remain reconciled, including pending settlements older than the discovery window.

## Counts against merged main c8dbbbd1

Both builds include #1426 lazy images. This is not a comparison to its earlier eager-image baseline. Chromium and WebKit, en and ja, fresh contexts at 390x844 DPR 3. The observation reaches the first grid image and verifies visible images loaded. Native HTTP caching remains enabled: no Playwright HTTP route is used for this matrix. A fetch guard blocks prefetches, queue wakes and writes equally. Signing batches each contain 94 paths; lazy loading downloads only nearby thumbnails.

| Profile | Signing on open, base → head | Signing on unchanged return | Image GETs on open | Response-body bytes on open | Additional GETs on return |
| --- | --- | --- | ---: | ---: | ---: |
| Chromium en, ja | 2 → 1 | 2 → 0 | 152 → 82 | 9,873,920 → 5,326,720 | 82 → 0 |
| WebKit en | 2 → 1 | 2 → 0 | 47 → 25 | 3,053,120 → 1,624,000 | 25 → 0 |
| WebKit ja | 2 → 1 | 2 → 0 | 44 → 25 | 2,858,240 → 1,624,000 | 25 → 0 |

Profile has zero post-mount and unchanged-return RSC refreshes on the head (base: one and two). Each head image URL is downloaded once. All photos remain signed feed JPEGs; no public-copy resize or original fallback was added. These are synthetic fixture body bytes, not production savings or a real-photo distribution.

About likewise has one signing batch on open, none on return and no unchanged RSC refresh. Its image GETs are 155 → 88 in Chromium and 47 → 34 in WebKit; additional return downloads are 88 → 0 and 34 → 0 respectively. Home remains zero mount/return refreshes; Days remains one mount and two additional return refreshes. All 16 paired screen comparisons have identical browser data-request multisets; the same queries are used, with the accepted extra created_at field/filter/order. No failed image response or page exception. Real phones and production Realtime transport are unproved.

## Real browser timing and streaming

The gap proof runs in both engines over the same local 1.6 Mbps/150 ms shared proxy. It holds the actual browser's existing pending/discovery requests and the real Supabase SDK's Realtime join acknowledgment, verifies the processing state was rendered, changes the owned disposable post to ready in the database, then releases the reads and acknowledgment. The SDK uses a local simulated acknowledgment because the disposable gateway has no production Realtime transport. This proves the browser/SDK timing and DB reconciliation, not a deployed WebSocket service.

Both engines pass all four scenarios:

- A rendered processing post older than the latest 20 settles while held: exactly one Profile refresh and ready shown.
- A latest-window processing post settles with the pending seed deliberately failed: exactly one, proving the status comparison independently of the missing-pending inference.
- A new post is inserted after rendering while discovery is held: exactly one and the new post appears.
- Days retains its original reconciliation and shows the now-ready day's total (two refreshes in this controlled subscription sequence).

For streaming, a diagnostic-only 5 s delay on the server's grid fetch forces browser reads to complete before the grid marker arrives. Under the same throttle, cold Chromium and WebKit each show one signing batch, no post-mount refresh and no duplicate image URL. The marker arrives around 5.2 s; the read and load times are retained. This is a correctness test, not an LCP benchmark.

## Faults, validation and evidence

Seven isolated unit mutants are caught: always false; ignore status; ignore missing-pending settlement; ignore new post; ignore deletion; decide before load; remove same-view coalescing. The intended assertions fail, including tuple-bound deletion and failed-seed coverage.

Ten browser-level fault checks (five throwaway builds, both engines) fail on the intended observation: always-false, ignore-status and ignore-pending-gap leave the post processing with zero refreshes; ignore-new leaves the inserted post absent; decide-before-load restores two signing batches. Successful underlying reads and DB-change timing are retained. Mutations were never committed or used as the product build; the separate fault worktree was restored afterward. Seven unit mutants also pass their intended negative controls, including deletion and coalescing. Exact source pins are in the private receipt.

Validation: production build/TypeScript, scoped lint (zero errors; one existing unused test import warning), 22 focused tests and the root suite. Root: 1,790 tests, 1,721 pass, 24 skip, 45 failures, identical names to the retained main baseline, zero head-only or baseline-only failures; the baseline has the same product except #1426's three img attributes. No USDA, model-provider or production data call was made for #1427.

Private evidence: `state/build/1427-profile-duplicate/TRACE.md`, `COUNTS-COMPARISON.json`, per-build/engine/locale JSON/screenshots, `GAP-RUNS.json`, per-case gap traces, `COLD-CONTROL-RUNS.json`, cold traces, `UNIT-MUTANTS.json`, `NATIVE-FAULTS.json`, `ROOT-COMPARISON.json`, `FOCUSED.tap`, build/lint logs and cleanup receipts. Initial invalid instruments are retained: a forwarded-route API call was refused by the local proxy, and a response-status getter was called incorrectly. Corrected native requests return 200 and the successful controls are separate; neither invalid run counts as product evidence. An earlier root run was interrupted when the load-decision source changed; the final suite above uses the final product source.

## Primary-review test delta

The primary review cleared product source at 288101fb but found a surviving read-driven-settle mutant. The added subscription-gap test starts with a tracked processing post, changes the read response to ready before the subscription acknowledgment, and verifies that the tracked-ID reconciliation actually ran. A complete list already rendering ready gets zero refreshes; a stale processing rendering gets exactly one, coalesced with the seed decision. The query stub now returns tracked-ID rows by its requested IDs rather than the mutable pending-seed fixture. Product source is unchanged. The formerly surviving unconditional-refresh mutant fails the new assertion (one refresh instead of zero). Green and red receipts are RECONNECT-GREEN.tap and RECONNECT-MUTANT-RED.tap; an initial isolated mutant run missing its tab-return fixture is retained separately and is not counted as a kill.
