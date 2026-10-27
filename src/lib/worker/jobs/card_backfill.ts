import { ioError } from "@/lib/worker/errors";
import type { JobHandler } from "@/lib/worker/handlers";
import { markReady } from "@/lib/pipeline/persist";

const backfill: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("Card backfill requires a post.");
  const { data, error, status } = await admin.from("posts").select("status").eq("id", job.post_id).maybeSingle();
  if (error) throw ioError("Card backfill could not read post.", error, status);
  if (data?.status !== "ready") return;
  await markReady(job.post_id, admin);
};
export default backfill;
