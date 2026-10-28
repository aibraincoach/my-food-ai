import { ioError } from "@/lib/worker/errors";
import type { JobHandler } from "@/lib/worker/handlers";
import { renderResultsCard } from "@/lib/pipeline/results-card";

const backfill: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("Card backfill requires a post.");
  const { data, error, status } = await admin.from("posts").select("status").eq("id", job.post_id).maybeSingle();
  if (error) throw ioError("Card backfill could not read post.", error, status);
  if (data?.status !== "ready") return;
  // Strict on purpose: a failed card makes this maintenance job fail and retry; the meal is already ready.
  await renderResultsCard(admin, job.post_id, job.id);
};
export default backfill;
