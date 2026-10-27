'use client';
import {useCallback,useEffect,useState} from 'react';
import {createClient} from '@/lib/supabase/client';
import CommentComposer,{type CommentRow} from '@/components/CommentComposer';
const sort=(rows:CommentRow[])=>rows.toSorted((a,b)=>a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id));
export default function Thread({postId}:{postId:string}){
 const [rows,setRows]=useState<CommentRow[]>([]);const [error,setError]=useState('');const [waiting,setWaiting]=useState(false);
 const append=useCallback((row:CommentRow)=>{setRows(old=>sort([...old.filter(r=>r.id!==row.id),row]));setWaiting(row.author==='user');},[]);
 useEffect(()=>{
  const client=createClient();let live=true;let inFlight=false;
  const load=async()=>{if(inFlight)return;inFlight=true;try{
   const {data,error}=await client.from('post_comments').select('id,author,body,created_at').eq('post_id',postId).order('created_at').order('id');
   if(!live)return;if(error){setError('Comments could not be loaded.');return;}
   setError('');setRows(old=>sort([...new Map([...old,...(data??[])].map(row=>[row.id,row as CommentRow])).values()]));
   const latest=data?.at(-1);setWaiting(latest?.author==='user');
  }catch{if(live)setError('Comments could not be loaded.');}finally{inFlight=false;}};
  const channel=client.channel(`thread-${postId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'post_comments',filter:`post_id=eq.${postId}`},()=>{void load();}).subscribe(()=>{void load();});
  void load(); const timer=setInterval(()=>{if(document.visibilityState==='visible')void load();},2000);
  return()=>{live=false;clearInterval(timer);void client.removeChannel(channel);};
 },[postId]);
 return <section aria-label="Meal comments" className="px-screen-x pt-sheet-top">
  <div aria-live="polite">{rows.map(row=><div key={row.id} className="border-b border-hairline py-sheet-top text-comment"><span className="font-semibold">{row.author==='model'?'Analysis':'You'}</span><p className="mt-grid whitespace-pre-wrap break-words">{row.body}</p></div>)}</div>
  {waiting?<p role="status" className="py-grid text-meta text-muted">Updating the meal…</p>:null}
  {error?<p role="status" className="text-meta text-muted">{error}</p>:null}
  <CommentComposer postId={postId} onPosted={append}/>
 </section>;
}
