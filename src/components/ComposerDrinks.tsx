'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import CorrectProductSheet from './CorrectProductSheet';
import type {BarcodeCorrection} from '@/lib/fdc/barcode-product';
import {photoDrinkProduct,scalePhotoDrink,type PhotoDrinkReading} from '@/lib/intake/photo-drinks';
import {uploadManager,type UploadState} from '@/lib/posts/upload-manager';
import {fromLocalInput} from '@/lib/posts/eaten-at';

type Props={upload?:UploadState;shots:{previewUrl:string}[];notEaten:number[];caption:string;when:string|null;busy:boolean;saveAsMeal:boolean;locationEnabled:boolean};
const amount=(value:number|null)=>value===null?'unavailable':new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(value);
export function useComposerDrinks(p:Props){
 const router=useRouter();
 const [readings,setReadings]=useState<Record<string,PhotoDrinkReading>>({});
 const [volumes,setVolumes]=useState<Record<string,number|null>>({});
 const [selected,setSelected]=useState<string|null>(null),[other,setOther]=useState<string|null>(null),[correcting,setCorrecting]=useState<string|null>(null);
 const [saving,setSaving]=useState(false),[error,setError]=useState({identity:'',message:''}),[todayMl,setTodayMl]=useState<number|null>(null);
 const attempted=useRef(new Set<string>());
 const uploadId=p.upload?.uploadId;
 const identity=uploadId?`${uploadId}:${p.shots.map(s=>s.previewUrl).join('|')}`:'';
 // Cache by actual upload and position; a replaced photo cannot render an old response.
 const readingAt=(position:number)=>readings[`${uploadId}:${position}`];
 useEffect(()=>{
  if(!uploadId||p.upload?.state!=='uploaded'||!p.shots.length)return;
  const mine=identity;
  for(let position=0;position<p.shots.length;position++){
   const key=`${uploadId}:${position}`;
   if(attempted.current.has(key))continue;attempted.current.add(key);
   void fetch('/api/drinks/identify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({upload_id:uploadId,position})})
    .then(async response=>{const result=await response.json();if(!response.ok)throw Error(result.error??'Drinks could not be checked.');return result as PhotoDrinkReading;})
    .then(result=>setReadings(previous=>({...previous,[key]:result})))
    .catch(failure=>setError({identity:mine,message:failure instanceof Error?failure.message:'Drinks could not be checked.'}));
  }
 },[uploadId,p.upload?.state,p.shots.length,identity]);
 const ready=!!uploadId&&p.shots.length>0&&!p.notEaten.length&&p.shots.every((_,position)=>readingAt(position)?.allDrinks);
 useEffect(()=>{if(!ready)return;const controller=new AbortController();void fetch(`/api/intake/post?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,{signal:controller.signal}).then(async response=>{if(!response.ok)return;const result=await response.json();setTodayMl((result.rows??[]).reduce((n:number,r:{ml?:number|null;kind:string;amount:number})=>n+(r.ml??(r.kind==='water'?r.amount:0)),0));}).catch(()=>{});return()=>controller.abort();},[ready]);
 const all=ready?p.shots.flatMap((_,position)=>readingAt(position).drinks.map((drink,index)=>({key:`${uploadId}:${position}:${index}`,position,index,drink}))):[];
 const rows=all.filter(row=>volumes[row.key]!==null).map(row=>({...row,chosen:scalePhotoDrink(row.drink,volumes[row.key]??row.drink.ml)}));
 const row=rows.find(r=>r.key===selected)??(rows.length===1?rows[0]:undefined);
 const sum=(key:'ml'|'caffeineMg'|'kcal')=>rows.some(r=>r.chosen[key]===null)?null:rows.reduce((n,r)=>n+Number(r.chosen[key]),0);
 const busy=p.busy||saving;
 const setVolume=(key:string,ml:number)=>{if(Number.isFinite(ml)&&ml>=1&&ml<=5000)setVolumes(previous=>({...previous,[key]:ml}));};
 async function post(){
  if(!ready||busy||!rows.length)return;setSaving(true);setError({identity,message:''});
  try{
   const response=await fetch('/api/drinks/post',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({upload_id:uploadId,caption:p.caption,save_as_meal:p.saveAsMeal,location:p.locationEnabled&&p.upload?uploadManager.fields(p.upload.operationId)?.location??null:null,...(p.when?{eaten_at:fromLocalInput(p.when)}:{}),readings:p.shots.map((_,position)=>({reading_id:readingAt(position).id,selections:rows.filter(r=>r.position===position).map(r=>({index:r.index,ml:r.chosen.ml}))}))})});
   const result=await response.json();if(!response.ok)throw Error(result.error??'The drinks could not be posted.');
   if(p.upload)await uploadManager.remove(p.upload.operationId);
   window.dispatchEvent(new CustomEvent('post-created',{detail:{id:result.post_id}}));window.dispatchEvent(new Event('close-sheets'));router.refresh();
  }catch(failure){setError({identity,message:failure instanceof Error?failure.message:'The drinks could not be posted.'});}finally{setSaving(false);}
 }
 const correction=all.find(r=>r.key===correcting);
 async function saveCorrection(value:BarcodeCorrection){
  if(!correction)return;
  const response=await fetch('/api/drinks/identify',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({reading_id:readingAt(correction.position).id,index:correction.index,correction:value})});
  const result=await response.json();if(!response.ok)throw Error(result.error??'The correction could not be saved.');
  setReadings(previous=>({...previous,[`${uploadId}:${correction.position}`]:result}));setVolumes(previous=>{const next={...previous};delete next[correction.key];return next;});
 }
 const card=ready?<section aria-label="Drinks in this photo" className="mx-inset mt-4 rounded-card border border-hairline bg-card p-inset">
  {!row?<>
   <h2 className="text-sheet-title">{rows.length} drinks</h2><p className="mt-1 text-detail text-muted">Tap one to change it</p>
   <div className="mt-3">{rows.map((r,index)=><button key={r.key} type="button" disabled={busy} onClick={()=>setSelected(r.key)} className="flex min-h-16 w-full items-center gap-3 border-b border-hairline text-left"><span className="text-meta text-muted">{index+1}</span><span className="min-w-0 flex-1"><span className="block text-body font-medium">{r.chosen.name}</span><span className="text-detail text-muted">{amount(r.chosen.ml)} ml · {amount(r.chosen.kcal)} kcal</span></span><span className="text-detail tabular-nums">{r.chosen.caffeineMg?`${amount(Math.round(r.chosen.caffeineMg))} mg`:'—'}</span></button>)}</div>
   <p className="mt-3 text-detail">{amount(sum('ml'))} ml · {amount(sum('caffeineMg')===null?null:Math.round(sum('caffeineMg')!))} mg caffeine · {amount(sum('kcal'))} kcal</p>
  </>:<>
   {rows.length>1&&<button type="button" disabled={busy} onClick={()=>setSelected(null)} className="mb-3 text-detail text-muted">‹ All {rows.length} drinks</button>}
   <p className="text-meta text-muted">Drink · {row.drink.source}</p>
   <div className="mt-2 flex items-center justify-between gap-3"><h2 className="text-sheet-title">{row.chosen.name}</h2>{row.drink.source==='read from the can'&&<button type="button" disabled={busy} onClick={()=>setCorrecting(row.key)} className="text-detail underline">Correct</button>}</div>
   {row.drink.source==='read from the can'?<div className="mt-4 grid grid-cols-3 gap-1 text-center"><p className="rounded-field bg-surface py-3 text-body tabular-nums">{amount(row.chosen.ml)}<span className="block text-meta text-muted">ml</span></p><p className="rounded-field bg-surface py-3 text-body tabular-nums">{amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))}<span className="block text-meta text-muted">mg caffeine</span></p><p className="rounded-field bg-surface py-3 text-body tabular-nums">{amount(row.chosen.kcal)}<span className="block text-meta text-muted">kcal</span></p></div>:<p className="mt-4"><span className="text-[52px] leading-none tabular-nums">{amount(row.chosen.ml)}</span><span className="ml-2 text-body text-muted">ml</span></p>}
   <p className="mt-5 text-detail">How much did you drink?</p>
   <div className="mt-2 flex gap-2">{[{label:row.drink.source==='read from the can'?'The whole can':'All of it',ml:row.drink.ml},{label:'Half',ml:row.drink.ml/2}].map(option=><button key={option.label} type="button" disabled={busy} aria-pressed={row.chosen.ml===option.ml&&other!==row.key} onClick={()=>{setVolume(row.key,option.ml);setOther(null);}} className={`min-h-10 flex-1 rounded-pill border px-3 text-detail ${row.chosen.ml===option.ml&&other!==row.key?'border-text bg-text text-surface':'border-ring bg-surface'}`}>{option.label}</button>)}<button type="button" disabled={busy} aria-pressed={other===row.key} onClick={()=>setOther(row.key)} className="min-h-10 flex-1 rounded-pill border border-ring bg-surface px-3 text-detail">Other</button></div>
   {other===row.key&&<label className="mt-3 flex items-center gap-2 text-detail"><input aria-label="Amount drunk in ml" type="number" min="1" max="5000" step="any" disabled={busy} value={row.chosen.ml} onChange={e=>setVolume(row.key,Number(e.target.value))} className="min-h-tap min-w-0 flex-1 rounded-field border border-ring bg-surface px-3"/>ml</label>}
   <p className="mt-4 text-detail text-muted">Adds {amount(row.chosen.ml)} ml{row.chosen.caffeineMg?` and ${amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))} mg caffeine`:''}{row.chosen.caffeineMg||todayMl===null?' to today':` to today's ${amount(todayMl)} ml`}</p>
   <button type="button" disabled={busy} onClick={()=>{setVolumes(previous=>({...previous,[row.key]:null}));setSelected(null);setOther(null);}} className="mt-3 min-h-10 text-detail text-muted underline">Remove drink</button>
  </>}
  {!rows.length&&<p className="mt-3 text-detail text-muted">All drinks were removed. Add another photo to make a new post.</p>}
 </section>:null;
 const editor=correction?<CorrectProductSheet product={photoDrinkProduct(correction.drink)} onSave={saveCorrection} onSaved={()=>setCorrecting(null)} onClose={()=>setCorrecting(null)}/>:null;
 return {active:ready,card,editor,error:ready&&error.identity===identity?error.message:'',saving,post,button:rows.length===1?`Post · ${amount(rows[0].chosen.ml)} ml`:`Post ${rows.length} drinks`,disabled:!rows.length};
}
