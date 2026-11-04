# Late historical production shell reproduction (P1)

Observed 2026-11-04T09:23:41.665Z–2026-11-04T09:23:50.558Z. This was performed **after Fleet 14 had already shipped**, against the earlier immutable production deployment `dpl_2CxQa5FWdy2GPTuZ2cqTZxcVm9nD`, not against the current alias. A fresh Vercel deployment API read confirmed its URL and source `299f13a49af5320cb81d4cdf4e9de14263214a96` before the run. It is a late historical reproduction, not an original before-time observation or proof of the cause of the owner's earlier screenshot.

Native Chromium on port 18800 was used through CDP in a newly created isolated browser context at 1280 × 800. Existing tabs were never listed, read or driven. A separate designated test account 2 session was used, without global sign-out. Before the observations, the driver verified a controlling activated worker, the actual cached `/shell`, and an active, unlocked media-cache session through its natural cache state; it did not fabricate that state.

| Configured latency on page and worker | `data-shell` | Main width | Today |
| --- | --- | --- | --- |
| 2500 ms | Present | 1025 px | Absent |
| 0 ms | Absent | 500 px | Present |

Both navigations used ordinary `/` without a query bypass. Both document responses passed through the service worker; the zero-latency document was the network Home forwarded by that worker. Under the controlled 2500 ms delay, the old worker's timeout selected the old shell, whose layout differed from Home. The zero-latency navigation returned the 500 px Home layout with Today. This single paired observation supports that historical mechanism; it is not a latency benchmark or a statement about the owner's original browser.

The immutable deployment is protected. The existing permanent bypass secret was added through Fetch interception **only to requests for that app origin**, including its worker's credential-omitting shell-install requests. It was not added to Supabase requests, copied into this receipt, revoked or removed. App write/server-action requests were blocked, and the tick response was stubbed to avoid waking production work. Those read-only driver adaptations did not change deployed source or the measured layout code. No image file was stored.

The first bounded attempt failed during worker setup with `Worker setup: Inspected target navigated or closed` and its context was disposed. The second and final attempt captured the observations above; it accepted the page and worker network commands and disposed its own context afterward. Native browser 18800 and the permanent bypass access remain available.

[Numeric receipt and bounded-attempt provenance](https://github.com/aibraincoach/my-food-ai/blob/eeba864c8e54c562f9a76cf90872187d172564ab/docs/evidence/run14/historical-shell-reproduction.json). [The separately observed current Fleet 14 production layout](production-desktop-geometry.md).
