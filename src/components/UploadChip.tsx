/* eslint-disable @next/next/no-img-element -- Private owner images bypass paid optimization. */
'use client';
import {captureFailureText} from '@/lib/posts/capture-failure';
import {useTranslations} from 'next-intl';
import {useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname,useRouter} from 'next/navigation';
import {createClient} from '@/lib/supabase/client';
import {uploadManager} from '@/lib/posts/upload-manager';
import {uploadTargetsPost} from '@/lib/posts/upload-target';
import {useUploads} from './useUploads';
import UploadBar from './UploadBar';
export default function UploadChip({sidebar=false}:{sidebar?:boolean}){
 const t=useTranslations('capture');
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
 // #684: a floating chip reserves its own height above the tab bar, so the page can scroll the meal it covers into view.
 const [box,setBox]=useState<HTMLElement|null>(null);
 useEffect(()=>{if(!box||inSidebar)return;const root=document.documentElement;const observer=new ResizeObserver(()=>root.style.setProperty('--mfa-chip-space',`${box.offsetHeight+14}px`));observer.observe(box);return()=>{observer.disconnect();root.style.removeProperty('--mfa-chip-space');};},[box,inSidebar]);
 // Home renders new posts as cards on phones; the desktop sidebar keeps every upload.
 // #1077: a pending photo must keep its refusal after the meal disappears; only its explicit Remove dismisses it.
 const uploads=pathname==='/'&&!inSidebar?all.filter(upload=>upload.attachment):all;
 useEffect(()=>{const db=createClient();void db.auth.getSession().then(({data:{session}})=>{if(session?.user)void uploadManager.initialize(session.user.id);});const {data:{subscription}}=db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')void uploadManager.clear();else if(session?.user.id)void uploadManager.initialize(session.user.id);});const removed=(event:Event)=>{const id=(event as CustomEvent<{id?:string}>).detail?.id;if(!id)return;for(const upload of uploadManager.list())if(uploadTargetsPost(upload,id)&&!upload.attachment)void uploadManager.remove(upload.operationId);};window.addEventListener('post-deleted',removed);window.addEventListener('post-unavailable',removed);window.addEventListener('online',uploadManager.online);return()=>{subscription.unsubscribe();window.removeEventListener('post-deleted',removed);window.removeEventListener('post-unavailable',removed);window.removeEventListener('online',uploadManager.online);};},[]);
 if(!uploads.length||(!inSidebar&&pathname==='/'&&!uploads.some(upload=>upload.attachment)))return null;
 const first=uploads[0],failed=uploads.find(upload=>upload.state==='failed');const upload=failed??first;
 const active=uploads.filter(upload=>upload.state!=='failed').length;
 const view=()=>{if(upload.attachment){router.push(`/posts/${upload.attachment.postId}`);return;}router.push('/');setTimeout(()=>document.querySelector(`[data-upload-id="${upload.operationId}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),300);};
 const chip=<aside ref={setBox} aria-label={t('pending_posts')} className={`overflow-hidden rounded-card bg-surface shadow-pill ${inSidebar?'relative mx-3':'fixed inset-x-6 z-40 mx-auto max-w-[342px]'}`} style={{boxShadow:'var(--color-shadow-pill)',...(!inSidebar?{bottom:'calc(96px + env(safe-area-inset-bottom))'}:{})}}><div className="flex min-h-14 items-center gap-3 px-3 py-2">{upload.previewUrl&&<img src={upload.previewUrl} alt="" className="size-10 rounded-thumb object-cover"/>}<div className="min-w-0 flex-1"><p className="truncate text-body font-semibold">{active>1?t('uploading_v0_posts', {v0: active}):upload.attachment?(upload.attachment.notEaten?t('leftovers'):t('addedPhoto')):upload.caption||t('new_post')}</p>{failed?(upload.photoLost?<>{upload.attachment?<button className="text-detail text-accent" onClick={()=>{void (async()=>{if(!upload.attachment)return;window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:upload.attachment.postId,notEaten:upload.attachment.notEaten}}));try{await uploadManager.remove(upload.operationId);}catch{/* camera is open; durable cleanup can finish later */}})();}}>{captureFailureText(upload.failure,t)??t('this_photo_was_not_kept_take_it')}</button>:<p role="alert" className="text-detail text-muted">{captureFailureText(upload.failure,t)}</p>}<button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(upload.operationId).catch(()=>{});}}>{t('remove')}</button></>:<><button className="text-detail text-accent" onClick={()=>uploadManager.retry(failed.operationId)}>{failed.kind==='copy'?t('not_confirmed_try_again'):t('not_saved_try_again')}</button>{(failed.attachment||failed.failureKind==='storage')&&captureFailureText(failed.failure,t)?<p role="alert" className="text-detail text-muted">{captureFailureText(failed.failure,t)}</p>:null}{failed.attachment?<button className="ml-3 text-detail text-muted" onClick={()=>{void uploadManager.remove(failed.operationId).catch(()=>{});}}>{t('remove')}</button>:null}</>):<p className="text-detail text-muted">{upload.kind?(upload.removing?t('removing_pending_post'):upload.kind==='copy'?t('saving_copy'):upload.kind==='drink'?t('saving_drink'):t('saving_food')):(upload.text?t('posting_caption'):upload.attachment?(upload.attachment.notEaten?t('adding_leftovers_photo'):t('adding_photo')):t('uploading_photo'))}</p>}</div><button className="min-h-tap px-2 text-body font-semibold" onClick={view}>{t('view')}</button></div><UploadBar upload={upload}/></aside>;

 return slot?createPortal(chip,slot):chip;
}
