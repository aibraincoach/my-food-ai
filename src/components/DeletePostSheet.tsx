'use client';
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatDate,formatEnergy} from '@/i18n/format';
import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import type {FeedPost} from '@/lib/posts/feed';
import {sumNutrition} from '@/lib/nutrition/totals';
import {Sheet} from '@/components/ui/Sheet';
import UndoToast from '@/components/UndoToast';
export default function DeletePostSheet(){
 const t=useTranslations('postMenu'),locale=useLocale() as Locale;
 const router=useRouter(),pathname=usePathname();
 const [id,setId]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [toast,setToast]=useState<{id:string;post?:FeedPost}|null>(null);
 const lock=useRef(false);const [selectedPost,setSelectedPost]=useState<FeedPost|undefined>(undefined);
 useEffect(()=>{const open=(event:Event)=>{const detail=(event as CustomEvent<{id:string;post?:FeedPost}>).detail;if(typeof detail?.id==='string'){setSelectedPost(detail.post);setId(detail.id);setError('');}};window.addEventListener('delete-post',open);return()=>window.removeEventListener('delete-post',open);},[]);
 const remove=async()=>{if(!id||lock.current)return;lock.current=true;setBusy(true);setError('');const deletedId=id,post=selectedPost;
 try{
  const response=await fetch(`/api/posts/${deletedId}`,{method:'DELETE'});
  if(!response.ok)throw Error(t('deleteFailedRetry'));
  setId(null);
  const card=document.querySelector<HTMLElement>(`[data-desktop-post="${deletedId}"]`);
  if(card&&!matchMedia('(prefers-reduced-motion: reduce)').matches){const animation=card.animate([{height:`${card.offsetHeight}px`,opacity:1},{height:'0px',opacity:0}],{duration:200,easing:'ease',fill:'forwards'});card.style.overflow='hidden';await animation.finished.catch(()=>{});}
  window.dispatchEvent(new CustomEvent('post-deleted',{detail:{id:deletedId}}));
  setToast({id:deletedId,post});if(pathname.startsWith('/posts/'))router.replace('/');router.refresh();
 }catch(cause){setError(cause instanceof Error?cause.message:t('deleteFailed'));}finally{lock.current=false;setBusy(false);}};
 const undo=async()=>{if(!toast)return;try{const response=await fetch(`/api/posts/${toast.id}/restore`,{method:'POST'});if(!response.ok)throw Error(t('restoreFailedRecently'));window.dispatchEvent(new CustomEvent('post-restore',{detail:toast}));router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:t('restoreFailed'));}finally{setToast(null);}};
 const post=selectedPost,caption=post?.caption||post?.items[0]?.name||t('meal');
 const weekday=post?formatDate(locale,new Date(post.eaten_at),Intl.DateTimeFormat().resolvedOptions().timeZone,{weekday:'long'}):'';
 const calories=post?sumNutrition(post.items).calories:null;
 return <><Sheet confirmation open={Boolean(id)} onClose={()=>{if(!lock.current)setId(null);}} label={t('deleteTitle')}>
  <h2 className="pt-2 text-sheet-head">{t('deleteTitle')}</h2><p className="text-[15px] leading-[1.5] text-muted">{t('deleteDescription',{caption})}{post&&<> {calories===null?t('deleteTotalUpdated',{weekday}):t('deleteTotalReduced',{weekday,amount:formatEnergy(locale,calories)})}</>}</p>
  {post?.saved_meal_id&&<p className="text-[15px] leading-[1.5] text-muted">{t('savedUnaffected',{caption})}</p>}
  {error&&<p role="alert" className="text-meta text-muted">{error}</p>}
  <button type="button" disabled={busy} onClick={()=>void remove()} className="mt-2 h-12 rounded-field text-[15px] font-semibold text-white disabled:opacity-50" style={{background:'oklch(0.52 0.17 25)'}}>{busy?t('deleting'):t('deletePost')}</button>
  <button type="button" disabled={busy} onClick={()=>setId(null)} className="h-12 rounded-field text-[15px] font-semibold">{t('cancel')}</button>
 </Sheet>{error&&!id&&<div role="alert" className="fixed inset-x-inset bottom-[100px] z-[80] rounded-card bg-text p-4 text-detail text-surface">{error}<button onClick={()=>setError('')} className="ml-3">{t('dismiss')}</button></div>}{toast&&<UndoToast key={toast.id} text={t('postDeleted')} onUndo={undo} ms={4000}/>}</>;
}
