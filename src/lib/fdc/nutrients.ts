// FDC foodNutrients are standardized per 100 units, including Branded foods;
// they are not the per-serving labelNutrients values. USDA documentation:
// https://fdc.nal.usda.gov/GBFPD_Documentation/
// Consumed values preserve nutrient order and units and carry basis="portion".
// A gram portion cannot convert a declared milliliter basis without density.
import type { FdcFood } from "./client";

const ENERGY_IDS = [1008, 2047, 2048];
const PROTEIN_ID = 1003;
const FAT_ID = 1004;
const CARBS_ID = 1005;
const FIBRE_ID = 1079;
const SUGAR_ID = 2000;
const SODIUM_ID = 1093;

const DATA_TYPE_RANK: Record<string, number> = {
  Foundation: 0,
  "SR Legacy": 1,
  Branded: 2,
};

export interface ScaledNutrition {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fibreG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  micronutrients: unknown[];
  sourceRef: string | null;
}

function rankOf(dataType: string): number {
  return DATA_TYPE_RANK[dataType] ?? 99;
}

const QUERY_STOP = new Set(["with", "and", "the", "one", "small", "a", "an", "of", "for"]);

function queryTokens(query: string): string[] {
  return [...new Set(
    query.toLowerCase().split(/[^a-z]+/).filter((token) => token.length > 2 && !QUERY_STOP.has(token)),
  )];
}

function gramBasis(food: FdcFood): boolean {
  const unit = (food.servingSizeUnit ?? "").toLowerCase();
  return !(food.dataType === "Branded" && ["ml", "milliliter", "milliliters"].includes(unit));
}

function unitToGrams(value: number, unit: string): number {
  const normalized = unit.trim().toUpperCase();
  if (normalized === "MG") return value / 1000;
  if (normalized === "UG" || normalized === "\u00B5G") return value / 1000000;
  return value;
}

function energyToKcal(value: number, unit: string): number {
  const normalized = unit.trim().toUpperCase();
  if (normalized === "KJ") return value * 0.239006;
  return value;
}

function nutrientValue(
  food: FdcFood,
  ids: number[]
): { value: number; unit: string } | null {
  for (const id of ids) {
    const found = food.foodNutrients.find((n) => n.nutrientId === id);
    if (found) return { value: found.value, unit: found.unitName };
  }
  return null;
}

function energyPer100Kcal(food: FdcFood): number | null {
  const energy = nutrientValue(food, ENERGY_IDS);
  return energy ? energyToKcal(energy.value, energy.unit) : null;
}

// Rank FDC search hits for an item name. Data-type rank alone picked dressing
// for salad, soymilk for black coffee, and ketchup for scrambled egg (#189).
export function scoreFoodMatch(query: string, food: FdcFood): number {
  const desc = food.description.toLowerCase();
  const q = query.toLowerCase();
  const descTokens = new Set(desc.split(/[^a-z]+/).filter(Boolean));
  let score = 0;
  for (const token of queryTokens(query)) {
    if (descTokens.has(token)) score += 1;
  }
  if (/\bsalad\b/.test(q) && !/\bdressing\b/.test(q)) {
    if (/\bdressing\b/.test(desc)) score -= 8;
    if (/\bspread\b/.test(desc)) score -= 6;
    const compound = desc.match(/\b(tuna|ham|potato|egg) salad\b/)?.[1];
    if (compound && !q.includes(compound)) score -= 4;
    if (/\bside salad\b/.test(desc) || /\blettuce\b/.test(desc) || /\bmixed salad\b/.test(desc)) score += 3;
  }
  if (/\bcoffee\b/.test(q)) {
    const plainCoffee = !/\b(milk|soymilk|soy|silk|cream|creamer|sugar|latte|cappuccino|mocha)\b/.test(q);
    if (plainCoffee && (/\bsoymilk\b/.test(desc) || /\bsilk\b/.test(desc))) score -= 8;
    if (/\bpepper\b/.test(desc) && !/\bcoffee\b/.test(desc)) score -= 8;
    if (plainCoffee && /\bblack coffee\b/.test(desc)) score += 4;
    const kcal = energyPer100Kcal(food);
    if (plainCoffee && /\bbeverages,\s*coffee\b/.test(desc) && kcal !== null && kcal <= 5) score += 3;
  }
  if (/\begg\b/.test(q)) {
    if (/\bketchup\b/.test(desc) && !/\begg\b/.test(desc)) score -= 10;
    if (/\bscrambled\b/.test(desc) || (/\begg\b/.test(desc) && !/\bketchup\b/.test(desc))) score += 4;
  }
  score -= rankOf(food.dataType) * 0.01;
  return score;
}

export function chooseBestMatch(foods: FdcFood[], query?: string): FdcFood | null {
  if (!foods.length) return null;
  const trimmed = query?.trim();
  if (!trimmed) {
    let best: FdcFood | null = null;
    for (const food of foods) {
      if (!best || rankOf(food.dataType) < rankOf(best.dataType)) best = food;
    }
    return best;
  }
  let best = foods[0];
  let bestScore = scoreFoodMatch(trimmed, best);
  for (const food of foods.slice(1)) {
    const score = scoreFoodMatch(trimmed, food);
    if (score > bestScore || (score === bestScore && rankOf(food.dataType) < rankOf(best.dataType))) {
      best = food;
      bestScore = score;
    }
  }
  return best;
}

// Scale one match to portion grams. A null portion leaves every column
// null but still records the source match.
export function scaleNutrition(
  food: FdcFood | null,
  portionGrams: number | null
): ScaledNutrition {
  if (!food) {
    return {
      calories: null,
      proteinG: null,
      carbsG: null,
      fatG: null,
      fibreG: null,
      sugarG: null,
      sodiumMg: null,
      micronutrients: [],
      sourceRef: null,
    };
  }
  const sourceRef = String(food.fdcId);
  const factor = portionGrams !== null && Number.isFinite(portionGrams) && portionGrams > 0 && gramBasis(food)
    ? portionGrams / 100 : null;
  const micronutrients = food.foodNutrients.map((nutrient) => ({
    ...nutrient, value: factor === null ? null : nutrient.value * factor,
    basis: "portion" as const,
  }));
  if (factor === null) {
    return {
      calories: null,
      proteinG: null,
      carbsG: null,
      fatG: null,
      fibreG: null,
      sugarG: null,
      sodiumMg: null,
      micronutrients,
      sourceRef,
    };
  }
  const scale = (
    ids: number[],
    convert: (value: number, unit: string) => number
  ): number | null => {
    const found = nutrientValue(food, ids);
    if (!found) return null;
    return convert(found.value, found.unit) * factor;
  };
  const sodium = nutrientValue(food, [SODIUM_ID]);
  return {
    calories: scale(ENERGY_IDS, energyToKcal),
    proteinG: scale([PROTEIN_ID], unitToGrams),
    carbsG: scale([CARBS_ID], unitToGrams),
    fatG: scale([FAT_ID], unitToGrams),
    fibreG: scale([FIBRE_ID], unitToGrams),
    sugarG: scale([SUGAR_ID], unitToGrams),
    sodiumMg:
      sodium === null
        ? null
        : sodium.unit.trim().toUpperCase() === "G"
          ? sodium.value * 1000 * factor
          : unitToGrams(sodium.value, sodium.unit) * 1000 * factor,
    micronutrients,
    sourceRef,
  };
}
