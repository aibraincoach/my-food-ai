'use client';
import FirstRunHint from '@/components/FirstRunHint';
import {useCallback,useEffect,useRef,useState} from 'react';
import {readPostComments} from '@/lib/posts/timeline';
import {useRouter} from 'next/navigation';
import {correctionFeedback} from '@/lib/posts/correction-feedback';
import {createClient} from '@/lib/supabase/client';
import CommentComposer,{type CommentRow} from '@/components/CommentComposer';
import {LocalTime} from '@/components/LocalTime';
import {usePostHandle} from '@/components/PostHandle';
const sort=(rows:CommentRow[])=>rows.toSorted((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export default function Thread({postId,readOnly=false}:{postId:string;readOnly?:boolean}){
 const handle=usePostHandle();
 const [accepted,setAccepted]=useState<string|null>(null);
 const router=useRouter();
 const [rows,setRows]=useState<CommentRow[]>([]);const [error,setError]=useState('');const [waiting,setWaiting]=useState(false);const [failed,setFailed]=useState(false);const [retrying,setRetrying]=useState(false);
 const wake=useRef<()=>void>(()=>{});
 const append=useCallback((row:CommentRow)=>{setRows(old=>sort([...old.filter(r=>r.id!==row.id),row]));setWaiting(row.author==='user');router.refresh();wake.current();},[router]);
 useEffect(()=>{
  const client=createClient();let live=true;let inFlight=false;let initialized=false;let busy=true;let lastLoad=0;let knownStatus:string|null=null;const knownModels=new Set<string>();
  // Always a full, ordered read: a comment can commit with an earlier timestamp than one already seen.
  const load=async()=>{if(inFlight)return;inFlight=true;try{
   const {data:verdict}=await client.from('post_feedback').select('verdict,model_comment_id,item_fingerprint').eq('post_id',postId).maybeSingle();
   const {data:revision}=await client.rpc('feedback_revision',{p_post_id:postId});
   if(live)setAccepted(verdict?.verdict==='up'&&verdict.item_fingerprint===revision?.fingerprint?verdict.model_comment_id:null);
   const [data,{data:post,error:postError}]=await Promise.all([
    readPostComments(client,postId),
    client.from('posts').select('status').eq('id',postId).maybeSingle(),
   ]);
   if(!live)return;if(postError||!post){setError('Comments could not be loaded.');return;}
   lastLoad=Date.now();busy=!['ready','failed','needs_input'].includes(post.status);
   const models=(data??[]).filter(row=>row.author==='model');
   if(initialized&&models.some(row=>!knownModels.has(row.id)))router.refresh();
   for(const model of models)knownModels.add(model.id);initialized=true;
   if(knownStatus&&knownStatus!==post.status)router.refresh();knownStatus=post.status;
   const feedback=correctionFeedback(post.status);
   setFailed(feedback==='failed');setError(feedback==='failed'?'The meal could not be updated.':'');setRows(old=>sort([...new Map([...old,...(data??[])].map(row=>[row.id,row as CommentRow])).values()]));
   setWaiting(feedback==='waiting');
  }catch{if(live)setError('Comments could not be loaded.');}finally{inFlight=false;}};
  const channel=client.channel(`thread-${postId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).subscribe((status)=>{if(status==='SUBSCRIBED')void load();});
  wake.current=()=>{busy=true;void load();};
  void load();
  // Poll quickly while work is pending; an idle meal is only rechecked every 15 seconds.
  const timer=setInterval(()=>{if(document.visibilityState==='visible'&&(busy||Date.now()-lastLoad>15000))void load();},2000);
  return()=>{live=false;wake.current=()=>{};clearInterval(timer);void client.removeChannel(channel);};
 },[postId,router]);
 const retry=async()=>{setRetrying(true);try{const response=await fetch(`/api/posts/${postId}/retry`,{method:'POST'});if(!response.ok)throw new Error('retry failed');setFailed(false);setError('');router.refresh();}catch{setError('Could not retry. Please try again.');}finally{setRetrying(false);}};
 return <section aria-label="Meal comments" className="px-inset pt-[14px]">
  <h2 className="mb-[10px] text-handle">Comments <span className="font-normal text-muted">{rows.length}</span></h2>
  <div aria-live="polite" className="flex flex-col gap-[10px]">{rows.map(row=><div key={row.id} className="flex items-start gap-[10px]">
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-circle text-avatar-sm ${row.author==='model'?'bg-text text-surface':'bg-field text-text'}`}>{row.author==='model'?'AI':handle.slice(0,1).toUpperCase()}</span>
    <p className="min-w-0 whitespace-pre-wrap break-words text-detail leading-[1.45]"><span className="font-semibold">{row.author==='model'?'AI':handle}</span> {row.body} <span className="whitespace-nowrap text-muted"><LocalTime value={row.created_at}/></span>{accepted===row.id?<span className="ml-2 text-meta text-muted">Accepted</span>:null}</p>
  </div>)}</div>
  {waiting?<p role="status" className="py-grid text-meta text-muted">Updating the meal…</p>:null}
  {error?<p role="status" className="text-meta text-muted">{error}</p>:null}
  <FirstRunHint hint="thread" />
  {failed?<button type="button" disabled={retrying} onClick={retry} className="min-h-tap text-meta text-text">{retrying?'Retrying…':'Try again'}</button>:null}
  {readOnly ? <p className="text-meta text-muted">Drink amounts were recorded when posted.</p> : <CommentComposer postId={postId} onPosted={append}/>}
 </section>;
}
