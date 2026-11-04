'use client';
import {formatModelCommentLabels} from '@/lib/posts/comment-label';
import UndoToast from '@/components/UndoToast';
import {delayAction} from '@/lib/posts/delayed-action';
import FirstRunHint from '@/components/FirstRunHint';
import {useRemovalMenus} from '@/components/useRemovalMenus';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {readPostComments} from '@/lib/posts/timeline';
import {useRouter} from 'next/navigation';
import {correctionFeedback} from '@/lib/posts/correction-feedback';
import {createClient} from '@/lib/supabase/client';
import CommentComposer,{type CommentRow} from '@/components/CommentComposer';
import {LocalTime} from '@/components/LocalTime';
import {usePostHandle} from '@/components/PostHandle';
const sort=(rows:CommentRow[])=>rows.toSorted((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export default function Thread({postId,readOnly=false,sourcePostId,desktopActions}:{desktopActions?:ReactNode;postId:string;readOnly?:boolean;sourcePostId?:string|null}){
 const menus=useRef<HTMLElement>(null);useRemovalMenus(menus);
 const handle=usePostHandle();
 const [accepted,setAccepted]=useState<string|null>(null);
 const router=useRouter();
 const [rows,setRows]=useState<CommentRow[]>([]);const [error,setError]=useState('');const [waiting,setWaiting]=useState(false);const [failed,setFailed]=useState(false);const [retrying,setRetrying]=useState(false);
 const wake=useRef<()=>void>(()=>{});
 const append=useCallback((row:CommentRow)=>{setRows(old=>sort([...old.filter(r=>r.id!==row.id),row]));setWaiting(row.author==='user');wake.current();},[]);
 useEffect(()=>{
  const client=createClient();let live=true;let inFlight=false;let knownStatus:string|null=null;
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
   const models=(data??[]).filter(row=>row.author==='model');
   void models;
   if(knownStatus&&knownStatus!==post.status)router.refresh();knownStatus=post.status;
   const feedback=correctionFeedback(post.status);
   setFailed(feedback==='failed');setError(feedback==='failed'?'The meal could not be updated.':'');setRows(old=>sort([...new Map([...old,...(data??[])].map(row=>[row.id,row as CommentRow])).values()]));
   setWaiting(feedback==='waiting');
  }catch{if(live)setError('Comments could not be loaded.');}finally{inFlight=false;}};
  const channel=client.channel(`thread-${postId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).on('postgres_changes',{event:'UPDATE',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).subscribe((status)=>{if(status==='SUBSCRIBED')void load();});
  wake.current=()=>{void load();};
  void load();
  return()=>{live=false;wake.current=()=>{};void client.removeChannel(channel);};
 },[postId,router]);
 useEffect(()=>{
  if(!waiting)return;
  let live=true;let delay=2000;let timer:ReturnType<typeof setTimeout>;
  const tick=()=>{if(!live)return;if(document.visibilityState==='visible')void wake.current();delay=Math.min(30000,delay*2);timer=setTimeout(tick,delay);};
  timer=setTimeout(tick,delay);
  return()=>{live=false;clearTimeout(timer);};
 },[waiting]);
 const [toast,setToast]=useState<{key:number;undo:()=>void}|null>(null);
 const [pendingRemovals,setPendingRemovals]=useState<string[]>([]);
 const pendingRemovalIds=useRef(new Set<string>());
 const removeCorrection=(commentId:string)=>{
  if(pendingRemovalIds.current.size)return;
  pendingRemovalIds.current.add(commentId);setError('');setPendingRemovals(old=>[...old,commentId]);
  const restore=()=>{pendingRemovalIds.current.delete(commentId);setPendingRemovals(old=>old.filter(id=>id!==commentId));};
  const action=delayAction(6000,async keepalive=>{
   try{
    const response=await fetch(`/api/posts/${postId}/comments/${commentId}/revert`,{method:'POST',keepalive});
    if(!response.ok)throw Error('The correction could not be removed. Try again.');
    setRows(old=>old.map(row=>row.id===commentId?{...row,reverted_at:new Date().toISOString()}:row));restore();
    setWaiting(true);window.dispatchEvent(new CustomEvent('correction-reverted',{detail:{id:postId,commentId}}));router.refresh();wake.current();
   }catch(cause){restore();setError(cause instanceof Error?cause.message:'The correction could not be removed.');}
  });
  setToast(previous=>({key:(previous?.key??0)+1,undo:()=>{action.undo();restore();setToast(null);}}));
 };
 const retry=async()=>{setRetrying(true);try{const response=await fetch(`/api/posts/${postId}/retry`,{method:'POST'});if(!response.ok)throw new Error('retry failed');setFailed(false);setError('');router.refresh();}catch{setError('Could not retry. Please try again.');}finally{setRetrying(false);}};
 return <section ref={menus} aria-label="Meal comments" className="relative px-inset pt-[14px]">
  {sourcePostId?<p className="mb-[10px] text-meta text-muted">Logged again</p>:null}
  <h2 className="mb-[10px] text-handle">Comments <span className="font-normal text-muted">{rows.length}</span></h2>
  <div aria-live="polite" className="flex flex-col gap-[10px]">{rows.filter(row=>!pendingRemovals.includes(row.id)).map(row=><div key={row.id} className="flex items-start gap-[10px]">
    <span className={`flex size-7 shrink-0 items-center justify-center rounded-circle text-avatar-sm ${row.author==='model'?'bg-text text-surface':'bg-field text-text'}`}>{row.author==='model'?'AI':handle.slice(0,1).toUpperCase()}</span>
    <p className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-detail leading-[1.45] ${row.reverted_at?'text-muted':''}`}><span className="font-semibold">{row.author==='model'?'My Food AI':handle}</span> {row.author==='model'?formatModelCommentLabels(row.body):row.body} <span className="whitespace-nowrap text-muted"><LocalTime value={row.created_at}/></span>{row.reverted_at?<span className="block text-meta text-muted">Removed</span>:row.author==='user'&&!readOnly?<details data-removal-menu className="inline-block"><summary className="ml-2 cursor-pointer list-none text-meta text-muted underline">Remove</summary><div className="absolute right-4 z-30 w-[230px] rounded-card border border-hairline bg-surface p-[6px] text-[15px] text-text" style={{boxShadow:'var(--color-shadow-pill)'}}><button type="button" onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');void removeCorrection(row.id);}} className="h-tap w-full border-b border-hairline px-[10px] text-left" style={{color:'oklch(0.52 0.17 25)'}}>Remove correction</button><span className="block px-[10px] py-2 text-meta text-muted">Removes your comment and the AI’s reply, and puts back what it changed.</span><button type="button" onClick={event=>event.currentTarget.closest('details')?.removeAttribute('open')} className="h-tap w-full px-[10px] text-left">Cancel</button></div></details>:null}{accepted===row.id?<span className="ml-2 text-meta text-muted">Accepted</span>:null}</p>
  </div>)}</div>
  {waiting?<p role="status" className="py-grid text-meta text-muted">Updating the meal…</p>:null}
  {error?<p role="status" className="text-meta text-muted">{error}</p>:null}
  {toast&&<UndoToast key={toast.key} text="Correction removed" onUndo={toast.undo} ms={6000}/>}
  <FirstRunHint hint="thread" />
  {failed?<button type="button" disabled={retrying} onClick={retry} className="min-h-tap text-meta text-text">{retrying?'Retrying…':'Try again'}</button>:null}
  {desktopActions}
  {readOnly ? <p className="text-meta text-muted">Drink amounts were recorded when posted.</p> : <CommentComposer postId={postId} onPosted={append}/>}
 </section>;
}
