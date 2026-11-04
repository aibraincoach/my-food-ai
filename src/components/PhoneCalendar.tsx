"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {formatCalories} from '@/lib/nutrition/totals';
import {visibleMonth} from '@/lib/posts/visible-month';
import {tokens} from '@/lib/theme/tokens';
import type {MonthSummary} from '@/lib/posts/days';
import {formatDayKcal,monthName,postedLabel} from './MonthGrid';

type Props={months:Record<string,MonthSummary>;today:string;selected?:string;onDay:(date:string,cell:HTMLElement)=>void;onOlder?:()=>void};

const DISCLOSURE_ROW=24;
const HEADER_H=tokens.spacing.grid+18+tokens.spacing.grid/2+18+DISCLOSURE_ROW+4;

function documentOffset(el:HTMLElement){return el.getBoundingClientRect().top+window.scrollY;}

export default function PhoneCalendar({months,today,selected,onDay,onOlder}:Props){
 const ordered=Object.keys(months).sort();
 const key=ordered.join(',');
 const root=useRef<HTMLDivElement>(null),sentinel=useRef<HTMLDivElement>(null),headerRef=useRef<HTMLDivElement>(null);
 const anchor=useRef<{day:string;offset:number}|null>(null),opened=useRef(false);
 const [visible,setVisible]=useState(today.slice(0,7));
 const olderRef=useRef(onOlder);
 useEffect(()=>{olderRef.current=onOlder;});
 const hasOlder=Boolean(onOlder);
 const current=months[visible]??months[today.slice(0,7)];
 const unavailable=[...new Set(current?.days.flatMap(day=>day.missing??[])??[])];
 useLayoutEffect(()=>{
  const saved=anchor.current;if(!saved)return;anchor.current=null;
  const cell=root.current?.querySelector<HTMLElement>('[data-day="'+saved.day+'"]');
  if(!cell)return;
  const delta=documentOffset(cell)-saved.offset;
  if(delta)window.scrollBy({top:delta,behavior:'instant'});
 },[key]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   document.querySelector<HTMLElement>('[data-day="'+today+'"]')?.scrollIntoView({block:'center'});
   opened.current=true;
  });
  return()=>cancelAnimationFrame(frame);
 },[today]);
 useEffect(()=>{
  let raf=0;
  const update=()=>{
   raf=0;
   const line=headerRef.current?.getBoundingClientRect().bottom??0;
   const elements=root.current?.querySelectorAll<HTMLElement>('[data-month-start]');
   if(!elements?.length)return;
   const starts=Array.from(elements).map(el=>({month:el.dataset.monthStart!,top:el.getBoundingClientRect().top}));
   const next=visibleMonth(starts,line,today.slice(0,7));
   setVisible(prev=>prev===next?prev:next);
  };
  const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(update);};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  schedule();
  return()=>{window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(raf);};
 },[key,today]);
 useEffect(()=>{
  if(!hasOlder||!sentinel.current)return;
  const older=olderRef;
  const observer=new IntersectionObserver(entries=>{
   if(!opened.current||!entries.some(entry=>entry.isIntersecting))return;
   observer.disconnect();
   const day=ordered[0]+'-01';
   const cell=root.current?.querySelector<HTMLElement>('[data-day="'+day+'"]');
   if(cell)anchor.current={day,offset:documentOffset(cell)};
   older.current?.();
  });
  observer.observe(sentinel.current);return()=>observer.disconnect();
 },[key,hasOlder]);
 const first=ordered[0]?new Date(ordered[0]+'-01T12:00:00Z'):null;
 const dates:string[]=[];
 if(first){const end=new Date(today.slice(0,7)+'-01T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);for(const d=new Date(first);d<end;d.setUTCDate(d.getUTCDate()+1))dates.push(d.toISOString().slice(0,10));}
 return <div ref={root} style={{overflowAnchor:'none'}}>
  <div ref={headerRef} className="sticky z-10 bg-surface pb-1" style={{top:'calc(var(--spacing-top-h) + env(safe-area-inset-top))',height:HEADER_H}}>
   <div className="grid grid-cols-7 gap-1 px-tooltip-x" aria-hidden="true">{['S','M','T','W','T','F','S'].map((label,index)=><span key={index} className="text-center text-bubble text-faint">{label}</span>)}</div>
   <p className="px-screen-x text-meta text-muted" aria-live="polite">{monthName(visible,true)} · {postedLabel(current?.posted??0)}</p>
   <div className="relative px-screen-x" style={{height:DISCLOSURE_ROW}}>
    {unavailable.length?<details data-nutrition-disclosure className="absolute inset-x-0 top-0 z-10 bg-surface text-meta text-muted"><summary className="cursor-pointer">Known nutrition shown · Unavailable foods</summary><p className="mt-2">Nutrition unavailable: {unavailable.join(', ')}</p></details>:null}
   </div>
  </div>
  <div ref={sentinel} className="h-px" aria-hidden="true"/>
  <div className="grid grid-cols-7 gap-1 px-tooltip-x">
   {Array.from({length:first?.getUTCDay()??0},(_,index)=><span key={'blank-'+index}/>)}
   {dates.map(date=>{
    const month=date.slice(0,7),day=months[month]?.days.find(entry=>entry.day===date),number=Number(date.slice(8));
    const outlined=date===today||date===selected;
    const short=new Date(month+'-01T12:00:00Z').toLocaleDateString('en',{month:'short',timeZone:'UTC'});
    return <button type="button" key={date} data-day={date} id={number===1?'month-'+month:undefined} data-month-start={number===1?month:undefined} disabled={!(day&&date<=today)} tabIndex={!day?-1:0} onClick={event=>{if(day)onDay(date,event.currentTarget);}}
     aria-label={`${date}${day?`, ${day.posts} ${day.posts===1?'post':'posts'}${day.pending?`, ${day.pending} not finished`:''}${day.intake?', drank':''}${day.ready?`, ${formatCalories(day.kcal)} kcal${day.missing?.length?`, nutrition unavailable: ${[...new Set(day.missing)].join(', ')}`:''}`:''}`:''}`}
     className={`flex min-w-0 scroll-mt-32 flex-col justify-between rounded-tile text-left ${day?'bg-card':''} ${date>today?'text-faint':'text-text'}`}
     style={{height:tokens.spacing.tap,padding:`${tokens.spacing.grid}px ${tokens.calendar.padding}px`,border:outlined?`${tokens.calendar.border}px solid ${tokens.colors.text}`:`${tokens.calendar.border}px solid transparent`}}>
     <span className={`text-label leading-none ${number===1?'font-semibold':'font-medium'}`}>{number===1?`${short} 1`:number}</span>
     <span className="text-cell-kcal text-muted tabular-nums">{day?.ready?`${formatDayKcal(day.kcal)}`:day?.intake?'drank':''}</span>
    </button>;
   })}
  </div>
 </div>;
}
