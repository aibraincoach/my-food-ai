import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getQueueStats(admin: SupabaseClient, now = new Date()) {
  const hourAgo = new Date(now.getTime() - 60 * 60_000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60_000);
  const [depth, oldest, failures, errors, posts] = await Promise.all([
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
    admin.from("jobs").select("created_at").eq("status", "queued").order("created_at").limit(1).maybeSingle(),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "error").gte("finished_at", dayAgo.toISOString()).lte("finished_at", now.toISOString()),
    admin.from("jobs").select("id,error,started_at,finished_at").not("error", "is", null).order("started_at", { ascending: false, nullsFirst: false }).order("id").limit(10),
    admin.from("posts").select("id,created_at").order("created_at", { ascending: false }).order("id").limit(20),
  ]);
  if ([depth, oldest, failures, errors, posts].some((result) => result.error)) throw new Error("Queue statistics could not be read.");
  const perMinute = Array.from({ length: 60 }, (_, i) => ({
    from: new Date(hourAgo.getTime() + i * 60_000).toISOString(), count: 0,
  }));
  // Pagination avoids silently truncating the hour at PostgREST's row limit.
  for (let offset = 0; ; offset += 1000) {
    const result = await admin.from("jobs").select("id,finished_at").eq("status", "finished")
      .gte("finished_at", hourAgo.toISOString()).lt("finished_at", now.toISOString())
      .order("finished_at").order("id").range(offset, offset + 999);
    if (result.error) throw new Error("Completed jobs could not be read.");
    const rows = result.data ?? [];
    for (const row of rows) {
      const index = Math.floor((new Date(row.finished_at).getTime() - hourAgo.getTime()) / 60_000);
      if (index >= 0 && index < perMinute.length) perMinute[index].count++;
    }
    if (rows.length < 1000) break;
  }
  return {
    depth: depth.count ?? 0,
    oldestAgeSeconds: oldest.data ? Math.max(0, Math.floor((now.getTime() - new Date(oldest.data.created_at).getTime()) / 1000)) : null,
    failures: failures.count ?? 0,
    perMinute,
    errors: errors.data ?? [],
    posts: posts.data ?? [],
  };
}
