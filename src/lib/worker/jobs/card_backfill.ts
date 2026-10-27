import type { JobHandler } from "@/lib/worker/handlers";
import { markReady } from "@/lib/pipeline/persist";

const backfill: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("Card backfill requires a post.");
  const { data, error } = await admin.from("posts").select("status").eq("id", job.post_id).maybeSingle();
  if (error) throw new Error("Card backfill could not read post.");
  if (data?.status !== "ready") return;
  await markReady(job.post_id, admin);
};
export default backfill;
