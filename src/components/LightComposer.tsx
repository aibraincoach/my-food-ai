'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import UploadBar from './UploadBar';
import {useComposerDrinks} from './ComposerDrinks';
import CameraPreview from './CameraPreview';
import type {UploadState} from '@/lib/posts/upload-manager';
import {Icon} from '@/components/ui/Icon';
import {Button} from '@/components/ui/Button';
import {usePostHandle} from '@/components/PostHandle';
import {toLocalInput} from '@/lib/posts/eaten-at';
type Props={cameraPreview?:HTMLCanvasElement|null;upload?:UploadState;shots:{previewUrl:string}[];caption:string;setCaption:(value:string)=>void;index:number;setIndex:(value:number)=>void;notEaten:number[];setNotEaten:(value:number[])=>void;when:string|null;setWhen:(value:string|null)=>void;locationEnabled:boolean;setLocationEnabled:(value:boolean)=>void;saveAsMeal:boolean;setSaveAsMeal:(value:boolean)=>void;busy:boolean;error:string|null;pending:number;onBack:()=>void;onPhoto:()=>void;onSearch:()=>void;onPost:()=>void;children?:ReactNode;searchPanel?:ReactNode;onRemove:(index:number)=>void};
function Switch({label,on,disabled,onChange}:{label:string;on:boolean;disabled:boolean;onChange:()=>void}) {
 return <button type="button" role="switch" aria-label={label} aria-checked={on} disabled={disabled} onClick={onChange} className={`relative h-[26px] w-[44px] shrink-0 rounded-circle disabled:opacity-50 ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-5 rounded-circle bg-white" style={{left:on?21:3,boxShadow:'var(--color-shadow-knob)'}}/></button>;
}
export default function LightComposer(p:Props) {
 const drinks=useComposerDrinks(p);
 const busy=p.busy||drinks.saving;
 const [drinkDetails,setDrinkDetails]=useState(false);
 const [whenOpen,setWhenOpen]=useState(false);
 const [photoOptions,setPhotoOptions]=useState(false);
 const [uploadedVisible,setUploadedVisible]=useState(false);
 useEffect(()=>{
  // Upload state is external. Defer its brief indicator until after commit,
  // and cancel both callbacks if another upload transition supersedes it.
  const frame=requestAnimationFrame(()=>setUploadedVisible(p.upload?.state==='uploaded'));
  const timer=p.upload?.state==='uploaded'?setTimeout(()=>setUploadedVisible(false),1000):undefined;
  return()=>{cancelAnimationFrame(frame);clearTimeout(timer);};
 },[p.upload?.state]);
 const handle=usePostHandle(),preview=useRef<HTMLDivElement>(null),caption=useRef<HTMLTextAreaElement>(null);
 const observedPhoto=useRef({index:-1,count:-1});
 useEffect(()=>{if(!p.shots.length&&!p.cameraPreview)caption.current?.focus();},[p.shots.length,p.cameraPreview]);
 useEffect(()=>{
  const observed=observedPhoto.current;
  if(p.shots.length===2&&(observed.index!==p.index||observed.count!==p.shots.length))preview.current?.scrollTo({left:p.index*210,behavior:'auto'});
  observedPhoto.current={index:p.index,count:p.shots.length};
 },[p.index,p.shots.length]);
 const current=p.shots[Math.min(p.index,p.shots.length-1)],on=p.notEaten.includes(p.index);
 const when=p.when?new Date(p.when).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Now';
 const groups:number[][]=[];
 for(let index=0;index<p.shots.length;index++){
  if(p.notEaten.length){if(!p.notEaten.includes(index)||!groups.length)groups.push([index]);else groups[groups.length-1].push(index);}
  else {if(index%2===0)groups.push([]);groups[groups.length-1].push(index);}
 }
 const mealBefore=Array.from({length:p.index},(_,index)=>index).filter(index=>!p.notEaten.includes(index)).at(-1)??0;
 const selectedNumbers=p.notEaten.map(index=>index+1).join(', ');

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
   {p.cameraPreview&&<CameraPreview frame={p.cameraPreview}/>}
   {!p.cameraPreview&&!!p.shots.length&&<div className="pt-3">
    {p.shots.length===1?<div className="relative mx-auto h-[276px] w-[220px] overflow-hidden rounded-card">
      {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews. */}
       <img src={current.previewUrl} alt="Meal photo 1" className="size-full object-cover"/><button type="button" disabled={busy} onClick={()=>p.onRemove(0)} aria-label="Remove photo 1" className="absolute top-[10px] left-[10px] flex size-[22px] items-center justify-center rounded-circle bg-overlay text-surface"><Icon name="close" size={16}/></button><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">1/1</span>
      {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<UploadBar upload={p.upload}/>}
    </div>:p.shots.length>2?<div aria-label="Selected meal photos" className="flex flex-col gap-3 px-inset" data-paired-photos>
     {groups.map((indices,group)=><section key={indices[0]} aria-label={p.notEaten.length?`Plate ${group+1}`:`Photos ${indices.map(index=>index+1).join(', ')}`}><h2 className="mb-[6px] text-meta font-semibold text-muted">{p.notEaten.length?`Plate ${group+1}`:`${indices.length===1?'Photo':'Photos'} ${indices.map(index=>index+1).join(', ')}`}</h2><div className="grid grid-cols-2 gap-2">
      {indices.map(index=><div key={p.shots[index].previewUrl} className={`relative h-32 overflow-hidden rounded-field ${p.index===index&&photoOptions?'ring-2 ring-text':''}`}>
       <button type="button" disabled={busy} aria-label={`Edit photo ${index+1}`} onClick={()=>{p.setIndex(index);setPhotoOptions(true);}} className="size-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews. */}
       <img src={p.shots[index].previewUrl} alt={`Meal photo ${index+1}`} className="size-full object-cover"/>
       </button>
       <button type="button" disabled={busy} onClick={()=>p.onRemove(index)} aria-label={`Remove photo ${index+1}`} className="absolute left-2 top-2 flex size-[22px] items-center justify-center rounded-circle bg-overlay text-surface"><Icon name="close" size={16}/></button>
       <span className="pointer-events-none absolute right-2 top-2 rounded-tile bg-overlay px-[7px] py-[2px] text-[11px] text-surface">{index+1}/{p.shots.length}</span>
       {p.notEaten.includes(index)&&<span className="pointer-events-none absolute bottom-2 left-2 rounded-tile bg-text px-2 py-1 text-[11px] font-semibold text-surface">Leftovers · not eaten</span>}
       {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<UploadBar upload={p.upload}/>}
      </div>)}
     </div></section>)}
    </div>:<div ref={preview} aria-label="Selected meal photos" className="flex snap-x snap-mandatory gap-[10px] overflow-x-auto px-[calc((100%-200px)/2)]" onScroll={event=>{const next=Math.round(event.currentTarget.scrollLeft/210);if(next<=p.shots.length){observedPhoto.current={index:next,count:p.shots.length};if(next!==p.index)p.setIndex(next);}}}>
     {p.shots.map((shot,index)=><div key={shot.previewUrl} className="relative h-[232px] w-[200px] shrink-0 snap-center overflow-hidden rounded-card">
       {/* eslint-disable-next-line @next/next/no-img-element -- Local blob previews. */}
       <img src={shot.previewUrl} alt={`Meal photo ${index+1}`} className="size-full object-cover"/><button type="button" disabled={busy} onClick={()=>p.onRemove(index)} aria-label={`Remove photo ${index+1}`} className="absolute top-[10px] left-[10px] flex size-[22px] items-center justify-center rounded-circle bg-overlay text-surface"><Icon name="close" size={16}/></button><span className="absolute top-[10px] right-[10px] rounded-tile bg-overlay px-2 text-meta text-surface">{index+1}/{p.shots.length}</span>
       {p.notEaten.includes(index)&&<span className="absolute bottom-[10px] left-[10px] rounded-tile bg-text px-[10px] py-[5px] text-badge text-surface">Leftovers · not eaten</span>}
       {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<UploadBar upload={p.upload}/>}
      </div>)}
     {p.shots.length<8&&<button type="button" onClick={photo} disabled={busy} aria-label="Take another photo" className="flex h-[232px] w-[200px] shrink-0 snap-center items-center justify-center rounded-card border-[1.5px] border-dashed border-ring"><Icon name="plus" size={28}/></button>}
    </div>}
    {p.upload&&(p.upload.state!=='uploaded'||uploadedVisible)&&<p className="mt-2 text-center text-detail text-muted" role="status">{p.upload.state==='failed'?'Upload failed':p.upload.state==='uploaded'?'Uploaded':p.shots.length>1?`Uploading ${p.shots.length} photos…`:'Uploading photo…'}</p>}
   </div>}
   {!drinks.active&&drinks.card}
   {p.shots.length>1&&p.index>0&&p.index<p.shots.length&&(p.shots.length===2||photoOptions)&&<div className={`mx-inset mt-3 flex items-center gap-[14px] rounded-card px-inset py-3 ${on?'bg-text text-surface':'bg-card'}`}>
    <div className="min-w-0 flex-1"><p className="text-body">This photo shows leftovers</p><p className={`mt-1 text-meta leading-[1.4] ${on?'text-faint':'text-muted'}`}>{on?`Consumed = photo ${mealBefore+1} minus photo ${p.index+1}. The card will say so.`:p.shots.length===2?'Off: both photos are of the meal. On: the first photo is the meal, this one is what remained, and the record is the difference.':'Off: this photo is part of the meal. On: this photo shows what remained from the preceding meal photo, and the record is the difference.'}</p></div>
    <button type="button" role="switch" aria-label="Leftovers · not eaten" aria-checked={on} disabled={busy} onClick={()=>p.setNotEaten(on?p.notEaten.filter(index=>index!==p.index):[...p.notEaten,p.index].sort((a,b)=>a-b))} className={`relative h-[30px] w-[50px] shrink-0 rounded-circle ${on?'bg-accent':'bg-ring'}`}><span className="absolute top-[3px] size-6 rounded-circle bg-white" style={{left:on?23:3,boxShadow:'var(--color-shadow-knob)'}}/></button>
    {p.shots.length>2&&<button type="button" aria-label="Close photo options" onClick={()=>setPhotoOptions(false)} className="flex size-tap shrink-0 items-center justify-center"><Icon name="close" size={18}/></button>}
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
    <button type="button" disabled={busy} onClick={()=>{if(p.shots.length<2)photo();else {p.setIndex(p.notEaten[0]??1);setPhotoOptions(value=>!value);}}} className="flex h-[52px] w-full items-center gap-[14px] border-b border-hairline text-left"><Icon name="photo-add"/><span className="min-w-0 flex-1"><span className="block text-body">Leftovers · not eaten</span><span className="block text-meta text-muted">Add a photo of what remained</span></span><span className="text-detail text-muted">{p.notEaten.length?`${p.notEaten.length===1?'Photo':'Photos'} ${selectedNumbers}`:p.shots.length>1?'Off':''}</span><Icon name="chevron-right" size={16}/></button>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="pin"/><span className="flex-1"><span className="block text-body">Location</span><span className="block text-meta text-muted">Only you see it</span></span><Switch label="Save location" on={p.locationEnabled} disabled={busy} onChange={()=>p.setLocationEnabled(!p.locationEnabled)}/></div>
    <div className="flex h-[52px] items-center gap-[14px] border-b border-hairline"><Icon name="bookmark"/><span className="flex-1 text-body">Save as meal</span><Switch label="Save as meal" on={p.saveAsMeal} disabled={busy} onChange={()=>p.setSaveAsMeal(!p.saveAsMeal)}/></div>
   </div>
  </div>
  <div className="shrink-0 px-inset pt-2 pb-[calc(30px+env(safe-area-inset-bottom))]">
   {drinks.error&&<p role="alert" className="mb-2 text-detail text-muted">{drinks.error}</p>}
   {p.error&&<p role="alert" className="mb-2 text-detail text-muted">{p.error}</p>}
   {p.pending>0&&<p role="status" className="mb-2 text-meta text-muted">Preparing selected photos…</p>}
   <Button style={{height:50,borderRadius:14,fontSize:16}} disabled={busy||drinks.saving||p.pending>0||(drinks.active?drinks.disabled:(!p.caption.trim()&&!p.shots.length))} onClick={drinks.active?()=>{void drinks.post();}:p.onPost}>{(busy||drinks.saving)&&!p.cameraPreview?'Posting…':drinks.active?drinks.button:'Post'}</Button>
  </div>
  {drinks.editor}
  {p.children}
 </div>;
}
