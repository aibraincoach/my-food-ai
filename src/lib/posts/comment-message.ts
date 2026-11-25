import type {Locale} from '@/i18n/locales';
import type {NutritionTranslator} from '@/i18n/nutrition';
import {formatNumber} from '@/i18n/format';
import {formatCalories,formatNutrition,formatConsumed,gapSentence,nutritionGaps,NUTRIENT_KEYS,type MealTotals,type MissingNutrition} from '@/lib/nutrition/totals';

export type SummaryTotals=Pick<MealTotals,'calories'|'protein_g'|'carbs_g'|'fat_g'|'missing'|'trace'|'traceOnly'>;
export type Approximation={name:string;basis:string;kind?:'closest'|'estimate'};
type Quantity={grams:number;count:number|null;total:number|null;unit:string|null};
type SummaryValues={totals:SummaryTotals;approximations:Approximation[];unavailable:{name:string;sourceRef:string|null}[]};
type Removal={kind:'removedLeftovers'|'unmarkedLeftovers'}|{kind:'removedCorrection';text:string};
export type MealSummaryMessage={code:'mealSummary';values:
 | (SummaryValues & {kind:'consumed'})
 | (SummaryValues & {kind:'removal';removal:Removal})
 | {kind:'leftovers';leftovers:Quantity[];consumed:Quantity[];omitted:number|null;calories:number|null}};
export type CommentMessage=MealSummaryMessage
 | {code:'editRemoved';values:{name:string|null}}
 | {code:'productCorrected';values:{name:string|null}}
 | {code:'editAdded'|'editRenamed'|'editPortion';values:{name:string|null;before:string|null;grams:number|null;amount:number|null;unit:'g'|'oz'|'cup'|'piece'}};
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string';
const numeric=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const nullableNumber=(v:unknown)=>v===null||numeric(v);
const nullableText=(v:unknown)=>v===null||text(v);
const quantity=(v:unknown)=>object(v)&&numeric(v.grams)&&v.grams>=0&&nullableNumber(v.count)&&nullableNumber(v.total)&&nullableText(v.unit)
 &&(v.count===null&&v.total===null&&v.unit===null||(numeric(v.count)&&Number.isInteger(v.count)&&numeric(v.total)&&Number.isInteger(v.total)&&v.total>0&&v.count>=0&&v.count<=v.total&&text(v.unit)&&v.unit.length>0));
