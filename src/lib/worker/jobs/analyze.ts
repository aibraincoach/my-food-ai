import { findPrior } from "@/lib/pipeline/prior";
import type { JobHandler } from "@/lib/worker/handlers";
import { analyzePost } from "@/lib/pipeline/analyze";
import { ioError } from "@/lib/worker/errors";
import { persistAnalysis, markReady } from "@/lib/pipeline/persist";

const analyze: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("analyze: job has no post.");
  const {data:post,error,status}=await admin.from("posts").select("analysis_initialized_at").eq("id",job.post_id).maybeSingle();
  if(error)throw ioError("Initial analysis state could not be read.",error,status);
  if(!post)throw new Error("analyze: post not found.");
  if(post.analysis_initialized_at){await markReady(job.post_id,admin);return;}
  const prior = await findPrior(admin,job.post_id);
  const named = prior?.named ?? await analyzePost(admin, job.post_id, prior?.hint);
  await persistAnalysis(admin, named, prior?.nutrition);
};

export default analyze;
