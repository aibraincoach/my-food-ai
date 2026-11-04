import type {SupabaseClient} from '@supabase/supabase-js';
import {ApiError,ioError} from '@/lib/worker/errors';
export class AttachmentStageExpired extends Error {
 readonly code='attachment_stage_expired';
 constructor(){super('The photo upload expired. Uploading the kept photo again.');}
}
function stageError(error:{code?:string;message?:string},status?:number):Error {
 return error.code==='22023'&&error.message==='Photo stage expired'
  ?new AttachmentStageExpired():ioError('The photo could not be attached.',error,status);
}
export interface AttachedPhoto {path:string;width:number;height:number}
/** A reservation is durable before any copy is made. Its delayed cleanup checks
 * exact paths, while the completion RPC verifies both copies and queues once. */
export async function attachPostPhoto(admin:SupabaseClient,postId:string,userId:string,photo:AttachedPhoto,notEaten:boolean){
 const {data:stage,error,status}=await admin.rpc('prepare_post_photo_attachment',{p_post_id:postId,p_user_id:userId,p_stage_path:photo.path,p_not_eaten:notEaten});
 if(error)throw stageError(error,status);
 if(!stage)throw Error('The photo could not be reserved.');
 if(stage.media_id)return {mediaId:stage.media_id as string};
 // An old pending reservation outlives its source objects. Check the same lease
 // complete_post_photo_attachment enforces before copying, so an expired source
 // can be renewed without mistaking an ambiguous successful attach for failure.
 const lease=await admin.from('jobs').select('status,run_after').eq('id',stage.cleanup_job_id).maybeSingle();
 if(lease.error)throw ioError('The photo upload could not be checked.',lease.error,lease.status);
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
   if(original.error||copy.error||!original.data||!copy.data)throw new ApiError(503,'','The photo could not be copied. Your photo was kept; try again.');
   const [expected,actual]=await Promise.all([original.data.arrayBuffer(),copy.data.arrayBuffer()]);
   const bytes=new Uint8Array(expected),stored=new Uint8Array(actual);
   if(bytes.length!==stored.length||!bytes.every((v,index)=>v===stored[index]))throw Error('The reserved photo copy did not match.');
  }
 }
 const complete=await admin.rpc('complete_post_photo_attachment',{p_id:stage.id,p_user_id:userId,p_width:photo.width,p_height:photo.height});
 if(complete.error)throw stageError(complete.error,complete.status);
 return {mediaId:complete.data as string};
}
