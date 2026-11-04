import type {FdcFood} from "./client";
// Provenance travels with nutrient entries through JSON copies and
// portion rescaling. It never acts as a nutrient or changes a source_ref.
type NutritionSource={source_ref?:unknown;micronutrients?:unknown};
export function foodApproximation(row:NutritionSource):{kind:'closest'|'estimate';basis:string}|null{
 if(typeof row.source_ref!=='string'||!row.source_ref||!Array.isArray(row.micronutrients))return null;
 for(const nutrient of row.micronutrients){
  if(!nutrient||typeof nutrient!=='object')continue;
  const value=nutrient.approximation;
  if(value&&typeof value==='object'&&(value.kind==='closest'||value.kind==='estimate')&&typeof value.basis==='string'&&value.basis.trim()&&value.sourceRef===row.source_ref)return{kind:value.kind,basis:value.basis};
 }
 return null;
}
export function approximationLabels(items:readonly (NutritionSource & {name:string})[]):{name:string;basis:string;kind:'closest'|'estimate'}[]{
 const seen=new Set<string>();
 return items.flatMap(item=>{
  const approximation=foodApproximation(item),key=`${item.name}\0${item.source_ref}`;
  if(!approximation||seen.has(key))return[];
  seen.add(key);return[{name:item.name,basis:approximation.basis,kind:approximation.kind}];
 });
}

// Model references have no fetchable USDA id. Keep their per-100 g values in
// provenance, separate from consumed amounts, even when the portion is unknown.
export function storedEstimateFood(row:NutritionSource):FdcFood|null{
 const approximation=foodApproximation(row);
 if(approximation?.kind!=='estimate'||!Array.isArray(row.micronutrients))return null;
 const foodNutrients=row.micronutrients.flatMap(entry=>{
  if(!entry||typeof entry!=='object'||!Number.isSafeInteger(entry.nutrientId)||typeof entry.nutrientName!=='string'||typeof entry.unitName!=='string')return[];
  const tag=entry.approximation,value=tag?.per100;
  if(tag?.kind!=='estimate'||tag.sourceRef!==row.source_ref||tag.basis!==approximation.basis||typeof value!=='number'||!Number.isFinite(value)||value<0)return[];
  return[{nutrientId:entry.nutrientId,nutrientName:entry.nutrientName,unitName:entry.unitName,value}];
 });
 if(!foodNutrients.some(n=>n.nutrientId===1008))return null;
 return{fdcId:0,description:`Model estimate: ${approximation.basis}`,dataType:'Estimate',foodNutrients,approximation};
}
