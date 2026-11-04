'use client';
import { formatCalories } from "@/lib/nutrition/totals";
import {useCallback,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {shiftDay,withZone,type FeedDayTotal,type MonthDay} from '@/lib/posts/days';
import {bubbleLinkClass} from '@/lib/posts/bubble';
import {Icon} from '@/components/ui/Icon';
// Design 7c/7d: Today first, older days to the right; the row scrolls back in
// time one ring at a time and never moves the feed. The first 30 days are
// drawn at once; 30 more load within five rings of the end, ending at the
// first post. The server supplies the first six totals; older rings read the
// month summaries only after the row is first scrolled.
const FIRST_LOAD=30,LOAD_MORE=30,NEAR_END=5,RING_STEP=72;
function daysBetween(from:string,to:string){return Math.round((Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86_400_000);}
export default function DayRings({days,totals,today,zone,zoneKnown,ownerId,earliest=null,pending=false}:{pending?:boolean;ownerId?:string|null;days:{date:string}[];totals:FeedDayTotal[];today:string;zone:string;zoneKnown:boolean;earliest?:string|null}) {
 const router=useRouter();
 const [snapshot,setSnapshot]=useState({seed:totals,days:totals,ready:!pending});
 const [count,setCount]=useState(FIRST_LOAD);
 const [touched,setTouched]=useState(false);
 const [loaded,setLoaded]=useState<Record<string,MonthDay>>({});
 const months=useRef(new Set<string>());
 const row=useRef<HTMLElement>(null);
 const currentTotals=snapshot.seed===totals?snapshot.days:totals;
 const waiting=pending&&!snapshot.ready;
 // The row always holds the first 30 days; past them it ends at the first post.
 const span=earliest?Math.max(FIRST_LOAD,daysBetween(earliest,today)+1):Number.MAX_SAFE_INTEGER;
 const limit=Math.min(count,span);
 useEffect(()=>{
  const receive=(event:Event)=>{const detail=(event as CustomEvent<{userId:string;days:FeedDayTotal[];fresh?:boolean}>).detail;
   if(ownerId&&detail?.userId===ownerId&&Array.isArray(detail.days)&&detail.fresh!==false)setSnapshot({seed:totals,days:detail.days,ready:true});
  };
  window.addEventListener('feed-day-totals',receive);
  window.dispatchEvent(new CustomEvent('feed-day-totals-request'));
  return()=>window.removeEventListener('feed-day-totals',receive);
 },[ownerId,totals]);
 useEffect(()=>{if(pending&&!zoneKnown)return;const local=Intl.DateTimeFormat().resolvedOptions().timeZone;if(local&&local!==zone){document.cookie=`time-zone=${encodeURIComponent(local)}; Path=/; SameSite=Lax; Max-Age=31536000`;router.refresh();}},[router,zone,pending,zoneKnown]);
 // Home tapped while on Home returns the row to Today (7d).
 useEffect(()=>{const reset=()=>row.current?.scrollTo({left:0,behavior:'smooth'});window.addEventListener('home-reset',reset);return()=>window.removeEventListener('home-reset',reset);},[]);
 const loadMonth=useCallback(async(month:string)=>{
  if(months.current.has(month))return;months.current.add(month);
  try{const response=await fetch(`/api/days?month=${month}${zoneKnown?`&tz=${encodeURIComponent(zone)}`:''}`,{credentials:'same-origin'});if(!response.ok)throw new Error('month');const summary=await response.json() as {days:MonthDay[]};setLoaded(previous=>{const next={...previous};for(const day of summary.days)next[day.day]=day;return next;});}
  catch{months.current.delete(month);}
 },[zone,zoneKnown]);
 useEffect(()=>{
  if(!touched||!ownerId)return;
  const first=shiftDay(today,-(limit-1));const wanted=new Set<string>();
  for(let month=first.slice(0,7);month<=today.slice(0,7);month=shiftDay(`${month}-28`,7).slice(0,7))wanted.add(month);
  for(const month of wanted)void loadMonth(month);
 },[touched,ownerId,limit,today,loadMonth]);
 const onScroll=()=>{const element=row.current;if(!element)return;if(!touched)setTouched(true);if(element.scrollLeft+element.clientWidth>=element.scrollWidth-NEAR_END*RING_STEP&&limit<span)setCount(value=>Math.min(value+LOAD_MORE,span));};
 const todayAction=()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'camera'}}));
 return <nav ref={row} aria-label="Days" onScroll={onScroll} onPointerDown={()=>{if(!touched)setTouched(true);}} className="desktop:hidden flex gap-[10px] overflow-x-auto snap-x snap-mandatory scroll-pl-inset overscroll-x-contain px-inset pt-[2px] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
  {Array.from({length:limit},(_,index)=>{
   const day=shiftDay(today,-index),month=loaded[day];
   const total=currentTotals.find(entry=>entry.day===day)??(month?{day,kcal:month.kcal,ready:month.ready,missing:month.missing}:undefined);
   const hasDay=total?total.ready:month?month.posts>0:days.some(entry=>entry.date===day);
   const parts=new Intl.DateTimeFormat('en-US',{weekday:'short',day:'numeric',timeZone:'UTC'}).formatToParts(new Date(`${day}T12:00:00Z`));
   const label=waiting?(index===0?'Today':'—'):index===0?'Today':`${parts.find(part=>part.type==='weekday')?.value} ${parts.find(part=>part.type==='day')?.value}`;
   const content=<><span className={`relative flex size-[56px] items-center justify-center rounded-circle border-2 p-[3px] ${index===0||hasDay?'border-text':'border-ring'}`}>
    <span className={`flex size-full items-center justify-center rounded-circle text-meta font-medium tabular-nums ${index===0||hasDay?'bg-card':''}`}>{total?.ready&&total.kcal!==null?formatCalories(total.kcal):''}</span>
    {index===0&&<span className="absolute -right-[3px] -bottom-[3px] flex size-[22px] items-center justify-center rounded-circle border-2 border-surface bg-text text-surface"><Icon name="plus" size={12} strokeWidth={3}/></span>}
   </span><span className={`text-label ${index===0?'text-text':bubbleLinkClass(hasDay)}`}>{label}</span></>;
   const dayLabel=`${label}, ${waiting?'updating':hasDay?(total?.kcal==null?'nutrition unavailable':`${formatCalories(total.kcal)} kcal consumed`):'no posts'}`;
   const className='flex w-[62px] shrink-0 snap-start flex-col items-center gap-[5px]';
   return index===0?<button key={day} type="button" aria-label="Photograph a meal today" onClick={todayAction} className={className}>{content}</button>:hasDay?<Link key={day} aria-label={dayLabel} href={withZone(`/days/${day}`,zone,zoneKnown)} className={className}>{content}</Link>:<span key={day} aria-label={dayLabel} className={className}>{content}</span>;
  })}
 </nav>;
}
