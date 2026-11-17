import type { SupabaseClient } from "@supabase/supabase-js";
import { tryAcquireLease } from "@/lib/queue/lease";

import { countDueQueued, getTraffic, type Traffic } from "@/lib/queue/traffic";
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
    countDueQueued(admin),
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

let retickPending = false;

// queueTick found due work while another holder has the lease. A healthy holder claims that work
// itself, but a holder that died never releases, and this tick can be the only wake the job gets
// (the post route ticks once; a stack without the minute database wake has nothing else). So the
// caller looks again once that lease can have expired. One pending look per server instance.
export async function retickWhenBlocked(
  admin: SupabaseClient,
  status: { queued: number; started: boolean },
  tickSelf: () => Promise<unknown>,
  ttlSeconds: number
): Promise<boolean> {
  if (status.started || status.queued === 0 || retickPending) return false;
  retickPending = true;
  try {
    const { data } = await admin.from("worker_lease").select("expires_at").eq("id", 1).maybeSingle();
    const expiresAt = data?.expires_at ? Date.parse(data.expires_at as string) : Date.now();
    const wait = Math.min(Math.max(expiresAt - Date.now(), 0), ttlSeconds * 1000) + 1000;
    await new Promise((resolve) => setTimeout(resolve, wait));
  } catch {
    // An unreadable lease still gets its second look, straight away.
  } finally { retickPending = false; }
  await tickSelf();
  return true;
}