function summary(v:Record<string,unknown>):boolean {
 if(!object(v.totals)||!['calories','protein_g','carbs_g','fat_g'].every(k=>nullableNumber((v.totals as Record<string,unknown>)[k])))return false;
 const trace=v.totals.trace,traceOnly=v.totals.traceOnly;
 if(trace!==undefined&&(!object(trace)||!Object.entries(trace).every(([k,n])=>NUTRIENT_KEYS.includes(k as typeof NUTRIENT_KEYS[number])&&Array.isArray(n)&&n.length>0&&n.every(text))))return false;
 if(traceOnly!==undefined&&(!Array.isArray(traceOnly)||!traceOnly.every(k=>NUTRIENT_KEYS.includes(k as typeof NUTRIENT_KEYS[number])&&object(trace)&&(!(String(k) in (v.totals as Record<string,unknown>))||(v.totals as Record<string,unknown>)[String(k)]===0)&&Array.isArray(trace[String(k)])&&(trace[String(k)] as unknown[]).length>0)))return false;
 const missing=v.totals.missing;
 if(missing!==undefined&&(!object(missing)||!Object.entries(missing).every(([k,n])=>NUTRIENT_KEYS.includes(k as typeof NUTRIENT_KEYS[number])&&Array.isArray(n)&&n.every(text))))return false;
 return Array.isArray(v.approximations)&&v.approximations.every(a=>object(a)&&text(a.name)&&text(a.basis)&&(a.kind===undefined||a.kind==='closest'||a.kind==='estimate'))
  &&Array.isArray(v.unavailable)&&v.unavailable.every(a=>object(a)&&text(a.name)&&nullableText(a.sourceRef));
}
/** Stored codes are a protocol. Unknown/invalid messages fail; body text is never parsed. */
export function parseCommentMessage(raw:unknown):CommentMessage {
 if(!object(raw)||!object(raw.values))throw new Error('Invalid meal comment message.');
 const v=raw.values;
 switch(raw.code){
  case 'mealSummary':
   if(v.kind==='consumed'&&summary(v))return raw as CommentMessage;
   if(v.kind==='removal'&&summary(v)&&object(v.removal)&&(['removedLeftovers','unmarkedLeftovers'].includes(String(v.removal.kind))||v.removal.kind==='removedCorrection'&&text(v.removal.text)))return raw as CommentMessage;
   if(v.kind==='leftovers'&&Array.isArray(v.leftovers)&&v.leftovers.every(quantity)&&Array.isArray(v.consumed)&&v.consumed.every(quantity)&&nullableNumber(v.omitted)&&nullableNumber(v.calories))return raw as CommentMessage;
   break;
  case 'editRemoved':case 'productCorrected':if(nullableText(v.name))return raw as CommentMessage;break;
  case 'editAdded':case 'editRenamed':case 'editPortion':
   if(nullableText(v.name)&&nullableText(v.before)&&nullableNumber(v.grams)&&(v.grams===null||numeric(v.grams)&&v.grams>0)&&nullableNumber(v.amount)&&['g','oz','cup','piece'].includes(String(v.unit))&&(v.unit==='g'||numeric(v.amount)&&v.amount>0))return raw as CommentMessage;
 }
 throw new Error('Unknown or invalid meal comment message.');
}
export function mealSummaryMessage(totals:SummaryTotals,approximations:Approximation[]=[],unavailable:{name:string;sourceRef:unknown}[]=[]):MealSummaryMessage {
 const cleanTotals:SummaryTotals={calories:totals.calories,protein_g:totals.protein_g,carbs_g:totals.carbs_g,fat_g:totals.fat_g,...(totals.missing?{missing:totals.missing as MissingNutrition}:{}),...(totals.trace?{trace:totals.trace}:{}),...(totals.traceOnly?{traceOnly:totals.traceOnly}:{})};
 return parseCommentMessage({code:'mealSummary',values:{kind:'consumed',totals:cleanTotals,approximations,unavailable:unavailable.map(a=>({name:a.name,sourceRef:typeof a.sourceRef==='string'?a.sourceRef:null}))}}) as MealSummaryMessage;
}
function consumed(values:SummaryValues,t:NutritionTranslator,locale:Locale):string {
 const {totals}=values;
 const value=(key:'protein_g'|'carbs_g'|'fat_g')=>totals.traceOnly?.includes(key)?t('trace'):totals[key]===null?t('unavailable'):formatNutrition(totals[key],t,locale);
 const gap=gapSentence(nutritionGaps(totals),t,locale,values.unavailable);
 const traceNote=totals.trace&&Object.keys(totals.trace).some(key=>!totals.traceOnly?.includes(key as typeof NUTRIENT_KEYS[number]))?(locale==='ja'?'':' ')+t('includesTraceAmounts'):'';
 const notes=values.approximations.map(a=>' '+t(a.kind==='estimate'?'approxModel':'approxUSDA',{name:a.name,basis:a.basis})).join('');
 return t('consumedStored',{calories:totals.traceOnly?.includes('calories')?t('trace'):totals.calories===null?t('unavailable'):formatCalories(totals.calories,t,locale),protein:value('protein_g'),carbs:value('carbs_g'),fat:value('fat_g'),hasGap:gap?'yes':'no',gap,approximations:notes+traceNote});
}
function quantityText(value:Quantity,isConsumed:boolean,t:NutritionTranslator,locale:Locale):string {
 return value.count===null?t('editGrams',{grams:formatNumber(locale,Math.round(value.grams),{useGrouping:false})})
  :t(isConsumed?'consumedCount':'remainderCount',{count:formatNumber(locale,value.count,{useGrouping:false}),total:formatNumber(locale,value.total!,{useGrouping:false}),unit:value.unit!});
}
export function formatCommentMessage(raw:unknown,t:NutritionTranslator,locale:Locale):string {
 const message=parseCommentMessage(raw);
 if(message.code==='mealSummary'){
  const s=message.values;
  if(s.kind==='consumed')return consumed(s,t,locale);
  if(s.kind==='leftovers')return t('remainderReply',{leftovers:s.leftovers.map(q=>quantityText(q,false,t,locale)).join(', '),consumed:s.consumed.map(q=>quantityText(q,true,t,locale)).join(', '),omitted:s.omitted===null?t('unavailable'):formatCalories(s.omitted,t,locale),calories:s.calories===null?t('unavailable'):formatCalories(s.calories,t,locale)});
  // Keep the old brief removal summary exactly in English. In Japanese remove
  // its final punctuation before the surrounding translated sentence adds it.
  const brief=[formatConsumed({...s.totals,fibre_g:null,sugar_g:null,sodium_mg:null},t,locale),...s.approximations.map(a=>t(a.kind==='estimate'?'approxModel':'approxUSDA',{name:a.name,basis:a.basis}).replace(/[.。]$/u,''))].join(locale==='ja'?'。':'. ').replace(/[。]$/u,'');
  return t(s.removal.kind,{summary:brief,...(s.removal.kind==='removedCorrection'?{text:s.removal.text}:{})});
 }
 if(message.code==='editRemoved')return t('editRemoved',{name:message.values.name??t('anItem')});
 if(message.code==='productCorrected')return t('productCorrected',{name:message.values.name??t('anItem')});
 const edit=message.values;
 const grams=edit.grams===null?t('unavailable'):formatNumber(locale,edit.grams,{useGrouping:false,maximumFractionDigits:20});
 const amount=edit.unit==='g'?t('editGrams',{grams}):t('editUnitAmount',{grams,amount:formatNumber(locale,edit.amount!,{useGrouping:false,maximumFractionDigits:20}),count:edit.amount!,unit:edit.unit});
 return t(message.code,{name:edit.name??t('itemUnnamed'),before:edit.before??t('anItem'),amount});
}
export function commentText(row:{body:string|null;message?:unknown},t:NutritionTranslator,locale:Locale):string {
 if(row.message!=null){if(row.body!==null)throw new Error('Ambiguous meal comment.');return formatCommentMessage(row.message,t,locale);}
 if(typeof row.body!=='string')throw new Error('Meal comment has no content.');
 return row.body;
}
