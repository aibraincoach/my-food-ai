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

export interface MealTotals {
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

export function sumNutrition(items: NutritionLike[]): MealTotals {
  const totals: MealTotals = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0 };
  for (const item of items) for (const key of Object.keys(totals) as (keyof MealTotals)[]) {
    const amount = nutritionNumber(item[key]);
    const subtotal = totals[key];
    totals[key] = amount === null || subtotal === null ? null : nutritionNumber(subtotal + amount);
  }
  return totals;
}

export function formatConsumed(totals: MealTotals): string {
  return `Consumed: ${formatNutrition(totals.calories)} kcal`;
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

// Preserve first-seen order and stored units. A nutrient missing from one
// item is unknown for the whole meal, not a complete sum of the other items.
export function sumMicronutrients(items: { micronutrients: StoredNutrient[] }[]): { name: string; unit: string; value: number | null }[] {
  const totals = new Map<string, { name: string; unit: string; value: number | null; count: number }>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const nutrient of item.micronutrients) {
      const name = nutrient.nutrientName ?? nutrient.name;
      const unit = nutrient.unitName ?? nutrient.unit;
      if (!name || !unit) continue;
      const key = `${nutrient.nutrientId ?? name}:${unit}`;
      const value = nutritionNumber(nutrient.value);
      const previous = totals.get(key);
      if (!previous) totals.set(key, { name, unit, value, count: 1 });
      else {
        previous.value = previous.value === null || value === null ? null : nutritionNumber(previous.value + value);
        if (!seen.has(key)) previous.count++;
      }
      seen.add(key);
    }
  }
  return [...totals.values()].map(({ name, unit, value, count }) => ({ name, unit, value: count === items.length ? value : null }));
}

export interface CurrentItem extends NutritionLike {
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

type NutritionRow = NutritionLike & {
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

// All detail/totals consumers use only current rows; superseded originals and
// their nutrition remain in the database as immutable edit history.
export async function getCurrentItems(supabase: SupabaseClient, postId: string): Promise<CurrentItem[]> {
  const { data, error } = await supabase.from("current_post_items")
    .select("id,name,portion_text,portion_grams,box,mask_path,source").eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Current items could not be read: ${error.message}`);
  if (!data?.length) return [];
  const { data: nutrition, error: nutritionError } = await supabase.from("item_nutrition")
    .select("post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref")
    .in("post_item_id", data.map((item) => item.id));
  if (nutritionError) throw new Error(`Nutrition could not be read: ${nutritionError.message}`);
  const byId = new Map((nutrition as NutritionRow[] | null ?? []).map((row) => [row.post_item_id, row]));
  return data.map((item) => {
    const row = byId.get(item.id);
    const normalized = row ? normalizeStoredNutrition(row, item.portion_grams) : null;
    return { ...item, source: item.source as "model" | "user", calories: normalized?.calories ?? null,
      protein_g: normalized?.protein_g ?? null, carbs_g: normalized?.carbs_g ?? null,
      fat_g: normalized?.fat_g ?? null, fibre_g: normalized?.fibre_g ?? null,
      sugar_g: normalized?.sugar_g ?? null, sodium_mg: normalized?.sodium_mg ?? null,
      micronutrients: normalized?.micronutrients ?? [], source_ref: normalized?.source_ref ?? null };
  });
}
