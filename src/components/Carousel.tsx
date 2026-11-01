"use client";
import {useState,type ReactNode} from 'react';
import Link from 'next/link';
import DoubleTap from '@/components/DoubleTap';
export type Slide={url:string;kind?:'photo'|'card';not_eaten?:boolean};
export default function Carousel({slides,caption,postId,href,modelCommentId,fingerprint,nutrition,onIndexChange}:{slides:Slide[];caption:string;postId:string;href?:string;modelCommentId:string|null;fingerprint:string|null;nutrition:ReactNode;onIndexChange?:(index:number)=>void}) {
 const [index,setIndex]=useState(0);
 return <div className="relative">
  <div className="flex snap-x snap-mandatory overflow-x-auto" onScroll={event=>{const element=event.currentTarget;const next=Math.round(element.scrollLeft/element.clientWidth);setIndex(next);onIndexChange?.(next);}} aria-label="Meal photos" tabIndex={0}>
   {slides.map((slide,i)=><div key={slide.kind==='card'?`card-${i}`:`${slide.url}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
    {slide.kind!=='card'?<DoubleTap postId={postId} href={href} modelCommentId={modelCommentId} fingerprint={fingerprint}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={slide.url} alt={caption||`Meal photo ${i+1}`} className="h-full w-full object-cover"/>
     </DoubleTap>:href?<Link href={href} aria-label="Open meal details" className="block size-full">{nutrition}</Link>:nutrition}
    {slide.not_eaten&&<span className="absolute bottom-3 left-3 rounded-field bg-text px-3 py-[6px] text-slide-label text-surface">Not eaten</span>}
   </div>)}
  </div>
  {slides.length>1&&<span className="absolute right-3 top-3 rounded-tile bg-overlay px-2 text-meta text-surface" aria-live="polite">{Math.min(index+1,slides.length)}/{slides.length}</span>}
 </div>;
}
