import { sendPostPush } from "@/lib/push/send";
import { findPrior } from "@/lib/pipeline/prior";
import type { JobHandler } from "@/lib/worker/handlers";
import { analyzePost } from "@/lib/pipeline/analyze";
import { ioError } from "@/lib/worker/errors";
import { persistAnalysis, markReady } from "@/lib/pipeline/persist";
import { certifiedPriorNutrition } from "@/lib/pipeline/prior-version";

const analyze: JobHandler = async (admin, job) => {
  if (!job.post_id) throw new Error("analyze: job has no post.");
  const {data:post,error,status}=await admin.from("posts").select("analysis_initialized_at").eq("id",job.post_id).maybeSingle();
  if(error)throw ioError("Initial analysis state could not be read.",error,status);
  if(!post)throw new Error("analyze: post not found.");
  const {data:photos,error:photoCountError,status:photoCountStatus}=await admin.from('post_media').select('id,not_eaten').eq('post_id',job.post_id).eq('kind','photo');
  if(photoCountError)throw ioError('Meal photos could not be counted.',photoCountError,photoCountStatus);
  const photoCount=photos?.filter(photo=>!photo.not_eaten).length??0;
  const hasNotEaten=photos?.some(photo=>photo.not_eaten)??false;
  async function queueRemainder(){const {error,status}=await admin.rpc('queue_post_remainder',{p_post_id:job.post_id,p_job_id:job.id});if(error)throw ioError('Not-eaten work could not be queued.',error,status);}
  if(post.analysis_initialized_at){await markReady(job.post_id,admin,job.id,{notify:!hasNotEaten,saveMeal:!hasNotEaten});await queueRemainder();return;}
  const prior = (photoCount??0)>1?null:await findPrior(admin,job.post_id);
  const reusable = prior?.named && certifiedPriorNutrition(prior.nutrition) ? prior : null;
  const named = reusable?.named ?? await analyzePost(admin, job.post_id, prior?.hint);
  named.hasNotEaten=hasNotEaten;
  await persistAnalysis(admin, named, named.labelNutrition?[named.labelNutrition]:reusable?.nutrition, job.id);
  if (named.needsInput) await sendPostPush(admin, job.post_id, named.needsInput.question);
  else await queueRemainder();
};

export default analyze;
