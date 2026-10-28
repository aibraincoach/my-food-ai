import type { SupabaseClient } from "@supabase/supabase-js";

export type RetryResult = "queued" | "conflict" | "error";

// The job is inserted first so a failure here changes nothing. If the
// compare-and-set on the post then fails or loses a race, the job is withdrawn.
// A crash between the two writes leaves a queued job on a failed post, which the
// worker simply runs; the reverse order stranded a queued post with no work.
export async function enqueueRetry(
  admin: SupabaseClient,
  { postId, userId, kind }: { postId: string; userId: string; kind: string }
): Promise<RetryResult> {
  const job = await admin.from("jobs").insert({ post_id: postId, kind, status: "queued", priority: 100 }).select("id").single();
  if (job.error || !job.data) return "error";
  const withdraw = () => admin.from("jobs").delete().eq("id", job.data.id).eq("status", "queued");
  const post = await admin.from("posts").update({ status: "queued", fail_reason: null })
    .eq("id", postId).eq("user_id", userId).eq("status", "failed").select("id").maybeSingle();
  if (post.error) { await withdraw(); return "error"; }
  if (!post.data) { await withdraw(); return "conflict"; }
  return "queued";
}
