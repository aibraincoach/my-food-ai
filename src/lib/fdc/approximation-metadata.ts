// Provenance travels with actual USDA nutrient entries through JSON copies and
// portion rescaling. It never acts as a nutrient or changes a source_ref.
type NutritionSource={source_ref?:unknown;micronutrients?:unknown};
export function foodApproximation(row:NutritionSource):{kind:'closest';basis:string}|null{
 if(typeof row.source_ref!=='string'||!row.source_ref||!Array.isArray(row.micronutrients))return null;
 for(const nutrient of row.micronutrients){
  if(!nutrient||typeof nutrient!=='object')continue;
  const value=nutrient.approximation;
  if(value&&typeof value==='object'&&value.kind==='closest'&&typeof value.basis==='string'&&value.basis.trim()&&value.sourceRef===row.source_ref)return{kind:'closest',basis:value.basis};
 }
 return null;
}
export function approximationLabels(items:readonly (NutritionSource & {name:string})[]):{name:string;basis:string}[]{
 const seen=new Set<string>();
 return items.flatMap(item=>{
  const approximation=foodApproximation(item),key=`${item.name}\0${item.source_ref}`;
  if(!approximation||seen.has(key))return[];
  seen.add(key);return[{name:item.name,basis:approximation.basis}];
 });
}
