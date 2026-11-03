"use client";
import {formatGtin} from "@/lib/fdc/gtin";
import {Icon} from "@/components/ui/Icon";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { BarcodeNutrition, ResolvedProduct } from "@/lib/fdc/barcode-product";
const fields:[keyof BarcodeNutrition,string,string][]=[["calories","Calories","kcal"],["protein_g","Protein","g"],["carbs_g","Carbs","g"],["fat_g","Fat","g"],["fibre_g","Fibre","g"],["sugar_g","Sugar","g"],["sodium_mg","Sodium","mg"]];
export default function CorrectProductSheet({product,onClose,onSaved}:{product:ResolvedProduct;onClose:()=>void;onSaved:()=>void}){
 const [name,setName]=useState(product.name);const [pack,setPack]=useState(product.packageWeight?.match(/^[\d.]+/)?.[0]??"");
 const [serving,setServing]=useState(String(product.servingSize??""));const [unit,setUnit]=useState<"g"|"ml">(product.basisUnit);
 const [nutrition,setNutrition]=useState(product.per100g);const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function save(){if(busy)return;setBusy(true);setError("");try{
  const response=await fetch(`/api/barcode/${encodeURIComponent(product.gtin)}/correction`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,pack_amount:pack?Number(pack):null,pack_unit:unit,serving_amount:serving?Number(serving):null,serving_unit:unit,per_100:nutrition})});const result=await response.json();if(!response.ok)throw Error(result.error??"The correction could not be saved.");onSaved();
 }catch(e){setError(e instanceof Error?e.message:"The correction could not be saved.");}finally{setBusy(false);}}
 return <Sheet hideClose open onClose={()=>{if(!busy)onClose();}} label="Correct this product" panelStyle={{overflow:"hidden"}}><div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"><div className="flex h-11 items-center justify-between"><h2 className="text-sheet-head">Correct this product</h2><button type="button" onClick={onClose} disabled={busy} className="size-tap" aria-label="Close correction"><Icon name="close" size={22}/></button></div>
 <p className="text-meta text-muted">Barcode {formatGtin(product.gtin)} · {product.source==="own"?"from your correction":product.source==="shared"?"from a shared correction":"from the database"}</p>
 <label className="text-meta text-muted">Name<Field autoFocus value={name} maxLength={80} onChange={e=>setName(e.target.value)} disabled={busy}/></label>
 <p className="text-meta text-muted">Was “{product.originalName??product.name}” <button type="button" onClick={()=>setName(product.originalName??product.name)} className="font-medium text-text">Undo</button></p>
 <div className="grid shrink-0 grid-cols-2 gap-2"><label className="text-meta text-muted">Pack<div className="relative"><Field type="number" min="0.1" step="any" value={pack} onChange={e=>setPack(e.target.value)} disabled={busy} className="pr-14"/><select aria-label="Pack and serving unit" value={unit} onChange={e=>setUnit(e.target.value as "g"|"ml")} disabled={busy} className="absolute right-2 top-0 h-full bg-transparent text-body text-muted"><option value="g">g</option><option value="ml">ml</option></select></div></label><label className="text-meta text-muted">Serving<div className="relative"><Field type="number" min="0.1" step="any" value={serving} onChange={e=>setServing(e.target.value)} disabled={busy} className="pr-12"/><span className="pointer-events-none absolute right-4 top-0 flex h-full items-center text-body text-muted">{unit}</span></div></label></div>
 <div><p className="mb-2 text-meta text-muted">Per 100 {unit}</p>{fields.map(([key,label,suffix])=><label key={key} className="flex h-10 items-center border-b border-hairline text-comment"><span className="flex-1">{label}</span><input aria-label={label} type="number" min="0" step="any" disabled={busy} value={nutrition[key]??""} onChange={e=>setNutrition({...nutrition,[key]:e.target.value===""?null:Number(e.target.value)})} className={`h-table-row w-16 rounded-thumb bg-white text-right tabular-nums ${nutrition[key]!==product.per100g[key]?"border border-text":"border border-transparent"}`}/><span className="w-7 text-right text-muted">{suffix}</span></label>)}</div>
 <p className="text-meta leading-normal text-muted">Kept for this barcode and used the next time you scan it. Corrections start as yours alone; a name correction is offered to everyone once three people make the same one.</p>
 {error&&<p role="alert" className="text-detail">{error}</p>}</div><Button className="shrink-0" disabled={busy} onClick={()=>{void save();}}>{busy?"Saving…":"Save and use for this post"}</Button></Sheet>;
}
