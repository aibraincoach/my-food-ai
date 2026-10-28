import type { SupabaseClient } from "@supabase/supabase-js";

// Upload confirmed: release the post's parked analyze job now. Only a job that has never been claimed
// (attempts = 0) and is still queued is touched, so a repeated confirmation can never pull a retry's
// backoff forward and burn the job's three attempts early.
export async function releaseParkedAnalyze(admin: SupabaseClient, postId: string, now = new Date()): Promise<{ error: unknown }> {
  const { error } = await admin.from("jobs").update({ run_after: now.toISOString() })
    .eq("post_id", postId).eq("kind", "analyze").eq("status", "queued").eq("attempts", 0);
  return { error };
}
