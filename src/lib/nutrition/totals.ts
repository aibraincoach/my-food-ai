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
export type MissingNutrition = Partial<Record<NutrientKey, string[]>>;

export interface MealTotals {
  missing?: MissingNutrition;
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
function nutritionNumber(value: Numeric): number | null {
  if (value == null || (typeof value === "string" && !value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatNutrition(value: Numeric): string {
  const amount = nutritionNumber(value);
  return amount === null ? "—" : String(Math.round(amount));
}

export function sumNutrition(items: (NutritionLike & {name?:string;missing?:MissingNutrition})[]): MealTotals {
  const totals: MealTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0 };
  const missing: MissingNutrition = {};
  for(const key of NUTRIENT_KEYS){
    let sum=0, known=0;
    const omitted=new Set<string>();
    for(const item of items){
      const amount=nutritionNumber(item[key]);
      if(amount===null)omitted.add(item.name||"an item");
      else {sum+=amount;known++;}
      for(const name of item.missing?.[key]??[])omitted.add(name);
    }
    totals[key]=items.length===0?0:known&&Number.isFinite(sum)?sum:null;
    if(omitted.size)missing[key]=[...omitted];
  }
  if(Object.keys(missing).length)totals.missing=missing;
  return totals;
}

export function unavailableFoods(totals: {missing?:MissingNutrition}, keys: readonly NutrientKey[] = ["calories","protein_g","carbs_g","fat_g"]): string[] {
  return [...new Set(keys.flatMap(key=>totals.missing?.[key]??[]))];
}

export function formatConsumed(totals: MealTotals): string {
  const names=unavailableFoods(totals);
  return `Consumed: ${totals.calories===null?"unavailable":formatNutrition(totals.calories)} kcal${names.length?` · Nutrition unavailable: ${names.join(", ")}`:""}`;
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
}

// Sum available micronutrients, distinguishing unavailable values from measured zero.
export function sumMicronutrients(items: {name?:string;micronutrients:StoredNutrient[]}[]): {name:string;unit:string;value:number|null;unavailable?:string[]}[] {
  const identities=new Map<string,{name:string;unit:string}>();
  const contributions=items.map(item=>{
    const map=new Map<string,number|null>();
    for(const n of item.micronutrients){
      const name=n.nutrientName??n.name,unit=n.unitName??n.unit;
      if(!name||!unit)continue;
      const key=`${n.nutrientId??name}:${unit}`;identities.set(key,{name,unit});
      const value=nutritionNumber(n.value);
      if(!map.has(key))map.set(key,value);else if(map.get(key)!==value)map.set(key,null);
    }
    return map;
  });
  return [...identities].map(([key,identity])=>{
    let value=0,known=0;const omitted=new Set<string>();
    for(const [index,map] of contributions.entries()){
      const amount=map.get(key);
      if(amount==null)omitted.add(items[index].name??"an item");else {value+=amount;known++;}
    }
    return {...identity,value:known&&Number.isFinite(value)?value:null,...(omitted.size?{unavailable:[...omitted]}:{})};
  });
}

export interface CurrentItem extends NutritionLike {
  gtin?: string | null;
  not_eaten_grams?: number | null;
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
}

export type NutritionRow = NutritionLike & {
  post_item_id: string;
  micronutrients: StoredNutrient[];
  source_ref: string | null;
};

// Pre-item-12 arrays were the unscaled FDC search values. Reconstruct both
// macros and all nutrient amounts on read, rather than mixing a legacy branded
// serving-size denominator with correctly scaled new rows. No database write.
export function normalizeStoredNutrition(row: NutritionRow, grams: Numeric): NutritionRow {
  const entries = Array.isArray(row.micronutrients) ? row.micronutrients : [];
  if (!entries.length || entries.every((entry) => entry.basis === "portion")) return { ...row, micronutrients: entries };
  const fdc = entries.filter((entry): entry is StoredNutrient & {
    nutrientId: number; nutrientName: string; unitName: string; value: number;
  } => typeof entry.nutrientId === "number" && typeof entry.nutrientName === "string"
    && typeof entry.unitName === "string" && typeof entry.value === "number" && Number.isFinite(entry.value));
  // Non-FDC entries already recorded with their own units are left intact.
  if (fdc.length !== entries.length) return { ...row, micronutrients: entries };
  const scaled = scaleNutrition({ fdcId: Number(row.source_ref) || 0, description: "", dataType: "Foundation", foodNutrients: fdc },
    grams == null ? null : toNumber(grams));
  return { ...row, calories: scaled.calories, protein_g: scaled.proteinG, carbs_g: scaled.carbsG,
    fat_g: scaled.fatG, fibre_g: scaled.fibreG, sugar_g: scaled.sugarG, sodium_mg: scaled.sodiumMg,
    micronutrients: scaled.micronutrients as StoredNutrient[] };
}

// Portion-only revisions retain the already selected USDA identity and density.
export function rescaleStoredNutrition(row: NutritionRow, oldGrams: Numeric, newGrams: Numeric): NutritionRow {
  const normalized = normalizeStoredNutrition(row, oldGrams);
  const old = toNumber(oldGrams), next = toNumber(newGrams);
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
  const { data, error, status } = await supabase.from("current_post_items")
    .select("id,name,portion_text,portion_grams,box,mask_path,source,gtin,not_eaten_grams,count_text,not_eaten_count_text").eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw ioError("Current items could not be read.", error, status);
  if (!data?.length) return [];
  const { data: nutrition, error: nutritionError, status: nutritionStatus } = await supabase.from("item_nutrition")
    .select("post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref")
    .in("post_item_id", data.map((item) => item.id));
  if (nutritionError) throw ioError("Nutrition could not be read.", nutritionError, nutritionStatus);
  const byId = new Map((nutrition as NutritionRow[] | null ?? []).map((row) => [row.post_item_id, row]));
  return data.map((item) => {
    const row = byId.get(item.id);
    if (!row && options.requireNutrition) throw new MissingNutritionError();
    const normalized = row ? normalizeStoredNutrition(row, item.portion_grams) : null;
    return { ...item, source: item.source as "model" | "user", calories: normalized?.calories ?? null,
      protein_g: normalized?.protein_g ?? null, carbs_g: normalized?.carbs_g ?? null,
      fat_g: normalized?.fat_g ?? null, fibre_g: normalized?.fibre_g ?? null,
      sugar_g: normalized?.sugar_g ?? null, sodium_mg: normalized?.sodium_mg ?? null,
      micronutrients: normalized?.micronutrients ?? [], source_ref: normalized?.source_ref ?? null };
  });
}
