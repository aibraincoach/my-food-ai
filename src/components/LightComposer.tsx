'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {Icon} from '@/components/ui/Icon';
import {Button} from '@/components/ui/Button';
import {usePostHandle} from '@/components/PostHandle';
import {toLocalInput} from '@/lib/posts/eaten-at';
type Props={shots:{previewUrl:string}[];caption:string;setCaption:(value:string)=>void;index:number;setIndex:(value:number)=>void;notEaten:number|null;setNotEaten:(value:number|null)=>void;when:string|null;setWhen:(value:string|null)=>void;locationEnabled:boolean;setLocationEnabled:(value:boolean)=>void;saveAsMeal:boolean;setSaveAsMeal:(value:boolean)=>void;busy:boolean;error:string|null;pending:number;onBack:()=>void;onPhoto:()=>void;onSearch:()=>void;onPost:()=>void;children?:ReactNode;searchPanel?:ReactNode;onRemove:(index:number)=>void};
function Switch({label,on,disabled,onChange}:{label:string;on:boolean;disabled:boolean;onChange:()=>void}) {
 return <button type="button" role="switch" aria-label={label} aria-checked={on} disabled={disabled} onClick={onChange} className={`relative h-[26px] w-[44px] shrink-0 rounded-circle disabled:opacity-50 ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-5 rounded-circle bg-white" style={{left:on?21:3,boxShadow:'var(--color-shadow-knob)'}}/></button>;
}
export default function LightComposer(p:Props) {
 const handle=usePostHandle(),preview=useRef<HTMLDivElement>(null),caption=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{if(!p.shots.length)caption.current?.focus();},[p.shots.length]);
 useEffect(()=>{if(p.shots.length>1)preview.current?.scrollTo({left:p.index*210,behavior:'smooth'});},[p.index,p.shots.length]);
 const current=p.shots[Math.min(p.index,p.shots.length-1)],on=p.notEaten===p.index;
 const when=p.when?new Date(p.when).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Now';
 const photo=()=>{if(!p.busy)p.onPhoto();};
 return <div className="flex h-full flex-col bg-surface text-text" style={{animation:'composer-in 220ms ease-out'}}>
  <style>{'@keyframes composer-in {from {transform:translateX(30px);opacity:.5}to {transform:translateX(0);opacity:1}}'}</style>
  <header className="flex h-top-safe shrink-0 items-center justify-between px-inset"><button type="button" aria-label="Back to Feed" disabled={p.busy} onClick={p.onBack} className="flex size-tap items-center justify-center rounded-circle bg-field"><Icon name="back" size={22}/></button><h1 id="capture-title" className="text-sheet-title">New post</h1><span className="size-tap"/></header>
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
   {!!p.shots.length&&<div className="pt-3">
    {p.shots.length===1?<div className="relative mx-auto h-[276px] w-[220px] overflow-hidden rounded-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}<img src={current.previewUrl} alt="Meal photo 1" className="size-full object-cover"/><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">1/1</span>
    </div>:<div ref={preview} aria-label="Selected meal photos" className="flex snap-x snap-mandatory gap-[10px] overflow-x-auto px-[calc((100%-200px)/2)]" onScroll={event=>{const next=Math.round(event.currentTarget.scrollLeft/210);if(next<p.shots.length&&next!==p.index)p.setIndex(next);}}>
     {p.shots.map((shot,index)=><div key={shot.previewUrl} className="relative h-[232px] w-[200px] shrink-0 snap-center overflow-hidden rounded-card">
       {/* eslint-disable-next-line @next/next/no-img-element */}<img src={shot.previewUrl} alt={`Meal photo ${index+1}`} className="size-full object-cover"/><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">{index+1}/{p.shots.length}</span>
       {p.notEaten===index&&<span className="absolute bottom-[10px] left-[10px] rounded-tile bg-text px-[10px] py-[5px] text-badge text-surface">Not eaten</span>}
      </div>)}
     {p.shots.length<8&&<button type="button" onClick={photo} disabled={p.busy} aria-label="Take another photo" className="flex h-[232px] w-[200px] shrink-0 snap-center items-center justify-center rounded-card border-[1.5px] border-dashed border-ring"><Icon name="plus" size={28}/></button>}
    </div>}
    <button type="button" disabled={p.busy} onClick={()=>p.onRemove(p.index)} className="mx-inset mt-1 min-h-tap text-meta text-muted">Remove photo {p.index+1}</button>
   </div>}
   {p.shots.length>1&&p.index>0&&<div className={`mx-inset mt-3 flex items-center gap-[14px] rounded-card px-inset py-3 ${on?'bg-text text-surface':'bg-card'}`}>
    <div className="min-w-0 flex-1"><p className="text-body">This photo shows what was not eaten</p><p className={`mt-1 text-meta leading-[1.4] ${on?'text-faint':'text-muted'}`}>{on?'Consumed = photo 1 minus photo 2. The card will say so.':'Off: both photos are of the meal. On: the first photo is the meal, this one is what remained, and the record is the difference.'}</p></div>
    <button type="button" role="switch" aria-label="This photo shows what was not eaten" aria-checked={on} disabled={p.busy} onClick={()=>p.setNotEaten(on?null:p.index)} className={`relative h-[30px] w-[50px] shrink-0 rounded-circle ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-6 rounded-circle bg-white" style={{left:on?23:3,boxShadow:'var(--color-shadow-knob)'}}/></button>
   </div>}
   <div className="px-inset pt-[14px]"><label htmlFor="capture-caption" className="text-body font-semibold">{handle}</label><textarea ref={caption} id="capture-caption" aria-label="Caption" maxLength={2000} rows={2} placeholder="Add a caption…" value={p.caption} disabled={p.busy} onChange={event=>p.setCaption(event.target.value)} className="w-full resize-none bg-transparent text-body font-normal outline-none placeholder:text-muted"/></div>
   <div className="flex gap-2 px-inset pt-[22px]">
    <button type="button" disabled={p.busy||p.shots.length>=8} onClick={photo} className="flex h-[34px] items-center gap-2 rounded-[17px] bg-field px-3 text-detail font-medium"><Icon name="camera" size={16}/>Another photo</button>
    <button type="button" disabled={p.busy} onClick={p.onSearch} className="flex h-[34px] items-center gap-2 rounded-[17px] bg-field px-3 text-detail font-medium"><Icon name="search" size={16}/>Search foods</button>
   </div>
   {p.searchPanel}
   <div className="px-inset pt-[6px]">
    <div className="flex min-h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="clock"/><label htmlFor="composer-when" className="flex-1 text-body">Eaten at</label><span className="text-detail text-muted">{when}</span><Icon name="chevron-right" size={16}/></div>
    <input id="composer-when" type="datetime-local" aria-label="Eaten at" disabled={p.busy} value={p.when??''} max={toLocalInput(new Date())} onChange={event=>p.setWhen(event.target.value||null)} className="mt-1 min-h-tap w-full rounded-field bg-field px-3 text-detail"/>
    <button type="button" disabled={p.busy} onClick={()=>p.shots.length<2?photo():p.setIndex(p.notEaten??1)} className="flex h-[52px] w-full items-center gap-[14px] border-b border-hairline text-left"><Icon name="photo-add"/><span className="min-w-0 flex-1"><span className="block text-body">Not eaten</span><span className="block text-meta text-muted">Add a photo of what remained</span></span><span className="text-detail text-muted">{p.notEaten!==null?`Photo ${p.notEaten+1}`:p.shots.length>1?'Off':''}</span><Icon name="chevron-right" size={16}/></button>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="pin"/><span className="flex-1"><span className="block text-body">Location</span><span className="block text-meta text-muted">Only you see it</span></span><Switch label="Save location" on={p.locationEnabled} disabled={p.busy} onChange={()=>p.setLocationEnabled(!p.locationEnabled)}/></div>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="bookmark"/><span className="flex-1 text-body">Save as meal</span><Switch label="Save as meal" on={p.saveAsMeal} disabled={p.busy} onChange={()=>p.setSaveAsMeal(!p.saveAsMeal)}/></div>
   </div>
  </div>
  <div className="shrink-0 px-inset pt-2 pb-[calc(30px+env(safe-area-inset-bottom))]">
   {p.error&&<p role="alert" className="mb-2 text-detail text-muted">{p.error}</p>}
   {p.pending>0&&<p role="status" className="mb-2 text-meta text-muted">Preparing selected photos…</p>}
   <Button disabled={p.busy||p.pending>0||(!p.caption.trim()&&!p.shots.length)} onClick={p.onPost}>{p.busy?'Posting…':'Post'}</Button>
  </div>
  {p.children}
 </div>;
}
