'use client';
import {useEffect,useRef,useState} from 'react';
import {tokens} from '@/lib/theme/tokens';
import {useLocalTime} from '@/components/LocalTime';

// Historical card pixels contain a UTC clock. Cover that header in the app,
// without rewriting the saved original, and render the viewing device's clock.
export function NutritionImage({url,eatenAt,label,alt='Consumed nutrition'}:{url:string;eatenAt:string;label?:string;alt?:string}){
 const ref=useRef<HTMLDivElement>(null);const [width,setWidth]=useState<number>(tokens.spacing.phone);
 const time=useLocalTime(eatenAt);
 useEffect(()=>{if(!ref.current)return;const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width>0)setWidth(entry.contentRect.width);});observer.observe(ref.current);return()=>observer.disconnect();},[]);
 const scale=width/tokens.spacing.phone;const meta=tokens.typography.meta;
 return <div ref={ref} className="relative h-full w-full overflow-hidden bg-card">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img src={url} alt={alt} className="h-full w-full object-cover" />
  <div className="absolute inset-x-0 top-0 bg-card text-muted" style={{height:(tokens.spacing['card-padding']+meta.size*meta.leading+5)*scale,padding:tokens.spacing['card-padding']*scale,paddingBottom:0,fontSize:meta.size*scale,fontWeight:meta.weight,lineHeight:meta.leading,letterSpacing:tokens.card.labelTracking*scale,textTransform:'uppercase',boxSizing:'border-box'}}>
   {label}{label&&time?' · ':''}{time}
  </div>
 </div>;
}
