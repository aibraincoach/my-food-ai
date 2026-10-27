import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";

export type JobHandler = (admin: SupabaseClient, job: JobRow) => Promise<void>;

// Handler registry. Items 8-10 replace the analyze stub with the real
// SAM + Spark + FDC pipeline; until then analyze jobs fail fast and land
// the post in failed after three attempts (visible once item 11 lands).
async function analyzeStub(): Promise<void> {
  throw new Error("analyze: items 8-10 have not landed yet.");
}

export const handlers: Record<string, JobHandler> = {
  analyze: analyzeStub,
  correct: analyzeStub,
  recompute: analyzeStub,
  card_backfill: analyzeStub,
};
