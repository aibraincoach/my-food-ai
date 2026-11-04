"use client";
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {formatCalories} from '@/lib/nutrition/totals';
import {tokens} from '@/lib/theme/tokens';
import type {MonthSummary} from '@/lib/posts/days';
import {formatDayKcal,monthName,postedLabel} from './MonthGrid';

type Props={months:Record<string,MonthSummary>;today:string;selected?:string;onDay:(date:string,cell:HTMLElement)=>void;onOlder?:()=>void};
export default function PhoneCalendar({months,today,selected,onDay,onOlder}:Props){
 const ordered=Object.keys(months).sort();
 const key=ordered.join(',');
 const root=useRef<HTMLDivElement>(null),sentinel=useRef<HTMLDivElement>(null);
 const anchor=useRef<{height:number;top:number}|null>(null),opened=useRef(false);
 const [visible,setVisible]=useState(today.slice(0,7));
 const olderRef=useRef(onOlder);
 useEffect(()=>{olderRef.current=onOlder;});
 const hasOlder=Boolean(onOlder);
 const current=months[visible]??months[today.slice(0,7)];
 const unavailable=[...new Set(current?.days.flatMap(day=>day.missing??[])??[])];
 useLayoutEffect(()=>{
  if(!anchor.current)return;
  const old=anchor.current;anchor.current=null;
  window.scrollTo({top:window.scrollY+(document.documentElement.scrollHeight-old.height),behavior:'instant'});
 },[key]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{
   document.querySelector<HTMLElement>('[data-day="'+today+'"]')?.scrollIntoView({block:'center'});
   opened.current=true;
  });
  return()=>cancelAnimationFrame(frame);
 },[today]);
 useEffect(()=>{
  const elements=root.current?.querySelectorAll<HTMLElement>('[data-month-start]');
  if(!elements?.length)return;
  const observer=new IntersectionObserver(()=>{
   const line=tokens.spacing['top-h'];
   const positions=Array.from(elements).map(el=>({month:el.dataset.monthStart!,top:el.getBoundingClientRect().top}));
   const past=positions.filter(p=>p.top<=line+60).at(-1);
   const nearest=past??positions.reduce((a,b)=>Math.abs(a.top-line)<Math.abs(b.top-line)?a:b);
   setVisible(nearest.month);
  },{rootMargin:`-${tokens.spacing['top-h']+60}px 0px 0px 0px`});
  elements.forEach(el=>observer.observe(el));return()=>observer.disconnect();
 },[key]);
 useEffect(()=>{
  if(!hasOlder||!sentinel.current)return;
  const older=olderRef;
  const observer=new IntersectionObserver(entries=>{
   if(!opened.current||!entries.some(entry=>entry.isIntersecting))return;
   observer.disconnect();anchor.current={height:document.documentElement.scrollHeight,top:window.scrollY};older.current?.();
  });
  observer.observe(sentinel.current);return()=>observer.disconnect();
 },[key,hasOlder]);
 const first=ordered[0]?new Date(ordered[0]+'-01T12:00:00Z'):null;
 const dates:string[]=[];
 if(first){const end=new Date(today.slice(0,7)+'-01T12:00:00Z');end.setUTCMonth(end.getUTCMonth()+1);for(const d=new Date(first);d<end;d.setUTCDate(d.getUTCDate()+1))dates.push(d.toISOString().slice(0,10));}
 return <div ref={root} style={{overflowAnchor:'none'}}>
  <div className="sticky z-10 bg-surface pb-1" style={{top:'calc(var(--spacing-top-h) + env(safe-area-inset-top))'}}>
   <div className="grid grid-cols-7 gap-1 px-tooltip-x" aria-hidden="true">{['S','M','T','W','T','F','S'].map((label,index)=><span key={index} className="text-center text-bubble text-faint">{label}</span>)}</div>
   <p className="px-screen-x text-meta text-muted" aria-live="polite">{monthName(visible,true)} · {postedLabel(current?.posted??0)}</p>
   {unavailable.length?<details data-nutrition-disclosure className="px-screen-x text-meta text-muted"><summary className="cursor-pointer">Known nutrition shown · Unavailable foods</summary><p className="mt-2">Nutrition unavailable: {unavailable.join(', ')}</p></details>:null}
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
