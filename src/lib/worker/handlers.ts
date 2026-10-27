import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";

export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;

export async function runJob(admin: SupabaseClient, job: JobRow): Promise<void> {
  const kind = job.kind;
  // Job kinds come only from server-created rows. Also reject path traversal
  // before constructing the bundle's dynamic import.
  if (!/^[a-z][a-z0-9_]*$/.test(kind)) {
    throw new Error("worker: invalid job kind.");
  }
  const run: JobHandler = (await import(`./jobs/${kind}`)).default;
  await run(admin, job);
}
