'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import type {FeedPost} from '@/lib/posts/feed';
import {sumNutrition,formatCalories} from '@/lib/nutrition/totals';
import {Sheet} from '@/components/ui/Sheet';
import UndoToast from '@/components/UndoToast';
export default function DeletePostSheet(){
 const router=useRouter(),pathname=usePathname();
 const [id,setId]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [toast,setToast]=useState<{id:string;post?:FeedPost}|null>(null);
 const lock=useRef(false);const [selectedPost,setSelectedPost]=useState<FeedPost|undefined>(undefined);
 useEffect(()=>{const open=(event:Event)=>{const detail=(event as CustomEvent<{id:string;post?:FeedPost}>).detail;if(typeof detail?.id==='string'){setSelectedPost(detail.post);setId(detail.id);setError('');}};window.addEventListener('delete-post',open);return()=>window.removeEventListener('delete-post',open);},[]);
 const remove=async()=>{if(!id||lock.current)return;lock.current=true;setBusy(true);setError('');const deletedId=id,post=selectedPost;
 try{
  const response=await fetch(`/api/posts/${deletedId}`,{method:'DELETE'});
  if(!response.ok)throw Error('The post could not be deleted. Try again.');
  setId(null);
  const card=document.querySelector<HTMLElement>(`[data-desktop-post="${deletedId}"]`);
  if(card&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const animation=card.animate([{height:`${card.offsetHeight}px`,opacity:1},{height:'0px',opacity:0}],{duration:200,easing:'ease',fill:'forwards'});card.style.overflow='hidden';await animation.finished.catch(()=>{});}
  window.dispatchEvent(new CustomEvent('post-deleted',{detail:{id:deletedId}}));
  setToast({id:deletedId,post});if(pathname.startsWith('/posts/'))router.replace('/');router.refresh();
 }catch(cause){setError(cause instanceof Error?cause.message:'The post could not be deleted.');}finally{lock.current=false;setBusy(false);}};
 const undo=async()=>{if(!toast)return;try{const response=await fetch(`/api/posts/${toast.id}/restore`,{method:'POST'});if(!response.ok)throw Error('The post could not be restored. Try Recently deleted.');window.dispatchEvent(new CustomEvent('post-restore',{detail:toast}));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:'The post could not be restored.');}finally{setToast(null);}};
 const post=selectedPost,caption=post?.caption||post?.items[0]?.name||'Meal';
 const weekday=post?new Intl.DateTimeFormat('en-US',{weekday:'long'}).format(new Date(post.eaten_at)):'';
 const calories=post?sumNutrition(post.items).calories:null;
 return <><Sheet confirmation open={Boolean(id)} onClose={()=>{if(!lock.current)setId(null);}} label="Delete this post?">
  <h2 className="pt-2 text-sheet-head">Delete this post?</h2><p className="text-[15px] leading-[1.5] text-muted">“{caption}” and its photos, comments and record are removed.{post&&<> {weekday}’s consumed total {calories===null?'will be updated.':<>goes down by {formatCalories(calories)} kcal.</>}</>}</p>
  {post?.saved_meal_id&&<p className="text-[15px] leading-[1.5] text-muted">The saved meal “{caption}” is not affected.</p>}
  {error&&<p role="alert" className="text-meta text-muted">{error}</p>}
  <button type="button" disabled={busy} onClick={()=>void remove()} className="mt-2 h-12 rounded-field text-[15px] font-semibold text-white disabled:opacity-50" style={{background:'oklch(0.52 0.17 25)'}}>{busy?'Deleting…':'Delete post'}</button>
  <button type="button" disabled={busy} onClick={()=>setId(null)} className="h-12 rounded-field text-[15px] font-semibold">Cancel</button>
 </Sheet>{error&&!id&&<div role="alert" className="fixed inset-x-inset bottom-[100px] z-[80] rounded-card bg-text p-4 text-detail text-surface">{error}<button onClick={()=>setError('')} className="ml-3">Dismiss</button></div>}{toast&&<UndoToast key={toast.id} text="Post deleted" onUndo={undo} ms={4000}/>}</>;
}
