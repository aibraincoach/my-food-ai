import type { SupabaseClient } from "@supabase/supabase-js";

// Cleanup outlives a failed request or a closed tab. Signed upload URLs last two hours.
export async function queueStagedPhotoCleanup(admin: SupabaseClient, userId: string, stageId: string) {
  const prefix = `${userId}/${stageId}`;
  const { error } = await admin.from("jobs").insert({
    post_id: null, kind: "media_cleanup", priority: 200, status: "queued",
    run_after: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    payload: { owner_id: userId, deleted_post_id: stageId, paths: [`${prefix}/0.jpg`, `${prefix}/0.feed.jpg`] },
  });
  if (error) throw new Error("Pack photo cleanup could not be scheduled.");
}
