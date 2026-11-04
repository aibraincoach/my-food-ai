'use client';
import {useEffect,useRef,useState} from 'react';
import CorrectProductSheet from './CorrectProductSheet';
import type {BarcodeCorrection} from '@/lib/fdc/barcode-product';
import {photoDrinkProduct,scalePhotoDrink,type PhotoDrinkReading} from '@/lib/intake/photo-drinks';
import {uploadManager,type UploadState} from '@/lib/posts/upload-manager';
import {formatCalories} from '@/lib/nutrition/totals';
import {fromLocalInput} from '@/lib/posts/eaten-at';

type Props={upload?:UploadState;shots:{previewUrl:string}[];notEaten:number[];caption:string;when:string|null;busy:boolean;saveAsMeal:boolean;locationEnabled:boolean};
const amount=(value:number|null)=>value===null?'unavailable':new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(value);
export function useComposerDrinks(p:Props){
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
   const identify=async()=>{for(let attempt=0;attempt<90;attempt++){
    const response=await fetch('/api/drinks/identify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({upload_id:uploadId,position})});
    const result=await response.json();
    if(response.status===409){await new Promise(resolve=>setTimeout(resolve,1000));continue;}
    if(!response.ok)throw Error(result.error??'Drinks could not be checked.');return result as PhotoDrinkReading;
   }throw Error('Drinks could not be checked. You can still post the photo.');};
   void identify()
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
 const queueing=useRef(false);
 const busy=p.busy||saving;
 const setVolume=(key:string,ml:number)=>{if(Number.isFinite(ml)&&ml>=1&&ml<=5000)setVolumes(previous=>({...previous,[key]:ml}));};
 async function post(){
  if(!ready||busy||!rows.length||queueing.current)return;queueing.current=true;setSaving(true);setError({identity,message:''});
  try{
   if(!p.upload||!uploadId)throw Error('Keep the uploaded drink photo and try again.');
   const eatenAt=p.when?fromLocalInput(p.when):new Date().toISOString();if(!eatenAt)throw Error('Choose a valid time eaten.');
   await uploadManager.postPhotoDrinks({upload_id:uploadId,caption:p.caption,save_as_meal:p.saveAsMeal,location:p.locationEnabled?uploadManager.fields(p.upload.operationId)?.location??null:null,eaten_at:eatenAt,readings:p.shots.map((_,position)=>({reading_id:readingAt(position).id,selections:rows.filter(r=>r.position===position).map(r=>({index:r.index,ml:r.chosen.ml}))}))},p.caption.trim()||(rows.length===1?rows[0].chosen.name:rows.length+' drinks'),p.upload.operationId);
   window.dispatchEvent(new Event('close-sheets'));
  }catch(failure){setError({identity,message:failure instanceof Error?failure.message:'The drinks could not be posted.'});}finally{queueing.current=false;setSaving(false);}
 }
 const correction=all.find(r=>r.key===correcting);
 async function saveCorrection(value:BarcodeCorrection){
  if(!correction)return;
  const response=await fetch('/api/drinks/identify',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({reading_id:readingAt(correction.position).id,index:correction.index,correction:value})});
  const result=await response.json();if(!response.ok)throw Error(result.error??'The correction could not be saved.');
  setReadings(previous=>({...previous,[`${uploadId}:${correction.position}`]:result}));setVolumes(previous=>{const next={...previous};delete next[correction.key];return next;});
 }
 const card=ready?<section aria-label="Drinks in this photo" className="bg-text px-5 pt-[18px] text-surface">
  {!row?<>
   <div className="flex items-baseline justify-between gap-3"><h2 className="text-sheet-title">{rows.length} drinks</h2><p className="text-detail text-faint">Tap one to change it</p></div>
   <div className="mt-3">{rows.map((r,index)=><button key={r.key} type="button" disabled={busy} onClick={()=>setSelected(r.key)} className="flex min-h-[46px] w-full items-center gap-3 border-b border-white/10 text-left"><span className="flex size-[22px] shrink-0 items-center justify-center rounded-circle bg-accent text-meta text-text">{index+1}</span><span className="min-w-0 flex-1"><span className="block text-body font-medium">{r.chosen.name}</span><span className="text-detail text-faint">{amount(r.chosen.ml)} ml · {r.chosen.kcal===null?'unavailable':formatCalories(r.chosen.kcal)} kcal</span></span><span className="text-detail tabular-nums">{r.chosen.caffeineMg?`${amount(Math.round(r.chosen.caffeineMg))} mg`:'—'}</span></button>)}</div>
   <p className="mt-3 text-detail">{amount(sum('ml'))} ml · {amount(sum('caffeineMg')===null?null:Math.round(sum('caffeineMg')!))} mg caffeine · {sum('kcal')===null?'unavailable':formatCalories(sum('kcal'))} kcal</p>
  </>:<>
   {rows.length>1&&<button type="button" disabled={busy} onClick={()=>setSelected(null)} className="mb-3 text-detail text-faint">‹ All {rows.length} drinks</button>}
   <p className="text-meta text-faint">Drink · {row.drink.source}</p>
   <div className="mt-2 flex items-center justify-between gap-3"><h2 className="text-sheet-title">{row.chosen.name}</h2>{row.drink.source==='read from the can'&&<button type="button" disabled={busy} onClick={()=>setCorrecting(row.key)} className="rounded-pill bg-white/12 px-[10px] py-1 text-meta">Correct</button>}</div>
   {row.drink.source==='read from the can'?<div className="mt-4 grid grid-cols-3 gap-2"><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{amount(row.chosen.ml)}<span className="block text-meta text-faint">ml</span></p><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))}<span className="block text-meta text-faint">mg caffeine</span></p><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{row.chosen.kcal===null?'unavailable':formatCalories(row.chosen.kcal)}<span className="block text-meta text-faint">kcal</span></p></div>:<p className="mt-4"><span className="text-[44px] font-light leading-none tabular-nums">{amount(row.chosen.ml)}</span><span className="ml-2 text-body text-faint">ml</span></p>}
   <p className="mt-5 text-detail">How much did you drink?</p>
   <div className="mt-2 flex gap-2">{[{label:row.drink.source==='read from the can'?'The whole can':'All of it',ml:row.drink.ml},{label:'Half',ml:row.drink.ml/2}].map(option=><button key={option.label} type="button" disabled={busy} aria-pressed={row.chosen.ml===option.ml&&other!==row.key} onClick={()=>{setVolume(row.key,option.ml);setOther(null);}} className={`min-h-10 ${option.label==='The whole can'?'flex-[1.4]':'flex-1'} whitespace-nowrap rounded-field border px-3 text-detail ${row.chosen.ml===option.ml&&other!==row.key?'border-surface bg-surface text-text':'border-white/25 bg-transparent'}`}>{option.label}</button>)}<button type="button" disabled={busy} aria-pressed={other===row.key} onClick={()=>setOther(row.key)} className="min-h-10 flex-1 rounded-field border border-white/25 bg-transparent px-3 text-detail">Other</button></div>
   {other===row.key&&<label className="mt-3 flex items-center gap-2 text-detail"><input aria-label="Amount drunk in ml" type="number" min="1" max="5000" step="any" disabled={busy} value={row.chosen.ml} onChange={e=>setVolume(row.key,Number(e.target.value))} className="min-h-tap min-w-0 flex-1 rounded-field border border-white/25 bg-transparent px-3"/>ml</label>}
   <p className="mt-4 text-detail text-faint">Adds {amount(row.chosen.ml)} ml{row.chosen.caffeineMg?` and ${amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))} mg caffeine`:''}{row.chosen.caffeineMg||todayMl===null?' to today':` to today's ${amount(todayMl)} ml`}</p>
   {all.length>1&&<button type="button" disabled={busy} onClick={()=>{setVolumes(previous=>({...previous,[row.key]:null}));setSelected(null);setOther(null);}} className="mt-2 min-h-10 text-detail text-faint underline">Remove drink</button>}
  </>}
  {!rows.length&&<p className="mt-3 text-detail text-faint">All drinks were removed. Add another photo to make a new post.</p>}
 </section>:null;
 const editor=correction?<CorrectProductSheet product={photoDrinkProduct(correction.drink)} onSave={saveCorrection} onSaved={()=>setCorrecting(null)} onClose={()=>setCorrecting(null)}/>:null;
 return {active:ready,card,editor,error:error.identity===identity?error.message:'',saving,post,button:rows.length===1?`Post · ${amount(rows[0].chosen.ml)} ml`:`Post ${rows.length} drinks`,disabled:!rows.length};
}
