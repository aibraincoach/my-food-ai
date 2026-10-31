import { traceContext } from "@/lib/trace/context";
import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { claimJob, finishJob } from "@/lib/queue/claim";
import { releaseLease, renewLease } from "@/lib/queue/lease";
import { jobHandlers, runJob, type JobHandlers } from "@/lib/worker/handlers";
import { isRetriable } from "@/lib/worker/errors";
import { workerConcurrency } from "@/lib/worker/concurrency";

import { WORKER_PROCESSING_MS, HANDOFF_REQUEST_MS, workerHandoffDelay } from "./budget";

const WORK_MS = 60_000;

export interface DrainStats {
  processed: number;
  failed: boolean;
}

// One job through the handler, with finish/retry/failed semantics.
export async function drainOnce(admin: SupabaseClient, handlers: JobHandlers = jobHandlers): Promise<DrainStats> {
  const job = await claimJob(admin);
  if (!job) return { processed: 0, failed: false };
  try {
    await traceContext.run({ ...traceContext.getStore(), postId: job.post_id }, () => runJob(admin, job, handlers));
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
    const concurrency = workerConcurrency(process.env.WORKER_CONCURRENCY);
    // Each lane claims through the same SKIP LOCKED RPC. Await every lane
    // before releasing the shared lease, including when another lane fails.
    const lanes = await traceContext.run({ postId: null, deadlineAt: startedAt + WORKER_PROCESSING_MS }, () => Promise.allSettled(Array.from({ length: concurrency }, async () => {
      for (;;) {
        if (Date.now() - startedAt > WORK_MS) break;
        const { processed } = await drainOnce(admin);
        if (processed === 0) break;
        await renewLease(admin, holder).catch(() => {});
      }
    })));
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
    const delay = workerHandoffDelay(new Date(next as string).getTime(), startedAt);
    if (delay === null) return;
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (Date.now() + HANDOFF_REQUEST_MS > startedAt + WORKER_PROCESSING_MS) return;
    await tickSelf();
  }
}
