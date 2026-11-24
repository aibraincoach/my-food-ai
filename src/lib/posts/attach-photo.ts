import {CaptureFailureError,type CaptureMessageCode} from '@/lib/posts/capture-failure';
import type {SupabaseClient} from '@supabase/supabase-js';
import {ioError} from '@/lib/worker/errors';
export class AttachmentStageExpired extends CaptureFailureError {
 readonly code='attachment_stage_expired';
 constructor(){super({code:"route_e335f24bae30"});}
}
/** One stable code and one sentence per refusal the attachment functions raise
 * (supabase/migrations/0028_multiple_leftovers.sql), keyed by the raised text. */
export const ATTACH_REFUSALS=new Map<string,{code:string;message_code:CaptureMessageCode}>([
 ['Wait for this meal to be ready',{code:'attachment_meal_not_ready',message_code:"route_d3506d4ab3d7"}],
 ['Drink amounts were recorded when posted',{code:'attachment_meal_has_drink',message_code:"route_2258222ca39d"}],
 ['A meal has at most eight photos',{code:'attachment_photo_limit',message_code:"route_d631f7faad7e"}],
 ['Photo upload incomplete',{code:'attachment_upload_incomplete',message_code:"route_b500c36dafe5"}],
 ['Post not found',{code:'attachment_meal_missing',message_code:"route_e4ffb99177e7"}],
]);
function attachmentFailure(code:CaptureMessageCode,cause:unknown,status?:number):CaptureFailureError {
 return Object.assign(new CaptureFailureError({code},{cause}),ioError(code,cause,status));
}
function stageError(error:{code?:string;message?:string},status?:number):Error {
 if(error.code==='22023'&&error.message==='Photo stage expired')return new AttachmentStageExpired();
 const refusal=ATTACH_REFUSALS.get(error.message??'');
 return refusal?Object.assign(attachmentFailure(refusal.message_code,error,status),{refusal:refusal.code}):attachmentFailure("route_f9138625bc22",error,status);
}
export interface AttachedPhoto {path:string;width:number;height:number}
/** A reservation is durable before any copy is made. Its delayed cleanup checks
 * exact paths, while the completion RPC verifies both copies and queues once. */
export async function attachPostPhoto(admin:SupabaseClient,postId:string,userId:string,photo:AttachedPhoto,notEaten:boolean){
 const {data:stage,error,status}=await admin.rpc('prepare_post_photo_attachment',{p_post_id:postId,p_user_id:userId,p_stage_path:photo.path,p_not_eaten:notEaten});
 if(error)throw stageError(error,status);
 if(!stage)throw new CaptureFailureError({code:"route_78a690888a81"});
 if(stage.media_id)return {mediaId:stage.media_id as string};
 // An old pending reservation outlives its source objects. Check the same lease
 // complete_post_photo_attachment enforces before copying, so an expired source
 // can be renewed without mistaking an ambiguous successful attach for failure.
 const lease=await admin.from('jobs').select('status,run_after').eq('id',stage.cleanup_job_id).maybeSingle();
 if(lease.error)throw attachmentFailure("route_91587b0a5f75",lease.error,lease.status);
 if(!lease.data||lease.data.status!=='queued'||Date.parse(lease.data.run_after)<=Date.now()){
  // Reconcile under the completion RPC's post/reservation locks. Another request
  // may have committed after prepare returned; in that case it returns that media.
  const settled=await admin.rpc('complete_post_photo_attachment',{p_id:stage.id,p_user_id:userId,p_width:photo.width,p_height:photo.height});
  if(settled.error)throw stageError(settled.error,settled.status);
  return {mediaId:settled.data as string};
 }
 const bucket=admin.storage.from('media');
 for(const [source,target]of [[photo.path,stage.target_path],[photo.path.replace(/\.jpg$/,'.feed.jpg'),String(stage.target_path).replace(/\.jpg$/,'.feed.jpg')]]){
  const {error:copyError}=await bucket.copy(source,target);
  if(copyError){
   // An earlier response may have been lost. The reserved destination belongs
   // only to this attachment; compare bytes before accepting a retry.
   const [original,copy]=await Promise.all([bucket.download(source),bucket.download(target)]);
   if(original.error||copy.error||!original.data||!copy.data)throw attachmentFailure("route_c30fd899be86",undefined,503);
   const [expected,actual]=await Promise.all([original.data.arrayBuffer(),copy.data.arrayBuffer()]);
   const bytes=new Uint8Array(expected),stored=new Uint8Array(actual);
   if(bytes.length!==stored.length||!bytes.every((v,index)=>v===stored[index]))throw new CaptureFailureError({code:"route_52ae9149ec2f"});
  }
 }
 const complete=await admin.rpc('complete_post_photo_attachment',{p_id:stage.id,p_user_id:userId,p_width:photo.width,p_height:photo.height});
 if(complete.error)throw stageError(complete.error,complete.status);
 return {mediaId:complete.data as string};
}
