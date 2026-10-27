import type { JobHandler } from "@/lib/worker/handlers";
import { analyzePost } from "@/lib/pipeline/analyze";
import { persistAnalysis } from "@/lib/pipeline/persist";

const analyze: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("analyze: job has no post.");
  const named = await analyzePost(admin, job.post_id);
  await persistAnalysis(admin, named);
};

export default analyze;
