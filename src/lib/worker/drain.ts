import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { claimJob, finishJob } from "@/lib/queue/claim";
import { releaseLease, renewLease } from "@/lib/queue/lease";
import { runJob } from "@/lib/worker/handlers";
import { isRetriable } from "@/lib/worker/errors";

const WORK_MS = 60_000;

export interface DrainStats {
  processed: number;
  failed: boolean;
}

// One job through the handler, with finish/retry/failed semantics.
export async function drainOnce(admin: SupabaseClient): Promise<DrainStats> {
  const job = await claimJob(admin);
  if (!job) return { processed: 0, failed: false };
  try {
    await runJob(admin, job);
    await finishJob(admin, job.id);
    return { processed: 1, failed: false };
  } catch (e) {
    // The database locks the running job and commits job/post failure together.
    // attempts was incremented by claim_job; the third retriable error is final.
    const { error, status } = await admin.rpc("fail_job", {
      p_job_id: job.id,
      p_message: e instanceof Error ? e.message : "worker error.",
      p_retriable: isRetriable(e),
    });
    if (error) throw ioError(`fail_job failed: ${error.message}`, error, status);
    return { processed: 1, failed: true };
  }
}

// Started in the background with after() by whichever request ticked the
// queue. Stops when the queue is empty or after 60 s of work, releases the
// lease, and re-ticks once if work remains so nothing stalls.
export async function runWorker(
  admin: SupabaseClient,
  holder: string,
  tickSelf?: () => Promise<void>
): Promise<void> {
  const startedAt = Date.now();
  try {
    const configured = Number(process.env.WORKER_CONCURRENCY ?? "1");
    const concurrency = Number.isSafeInteger(configured) && configured > 0 ? configured : 1;
    // Each lane claims through the same SKIP LOCKED RPC. Await every lane
    // before releasing the shared lease, including when another lane fails.
    const lanes = await Promise.allSettled(Array.from({ length: concurrency }, async () => {
      for (;;) {
        if (Date.now() - startedAt > WORK_MS) break;
        const { processed } = await drainOnce(admin);
        if (processed === 0) break;
        await renewLease(admin, holder).catch(() => {});
      }
    }));
    const failed = lanes.find((lane) => lane.status === "rejected");
    if (failed?.status === "rejected") throw failed.reason;
  } finally {
    await releaseLease(admin, holder).catch(() => {});
  }
  const { data: next, error, status } = await admin.rpc("next_worker_wake");
  if (error) throw ioError(`worker remaining jobs: ${error.message}`, error, status);
  if (next && tickSelf) {
    // after() awaits this timer and the self-request. Delay rather than spin
    // through new serverless invocations while the backoff is still pending.
    const delay = Math.max(0, new Date(next as string).getTime() - Date.now());
    await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(delay, 1000), 60_000)));
    await tickSelf();
  }
}
