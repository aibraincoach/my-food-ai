import analyze from "@/lib/worker/jobs/analyze";
import correct from "@/lib/worker/jobs/correct";
import recompute from "@/lib/worker/jobs/recompute";
import remainder from "@/lib/worker/jobs/remainder";
import card_backfill from "@/lib/worker/jobs/card_backfill";
import media_cleanup from "@/lib/worker/jobs/media_cleanup";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;
export type JobHandlers = Readonly<Record<string, JobHandler>>;

export const jobHandlers: JobHandlers = Object.freeze({
  analyze,
  correct,
  recompute,
  remainder,
  card_backfill,
  media_cleanup,
});

// Tests pass their own table (including fixture kinds); production always uses the one above.
export async function runJob(admin: SupabaseClient, job: JobRow, handlers: JobHandlers = jobHandlers): Promise<void> {
  const run = Object.hasOwn(handlers, job.kind) ? handlers[job.kind] : undefined;
  if (!run) throw new Error("worker: unknown job kind.");
  await run(admin, job);
}
