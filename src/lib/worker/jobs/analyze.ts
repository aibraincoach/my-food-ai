import { sendPostPush } from "@/lib/push/send";
import { findPrior } from "@/lib/pipeline/prior";
import type { JobHandler } from "@/lib/worker/handlers";
import { analyzePost } from "@/lib/pipeline/analyze";
import { persistAnalysis } from "@/lib/pipeline/persist";

const analyze: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("analyze: job has no post.");
  const prior = await findPrior(admin,job.post_id);
  const named = prior?.named ?? await analyzePost(admin, job.post_id, prior?.hint);
  await persistAnalysis(admin, named, prior?.nutrition);
  if (named.needsInput) await sendPostPush(admin, job.post_id, named.needsInput.question);
};

export default analyze;
