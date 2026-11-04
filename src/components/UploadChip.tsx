/* eslint-disable @next/next/no-img-element -- Private owner images bypass paid optimization. */
'use client';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname,useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {uploadManager} from '@/lib/posts/upload-manager';
import {useUploads} from './useUploads';
import UploadBar from './UploadBar';
export default function UploadChip({sidebar=false}:{sidebar?:boolean}){
 const pathname=usePathname(),router=useRouter(),all=useUploads().filter(upload=>upload.posted&&!upload.postId);
 const [slot,setSlot]=useState<HTMLElement|null>(null);
 useEffect(()=>{
  if(sidebar)return;
  const media=window.matchMedia('(min-width:1024px)');
  const update=()=>setSlot(media.matches?document.getElementById('desktop-upload-slot'):null);
  // Layout commits and pathname changes already provide the sidebar slot. Phone
  // typing, progress bars and feed updates need no document-wide observation.
  update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[pathname,sidebar]);
 const inSidebar=sidebar||Boolean(slot);
 // Home renders new posts as cards on phones; the desktop sidebar keeps every upload.
 const uploads=pathname==='/'&&!inSidebar?all.filter(upload=>upload.attachment):all;
 useEffect(()=>{const db=createClient();void db.auth.getUser().then(({data})=>{if(data.user)void uploadManager.initialize(data.user.id);});const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')void uploadManager.clear();else if(session?.user.id)void uploadManager.initialize(session.user.id);});const removed=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;for(const upload of uploadManager.list())if(upload.postId===id)void uploadManager.remove(upload.operationId);};window.addEventListener('post-deleted',removed);window.addEventListener('post-unavailable',removed);window.addEventListener('online',uploadManager.online);return()=>{subscription.unsubscribe();window.removeEventListener('post-deleted',removed);window.removeEventListener('post-unavailable',removed);window.removeEventListener('online',uploadManager.online);};},[]);
 if(!uploads.length||(!inSidebar&&pathname==='/'&&!uploads.some(upload=>upload.attachment)))return null;
 const first=uploads[0],failed=uploads.find(upload=>upload.state==='failed');const upload=failed??first;
 const view=()=>{if(upload.attachment){router.push(`/posts/${upload.attachment.postId}`);return;}router.push('/');setTimeout(()=>document.querySelector(`[data-upload-id="${upload.operationId}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),300);};
 const chip=<aside aria-label="Pending posts" className={`overflow-hidden rounded-card bg-surface shadow-pill ${inSidebar?'relative mx-3':'fixed inset-x-6 z-40 mx-auto max-w-[342px]'}`} style={{boxShadow:'var(--color-shadow-pill)',...(!inSidebar?{bottom:'calc(96px + env(safe-area-inset-bottom))'}:{})}}><div className="flex h-14 items-center gap-3 px-3">{upload.previewUrl&&<img src={upload.previewUrl} alt="" className="size-10 rounded-thumb object-cover"/>}<div className="min-w-0 flex-1"><p className="truncate text-body font-semibold">{uploads.length>1?`Uploading ${uploads.length} posts…`:upload.caption||'New post'}</p>{failed?<button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?'Not confirmed · Try again':'Not saved · Try again'}</button>:<p className="text-detail text-muted">{upload.kind?(upload.removing?'Removing pending post…':upload.kind==='copy'?'Saving copy…':upload.kind==='drink'?'Saving drink…':'Saving food…'):(upload.text?'Posting caption…':upload.attachment?(upload.attachment.notEaten?'Adding leftovers photo…':'Adding photo…'):'Uploading photo…')}</p>}</div><button className="min-h-tap px-2 text-body font-semibold" onClick={view}>View</button></div><UploadBar upload={upload}/></aside>;

 return slot?createPortal(chip,slot):chip;
}
