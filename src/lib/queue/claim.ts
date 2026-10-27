import type { SupabaseClient } from "@supabase/supabase-js";

export interface JobRow {
  id: string;
  post_id: string | null;
  kind: string;
  priority: number;
  status: string;
  attempts: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
}

// Lowest priority number first, then oldest — FOR UPDATE SKIP LOCKED inside
// the claim_job() function. Stamps started_at and increments attempts.
export async function claimJob(admin: SupabaseClient): Promise<JobRow | null> {
  const { data, error } = await admin.rpc("claim_job");
  if (error) throw new Error(`claim_job failed: ${error.message}`);
  return (data ?? null) as JobRow | null;
}

export async function finishJob(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin
    .from("jobs")
    .update({ status: "finished", finished_at: new Date().toISOString(), error: null })
    .eq("id", id);
  if (error) throw new Error(`finish_job failed: ${error.message}`);
}

// A 429/5xx-style retryable failure: back to queued with the error noted.
// Past three attempts the post is failed.
export async function failJob(admin: SupabaseClient, job: JobRow, message: string): Promise<void> {
  if (job.attempts >= 3) {
    await admin.from("jobs").update({
      status: "error",
      finished_at: new Date().toISOString(),
      error: message,
    }).eq("id", job.id);
    if (job.post_id) {
      await admin.from("posts").update({ status: "failed" }).eq("id", job.post_id);
    }
    return;
  }
  const { error } = await admin
    .from("jobs")
    .update({ status: "queued", error: message })
    .eq("id", job.id);
  if (error) throw new Error(`fail_job failed: ${error.message}`);
}
