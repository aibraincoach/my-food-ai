"use client";
import {useState} from "react";
import {tokens} from "@/lib/theme/tokens";
export type Slide = {url:string;kind?:"photo"|"card"};
export default function Carousel({slides,caption}:{slides:Slide[];caption:string}) {
  const [index,setIndex]=useState(0);
  return <div className="relative">
    <div className="flex snap-x snap-mandatory overflow-x-auto" onScroll={event=>{
      const element=event.currentTarget;
      setIndex(Math.round(element.scrollLeft/element.clientWidth));
    }} aria-label="Meal photos" tabIndex={0}>
      {slides.map((slide,i)=><div key={`${slide.url}-${i}`} className="aspect-square w-full shrink-0 snap-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.url} alt={slide.kind==="card"?"Consumed nutrition":caption||`Meal photo ${i+1}`} className="h-full w-full object-cover" />
      </div>)}
    </div>
    {slides.length>1&&<>
      <span className="absolute right-sheet-top top-sheet-top rounded-tile bg-overlay px-2 text-meta text-surface" aria-live="polite">{Math.min(index+1,slides.length)}/{slides.length}</span>
      <div className="flex justify-center gap-2 py-2" aria-hidden="true">{slides.map((_,i)=><span key={i} className={`rounded-circle ${i===index?'bg-text':'bg-ring'}`} style={{width:tokens.radii.chip,height:tokens.radii.chip}} />)}</div>
    </>}
  </div>;
}
