import type {SupabaseClient} from '@supabase/supabase-js';
export type Verdict='up'|'down';
export async function saveFeedback(client:SupabaseClient,postId:string,userId:string,verdict:Verdict){
 const {error}=await client.from('post_feedback').upsert({post_id:postId,user_id:userId,verdict},{onConflict:'post_id,user_id'});
 if(error)throw new Error('Feedback could not be saved.');
}
export async function sendFeedback(postId:string,verdict:Verdict):Promise<void>{
 const response=await fetch(`/api/posts/${postId}/feedback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({verdict})});
 if(!response.ok)throw new Error('Feedback could not be saved.');
 window.dispatchEvent(new CustomEvent('post-feedback',{detail:{postId,verdict}}));
}
