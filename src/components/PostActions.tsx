'use client';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {tokens} from '@/lib/theme/tokens';
import ThumbsFeedback from '@/components/ThumbsFeedback';
import { Icon } from '@/components/ui/Icon';
export function postAction(name:string,postId:string) { window.dispatchEvent(new CustomEvent(name,{detail:{postId}})); }
export default function PostActions({postId,modelCommentId,fingerprint,drink=false,saved=false,slides=1,index=0,detail=false}:{postId:string;modelCommentId:string|null;fingerprint:string|null;drink?:boolean;saved?:boolean;slides?:number;index?:number;detail?:boolean}) {
  const ref=useRef<HTMLDivElement>(null),[width,setWidth]=useState<number>(tokens.spacing.phone);
  useEffect(()=>{const element=ref.current;if(!element)return;const measure=()=>setWidth(element.getBoundingClientRect().width);measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();},[]);
  const controlsRight=16+(drink?66:150);
  const dotWidth=Math.min(11*slides-5,Math.max(0,width-controlsRight-56));
  const dotCenter=Math.max(controlsRight+8+dotWidth/2,Math.min(width/2,width-48-dotWidth/2));
  return <div ref={ref} className={`relative flex items-center gap-[18px] px-inset pt-[10px] ${detail?"pb-[6px]":"pb-1"}`}>
    {!drink && <ThumbsFeedback postId={postId} modelCommentId={modelCommentId} fingerprint={fingerprint} compact />}
    <Link href={`/posts/${postId}?reply=1`} aria-label="Comment or correct" className="flex h-6 items-center active:opacity-50"><Icon name="comment" /></Link>
    <button type="button" aria-label="Log again" className="flex h-6 items-center active:opacity-50" onClick={()=>postAction('log-again',postId)}><Icon name="log-again" /></button>
    {slides>1&&<div className="pointer-events-none absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-[5px] overflow-hidden" style={{left:dotCenter,width:dotWidth}} aria-hidden="true">{Array.from({length:slides},(_,i)=><span key={i} className={`size-[6px] shrink-0 rounded-circle ${i===index?'bg-text':'bg-ring'}`} />)}</div>}
    <button type="button" aria-label={saved?'Unsave meal':'Save meal'} aria-pressed={saved} className="ml-auto flex h-6 items-center active:opacity-50" onClick={()=>postAction('save-meal',postId)}><Icon name="bookmark" active={saved} /></button>
  </div>;
}
