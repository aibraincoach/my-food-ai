// One deterministic shared-pot/portion rule. Names and visible portions survive;
// only consumed nutrients are zeroed, with recoverable provenance in source_ref.
const POT=/\b(?:hot[- ]pot|shabu(?:[- ]shabu)?|sukiyaki|steamboat)\b/i;
const SAUCE=/\b(?:dipping sauce|shabu sauce|hot[- ]pot sauce)\b/i;
const BROTH=/\b(?:broth|stock|soup base)\b/i;
const withoutSauce=(text:string)=>text.replace(new RegExp(SAUCE.source,'gi'),'');
export type PotItem={name:string;portionText?:string|null;portionGrams?:number|null};
export type PotContext={caption:string;names:readonly string[];corrections?:readonly string[];items?:readonly PotItem[]};
// A bottle named "shabu sauce" alone is not evidence of a shared hot pot.
export function sharedPotContext(context:PotContext):boolean {
 if(POT.test(withoutSauce(context.caption))||context.names.some(name=>POT.test(withoutSauce(name))))return true;
 const namedPotSauce=context.names.some(name=>/\b(?:shabu sauce|hot[- ]pot sauce)\b/i.test(name));
 const items=context.items??context.names.map(name=>({name,portionText:null}));
 return namedPotSauce&&items.some(item=>/\b(?:pork|beef)\b/i.test(item.name)&&!/\b(?:ham|bacon|sausage)\b/i.test(item.name)&&/\b(?:thin(?:ly)?[- ](?:slices?|sliced)|shabu|hot[- ]pot|sukiyaki)\b/i.test(item.name+' '+(item.portionText??'')));
}
export function sharedPotKind(name:string):'broth'|'sauce'|null {
 // The item itself must be the liquid/condiment, not food served with it.
 for(const [kind,term]of [['broth',BROTH],['sauce',SAUCE]]as const){
  const head=new RegExp(term.source+'(?:\\s*\\([^)]*\\))?\\s*[.!]?$','i').exec(name);
  if(head&&!/\b(?:with|in|and|over|on|served)\b/i.test(name.slice(0,head.index)))return kind;
 }
 return null;
}
export function countSharedItem(kind:'broth'|'sauce',context:PotContext):boolean {
 const target=kind==='broth'?'(?:broth|stock|soup base)':'(?:sauce|dipping sauce|shabu sauce|hot[- ]pot sauce)';
 const amount='(?:(?:some|all|any|half)(?:\\s+of)?\\s+)?(?:the\\s+|this\\s+|my\\s+)?';
 const directive=new RegExp('\\b(?:(?:i\\s+)?(?:drank|ate|consumed|had|finished|sipped)|count)\\s+'+amount+target+'\\b','i');
 const excluded=new RegExp("\\b(?:do not|don't|did not|didn't|not)\\s+(?:count|drink|eat|consume|have|finish|sip|drank|ate|consumed|had|finished|sipped)\\s+"+amount+target+'\\b','i');
 let counted=false;
 for(const text of[context.caption,...(context.corrections??[])]){
  if(excluded.test(text))counted=false;
  else if(directive.test(text))counted=true;
 }
 return counted;
}
export function excludeSharedItem(name:string,context:PotContext):boolean {
 const kind=sharedPotKind(name);
 return Boolean(kind&&sharedPotContext(context)&&!countSharedItem(kind,context));
}
export const PINNED_SOURCE=/^(barcode:|off:|label|user:)/;
const PREFIX='shared-pot:v1:';
export type SharedNutrition={calories?:unknown;protein_g?:unknown;carbs_g?:unknown;fat_g?:unknown;fibre_g?:unknown;sugar_g?:unknown;sodium_mg?:unknown;micronutrients?:unknown;source_ref?:unknown;food_category?:unknown;candidates?:readonly SharedNutrition[]};
export type SharedMarker={kind:'broth'|'sauce';original:SharedNutrition|null};
export function sharedPotMarker(ref:unknown):SharedMarker|null {
 if(typeof ref!=='string'||!ref.startsWith(PREFIX))return null;
 let value:unknown;try{value=JSON.parse(ref.slice(PREFIX.length));}catch{return null;}
 if(!value||typeof value!=='object')return null;
 const v=value as SharedMarker;
 return (v.kind==='broth'||v.kind==='sauce')&&(v.original===null||typeof v.original==='object'&&!Array.isArray(v.original))?v:null;
}
function originalSharedNutrition(row:SharedNutrition|null):SharedNutrition|null {
 if(!row)return null;
 const marked=sharedPotMarker(row.source_ref);
 if(marked)return originalSharedNutrition(marked.original);
 if(Array.isArray(row.candidates)){
  const flattened=row.candidates.flatMap(candidate=>{
   const value=originalSharedNutrition(candidate);
   return value?.candidates?[...value.candidates]:value?[value]:[];
  });
  const unique=[...new Map(flattened.map(value=>[JSON.stringify(value),value])).values()];
  return unique.length===1?unique[0]:unique.length?{source_ref:null,candidates:unique}:null;
 }
 return row;
}
export function sharedNutrition(kind:'broth'|'sauce',original:SharedNutrition|null=null){
 return {calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[],
  source_ref:PREFIX+JSON.stringify({kind,original:originalSharedNutrition(original)}),food_category:typeof original?.food_category==='string'?original.food_category:null};
}
export const SHABU_SLICE_GRAMS=15;
// Snow Brand BeanStalk Mamecomi, "肉 うす切り1枚": shabu half slice8g,
// whole slice15g (rounded guide). Published estimate, not a measurement of a meal.
export const SHABU_SLICE_SOURCE='https://www.mamecomi.jp/babyfood_recipes/babyfood/ingredients';
export function thinPotMeat(item:PotItem,context:PotContext):'pork'|'beef'|null {
 const meal={...context,items:context.items??[item,...context.names.filter(name=>name!==item.name).map(name=>({name}))]};
 const namedContext=[context.caption,...context.names].some(text=>/\b(?:hot[- ]pot|shabu(?:[- ]shabu)?|sukiyaki)\b/i.test(withoutSauce(text)));
 const sauceContext=context.names.some(name=>/\b(?:shabu sauce|hot[- ]pot sauce)\b/i.test(name));
 if((!namedContext&&!sauceContext)||!sharedPotContext(meal)||/\b(?:ham|bacon|toast|sausage|meatballs?)\b/i.test(item.name))return null;
 if(!/\b(?:thin(?:ly)?[- ](?:sliced?|slices?)|thin slices?|shabu|sukiyaki)\b/i.test(item.name+' '+(item.portionText??'')))return null;
 return /\bpork\b/i.test(item.name)?'pork':/\bbeef\b/i.test(item.name)?'beef':null;
}
export function thinPotPortion(item:PotItem,context:PotContext){
 const meat=thinPotMeat(item,context);
 const count=(item.portionText??item.name).match(/\b(\d+(?:\.\d+)?)\s+(?:thin(?:ly)?[- ](?:cut\s+)?|thinly sliced\s+)?slices?\b/i);
 // Explicit user mass wins; do not misattribute a mass from another caption item.
 const explicitMass=/\b\d+(?:\.\d+)?\s*(?:g|grams?|kg|kilograms?|oz|ounces?)\b/i.test(context.caption);
 if(!meat)return {grams:item.portionGrams??null,adjusted:false};
 const mass='(\\d+(?:\\.\\d+)?)\\s*(kilograms?|kg|grams?|g|ounces?|oz)\\b';
 const after=new RegExp('\\b'+meat+'\\b(?:\\s+(?:for\\s+)?(?:shabu|hot[- ]pot|sukiyaki|thin|slices?|weighed)|,\\s*weighed){0,5}\\s*'+mass,'i').exec(context.caption);
 const before=new RegExp('\\b'+mass+'\\s+(?:(?:of|thin|sliced|shabu)\\s+){0,4}'+meat+'\\b','i').exec(context.caption);
 const stated=after??before;
 if(stated){
  const multiplier=/^(?:kg|kilogram)/i.test(stated[2])?1000:/^(?:oz|ounce)/i.test(stated[2])?28.349523125:1;
  const grams=Number(stated[1])*multiplier;
  if(grams>0&&grams<=100000)return {grams,adjusted:grams!==item.portionGrams,modelGrams:item.portionGrams??null,source:'caption'};
 }
 if(!count||explicitMass)return {grams:item.portionGrams??null,adjusted:false};
 const slices=Number(count[1]);if(!Number.isFinite(slices)||slices<=0||slices>1000)return{grams:item.portionGrams??null,adjusted:false};
 return{grams:slices*SHABU_SLICE_GRAMS,adjusted:true,modelGrams:item.portionGrams??null,slices,source:SHABU_SLICE_SOURCE};
}
export function thinPotRecordReason(item:PotItem,context:PotContext,description:string):string|null {
 const meat=thinPotMeat(item,context);
 if(meat==='pork'&&/\b(?:pork|pig)\b/i.test(description)&&/\bbelly\b/i.test(description)&&!/\bpork belly\b/i.test(context.caption))
  return 'hot-pot: thin pork requires a lean loin or leg reference; belly was not named by the person';
 if(meat==='beef'&&/\bbeef\b/i.test(description)&&/\b(?:short[- ]plate|plate|belly)\b/i.test(description)&&!/\b(?:beef[- ,]+(?:short[- ]plate|plate|belly)|short[- ]plate(?:[- ,]+beef)?|belly[- ,]+beef)\b/i.test(context.caption))
  return 'hot-pot: thin beef excludes plate/belly unless the person names that cut';
 return null;
}
