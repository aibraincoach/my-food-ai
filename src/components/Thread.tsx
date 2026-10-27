'use client';
import FirstRunHint from "@/components/FirstRunHint";
import {useCallback,useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {correctionFeedback} from '@/lib/posts/correction-feedback';
import {createClient} from '@/lib/supabase/client';
import CommentComposer,{type CommentRow} from '@/components/CommentComposer';
const sort=(rows:CommentRow[])=>rows.toSorted((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export default function Thread({postId}:{postId:string}){
 const [accepted,setAccepted]=useState(false);
 const router=useRouter();
 const [rows,setRows]=useState<CommentRow[]>([]);const [error,setError]=useState('');const [waiting,setWaiting]=useState(false);
 const append=useCallback((row:CommentRow)=>{setRows(old=>sort([...old.filter(r=>r.id!==row.id),row]));setWaiting(row.author==='user');router.refresh();},[router]);
 useEffect(()=>{
  const client=createClient();let live=true;let inFlight=false;let initialized=false;let knownStatus:string|null=null;const knownModels=new Set<string>();
  const load=async()=>{if(inFlight)return;inFlight=true;try{
   const {data:verdict}=await client.from('post_feedback').select('verdict').eq('post_id',postId).maybeSingle();
   if(live)setAccepted(verdict?.verdict==='up');
   const [{data,error},{data:post,error:postError}]=await Promise.all([
    client.from('post_comments').select('id,author,body,created_at').eq('post_id',postId).order('created_at').order('id'),
    client.from('posts').select('status').eq('id',postId).maybeSingle(),
   ]);
   if(!live)return;if(error||postError||!post){setError('Comments could not be loaded.');return;}

   const models=(data??[]).filter(row=>row.author==='model');
   if(initialized&&models.some(row=>!knownModels.has(row.id)))router.refresh();
   for(const model of models)knownModels.add(model.id);initialized=true;
   if(knownStatus&&knownStatus!==post.status)router.refresh();knownStatus=post.status;
   const feedback=correctionFeedback(post.status);
   setError(feedback==='failed'?'The meal could not be updated. Use Retry to try again.':'');setRows(old=>sort([...new Map([...old,...(data??[])].map(row=>[row.id,row as CommentRow])).values()]));
   setWaiting(feedback==='waiting');
  }catch{if(live)setError('Comments could not be loaded.');}finally{inFlight=false;}};
  const channel=client.channel(`thread-${postId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).subscribe(()=>{void load();});
  void load(); const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},2000);
  return()=>{live=false;clearInterval(timer);void client.removeChannel(channel);};
 },[postId,router]);
 return <section aria-label="Meal comments" className="px-screen-x pt-sheet-top">
  <div aria-live="polite">{rows.map(row=><div key={row.id} className="border-b border-hairline py-sheet-top text-comment"><span className="font-semibold">{row.author==='model'?'Analysis':'You'}</span>{accepted&&row.id===rows.findLast(r=>r.author==='model')?.id?<span className="ml-2 text-meta text-muted">Accepted</span>:null}<p className="mt-grid whitespace-pre-wrap break-words">{row.body}</p></div>)}</div>
  {waiting?<p role="status" className="py-grid text-meta text-muted">Updating the meal…</p>:null}
  {error?<p role="status" className="text-meta text-muted">{error}</p>:null}
  <FirstRunHint hint="thread" />
  <CommentComposer postId={postId} onPosted={append}/>
 </section>;
}
