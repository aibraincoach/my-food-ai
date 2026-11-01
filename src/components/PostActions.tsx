'use client';
import Link from 'next/link';
import ThumbsFeedback from '@/components/ThumbsFeedback';
import { Icon } from '@/components/ui/Icon';
export function postAction(name:string,postId:string) { window.dispatchEvent(new CustomEvent(name,{detail:{postId}})); }
export default function PostActions({postId,modelCommentId,fingerprint,drink=false,saved=false,slides=1,index=0}:{postId:string;modelCommentId:string|null;fingerprint:string|null;drink?:boolean;saved?:boolean;slides?:number;index?:number}) {
  return <div className="relative flex items-center gap-[18px] px-inset pt-[10px] pb-1">
    {!drink && <ThumbsFeedback postId={postId} modelCommentId={modelCommentId} fingerprint={fingerprint} compact />}
    <Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct" className="flex h-tap items-center active:opacity-50"><Icon name="comment" /></Link>
    <button type="button" aria-label="Log again" className="flex h-tap items-center active:opacity-50" onClick={()=>postAction('log-again',postId)}><Icon name="log-again" /></button>
    {slides>1&&<div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 gap-[5px]" aria-hidden="true">{Array.from({length:slides},(_,i)=><span key={i} className={`size-[6px] rounded-circle ${i===index?'bg-text':'bg-ring'}`} />)}</div>}
    <button type="button" aria-label={saved?'Unsave meal':'Save meal'} aria-pressed={saved} className="ml-auto flex h-tap items-center active:opacity-50" onClick={()=>postAction('save-meal',postId)}><Icon name="bookmark" active={saved} /></button>
  </div>;
}
