"use client";
import {useApiFailureText} from '@/i18n/api-error-text';
import {useTranslations} from 'next-intl';
import {formatGtin} from "@/lib/fdc/gtin";
import {Icon} from "@/components/ui/Icon";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { BarcodeCorrection, BarcodeNutrition, ResolvedProduct } from "@/lib/fdc/barcode-product";
const HIDE_PILL_STYLE='nav[data-pill]{visibility:hidden}';
const fields:[keyof BarcodeNutrition,'caloriesField'|'proteinField'|'carbsField'|'fatField'|'fibreField'|'sugarField'|'sodiumField',string][]=[["calories",'caloriesField',"kcal"],["protein_g",'proteinField',"g"],["carbs_g",'carbsField',"g"],["fat_g",'fatField',"g"],["fibre_g",'fibreField',"g"],["sugar_g",'sugarField',"g"],["sodium_mg",'sodiumField',"mg"]];
export default function CorrectProductSheet({product,onClose,onSaved,onSave}:{product:ResolvedProduct;onClose:()=>void;onSaved:()=>void;onSave?:(correction:BarcodeCorrection)=>Promise<void>}){
 const apiError=useApiFailureText();
 const t=useTranslations('postMenu');
 const [name,setName]=useState(product.name);const [pack,setPack]=useState(product.packageWeight?.match(/^[\d.]+/)?.[0]??"");
 const [serving,setServing]=useState(String(product.servingSize??""));const [unit,setUnit]=useState<"g"|"ml">(product.basisUnit);
 const [nutrition,setNutrition]=useState(product.per100g);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function save(){if(busy)return;setBusy(true);setError("");try{
  const correction={name,pack_amount:pack?Number(pack):null,pack_unit:unit,serving_amount:serving?Number(serving):null,serving_unit:unit,per_100:nutrition};
  if(onSave){await onSave(correction);onSaved();return;}
  const response=await fetch(`/api/barcode/${encodeURIComponent(product.gtin)}/correction`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(correction)});const result=await response.json();if(!response.ok)throw Error(apiError(result,"route_f050ad5fac73"));onSaved();
 }catch(e){setError(e instanceof Error?e.message:t('productCorrectionFailed'));}finally{setBusy(false);}}
 return <Sheet hideClose open confirmation={Boolean(onSave)} onClose={()=>{if(!busy)onClose();}} label={t('correctThisProduct')} initialFocus="[data-correct-product-name]" panelStyle={{overflow:"hidden",color:"var(--color-text)"}}>{onSave&&<style>{HIDE_PILL_STYLE}</style>}<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"><div className="flex h-11 items-center justify-between"><h2 className="text-sheet-head">{t('correctThisProduct')}</h2><button type="button" onClick={onClose} disabled={busy} className="size-tap" aria-label={t('closeCorrection')}><Icon name="close" size={22}/></button></div>
 <p className="text-meta text-muted">{product.gtin?t('barcodeSource',{barcode:formatGtin(product.gtin),source:onSave?t('forThisPhoto'):product.source==='own'?t('fromOwnCorrection'):product.source==='shared'?t('fromSharedCorrection'):t('fromDatabase')}):onSave?t('forThisPhoto'):product.source==='own'?t('fromOwnCorrection'):product.source==='shared'?t('fromSharedCorrection'):t('fromDatabase')}</p>
 <label className="text-meta text-muted">{t('nameField')}<Field data-correct-product-name autoFocus className="[&>div:focus-within]:border-text" value={name} maxLength={80} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
 <p className="text-meta text-muted">{t('wasName',{name:product.originalName??product.name})} <button type="button" onClick={()=>setName(product.originalName??product.name)} className="font-medium text-text">{t('undo')}</button></p>
 <div className="grid shrink-0 grid-cols-2 gap-2"><label className="text-meta text-muted">{t('packField')}<Field type="number" min="0.1" step="any" value={pack} onChange={e=>setPack(e.target.value)} disabled={busy} suffix={<select aria-label={t('packServingUnit')} value={unit} onChange={e=>setUnit(e.target.value as "g"|"ml")} disabled={busy} className="bg-transparent text-body text-muted"><option value="g">g</option><option value="ml">ml</option></select>}/></label><label className="text-meta text-muted">{t('servingField')}<Field type="number" min="0.1" step="any" value={serving} onChange={e=>setServing(e.target.value)} disabled={busy} suffix={unit}/></label></div>
 <div><p className="mb-2 text-meta text-muted">{t('per100',{unit})}</p>{fields.map(([key,label,suffix])=><label key={key} className="flex h-10 items-center border-b border-hairline text-comment"><span className="flex-1">{t(label)}</span><input aria-label={t(label)} type="number" min="0" step="any" disabled={busy} value={nutrition[key]??""} onChange={e=>setNutrition({...nutrition,[key]:e.target.value===""?null:Number(e.target.value)})} className={`h-table-row w-16 rounded-thumb bg-white text-right tabular-nums ${nutrition[key]!==product.per100g[key]?"border border-text":"border border-transparent"}`}/><span className="w-7 text-right text-muted">{suffix}</span></label>)}</div>
 <p className="text-meta leading-normal text-muted">{onSave?t('usedForPhoto'):t('barcodePersistence')}</p>
 {error&&<p role="alert" className="text-detail">{error}</p>}</div><Button className="shrink-0" disabled={busy} onClick={()=>{void save();}}>{busy?t('saving'):t('saveUsePost')}</Button></Sheet>;
}
