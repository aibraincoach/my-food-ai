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
  "Survey (FNDDS)": 0.5,
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

export function gramBasis(food: FdcFood): boolean {
  const unit = (food.servingSizeUnit ?? "").trim().toLowerCase();
  // An unsupported count/activity unit cannot establish a gram denominator.
  // Missing units retain the historical per-100g reference behavior.
  return food.dataType !== "Branded" || !unit || ["g","grm","gm","gram","grams","kg","mg","oz","onz","ounce","ounces"].includes(unit);
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

// Rank FDC search hits for an item name. Data-type rank alone picked dressing
// for salad, soymilk for black coffee, and ketchup for scrambled egg (#189).
export function scoreFoodMatch(query: string, food: FdcFood): number {
  const words = queryTokens(query);
  const description = new Set(food.description.toLowerCase().split(/[^a-z]+/).filter(Boolean));
  const overlap = words.filter(word => description.has(word)).length;
  const unrequested = ["sauce", "dressing", "spread", "powder", "dried", "sweetened", "glutinous"].filter(word => description.has(word) && !words.includes(word));
  return (words.length ? overlap / words.length : 0) - unrequested.length - rankOf(food.dataType) * 0.001;
}

export function hasNutrition(food: FdcFood): boolean {
  return food.foodNutrients.some(n => [1008, 2047, 2048, 1003, 1004, 1005].includes(n.nutrientId) && Number.isFinite(n.value));
}

export function chooseBestMatch(foods: FdcFood[], query?: string): FdcFood | null {
  const eligible = foods.filter(food => gramBasis(food) && hasNutrition(food));
  if (!query?.trim()) return eligible.sort((a,b) => rankOf(a.dataType)-rankOf(b.dataType))[0] ?? null;
  const ranked = eligible.map(food => ({food,score:scoreFoodMatch(query,food)})).sort((a,b) => b.score-a.score);
  return ranked[0]?.score >= 0.66 ? ranked[0].food : null;
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
