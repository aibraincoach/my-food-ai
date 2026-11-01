'use client';
import {useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {shiftDay,withZone,type FeedDayTotal} from '@/lib/posts/days';
import {bubbleLinkClass} from '@/lib/posts/bubble';
import {Icon} from '@/components/ui/Icon';
export default function DayRings({days,totals,today,zone,zoneKnown}:{days:{date:string}[];totals:FeedDayTotal[];today:string;zone:string;zoneKnown:boolean}) {
 const router=useRouter();
 useEffect(()=>{const local=Intl.DateTimeFormat().resolvedOptions().timeZone;if(local&&local!==zone){document.cookie=`time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;router.refresh();}},[router,zone]);
 const todayAction=()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera'}}));
 return <nav aria-label="Last five days" className="flex gap-[14px] overflow-hidden px-inset pt-[2px] pb-2">
  {Array.from({length:5},(_,index)=>{
   const day=shiftDay(today,-index),hasDay=days.some(entry=>entry.date===day),total=totals.find(entry=>entry.day===day);
   const label=index===0?'Today':new Intl.DateTimeFormat('en-US',{weekday:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${day}T12:00:00Z`));
   const content=<><span className={`relative flex size-[56px] items-center justify-center rounded-circle border-2 p-[3px] ${index===0||hasDay?'border-text':'border-ring'}`}>
    <span className={`flex size-full items-center justify-center rounded-circle text-meta font-medium tabular-nums ${index===0||hasDay?'bg-card':''}`}>{total?.ready&&total.kcal!==null?Math.round(total.kcal).toLocaleString('en-US'):''}</span>
    {index===0&&<span className="absolute -right-[3px] -bottom-[3px] flex size-[22px] items-center justify-center rounded-circle border-2 border-surface bg-text text-surface"><Icon name="plus" size={12} strokeWidth={3}/></span>}
   </span><span className={`text-label ${index===0?'text-text':bubbleLinkClass(hasDay)}`}>{label}</span></>;
   const dayLabel=`${label}, ${hasDay?(total?.kcal==null?'nutrition unavailable':`${Math.round(total.kcal)} kcal consumed`):'no posts'}`;
   const className='flex w-[66px] shrink-0 flex-col items-center gap-[5px]';
   return index===0?<button key={day} type="button" aria-label="Photograph a meal today" onClick={todayAction} className={className}>{content}</button>:hasDay?<Link key={day} aria-label={dayLabel} href={withZone(`/days/${day}`,zone,zoneKnown)} className={className}>{content}</Link>:<span key={day} aria-label={dayLabel} className={className}>{content}</span>;
  })}
 </nav>;
}
