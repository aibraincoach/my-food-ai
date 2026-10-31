# Durable worker wake

Migration 0024 adds a once-per-minute database wake using pg_cron and pg_net. The existing tick route owns the worker lease, so overlapping timer, upload and self-handoff requests still produce one worker. Runtime concurrency is fixed at one, including when an older deployment setting requests more lanes.

The schedule is dormant until its deployment origin is configured. After the authorized migration and matching code merge, configure the current HTTPS application origin through the service-only `configure_worker_wake` RPC. The caller supplies deployment configuration; neither an origin nor a credential is committed here. Reconfiguration replaces the singleton target. Removing that configuration row disables network wakes without discarding queued jobs.

The scheduled function calls `next_worker_wake`, which accounts for retry times, stale running owners and the lease expiry. It sends a request only when that time is due. Future upload-cleanup jobs do not keep the serverless worker awake. The normal upload kickoff and bounded self-handoff remain in place for prompt processing; losing either no longer removes the independent scheduled wake.

Migration 0024 was applied on production on 2026-10-31 in one psql transaction and #239 merged. At the handover cutoff the configuration table contains zero rows, so the schedule is dormant. Activation and the twenty-post drain have not run while the incomplete matching decision awaits the separately authorized #246 fix. Production acceptance remains twenty posts reaching ready with no manual tick and no browser focus wake. A successful local scheduler test is not evidence that production drained.
