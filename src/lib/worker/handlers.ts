import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { analyzePost } from "@/lib/pipeline/analyze";
import { persistAnalysis } from "@/lib/pipeline/persist";

export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;

// Item 10: the analyze job runs segment (SAM) + identify (Spark) + FDC
// lookup + the one-RPC persist, flipping the post to ready. Throwing
// requeues; three attempts land the post in failed (item 7).
async function analyzeHandler(
  admin: SupabaseClient,
  job: JobRow
): Promise<void> {
  if (!job.post_id) {
    throw new Error("analyze: job has no post.");
  }
  const named = await analyzePost(admin, job.post_id);
  await persistAnalysis(admin, named);
}

async function notLanded(kind: string): Promise<void> {
  throw new Error(`worker: ${kind} has not landed yet.`);
}

export const handlers: Record<string, JobHandler> = {
  analyze: analyzeHandler,
  correct: (admin, job) => notLanded(job.kind),
  recompute: (admin, job) => notLanded(job.kind),
  card_backfill: (admin, job) => notLanded(job.kind),
};
