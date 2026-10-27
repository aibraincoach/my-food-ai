import type {SupabaseClient} from '@supabase/supabase-js';
export type Verdict='up'|'down';
export async function saveFeedback(client:SupabaseClient,postId:string,verdict:Verdict,modelCommentId:string,fingerprint:string){
 const {error}=await client.rpc('save_revision_feedback',{p_post_id:postId,p_model_comment_id:modelCommentId,p_fingerprint:fingerprint,p_verdict:verdict});
 if(error)throw new Error('Feedback could not be saved.');
}
export async function sendFeedback(postId:string,verdict:Verdict,modelCommentId:string,fingerprint:string):Promise<void>{
 const response=await fetch(`/api/posts/${postId}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verdict,modelCommentId,fingerprint})});
 if(!response.ok)throw new Error('Feedback could not be saved.');
 window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId,verdict,modelCommentId,fingerprint}}));
}
