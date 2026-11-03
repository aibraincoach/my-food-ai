import type {SupabaseClient} from '@supabase/supabase-js';
export type Verdict='up'|'down';
export async function saveFeedback(client:SupabaseClient,postId:string,verdict:Verdict,modelCommentId:string,fingerprint:string){
 const {error}=await client.rpc('save_revision_feedback',{p_post_id:postId,p_model_comment_id:modelCommentId,p_fingerprint:fingerprint,p_verdict:verdict});
 if(error)throw Object.assign(new Error('Feedback could not be saved.'),{code:error.code as string|undefined});
}
export async function sendFeedback(postId:string,verdict:Verdict,modelCommentId:string,fingerprint:string):Promise<void>{
 const send=(comment:string,print:string)=>fetch(`/api/posts/${postId}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verdict,modelCommentId:comment,fingerprint:print})});
 let comment=modelCommentId,print=fingerprint;let response=await send(comment,print);
 if(response.status===409){
  const body=await response.json().catch(()=>null) as {revision?:{modelCommentId?:string|null;fingerprint?:string}|null}|null;
  if(body?.revision?.modelCommentId&&body.revision.fingerprint){comment=body.revision.modelCommentId;print=body.revision.fingerprint;response=await send(comment,print);}
 }
 if(!response.ok)throw new Error('Feedback could not be saved.');
 window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId,verdict,modelCommentId:comment,fingerprint:print}}));
}
