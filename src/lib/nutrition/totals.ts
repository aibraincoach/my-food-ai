import type {NutritionTranslator} from '@/i18n/nutrition';
import {isLocale,type Locale} from '@/i18n/locales';
import {formatEnergy,formatNutrient} from '@/i18n/format';
import {unavailableSentence} from "@/lib/fdc/unavailable";
import {foodApproximation,storedEstimateFood} from "@/lib/fdc/approximation-metadata";
import { ApiError, ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import { scaleNutrition } from "@/lib/fdc/nutrients";

export type Numeric = string | number | null | undefined;

export interface NutritionLike {
  calories: Numeric;
  protein_g: Numeric;
  carbs_g: Numeric;
  fat_g: Numeric;
  fibre_g: Numeric;
  sugar_g: Numeric;
  sodium_mg: Numeric;
}

export const NUTRIENT_KEYS = ["calories","protein_g","carbs_g","fat_g","fibre_g","sugar_g","sodium_mg"] as const;
export type NutrientKey = typeof NUTRIENT_KEYS[number];
export const UNNAMED_ITEM = 'nutrition.anItem';
export type MissingNutrition = Partial<Record<NutrientKey, string[]>>;

export interface MealTotals {
  missing?: MissingNutrition;
  trace?: MissingNutrition;
  traceOnly?: NutrientKey[];
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
}

// PostgREST returns numeric columns as strings; coerce defensively.
export function toNumber(value: Numeric): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// Unknown is distinct from measured zero. Keep known nutrients independent:
// missing calories do not erase a measured protein amount, for example.
export function nutritionNumber(value: Numeric): number | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNutrition(value: Numeric, _t: NutritionTranslator, locale: Locale): string {
  if(!isLocale(locale))throw new Error('Nutrition locale is required.');
  return formatNutrient(locale,value);
}

// The same precision as every other energy display; no default English locale.
export function formatCalories(value: Numeric, _t: NutritionTranslator, locale: Locale): string {
  if(!isLocale(locale))throw new Error('Nutrition locale is required.');
  return formatEnergy(locale,value);
}

export const MACRO_NUTRIENT_IDS:Record<NutrientKey,number>={calories:1008,protein_g:1003,carbs_g:1005,fat_g:1004,fibre_g:1079,sugar_g:2000,sodium_mg:1093};
type NutritionContribution=NutritionLike & {name?:string;missing?:MissingNutrition;trace?:MissingNutrition;traceOnly?:NutrientKey[];micronutrients?:unknown};
export function sumNutrition(items: NutritionContribution[]): MealTotals {
  const totals:MealTotals={calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0};
  const missing:MissingNutrition={},trace:MissingNutrition={},traceOnly:NutrientKey[]=[];
  for(const key of NUTRIENT_KEYS){
    let sum=0,known=0,measured=0;
    const omitted=new Set<string>(),traces=new Set<string>();
    for(const item of items){
      const amount=nutritionNumber(item[key]);
      const sourceTrace=amount===null&&Array.isArray(item.micronutrients)&&item.micronutrients.some(n=>n&&typeof n==='object'&&n.nutrientId===MACRO_NUTRIENT_IDS[key]&&n.marker==='trace'&&n.value===null);
      if(sourceTrace){known++;traces.add(item.name||UNNAMED_ITEM);}
      else if(amount===null){if(!item.missing?.[key]?.length)omitted.add(item.name||UNNAMED_ITEM);}
      else {sum+=amount;known++;if(!item.traceOnly?.includes(key))measured++;}
      for(const name of item.missing?.[key]??[])omitted.add(name);
      for(const name of item.trace?.[key]??[])traces.add(name);
    }
    totals[key]=known&&Number.isFinite(sum)?sum:null;
    if(omitted.size)missing[key]=[...omitted];
    if(traces.size){trace[key]=[...traces];if(known&&!measured)traceOnly.push(key);}
  }
  if(Object.keys(missing).length)totals.missing=missing;
  if(Object.keys(trace).length)totals.trace=trace;
  if(traceOnly.length)totals.traceOnly=traceOnly;
  return totals;
}

export interface NutritionGap { name: string; nutrients: NutrientKey[] }
export function nutritionGaps(totals: {missing?:MissingNutrition}, shown: readonly NutrientKey[] = ["calories","protein_g","carbs_g","fat_g"]): NutritionGap[] {
  const byFood = new Map<string, NutrientKey[]>();
  for (const key of new Set(shown)) for (const name of totals.missing?.[key] ?? []) {
    const keys = byFood.get(name) ?? [];
    if (!keys.includes(key)) keys.push(key);
    byFood.set(name, keys);
  }
  return [...byFood].map(([name,nutrients]) => ({name,nutrients}));
}
const nutrientNames = {calories:'calories',protein_g:'protein',carbs_g:'carbs',fat_g:'fat',fibre_g:'fibre',sugar_g:'sugar',sodium_mg:'sodium'} as const;
// All consumers share the same full sentences, including the PNG path.
export function gapSentence(gaps: NutritionGap[], t: NutritionTranslator, locale: Locale, reasons: {name:string;sourceRef:unknown}[] = [], withDetail = false): string {
  const joiner = locale === 'ja' ? '' : ' ';
  const sentences = gaps.map(gap => {
    const food=gap.name===UNNAMED_ITEM?t('anItem'):gap.name;
    if (gap.nutrients.includes('calories')) {
      const why = [...new Set(reasons.filter(row=>row.name===gap.name).map(row=>unavailableSentence(row.name,row.sourceRef,t,locale,withDetail)).filter(Boolean))].join(joiner);
      if (['calories','protein_g','carbs_g','fat_g'].every(key=>gap.nutrients.includes(key as NutrientKey))) return why || t('nutritionUnavailable',{food});
      return [t('caloriesUnavailable',{food}),why].filter(Boolean).join(joiner);
    }
    const nutrients=new Intl.ListFormat(locale,{style:'long',type:'conjunction'}).format(gap.nutrients.map(key=>t(nutrientNames[key])));
    return gap.nutrients.length ? t('missing',{nutrients,food}) : '';
  }).filter(Boolean);
  for (const reason of reasons) if (!gaps.some(gap=>gap.name===reason.name && gap.nutrients.includes('calories'))) {
    const why=unavailableSentence(reason.name,reason.sourceRef,t,locale,withDetail);
    if (why && !sentences.includes(why)) sentences.push(why);
  }
  return sentences.join(joiner);
}

export function formatConsumed(totals: MealTotals, t: NutritionTranslator, locale: Locale): string {
  const gap=gapSentence(nutritionGaps(totals),t,locale).replace(/\.$/, '');
  const brief=t('consumedBrief',{known:totals.calories===null?'no':'yes',calories:totals.traceOnly?.includes('calories')?t('trace'):formatCalories(totals.calories,t,locale),hasGap:gap?'yes':'no',gap});
  return totals.trace&&Object.keys(totals.trace).some(key=>!totals.traceOnly?.includes(key as NutrientKey))?brief+(locale==='ja'?'':' ')+t('includesTraceAmounts'):brief;
}

export function formatGrams(grams: Numeric): string {
  return `${Math.round(toNumber(grams))} g`;
}

export interface StoredNutrient {
  nutrientId?: number;
  nutrientName?: string;
  unitName?: string;
  name?: string;
  unit?: string;
  value: number | null;
  basis?: "portion";
  marker?: "trace" | "not_measured";
}

// Sum available micronutrients, distinguishing unavailable values from measured zero.
export function sumMicronutrients(items: {name?:string;micronutrients:StoredNutrient[]}[], options: {withNutrientIds?:boolean} = {}): {name:string;unit:string;value:number|null;unavailable?:string[];trace?:string[];traceOnly?:true;nutrientId?:number}[] {
  const identities=new Map<string,{name:string;unit:string;nutrientId?:number}>();
  const contributions=items.map(item=>{
    const map=new Map<string,{value:number|null;trace:boolean}>();
    for(const n of item.micronutrients){
      const name=n.nutrientName??n.name,unit=n.unitName??n.unit;
      if(!name||!unit)continue;
      const key=`${n.nutrientId??name}:${unit}`;identities.set(key,{name,unit,...(options.withNutrientIds&&n.nutrientId!=null?{nutrientId:n.nutrientId}:{})});
      const value=nutritionNumber(n.value),trace=n.marker==='trace'&&n.value===null;
      if(!map.has(key))map.set(key,{value,trace});
      else {const prior=map.get(key)!;if(prior.value!==value||prior.trace!==trace)map.set(key,{value:null,trace:false});}
    }
    return map;
  });
  return [...identities].map(([key,identity])=>{
    let value=0,known=0,measured=0;const omitted=new Set<string>(),trace=new Set<string>();
    for(const [index,map] of contributions.entries()){
      const contribution=map.get(key),name=items[index].name??UNNAMED_ITEM;
      if(contribution?.trace){known++;trace.add(name);}
      else if(contribution?.value==null)omitted.add(name);
      else {value+=contribution.value;known++;measured++;}
    }
    return {...identity,value:known&&Number.isFinite(value)?value:null,...(omitted.size?{unavailable:[...omitted]}:{}),
      ...(trace.size?{trace:[...trace],...(!measured?{traceOnly:true as const}:{})}:{})};
  });
}

export interface CurrentItem extends NutritionLike {
  gtin?: string | null;
  not_eaten_grams?: number | null;
  not_eaten_calories?:number|null;
  supersedes?:string|null;
  count_text?: string | null;
  not_eaten_count_text?: string | null;
  id: string;
  name: string;
  portion_text: string | null;
  portion_grams: Numeric;
  box: unknown;
  mask_path: string | null;
  source: "model" | "user";
  micronutrients: StoredNutrient[];
  source_ref: string | null;
  food_category?: string | null;
}

export type NutritionRow = NutritionLike & {
  post_item_id: string;
  micronutrients: StoredNutrient[];
  source_ref: string | null;
  food_category?: string | null;
};

// One stored contract: nutrient values already describe the consumed portion.
// Malformed/old arrays fail visibly; readers never reconstruct another format.
export function requireStoredNutrition(row: NutritionRow): NutritionRow {
  if (!Array.isArray(row.micronutrients) || row.micronutrients.some(entry => !entry || typeof entry !== 'object' || entry.basis !== 'portion' || (entry.marker!==undefined&&(!['trace','not_measured'].includes(entry.marker)||entry.value!==null)))) {
    throw new ApiError(503, '', 'Stored nutrition format is invalid.');
  }
  return row;
}

// Portion-only revisions retain the already selected USDA identity and density.
export function rescaleStoredNutrition(row: NutritionRow, oldGrams: Numeric, newGrams: Numeric): NutritionRow {
  const reference=storedEstimateFood(row);
  if(reference){
    const n=scaleNutrition(reference,newGrams==null?null:toNumber(newGrams));
    return {...row,calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg,micronutrients:n.micronutrients as StoredNutrient[]};
  }
  if(foodApproximation(row)?.kind==='estimate')throw new ApiError(503,'','Stored estimate density is unavailable.');
  return rescaleStoredAmounts(row,oldGrams,newGrams);
}

// Ratio-only rescaling of already consumed amounts. The quantities may be ml;
// unlike gram reconstruction this never interprets them as a reference mass.
export function rescaleStoredAmounts(row:NutritionRow,oldAmount:Numeric,newAmount:Numeric):NutritionRow{
  const normalized = requireStoredNutrition(row);
  const old = toNumber(oldAmount), next = toNumber(newAmount);
  const factor = old > 0 && next > 0 ? next / old : null;
  const scale = (value: Numeric) => value == null || factor === null ? null : toNumber(value) * factor;
  return { ...normalized, calories: scale(normalized.calories), protein_g: scale(normalized.protein_g),
    carbs_g: scale(normalized.carbs_g), fat_g: scale(normalized.fat_g), fibre_g: scale(normalized.fibre_g),
    sugar_g: scale(normalized.sugar_g), sodium_mg: scale(normalized.sodium_mg),
    micronutrients: normalized.micronutrients.map(entry => ({ ...entry, value: scale(entry.value), basis: "portion" })) };
}

export class MissingNutritionError extends ApiError {
  constructor() { super(503, "", "Item nutrition is awaiting recomputation."); this.name="MissingNutritionError"; }
}

// All detail/totals consumers use only current rows; superseded originals and
// their nutrition remain in the database as immutable edit history.
export async function getCurrentItems(supabase: SupabaseClient, postId: string, options: { requireNutrition?: boolean } = {}): Promise<CurrentItem[]> {
  const columns="id,name,portion_text,portion_grams,box,mask_path,source,gtin,supersedes,not_eaten_grams,not_eaten_calories,count_text,not_eaten_count_text";
  // #1103: one read with not_eaten_calories (migration 0028). A failed read fails visibly; it is not retried without it.
  const snapshot=await supabase.from("current_post_items").select(columns).eq("post_id",postId).order("created_at",{ascending:true});
  const {error,status}=snapshot;
  type ItemSnapshot=Pick<CurrentItem,'id'|'name'|'portion_text'|'portion_grams'|'box'|'mask_path'|'source'|'gtin'|'supersedes'|'not_eaten_grams'|'not_eaten_calories'|'count_text'|'not_eaten_count_text'>;
  const data=snapshot.data as unknown as ItemSnapshot[]|null;
  if(error)throw ioError("Current items could not be read.",error,status);
  if (!data?.length) return [];
  const { data: nutrition, error: nutritionError, status: nutritionStatus } = await supabase.from("item_nutrition")
    .select("post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category")
    .in("post_item_id", data.map((item) => item.id));
  if (nutritionError) throw ioError("Nutrition could not be read.", nutritionError, nutritionStatus);
  const byId = new Map((nutrition as NutritionRow[] | null ?? []).map((row) => [row.post_item_id, row]));
  return data.map((item) => {
    const row = byId.get(item.id);
    if (!row && options.requireNutrition) throw new MissingNutritionError();
    const normalized = row ? requireStoredNutrition(row) : null;
    return { ...item, source: item.source as "model" | "user", calories: normalized?.calories ?? null,
      protein_g: normalized?.protein_g ?? null, carbs_g: normalized?.carbs_g ?? null,
      fat_g: normalized?.fat_g ?? null, fibre_g: normalized?.fibre_g ?? null,
      sugar_g: normalized?.sugar_g ?? null, sodium_mg: normalized?.sodium_mg ?? null,
      micronutrients: normalized?.micronutrients ?? [], source_ref: normalized?.source_ref ?? null, food_category: normalized?.food_category ?? null };
  });
}

export const CURRENT_ITEM_COLUMNS = "id,post_id,name,portion_text,portion_grams,box,mask_path,source,gtin,supersedes,not_eaten_grams,not_eaten_calories,count_text,not_eaten_count_text";
export const CURRENT_NUTRITION_COLUMNS = "post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category";
type BatchedItem = Omit<CurrentItem, keyof NutritionLike | 'micronutrients' | 'source_ref'> & {
  post_id: string; item_nutrition?: NutritionRow | NutritionRow[] | null;
};

// The same normalization as getCurrentItems, with owner RLS retained on the embedded item_nutrition relationship.
export function mapCurrentItems(data: BatchedItem[]): CurrentItem[] {
  return data.map(item => {
    const row = Array.isArray(item.item_nutrition) ? item.item_nutrition[0] : item.item_nutrition;
    const normalized = row ? requireStoredNutrition(row) : null;
    const {item_nutrition: _embedded, post_id: _postId, ...fields} = item;
    void _embedded; void _postId;
    return { ...fields, calories: normalized?.calories ?? null,
      protein_g: normalized?.protein_g ?? null, carbs_g: normalized?.carbs_g ?? null, fat_g: normalized?.fat_g ?? null,
      fibre_g: normalized?.fibre_g ?? null, sugar_g: normalized?.sugar_g ?? null, sodium_mg: normalized?.sodium_mg ?? null,
      micronutrients: normalized?.micronutrients ?? [], source_ref: normalized?.source_ref ?? null, food_category: normalized?.food_category ?? null };
  });
}

export async function getCurrentItemsForPosts(db: SupabaseClient, ids: string[]): Promise<Map<string, CurrentItem[]>> {
  const result = new Map<string, CurrentItem[]>(ids.map(id => [id, []]));
  if (!ids.length) return result;
  const items: BatchedItem[] = [];
  for (let offset = 0; ; offset += 1000) {
    const snapshot = await db.from('current_post_items').select(`${CURRENT_ITEM_COLUMNS},item_nutrition(${CURRENT_NUTRITION_COLUMNS})`)
      .in('post_id', ids).order('created_at').order('id').range(offset, offset + 999).abortSignal(AbortSignal.timeout(8000));
    if (snapshot.error) throw ioError('Current meal nutrition could not be read.', snapshot.error, snapshot.status);
    items.push(...(snapshot.data ?? []) as unknown as BatchedItem[]);
    if ((snapshot.data?.length ?? 0) < 1000) break;
  }
  for (const [index, item] of mapCurrentItems(items).entries()) {
    result.get(items[index].post_id)?.push(item);
  }
  return result;
}
