"use client";
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {Sheet} from '@/components/ui/Sheet';
export default function DeletePostSheet(){
 const router=useRouter(),pathname=usePathname();
 const [id,setId]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[toast,setToast]=useState(false);
 const lock=useRef(false);
 useEffect(()=>{const open=(event:Event)=>{const id=(event as CustomEvent<{id:string}>).detail?.id;if(typeof id==='string'){setId(id);setError('');}};window.addEventListener('delete-post',open);return()=>window.removeEventListener('delete-post',open);},[]);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(false),3000);return()=>clearTimeout(timer);},[toast]);
 const remove=async()=>{if(!id||lock.current)return;lock.current=true;setBusy(true);setError('');try{
  const response=await fetch(`/api/posts/${id}`,{method:'DELETE'});
  if(!response.ok)throw Error('The post could not be deleted. Try again.');
  window.dispatchEvent(new CustomEvent('post-deleted',{detail:{id}}));setId(null);setToast(true);
  if(pathname.startsWith('/posts/'))router.replace('/');else router.refresh();
 }catch(cause){setError(cause instanceof Error?cause.message:'The post could not be deleted.');}finally{lock.current=false;setBusy(false);}};
 return <><Sheet open={Boolean(id)} onClose={()=>{if(!lock.current)setId(null);}} label="Delete this post?">
  <h2 className="text-sheet-head">Delete this post?</h2><p className="text-[15px] text-muted">Its photos and numbers are removed. This cannot be undone.</p>
  {error&&<p role="alert" className="text-meta text-muted">{error}</p>}
  <button type="button" disabled={busy} onClick={()=>void remove()} className="h-12 rounded-field text-[15px] text-white disabled:opacity-50" style={{background:'oklch(0.52 0.17 25)'}}>{busy?'Deleting…':'Delete post'}</button>
  <button type="button" disabled={busy} onClick={()=>setId(null)} className="h-12 rounded-field border border-hairline text-[15px]">Cancel</button>
 </Sheet>{toast&&<div role="status" className="fixed inset-x-inset bottom-[100px] z-[80] mx-auto flex h-[52px] max-w-phone items-center rounded-card bg-text px-4 text-comment text-surface">Post deleted</div>}</>;
}
