// Per-100 g scaling of an FDC match to the estimated portion (item 10).
// Preference: Foundation, then SR Legacy, then Branded. Foundation and
// SR Legacy values are per 100 g; Branded label values are per serving,
// so Branded scales by servingSize when it is in grams, else falls back
// to the per-100 g reading. Nutrient ids verified against the live API:
// Energy 1008 (kcal; 2047/2048 fallbacks; kJ converted), Protein 1003,
// Total lipid 1004, Carbohydrate 1005, Fiber 1079, Sugars 2000,
// Sodium 1093. The full nutrient array is kept in micronutrients and
// source_ref is the FDC id, so numbers are traceable to USDA FDC.
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

export function chooseBestMatch(foods: FdcFood[]): FdcFood | null {
  let best: FdcFood | null = null;
  for (const food of foods) {
    if (!best || rankOf(food.dataType) < rankOf(best.dataType)) {
      best = food;
    }
  }
  return best;
}

// Grams of reference the food's nutrient values describe.
function referenceGrams(food: FdcFood): number {
  if (food.dataType === "Branded") {
    const unit = (food.servingSizeUnit ?? "").toLowerCase();
    if (
      typeof food.servingSize === "number" &&
      food.servingSize > 0 &&
      (unit === "g" || unit === "gram" || unit === "ml")
    ) {
      return food.servingSize;
    }
  }
  return 100;
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
  const micronutrients: unknown[] = food.foodNutrients;
  if (portionGrams === null || portionGrams <= 0) {
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
  const factor = portionGrams / referenceGrams(food);
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
