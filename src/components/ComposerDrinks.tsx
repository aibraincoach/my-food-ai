'use client';
import {DisplayError} from '@/i18n/display-error';
import {useFailureMessages} from '@/i18n/failure-messages';
import {CaptureFailureError,captureFailureText,failureFromResponse} from '@/lib/posts/capture-failure';
import {useTranslations,useLocale} from 'next-intl';
import {useEffect,useRef,useState} from 'react';
import CorrectProductSheet from './CorrectProductSheet';
import type {DrinkCorrection} from '@/lib/intake/drink-correction';
import {photoDrinkProduct,scalePhotoDrink,type PhotoDrinkReading} from '@/lib/intake/photo-drinks';
import {uploadManager,type UploadState} from '@/lib/posts/upload-manager';
import {formatCalories} from '@/lib/nutrition/totals';
import {fromLocalInput} from '@/lib/posts/eaten-at';

type Props={upload?:UploadState;shots:{previewUrl:string}[];notEaten:number[];caption:string;when:string|null;busy:boolean;saveAsMeal:boolean;locationEnabled:boolean};

export function useComposerDrinks(p:Props){
 const tn=useTranslations('nutrition');
 const tf=useFailureMessages();
 const t=useTranslations('capture');
 const locale=useLocale();
 const amount=(value:number|null)=>value===null?t('unavailable'):new Intl.NumberFormat(locale,{maximumFractionDigits:1}).format(value);
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
    if(!response.ok)throw new CaptureFailureError(failureFromResponse(result));return result as PhotoDrinkReading;
   }throw new DisplayError(tf('route_56080fee81fd'));};
   void identify()
    .then(result=>setReadings(previous=>({...previous,[key]:result})))
    .catch(failure=>setError({identity:mine,message:failure instanceof CaptureFailureError ? captureFailureText(failure.failure,tf)! : failure instanceof DisplayError ? failure.message:t('error_622c487d3135')}));
  }
 },[uploadId,p.upload?.state,p.shots.length,identity,t,tf]);
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
   if(!p.upload||!uploadId)throw new DisplayError(t('error_a8b5df9b34f6'));
   const eatenAt=p.when?fromLocalInput(p.when):new Date().toISOString();if(!eatenAt)throw new DisplayError(tf('route_6572182f4064'));
   await uploadManager.postPhotoDrinks({upload_id:uploadId,caption:p.caption,save_as_meal:p.saveAsMeal,location:p.locationEnabled?uploadManager.fields(p.upload.operationId)?.location??null:null,eaten_at:eatenAt,readings:p.shots.map((_,position)=>({reading_id:readingAt(position).id,selections:rows.filter(r=>r.position===position).map(r=>({index:r.index,ml:r.chosen.ml}))}))},p.caption.trim()||(rows.length===1?rows[0].chosen.name:t('drinksCount',{count:rows.length})),p.upload.operationId);
   window.dispatchEvent(new Event('close-sheets'));
  }catch(failure){setError({identity,message:failure instanceof CaptureFailureError ? captureFailureText(failure.failure,tf)! : failure instanceof DisplayError ? failure.message:t('drinksPostFailed')});}finally{queueing.current=false;setSaving(false);}
 }
 const correction=all.find(r=>r.key===correcting);
 async function saveCorrection(value:DrinkCorrection){
  if(!correction)return;
  const response=await fetch('/api/drinks/identify',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({reading_id:readingAt(correction.position).id,index:correction.index,correction:value})});
  const result=await response.json();if(!response.ok)throw new CaptureFailureError(failureFromResponse(result));
  setReadings(previous=>({...previous,[`${uploadId}:${correction.position}`]:result}));setVolumes(previous=>{const next={...previous};delete next[correction.key];return next;});
 }
 const card=ready?<section aria-label={t('drinks_in_this_photo')} className="bg-text px-5 pt-[18px] text-surface">
  {!row?<>
   <div className="flex items-baseline justify-between gap-3"><h2 className="text-sheet-title">{rows.length} {t('drinks')}</h2><p className="text-detail text-faint">{t('tap_one_to_change_it')}</p></div>
   <div className="mt-3">{rows.map((r,index)=><button key={r.key} type="button" disabled={busy} onClick={()=>setSelected(r.key)} className="flex min-h-[46px] w-full items-center gap-3 border-b border-white/10 text-left"><span className="flex size-[22px] shrink-0 items-center justify-center rounded-circle bg-accent text-meta text-text">{index+1}</span><span className="min-w-0 flex-1"><span className="block text-body font-medium">{r.chosen.name}</span><span className="text-detail text-faint">{amount(r.chosen.ml)} {t('ml')}{r.chosen.kcal===null?t('unavailable'):formatCalories(r.chosen.kcal,tn,locale)} {t('kcal_72037b')}</span></span><span className="text-detail tabular-nums">{r.chosen.caffeineMg?t('v0_mg', {v0: amount(Math.round(r.chosen.caffeineMg))}):'—'}</span></button>)}</div>
   <p className="mt-3 text-detail">{amount(sum('ml'))} {t('ml')}{amount(sum('caffeineMg')===null?null:Math.round(sum('caffeineMg')!))} {t('mg_caffeine')}{sum('kcal')===null?t('unavailable'):formatCalories(sum('kcal'),tn,locale)} {t('kcal_72037b')}</p>
  </>:<>
   {rows.length>1&&<button type="button" disabled={busy} onClick={()=>setSelected(null)} className="mb-3 text-detail text-faint">{t('all')}{rows.length} {t('drinks')}</button>}
   <p className="text-meta text-faint">{t('drink')}{row.drink.source==='read from the can'?t('readFromCan'):t('estimatedFromPhoto')}</p>
   <div className="mt-2 flex items-center justify-between gap-3"><h2 className="text-sheet-title">{row.chosen.name}</h2>{row.drink.source==='read from the can'&&<button type="button" disabled={busy} onClick={()=>setCorrecting(row.key)} className="rounded-pill bg-white/12 px-[10px] py-1 text-meta">{t('correct')}</button>}</div>
   {row.drink.source==='read from the can'?<div className="mt-4 grid grid-cols-3 gap-2"><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{amount(row.chosen.ml)}<span className="block text-meta text-faint">{t('ml_b331fc')}</span></p><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))}<span className="block text-meta text-faint">{t('mg_caffeine_e9df91')}</span></p><p className="rounded-field bg-white/8 px-3 py-3 break-words text-[24px] tabular-nums">{row.chosen.kcal===null?t('unavailable'):formatCalories(row.chosen.kcal,tn,locale)}<span className="block text-meta text-faint">{t('kcal_72037b')}</span></p></div>:<p className="mt-4"><span className="text-[44px] font-light leading-none tabular-nums">{amount(row.chosen.ml)}</span><span className="ml-2 text-body text-faint">{t('ml_b331fc')}</span></p>}
   <p className="mt-5 text-detail">{t('how_much_did_you_drink')}</p>
   <div className="mt-2 flex gap-2">{[{label:row.drink.source==='read from the can'?t('wholeCan'):t('allOfIt'),wide:row.drink.source==='read from the can',ml:row.drink.ml},{label:t('half'),wide:false,ml:row.drink.ml/2}].map(option=><button key={option.label} type="button" disabled={busy} aria-pressed={row.chosen.ml===option.ml&&other!==row.key} onClick={()=>{setVolume(row.key,option.ml);setOther(null);}} className={`min-h-10 ${option.wide?'flex-[1.4]':'flex-1'} whitespace-nowrap rounded-field border px-3 text-detail ${row.chosen.ml===option.ml&&other!==row.key?'border-surface bg-surface text-text':'border-white/25 bg-transparent'}`}>{option.label}</button>)}<button type="button" disabled={busy} aria-pressed={other===row.key} onClick={()=>setOther(row.key)} className="min-h-10 flex-1 rounded-field border border-white/25 bg-transparent px-3 text-detail">{t('other')}</button></div>
   {other===row.key&&<label className="mt-3 flex items-center gap-2 text-detail"><input aria-label={t('amount_drunk_in_ml')} type="number" min="1" max="5000" step="any" disabled={busy} value={row.chosen.ml} onChange={e=>setVolume(row.key,Number(e.target.value))} className="min-h-tap min-w-0 flex-1 rounded-field border border-white/25 bg-transparent px-3"/>{t('ml_b331fc')}</label>}
   <p className="mt-4 text-detail text-faint">{t('adds')}{amount(row.chosen.ml)} {t('ml_b331fc')}{row.chosen.caffeineMg?t('and_v0_mg_caffeine', {v0: amount(row.chosen.caffeineMg===null?null:Math.round(row.chosen.caffeineMg))}):''}{row.chosen.caffeineMg||todayMl===null?t('to_today'):t('to_today_s_v0_ml', {v0: amount(todayMl)})}</p>
   {all.length>1&&<button type="button" disabled={busy} onClick={()=>{setVolumes(previous=>({...previous,[row.key]:null}));setSelected(null);setOther(null);}} className="mt-2 min-h-10 text-detail text-faint underline">{t('remove_drink')}</button>}
  </>}
  {!rows.length&&<p className="mt-3 text-detail text-faint">{t('all_drinks_were_removed_add_another_photo')}</p>}
 </section>:null;
 const editor=correction?<CorrectProductSheet product={photoDrinkProduct(correction.drink)} onSave={saveCorrection} onSaved={()=>setCorrecting(null)} onClose={()=>setCorrecting(null)}/>:null;
 return {identity,active:ready,card,editor,error:error.identity===identity?error.message:'',saving,post,button:rows.length===1?t('postDrinkVolume',{amount:amount(rows[0].chosen.ml)}):t('postDrinks',{count:rows.length}),disabled:!rows.length};
}
