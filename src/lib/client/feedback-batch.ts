import {createClient} from '@/lib/supabase/client';
import type {Verdict} from '@/lib/posts/feedback';

export type FeedbackRow={verdict:Verdict;model_comment_id:string|null;item_fingerprint:string|null};
type Waiting={resolve:(row:FeedbackRow|null)=>void;reject:(error:unknown)=>void};
let batch:Map<string,Waiting[]>|null=null;

// Mounts and tab returns in one task share a read. Delete before dispatch so
// later requests always read again, including while an earlier batch is in flight.
export function requestFeedback(postId:string):Promise<FeedbackRow|null>{
 return new Promise((resolve,reject)=>{
  if(!batch){
   batch=new Map();
   setTimeout(()=>{
    const waiting=batch!;batch=null;const ids=[...waiting.keys()];
    for(let start=0;start<ids.length;start+=50){
     const selected=ids.slice(start,start+50);
     void Promise.resolve().then(async()=>{
      const {data,error}=await createClient().from('post_feedback').select('post_id,verdict,model_comment_id,item_fingerprint').in('post_id',selected);
      if(error)throw error;
      const rows=new Map((data??[]).map(row=>[row.post_id,row]));
      for(const id of selected)for(const listener of waiting.get(id)!)listener.resolve(rows.get(id)??null);
     }).catch(error=>{for(const id of selected)for(const listener of waiting.get(id)!)listener.reject(error);});
    }
   },0);
  }
  batch.set(postId,[...(batch.get(postId)??[]),{resolve,reject}]);
 });
}
