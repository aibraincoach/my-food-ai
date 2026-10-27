import type { SupabaseClient } from "@supabase/supabase-js";
import { claimJob, failJob, finishJob } from "@/lib/queue/claim";
import { releaseLease, renewLease } from "@/lib/queue/lease";
import { handlers } from "@/lib/worker/handlers";

const WORK_MS = 60_000;

export interface DrainStats {
  processed: number;
  failed: boolean;
}

// One job through the handler, with finish/retry/failed semantics.
export async function drainOnce(admin: SupabaseClient): Promise<DrainStats> {
  const job = await claimJob(admin);
  if (!job) return { processed: 0, failed: false };
  const handler = handlers[job.kind];
  try {
    if (!handler) throw new Error(`no handler for job kind ${job.kind}.`);
    await handler(admin, job);
    await finishJob(admin, job.id);
    return { processed: 1, failed: false };
  } catch (e) {
    await failJob(admin, job, e instanceof Error ? e.message : "worker error.");
    return { processed: 1, failed: true };
  }
}

// Started in the background with after() by whichever request ticked the
// queue. Stops when the queue is empty or after 60 s of work, releases the
// lease, and re-ticks once if work remains so nothing stalls.
export async function runWorker(
  admin: SupabaseClient,
  holder: string,
  tickSelf?: () => void
): Promise<void> {
  const startedAt = Date.now();
  try {
    for (;;) {
      if (Date.now() - startedAt > WORK_MS) break;
      const { processed } = await drainOnce(admin);
      if (processed === 0) break;
      await renewLease(admin, holder).catch(() => {});
    }
  } finally {
    await releaseLease(admin, holder).catch(() => {});
  }
  let remaining = 0;
  try {
    const { count } = await admin
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "queued");
    remaining = count ?? 0;
  } catch {
    remaining = 0;
  }
  if (remaining > 0) tickSelf?.();
}
