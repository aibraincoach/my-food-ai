import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

// Shared enqueue helper for the posts/comments/items routes: one jobs row,
// kind analyze/correct/recompute, priority 100 unless stated.
export async function enqueueJob(
  admin: SupabaseClient,
  postId: string,
  kind: "analyze" | "correct" | "recompute" | "card_backfill" | "remainder",
  priority = 100
): Promise<string> {
  const { data, error, status } = await admin
    .from("jobs")
    .insert({ post_id: postId, kind, priority, status: "queued" })
    .select("id")
    .single();
  if (error || !data) throw ioError(error?.message ?? "enqueue failed.", error, status);
  return data.id as string;
}
