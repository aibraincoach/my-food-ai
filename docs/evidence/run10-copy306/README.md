# Durable copy proof — phone only

Addresses the Log again / Saved Log now part of #306. This is not a claim that all #306 controls or #217 owner-phone acceptance are complete. No desktop or Round 6 work belongs here.

Before: actual production designated account 2, 2026-11-03 11:25 UTC. Its Log again POST was intercepted before dispatch and then aborted; the sheet remained with only Posting… until failure. No source post was changed. This still is UI-state evidence, not a matched latency benchmark.

After: actual locally built phone page and real local HTTP/Postgres/Storage stack, 2026-11-03 12:35–12:36 UTC, Chrome for Testing 156 ARM, 390×844, CPU 4×, Fast 4G tuple (1,012,500 B/s down, 168,750 B/s up, 165 ms latency). Service workers were blocked only for these controlled network probes; normal PWA/performance acceptance remains separate. Functional actions wait for registered client handlers, not merely SSR button markup. Explicit local nutrition/intake fixtures were used; no model response was fabricated and no model call was made. Their nutrition values are test data, not meal-estimation accuracy evidence.

- Log again and Saved Log now each show a new pending feed entry while the POST is held **before backend dispatch**. The operation has been written locally, but the server receipt is verified absent. Release commits one real copy; its real ID is visible after reload.
- Abort all three attempts before backend dispatch: the UI says it could not confirm the save, the completed state is not asserted, no server copy exists, and the selection survives reload. Explicit retry retains the operation ID and acknowledges one real copy.
- Let the real backend commit, then discard each of three responses: one receipt/copy exists. Remove pending post sends durable cancellation, soft-deletes the unacknowledged copy, leaves a tombstone and removes it from the UI after reload. Saved last-logged bookkeeping returns to its prior value; a later successful log is never overwritten.

`phone-proof.json` records those assertions; images are actual page captures. `cleanup.json` verifies all five local posts, four receipts and one snapshot removed and original preferences restored. Initial setup/driver attempts and the unavailable 59996 Storage gateway are not passing evidence; their owned fixture rows were separately cleaned before this run.

Other validation: seven copy queue tests plus seven existing food/label queue tests; real transactional DB regression including source hard deletion, authoritative sheet intake, owner rejection, payload conflicts, cancellation-before-publication, lost-response retry, rollback and legacy compatibility; actual HTTP concurrent duplicate/cancel race and legacy-client tests. The server receipt never uses client nutrition or treats a local operation ID as a published post ID.
