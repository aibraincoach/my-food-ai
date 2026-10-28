import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import analyze from "@/lib/worker/jobs/analyze";
import correct from "@/lib/worker/jobs/correct";
import recompute from "@/lib/worker/jobs/recompute";
import cardBackfill from "@/lib/worker/jobs/card_backfill";

export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;
export type JobHandlers = Readonly<Record<string, JobHandler>>;

// Every job kind the worker runs is listed here, explicitly. A kind that is not in this table is rejected;
// nothing is imported by name at run time, and no test fixture handler lives in the production folder.
export const jobHandlers: JobHandlers = Object.freeze({
  analyze,
  correct,
  recompute,
  card_backfill: cardBackfill,
});

// Tests pass their own table (including fixture kinds); production always uses the one above.
export async function runJob(admin: SupabaseClient, job: JobRow, handlers: JobHandlers = jobHandlers): Promise<void> {
  const run = Object.hasOwn(handlers, job.kind) ? handlers[job.kind] : undefined;
  if (!run) throw new Error("worker: unknown job kind.");
  await run(admin, job);
}
