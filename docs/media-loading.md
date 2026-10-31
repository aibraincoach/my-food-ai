# Media-loading measurement

Read-only investigation on 2026-10-31 used the first configured test account's licensed evaluation image. No post, upload, job retry or analysis was created. Credentials and signed URLs stayed in memory.

The existing feed requests the `.feed.jpg` derivative rather than the original. For the sampled derivative, two independently signed URLs 1.1 seconds apart differed even though both returned the same 152,193 bytes with HTTP 200. Signing took 151 ms and 54 ms; the subsequent image requests took 331 ms and 94 ms from this server. The GET responses did not include a Cache-Control header. These are server observations, not phone or mobile-data timings.

That URL churn prevents a consistent browser cache key across refreshes. A bounded in-process cache now retains each successful owner/path read capability for five minutes, inside its one-hour storage signature lifetime. Calls first read the owned media/post through the session's RLS queries; cache keys include the actual owner and immutable object path. A mismatched owner path is rejected, failures are not cached, and concurrent requests share signing work. A correction's new immutable path has its own entry. The original image and detail-resolution path are unchanged.

A read-only run of the changed service on the same derivative took 234.86 ms to sign initially and 0.03 ms for the repeated read, returning the same URL. This demonstrates the removed signing request and stable key inside a warm instance; it does not prove an improvement across separate cold serverless instances or the complete feed.

A separate native Chrome probe at 390x844, emulating 1.6 Mbit/s downstream, 0.75 Mbit/s upstream and 150 ms latency, was inconclusive: its browser navigation reached sign-in despite the helper session working in a direct authenticated HTTP read. No decoded-image or first-picture result is claimed from that probe. Its request interceptor blocked job ticks and non-read requests.

Still required before closing #222: a successful authenticated cold/warm page measurement, before/after decoded first-image time and transferred bytes under the same network profile, and the first feed photo within two seconds on a real phone over mobile data. Real-device acceptance remains unproven.
