"use client";
import {useRef,useState,type ReactNode} from 'react';
import Link from 'next/link';
import DoubleTap from '@/components/DoubleTap';
export type Slide={url:string;kind?:'photo'|'card';not_eaten?:boolean};
export default function Carousel({slides,caption,postId,href,modelCommentId,fingerprint,nutrition,onIndexChange,canAddNotEaten=false}:{slides:Slide[];caption:string;postId:string;href?:string;modelCommentId:string|null;fingerprint:string|null;nutrition:ReactNode;onIndexChange?:(index:number)=>void;canAddNotEaten?:boolean}) {
 const [index,setIndex]=useState(0);
 const rail=useRef<HTMLDivElement>(null);
 const move=(step:number)=>{const element=rail.current;if(!element)return;const next=Math.max(0,Math.min(slides.length+(canAddNotEaten?1:0)-1,index+step));element.scrollTo({left:next*element.clientWidth,behavior:'smooth'});};
 return <div className="group relative">
  <div ref={rail} onKeyDown={event=>{if(!matchMedia("(min-width:1024px)").matches)return;if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();move(event.key==="ArrowRight"?1:-1);}}} className="flex snap-x snap-mandatory overflow-x-auto" onScroll={event=>{const element=event.currentTarget;const next=Math.round(element.scrollLeft/element.clientWidth);setIndex(next);onIndexChange?.(Math.min(next,slides.length-1));}} aria-label="Meal photos" tabIndex={0}>
   {slides.map((slide,i)=><div key={slide.kind==='card'?`card-${i}`:`${slide.url}-${i}`} className="relative aspect-square w-full shrink-0 snap-center">
    {slide.kind!=='card'?<DoubleTap postId={postId} href={href} modelCommentId={modelCommentId} fingerprint={fingerprint}>
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={slide.url} alt={caption||`Meal photo ${i+1}`} className="h-full w-full object-cover"/>
     </DoubleTap>:href?<Link href={href} aria-label="Open meal details" className="block size-full">{nutrition}</Link>:nutrition}
    {slide.not_eaten&&<span className="absolute bottom-3 left-3 rounded-field bg-text px-3 py-[6px] text-slide-label text-surface">leftovers (not eaten)</span>}
   </div>)}
   {canAddNotEaten&&<button type="button" onClick={()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera',forPost:postId,notEaten:true}}))} className="flex aspect-square w-full shrink-0 snap-center flex-col items-center justify-center gap-3 bg-surface text-text" aria-label="Add a photo of leftovers (not eaten)"><span className="flex size-16 items-center justify-center rounded-card border-[1.5px] border-dashed border-ring text-[28px]">+</span><span className="text-body">Add a photo</span><span className="text-detail text-muted">leftovers (not eaten)</span></button>}
  </div>
  {slides.length>1&&<><button type="button" aria-label="Previous slide" disabled={index===0} onClick={()=>move(-1)} className="absolute left-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-overlay text-xl text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">‹</button><button type="button" aria-label="Next slide" disabled={index>=slides.length-1} onClick={()=>move(1)} className="absolute right-3 top-1/2 hidden size-8 -translate-y-1/2 items-center justify-center rounded-circle bg-overlay text-xl text-surface opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 disabled:invisible desktop:flex">›</button></>}
  {slides.length>1&&index<slides.length&&<span className="absolute right-3 top-3 rounded-tile bg-overlay px-2 text-meta text-surface" aria-live="polite">{Math.min(index+1,slides.length)}/{slides.length}</span>}
 </div>;
}
