import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;
export type JobHandlers = Readonly<Record<string, JobHandler>>;

// Fixed module paths keep dispatch explicit while tick can boot without loading
// food analysis, image parsing or push dependencies until a job actually runs.
const lazy = (load: () => Promise<{ default: JobHandler }>): JobHandler =>
  async (admin, job) => (await load()).default(admin, job);

export const jobHandlers: JobHandlers = Object.freeze({
  analyze: lazy(() => import("@/lib/worker/jobs/analyze")),
  correct: lazy(() => import("@/lib/worker/jobs/correct")),
  recompute: lazy(() => import("@/lib/worker/jobs/recompute")),
  remainder: lazy(() => import("@/lib/worker/jobs/remainder")),
  card_backfill: lazy(() => import("@/lib/worker/jobs/card_backfill")),
  media_cleanup: lazy(() => import("@/lib/worker/jobs/media_cleanup")),
});

// Tests pass their own table (including fixture kinds); production always uses the one above.
export async function runJob(admin: SupabaseClient, job: JobRow, handlers: JobHandlers = jobHandlers): Promise<void> {
  const run = Object.hasOwn(handlers, job.kind) ? handlers[job.kind] : undefined;
  if (!run) throw new Error("worker: unknown job kind.");
  await run(admin, job);
}
