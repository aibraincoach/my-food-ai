import type { SupabaseClient } from "@supabase/supabase-js";
import { tryAcquireLease } from "@/lib/queue/lease";

import { getTraffic, type Traffic } from "@/lib/queue/traffic";
export { trafficForDepth, type Traffic } from "@/lib/queue/traffic";

export interface TickStatus {
  queued: number;
  running: number;
  traffic: Traffic;
}

// Called from the posts/comments/items routes right after they enqueue, from
// GET /api/jobs/tick, and from the client shell on load and tab focus.
// Anyone may call it: it does nothing when nothing waits or a worker holds
// the lease. Returns started=true when the caller should run the worker
// (via after()) for this lease holder.
export async function queueTick(
  admin: SupabaseClient,
  holder: string,
  ttlSeconds = 300
): Promise<TickStatus & { started: boolean }> {
  const [queuedResult, runningResult, traffic] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "running"),
    getTraffic(admin),
  ]);
  if (queuedResult.error || runningResult.error) throw new Error("Queue depth could not be read.");
  const queued = queuedResult.count;
  const running = runningResult.count;
  const depth = queued ?? 0;
  if (depth === 0 && (running ?? 0) === 0) {
    return { queued: 0, running: running ?? 0, traffic, started: false };
  }
  const started = await tryAcquireLease(admin, holder, ttlSeconds);
  return { queued: depth, running: running ?? 0, traffic, started };
}
