'use client';
import {useRef,useState,useSyncExternalStore} from 'react';
import {Sheet} from './ui/Sheet';
import {Button} from './ui/Button';
import type {SavedMeal} from '@/lib/posts/saved';
export type LogTarget={loading?:boolean;loadError?:string;id:string;name:string;saved:boolean;thumbnail?:string|null;items?:SavedMeal['items'];firstPostAt?:string|null};
export default function LogAgainSheet({target,onClose,onPosted}:{target:LogTarget|null;onClose:()=>void;onPosted:()=>void}){
 const [mode,setMode]=useState('now'); const [time,setTime]=useState('');const [date,setDate]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false);
 const now=mounted?new Date():new Date(0); const current=now.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
 const chips:string[]=[]; const first=target?.firstPostAt?new Date(target.firstPostAt):null;
 const start=first?first.getHours()*60+Math.floor(first.getMinutes()/30)*30:0;
 for(let m=start;m<=Math.floor((now.getHours()*60+now.getMinutes())/30)*30;m+=30)chips.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
 const close=()=>{if(!lock.current){setError('');setMode('now');setTime('');setDate('');onClose();}};
 async function post(){if(!target||target.loading||lock.current)return;lock.current=true;setBusy(true);setError('');
 try{const when=new Date(); if(mode!=='now'){if(!time||mode==='day'&&!date)throw new Error('Choose a date and time.');if(mode==='day'){const [y,m,d]=date.split('-').map(Number);when.setFullYear(y,m-1,d);}const[h,m]=time.split(':').map(Number);when.setHours(h,m,0,0);}
 const r=await fetch(target.saved?`/api/saved/${target.id}/log`:`/api/posts/${target.id}/log-again`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eaten_at:when.toISOString()})});const body=await r.json();if(!r.ok)throw new Error(body.error||'The meal could not be logged.');window.dispatchEvent(new CustomEvent('post-created',{detail:{id:body.postId}}));onPosted();onClose();
 }catch(e){setError(e instanceof Error?e.message:'The meal could not be logged.');}finally{lock.current=false;setBusy(false);}}
 return <Sheet hideClose open={!!target} onClose={close} label="Log again" panelStyle={{overflow:'hidden'}}>
  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain" data-log-again-content>
   <div className="flex h-11 shrink-0 items-center justify-between"><h2 className="text-sheet-head font-semibold">Log again</h2><button onClick={close} aria-label="Close Log again" className="min-h-tap min-w-tap">×</button></div>
   <div className="flex shrink-0 items-center gap-3 border-b border-hairline pb-3">{target?.thumbnail?<img src={target.thumbnail} alt="" className="size-12 shrink-0 rounded-thumb object-cover"/>:null}<div className="min-w-0"><p className="truncate text-body">{target?.name}</p><p className="line-clamp-2 text-meta text-muted">{target?.items?.map(i=>`${i.name} ${i.portion_text??''}`).join(' · ')}{target?.items?.length?` · ${target.items.some(i=>i.nutrition?.calories==null)?'unavailable':Math.round(target.items.reduce((sum,i)=>sum+Number(i.nutrition.calories),0))} kcal`:''}</p></div></div>
   <p className="shrink-0 text-meta text-muted">When?</p>
   <div className="flex shrink-0 flex-col gap-2">{[['now','Now',current],['today','Earlier today','pick a time'],['day','Another day','pick a date and time']].map(([id,label,detail])=><button key={id} disabled={busy} onClick={()=>setMode(id)} className={`flex h-[52px] shrink-0 items-center justify-between rounded-field border px-4 text-body ${mode===id?'border-text bg-text text-surface':'border-line bg-white'}`}><span>{label}</span><span className={`text-detail ${mode===id?'text-faint':'text-muted'}`}>{detail}</span></button>)}</div>
   {mode==='today'?<div className="flex shrink-0 flex-col gap-2"><p className="text-meta text-muted">Earlier today</p><div className="grid max-h-[86px] grid-cols-6 gap-[6px] overflow-y-auto overscroll-contain" aria-label="Earlier half-hour times">{chips.map(t=><button key={t} disabled={busy} onClick={()=>setTime(t)} className={`h-10 rounded-tile text-detail tabular-nums ${time===t?'bg-text text-surface':'bg-field'}`}>{t}</button>)}</div></div>:null}
   {mode==='day'?<label className="flex shrink-0 items-center justify-between gap-3 text-meta text-muted">Another day<input type="date" value={date} disabled={busy} onChange={e=>setDate(e.target.value)} className="h-10 min-w-0 rounded-field border border-line bg-white px-3 text-body"/></label>:null}
   {mode!=='now'?<label className="flex shrink-0 items-center justify-between gap-3 text-meta text-muted">Other time<input type="time" value={time} disabled={busy} onChange={e=>setTime(e.target.value)} className="h-10 w-[140px] rounded-field border border-line bg-white px-3 text-body"/></label>:null}
   {error?<p role="alert" className="text-detail">{error}</p>:null}
   {target?.loading&&<p role={target.loadError?"alert":"status"} className="text-meta text-muted">{target.loadError||"Loading meal…"}</p>}
  </div>
  <Button className="shrink-0" disabled={busy||Boolean(target?.loading)} onClick={()=>void post()}>{busy?'Posting…':`Post · ${target?.name??'Meal'}${mode!=='now'&&time?` at ${new Date(`2000-01-01T${time}`).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`:''}`}</Button>
 </Sheet>;
}
