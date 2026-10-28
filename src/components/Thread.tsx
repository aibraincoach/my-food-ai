'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {readPostComments,readPostCommentsAfter} from '@/lib/posts/timeline';
import {useRouter} from 'next/navigation';
import {correctionFeedback} from '@/lib/posts/correction-feedback';
import {createClient} from '@/lib/supabase/client';
import CommentComposer,{type CommentRow} from '@/components/CommentComposer';
const sort=(rows:CommentRow[])=>rows.toSorted((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export default function Thread({postId}:{postId:string}){
 const router=useRouter();
 const [rows,setRows]=useState<CommentRow[]>([]);const [error,setError]=useState('');const [waiting,setWaiting]=useState(false);const [failed,setFailed]=useState(false);const [retrying,setRetrying]=useState(false);
 const wake=useRef<()=>void>(()=>{});
 const append=useCallback((row:CommentRow)=>{setRows(old=>sort([...old.filter(r=>r.id!==row.id),row]));setWaiting(row.author==='user');router.refresh();wake.current();},[router]);
 useEffect(()=>{
  const client=createClient();let live=true;let inFlight=false;let initialized=false;let after:{id:string;created_at:string}|undefined;let busy=true;let lastLoad=0;let knownStatus:string|null=null;const knownModels=new Set<string>();
  // The first read (and any channel reconnect) loads the whole thread; later reads fetch only newer comments.
  const load=async(full=false)=>{if(inFlight)return;inFlight=true;try{
   const [data,{data:post,error:postError}]=await Promise.all([
    full||!after?readPostComments(client,postId):readPostCommentsAfter(client,postId,after),
    client.from('posts').select('status').eq('id',postId).maybeSingle(),
   ]);
   if(!live)return;if(postError||!post){setError('Comments could not be loaded.');return;}
   if(data.length)after=data[data.length-1];lastLoad=Date.now();busy=!['ready','failed','needs_input'].includes(post.status);
   const models=(data??[]).filter(row=>row.author==='model');
   if(initialized&&models.some(row=>!knownModels.has(row.id)))router.refresh();
   for(const model of models)knownModels.add(model.id);initialized=true;
   if(knownStatus&&knownStatus!==post.status)router.refresh();knownStatus=post.status;
   const feedback=correctionFeedback(post.status);
   setFailed(feedback==='failed');setError(feedback==='failed'?'The meal could not be updated.':'');setRows(old=>sort([...new Map([...old,...(data??[])].map(row=>[row.id,row as CommentRow])).values()]));
   setWaiting(feedback==='waiting');
  }catch{if(live)setError('Comments could not be loaded.');}finally{inFlight=false;}};
  const channel=client.channel(`thread-${postId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).subscribe((status)=>{if(status==='SUBSCRIBED')void load(true);});
  wake.current=()=>{busy=true;void load();};
  void load(true);
  // Poll quickly while work is pending; an idle meal is only rechecked now and then.
  const timer=setInterval(()=>{if(document.visibilityState==='visible'&&(busy||Date.now()-lastLoad>15000))void load();},2000);
  return()=>{live=false;wake.current=()=>{};clearInterval(timer);void client.removeChannel(channel);};
 },[postId,router]);
 const retry=async()=>{setRetrying(true);try{const response=await fetch(`/api/posts/${postId}/retry`,{method:'POST'});if(!response.ok)throw new Error('retry failed');setFailed(false);setError('');router.refresh();}catch{setError('Could not retry. Please try again.');}finally{setRetrying(false);}};
 return <section aria-label="Meal comments" className="px-screen-x pt-sheet-top">
  <div aria-live="polite">{rows.map(row=><div key={row.id} className="border-b border-hairline py-sheet-top text-comment"><span className="font-semibold">{row.author==='model'?'Analysis':'You'}</span><p className="mt-grid whitespace-pre-wrap break-words">{row.body}</p></div>)}</div>
  {waiting?<p role="status" className="py-grid text-meta text-muted">Updating the meal…</p>:null}
  {error?<p role="status" className="text-meta text-muted">{error}</p>:null}
  {failed?<button type="button" disabled={retrying} onClick={retry} className="min-h-tap text-meta text-text">{retrying?'Retrying…':'Try again'}</button>:null}
  <CommentComposer postId={postId} onPosted={append}/>
 </section>;
}
