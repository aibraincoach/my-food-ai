'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import UploadBar from './UploadBar';
import {useComposerDrinks} from './ComposerDrinks';
import type {UploadState} from '@/lib/posts/upload-manager';
import {Icon} from '@/components/ui/Icon';
import {Button} from '@/components/ui/Button';
import {usePostHandle} from '@/components/PostHandle';
import {toLocalInput} from '@/lib/posts/eaten-at';
type Props={upload?:UploadState;shots:{previewUrl:string}[];caption:string;setCaption:(value:string)=>void;index:number;setIndex:(value:number)=>void;notEaten:number[];setNotEaten:(value:number[])=>void;when:string|null;setWhen:(value:string|null)=>void;locationEnabled:boolean;setLocationEnabled:(value:boolean)=>void;saveAsMeal:boolean;setSaveAsMeal:(value:boolean)=>void;busy:boolean;error:string|null;pending:number;onBack:()=>void;onPhoto:()=>void;onSearch:()=>void;onPost:()=>void;children?:ReactNode;searchPanel?:ReactNode;onRemove:(index:number)=>void};
function Switch({label,on,disabled,onChange}:{label:string;on:boolean;disabled:boolean;onChange:()=>void}) {
 return <button type="button" role="switch" aria-label={label} aria-checked={on} disabled={disabled} onClick={onChange} className={`relative h-[26px] w-[44px] shrink-0 rounded-circle disabled:opacity-50 ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-5 rounded-circle bg-white" style={{left:on?21:3,boxShadow:'var(--color-shadow-knob)'}}/></button>;
}
export default function LightComposer(p:Props) {
 const drinks=useComposerDrinks(p);
 const busy=p.busy||drinks.saving;
 const [drinkDetails,setDrinkDetails]=useState(false);
 const [whenOpen,setWhenOpen]=useState(false);
 const [uploadedVisible,setUploadedVisible]=useState(false);
 useEffect(()=>{const show=setTimeout(()=>setUploadedVisible(p.upload?.state==='uploaded'),0);const hide=setTimeout(()=>setUploadedVisible(false),1000);return()=>{clearTimeout(show);clearTimeout(hide);};},[p.upload?.state]);
 const handle=usePostHandle(),preview=useRef<HTMLDivElement>(null),caption=useRef<HTMLTextAreaElement>(null);
 const observedPhoto=useRef({index:-1,count:-1});
 useEffect(()=>{if(!p.shots.length)caption.current?.focus();},[p.shots.length]);
 useEffect(()=>{
  const observed=observedPhoto.current;
  if(p.shots.length>1&&(observed.index!==p.index||observed.count!==p.shots.length))preview.current?.scrollTo({left:p.index*210,behavior:'auto'});
  observedPhoto.current={index:p.index,count:p.shots.length};
 },[p.index,p.shots.length]);
 const current=p.shots[Math.min(p.index,p.shots.length-1)],on=p.notEaten.includes(p.index);
 const when=p.when?new Date(p.when).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Now';
 const photo=()=>{if(!busy)p.onPhoto();};
 if(drinks.active&&!drinkDetails)return <div className="flex h-full flex-col bg-camera text-surface">
  <header className="flex h-top-safe shrink-0 items-center justify-between px-5"><button type="button" aria-label="Back to Feed" disabled={busy} onClick={p.onBack} className="flex size-tap items-center justify-center"><Icon name="close"/></button><h1 id="capture-title" className="text-body font-semibold">New post</h1><button type="button" disabled={busy} onClick={()=>setDrinkDetails(true)} className="min-h-tap text-meta">Post details</button></header>
  <div className="relative min-h-[140px] flex-1 overflow-hidden">
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={current?.previewUrl} alt="Photographed drinks" className="size-full object-contain"/>
  </div>
  <div className="max-h-[70%] shrink-0 overflow-y-auto rounded-t-sheet bg-text">{drinks.card}
   <footer className="px-5 pt-4 pb-[calc(34px+env(safe-area-inset-bottom))]">
    {drinks.error&&<p role="alert" className="mb-2 text-detail text-faint">{drinks.error}</p>}
    <Button variant="camera" style={{height:48,borderRadius:12,fontSize:15}} disabled={busy||drinks.disabled} onClick={()=>{void drinks.post();}}>{busy?'Posting…':drinks.button}</Button>
   </footer>
  </div>{drinks.editor}{p.children}
 </div>;
 return <div className="flex h-full flex-col bg-surface text-text" style={{animation:'composer-in 220ms ease-out'}}>
  <style>{'@keyframes composer-in {from {transform:translateX(30px);opacity:.5}to {transform:translateX(0);opacity:1}}'}</style>
  <header className="flex h-top-safe shrink-0 items-center justify-between px-inset"><button type="button" aria-label="Back to Feed" disabled={busy} onClick={drinks.active?()=>setDrinkDetails(false):p.onBack} className="flex size-tap items-center justify-center rounded-circle bg-field"><Icon name="back" size={22}/></button><h1 id="capture-title" className="text-sheet-title">{drinks.active?'Post details':'New post'}</h1><span className="size-tap"/></header>
  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
   {!!p.shots.length&&<div className="pt-3">
    {p.shots.length===1?<div className="relative mx-auto h-[276px] w-[220px] overflow-hidden rounded-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.previewUrl} alt="Meal photo 1" className="size-full object-cover"/><button type="button" disabled={busy} onClick={()=>p.onRemove(0)} aria-label="Remove photo 1" className="absolute top-[10px] left-[10px] flex size-[22px] items-center justify-center rounded-circle bg-overlay text-surface"><Icon name="close" size={16}/></button><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">1/1</span>
      {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<UploadBar upload={p.upload}/>}
    </div>:<div ref={preview} aria-label="Selected meal photos" className="flex snap-x snap-mandatory gap-[10px] overflow-x-auto px-[calc((100%-200px)/2)]" onScroll={event=>{const next=Math.round(event.currentTarget.scrollLeft/210);if(next<=p.shots.length){observedPhoto.current={index:next,count:p.shots.length};if(next!==p.index)p.setIndex(next);}}}>
     {p.shots.map((shot,index)=><div key={shot.previewUrl} className="relative h-[232px] w-[200px] shrink-0 snap-center overflow-hidden rounded-card">
       {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.previewUrl} alt={`Meal photo ${index+1}`} className="size-full object-cover"/><button type="button" disabled={busy} onClick={()=>p.onRemove(index)} aria-label={`Remove photo ${index+1}`} className="absolute top-[10px] left-[10px] flex size-[22px] items-center justify-center rounded-circle bg-overlay text-surface"><Icon name="close" size={16}/></button><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">{index+1}/{p.shots.length}</span>
       {p.notEaten.includes(index)&&<span className="absolute bottom-[10px] left-[10px] rounded-tile bg-text px-[10px] py-[5px] text-badge text-surface">leftovers (not eaten)</span>}
       {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<UploadBar upload={p.upload}/>}
      </div>)}
     {p.shots.length<8&&<button type="button" onClick={photo} disabled={busy} aria-label="Take another photo" className="flex h-[232px] w-[200px] shrink-0 snap-center items-center justify-center rounded-card border-[1.5px] border-dashed border-ring"><Icon name="plus" size={28}/></button>}
    </div>}
    {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<p className="mt-2 text-center text-detail text-muted" role="status">{p.upload.state==='failed'?'Upload failed':p.upload.state==='uploaded'?'Uploaded':p.shots.length>1?`Uploading ${p.shots.length} photos…`:'Uploading photo…'}</p>}
   </div>}
   {!drinks.active&&drinks.card}
   {p.shots.length>1&&p.index>0&&p.index<p.shots.length&&<div className={`mx-inset mt-3 flex items-center gap-[14px] rounded-card px-inset py-3 ${on?'bg-text text-surface':'bg-card'}`}>
    <div className="min-w-0 flex-1"><p className="text-body">leftovers (not eaten)</p><p className={`mt-1 text-meta leading-[1.4] ${on?'text-faint':'text-muted'}`}>{on?'The photographed leftovers are subtracted from the meal. Each marked photo is recorded.':'Off: this photo shows the meal. On: this photo shows leftovers, subtracted once from the meal.'}</p></div>
    <button type="button" role="switch" aria-label="leftovers (not eaten)" aria-checked={on} disabled={busy} onClick={()=>p.setNotEaten(on?p.notEaten.filter(index=>index!==p.index):[...p.notEaten,p.index].sort((a,b)=>a-b))} className={`relative h-[30px] w-[50px] shrink-0 rounded-circle ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-6 rounded-circle bg-white" style={{left:on?23:3,boxShadow:'var(--color-shadow-knob)'}}/></button>
   </div>}
   <div className="px-inset pt-[14px]"><label htmlFor="capture-caption" className="text-body font-semibold">{handle}</label><textarea ref={caption} id="capture-caption" aria-label="Caption" maxLength={2000} rows={2} placeholder="Add a caption…" value={p.caption} disabled={busy} onChange={event=>p.setCaption(event.target.value)} className="w-full resize-none bg-transparent text-body font-normal outline-none placeholder:text-muted"/></div>
   <div className="flex gap-2 px-inset pt-[22px]">
    <button type="button" disabled={busy||p.shots.length>=8} onClick={photo} className="flex h-[34px] items-center gap-2 rounded-[17px] bg-field px-3 text-detail font-medium"><Icon name="camera" size={16}/>Another photo</button>
    <button type="button" disabled={busy} onClick={p.onSearch} className="flex h-[34px] items-center gap-2 rounded-[17px] bg-field px-3 text-detail font-medium"><Icon name="search" size={16}/>Search foods</button>
   </div>
   {p.searchPanel}
   <div className="px-inset pt-[6px]">
    <button type="button" disabled={busy} onClick={()=>setWhenOpen(value=>!value)} className="flex min-h-[52px] w-full items-center gap-[14px] border-b border-hairline text-left"><Icon name="clock"/><span className="flex-1 text-body">Eaten at</span><span className="text-detail text-muted">{when}</span><Icon name="chevron-right" size={16}/></button>
    {whenOpen&&<input id="composer-when" type="datetime-local" aria-label="Eaten at" disabled={busy} value={p.when??''} max={toLocalInput(new Date())} onChange={event=>p.setWhen(event.target.value||null)} className="mt-1 min-h-tap w-full rounded-field bg-field px-3 text-detail"/>}
    <button type="button" disabled={busy} onClick={()=>p.shots.length<2?photo():p.setIndex(p.notEaten[0]??1)} className="flex h-[52px] w-full items-center gap-[14px] border-b border-hairline text-left"><Icon name="photo-add"/><span className="min-w-0 flex-1"><span className="block text-body">leftovers (not eaten)</span><span className="block text-meta text-muted">Add a photo of what remained</span></span><span className="text-detail text-muted">{p.notEaten.length?`Photos ${p.notEaten.map(index=>index+1).join(', ')}`:p.shots.length>1?'Off':''}</span><Icon name="chevron-right" size={16}/></button>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="pin"/><span className="flex-1"><span className="block text-body">Location</span><span className="block text-meta text-muted">Only you see it</span></span><Switch label="Save location" on={p.locationEnabled} disabled={busy} onChange={()=>p.setLocationEnabled(!p.locationEnabled)}/></div>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="bookmark"/><span className="flex-1 text-body">Save as meal</span><Switch label="Save as meal" on={p.saveAsMeal} disabled={busy} onChange={()=>p.setSaveAsMeal(!p.saveAsMeal)}/></div>
   </div>
  </div>
  <div className="shrink-0 px-inset pt-2 pb-[calc(30px+env(safe-area-inset-bottom))]">
   {drinks.error&&<p role="alert" className="mb-2 text-detail text-muted">{drinks.error}</p>}
   {p.error&&<p role="alert" className="mb-2 text-detail text-muted">{p.error}</p>}
   {p.pending>0&&<p role="status" className="mb-2 text-meta text-muted">Preparing selected photos…</p>}
   <Button style={{height:50,borderRadius:14,fontSize:16}} disabled={busy||drinks.saving||p.pending>0||(drinks.active?drinks.disabled:(!p.caption.trim()&&!p.shots.length))} onClick={drinks.active?()=>{void drinks.post();}:p.onPost}>{busy||drinks.saving?'Posting…':drinks.active?drinks.button:'Post'}</Button>
  </div>
  {drinks.editor}
  {p.children}
 </div>;
}
