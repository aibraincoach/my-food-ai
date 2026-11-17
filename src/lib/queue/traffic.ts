import type { SupabaseClient } from "@supabase/supabase-js";

export type Traffic = "low" | "medium" | "high";
export function trafficForDepth(depth: number): Traffic {
  return depth < 10 ? "low" : depth <= 50 ? "medium" : "high";
}

// The one rule for waiting work: queued and due. A job that is not due yet (a photo-stage cleanup
// runs three hours later) is not waiting. The tick's wake decision and the traffic label both read this.
export function countDueQueued(admin: SupabaseClient) {
  return admin.from("jobs").select("id", { count: "exact", head: true }).lte("run_after", new Date().toISOString()).eq("status", "queued");
}

const CACHE_MS = 60_000;
let cached: { depth: number; at: number } | undefined;
let pending: Promise<number> | undefined;

// Shared by concurrent ticks in this server instance. Failed reads never
// replace a known value or get presented as an empty queue.
export async function getTraffic(admin: SupabaseClient): Promise<Traffic> {
  if (cached && Date.now() - cached.at < CACHE_MS) return trafficForDepth(cached.depth);
  if (!pending) {
    pending = (async () => {
      const { count, error } = await countDueQueued(admin);
      if (error || count === null) throw new Error("Queue traffic could not be read.");
      cached = { depth: count, at: Date.now() };
      return count;
    })().finally(() => { pending = undefined; });
  }
  return trafficForDepth(await pending);
}
