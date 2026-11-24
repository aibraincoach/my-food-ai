'use client';
import {DisplayError} from '@/i18n/display-error';
import {useApiFailureText} from '@/i18n/api-error-text';
import {useTranslations} from 'next-intl';
import {servingsMessageValues} from '@/i18n/servings';
import type {FeedPost} from '@/lib/posts/feed';
import type {PostPresentation} from '@/lib/posts/summary-line';
import {usePostHandle,usePostAuthor} from '@/components/PostHandle';
import Avatar from '@/components/Avatar';
import {useLocalDate,useLocalTime} from '@/components/LocalTime';
import PostMenu,{type PostMenuRow} from '@/components/PostMenu';
import {useRouter} from 'next/navigation';
import {useRef,useState} from 'react';
import {MAX_SERVINGS,MIN_SERVINGS,parseServings,servingsLabel,stepServings} from '@/lib/posts/servings';

const SERVING_CHIPS = [
  { value: 0.25, label: '¼' },
  { value: 0.5, label: '½' },
  { value: 1, label: '1' },
  { value: 1.5, label: '1½' },
  { value: 2, label: '2' },
] as const;

function HeaderServings({postId,servings}:{postId:string;servings:number}) {
  const apiError=useApiFailureText();
 const t=useTranslations('postMenu');
  const servingText=(value:number)=>t('servingAmount',servingsMessageValues(value));
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  const busyRef=useRef(false);
  const [saved,setSaved]=useState(servings);
  const [draft,setDraft]=useState(servingsLabel(servings));
  const [error,setError]=useState('');
  const submit=async(next:number)=>{
    if(busyRef.current||next===saved)return;
    busyRef.current=true;setBusy(true);setError('');
    try{
      const response=await fetch(`/api/posts/${postId}/servings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({servings:next})});
      if(!response.ok)throw new DisplayError(apiError((await response.json().catch(()=>null)),"route_bbb2ee989003"));
      setSaved(next);setDraft(servingsLabel(next));
      window.dispatchEvent(new CustomEvent('post-updated',{detail:{id:postId}}));
      router.refresh();
    }catch(e){setDraft(servingsLabel(saved));setError(e instanceof DisplayError?e.message:t('servingsFailed'));}
    finally{busyRef.current=false;setBusy(false);}
  };
  const applyDraft=()=>{
    const next=parseServings(draft);
    if(next===null){setDraft(servingsLabel(saved));setError(t('servingsRange'));return;}
    setDraft(servingsLabel(next));setError('');
    if(next!==saved)void submit(next);
  };
  if(!open){
    // #1134: a 44 px tap target whose negative margin keeps the header row's height; the name says the count it edits.
    return <button type="button" aria-label={t('editServings',{amount:servingText(saved)})} disabled={busy} onClick={()=>{setOpen(true);setDraft(servingsLabel(saved));setError('');}} className="-my-3 min-h-tap shrink-0 text-handle tabular-nums disabled:opacity-50">{servingText(saved)} <span className="text-muted" aria-hidden>✎</span></button>;
  }
  return <div className="flex max-w-[min(100%,14rem)] flex-col items-end gap-1">
    <div className="flex items-center gap-1">
      <button type="button" aria-label={t('fewerServings')} disabled={busy||saved<=MIN_SERVINGS} onClick={()=>{const next=stepServings(saved,-1);setDraft(servingsLabel(next));void submit(next);}} className="min-h-tap min-w-tap text-detail disabled:opacity-50">−</button>
      <input type="text" inputMode="decimal" aria-label={t('servingsCount')} value={draft} onChange={event=>setDraft(event.currentTarget.value)} disabled={busy} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();applyDraft();}if(event.key==='Escape'){event.preventDefault();setOpen(false);setDraft(servingsLabel(saved));setError('');}}} onBlur={applyDraft} className="h-tap w-14 rounded-field border border-line bg-white text-center text-detail tabular-nums disabled:opacity-50"/>
      <button type="button" aria-label={t('moreServings')} disabled={busy||saved>=MAX_SERVINGS} onClick={()=>{const next=stepServings(saved,1);setDraft(servingsLabel(next));void submit(next);}} className="min-h-tap min-w-tap text-detail disabled:opacity-50">+</button>
      <button type="button" aria-label={t('closeServings')} onClick={()=>{setOpen(false);setDraft(servingsLabel(saved));setError('');}} className="min-h-tap px-1 text-meta text-muted">{t('done')}</button>
    </div>
    <div className="flex flex-wrap justify-end gap-1">{SERVING_CHIPS.map(chip=><button key={chip.label} type="button" disabled={busy} onClick={()=>{setDraft(chip.label);void submit(chip.value);}} className="h-8 min-w-8 rounded-field border border-line px-2 text-meta tabular-nums disabled:opacity-50">{chip.label}</button>)}</div>
    {error?<p role="alert" className="text-meta text-muted">{error}</p>:null}
  </div>;
}

export default function PostDetailHeader({post,postId,caption,eatenAt,handle:providedHandle,gtin,rows,saved=false,status,readOnly=false,servings,showServings=false}:{post?:FeedPost;postId:string;caption:string;eatenAt:string;handle?:string;gtin?:string|null;rows?:PostMenuRow[];saved?:boolean;status?:string;readOnly?:boolean;servings?:number;showServings?:boolean}) {
 const t=useTranslations('post'),tm=useTranslations('postMenu');
 const row=post as PostPresentation|undefined;
 const author=usePostAuthor(row?.user_id?{userId:row.user_id,handle:row.handle??'',avatarMediaId:row.avatar_media_id??null}:null);
 const handle=usePostHandle(providedHandle??row?.handle,author.userId?{userId:author.userId,handle:author.handle,avatarMediaId:author.avatarMediaId}:null);
 const date=useLocalDate(eatenAt);const time=useLocalTime(eatenAt);
 return <div className="flex min-h-[52px] items-center gap-[10px] px-inset">
  <Avatar handle={handle} userId={author.userId} mediaId={author.avatarMediaId} sizePx={32} textClassName="text-avatar"/>
  <div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-center gap-2"><p data-i18n-stored="handle" className="min-w-0 [overflow-wrap:break-word] text-handle">{handle}</p>{showServings&&servings!=null?<HeaderServings key={`${postId}:${servings}`} postId={postId} servings={servings}/>:null}</div><p className="text-label text-muted">{tm('dateTime',{date,time})}</p></div>
  <PostMenu postId={postId} caption={caption} eatenAt={eatenAt} gtin={gtin} rows={[...(status==='ready'&&!readOnly?[{label:t('addPhoto'),onSelect:()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:false}}))}]:[]),{label:t('eatAgain'),onSelect:()=>window.dispatchEvent(new CustomEvent('log-again',{detail:{postId}}))},{label:saved?t('unsave'):t('saveMeal'),disabled:!saved&&(post?.status??status)!=='ready',onSelect:()=>window.dispatchEvent(new CustomEvent('save-meal',{detail:{postId}}))},...(rows??[]),{label:t('delete'),muted:true,onSelect:()=>window.dispatchEvent(new CustomEvent('delete-post',{detail:{id:postId,post}}))}]}/>
 </div>;
}
