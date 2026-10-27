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
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  sugar_g: number;
  sodium_mg: number;
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

export function sumNutrition(items: NutritionLike[]): MealTotals {
  const totals: MealTotals = {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fibre_g: 0,
    sugar_g: 0,
    sodium_mg: 0,
  };
  for (const item of items) {
    totals.calories += toNumber(item.calories);
    totals.protein_g += toNumber(item.protein_g);
    totals.carbs_g += toNumber(item.carbs_g);
    totals.fat_g += toNumber(item.fat_g);
    totals.fibre_g += toNumber(item.fibre_g);
    totals.sugar_g += toNumber(item.sugar_g);
    totals.sodium_mg += toNumber(item.sodium_mg);
  }
  return totals;
}

export function formatConsumed(totals: MealTotals): string {
  return `Consumed: ${Math.round(totals.calories)} kcal`;
}

export function formatGrams(grams: Numeric): string {
  return `${Math.round(toNumber(grams))} g`;
}
