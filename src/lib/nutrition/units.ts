// Amounts a person can enter for an item. Everything is stored in grams; g and oz convert exactly, cup and piece
// need a gram weight that the matched FDC food states.
export const UNITS = ["g", "oz", "piece", "cup"] as const;
export type Unit = (typeof UNITS)[number];
export const OZ_G = 28.349523125;
export const isUnit = (value: unknown): value is Unit => typeof value === "string" && (UNITS as readonly string[]).includes(value);

export interface FoodPortion { unit: "cup" | "piece"; gramsPerUnit: number }

const MASS_OR_VOLUME = /^(g|gram|grams|oz|ounce|ounces|ml|milliliter|fl oz|tbsp|tablespoon|tsp|teaspoon|undetermined|racc|nlea serving)$/i;

// FDC detail: foodPortions[{amount, gramWeight, modifier, measureUnit:{name}}] for Foundation and SR Legacy foods,
// servingSize plus householdServingFullText ("0.75 cup", "1 cookie") for Branded foods.
export function portionsFromDetail(payload: unknown): FoodPortion[] {
  const food = payload as Record<string, unknown> | null;
  const out: FoodPortion[] = [];
  const push = (unit: FoodPortion["unit"], amount: unknown, grams: unknown) => {
    if (typeof amount === "number" && typeof grams === "number" && amount > 0 && grams > 0 && Number.isFinite(grams / amount)) out.push({ unit, gramsPerUnit: grams / amount });
  };
  if (Array.isArray(food?.foodPortions)) {
    for (const raw of food.foodPortions as unknown[]) {
      const p = raw as { amount?: unknown; gramWeight?: unknown; measureUnit?: { name?: unknown } } | null;
      const name = typeof p?.measureUnit?.name === "string" ? p.measureUnit.name.trim() : "";
      if (!name) continue;
      if (/^cups?$/i.test(name)) push("cup", p!.amount, p!.gramWeight);
      else if (!MASS_OR_VOLUME.test(name)) push("piece", p!.amount, p!.gramWeight);
    }
  }
  const household = typeof food?.householdServingFullText === "string" ? food.householdServingFullText.trim() : "";
  const serving = typeof food?.servingSize === "number" && String(food.servingSizeUnit).toLowerCase() === "g" ? food.servingSize : null;
  const match = /^(\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s+([a-z][a-z .-]*)/i.exec(household);
  if (serving && match) {
    const [whole, fraction] = match[1].split(/\s+/);
    const amount = fraction ? Number(whole) + Number(fraction.split("/")[0]) / Number(fraction.split("/")[1])
      : whole.includes("/") ? Number(whole.split("/")[0]) / Number(whole.split("/")[1]) : Number(whole);
    const word = match[2].trim().toLowerCase();
    if (/^cups?\b/.test(word)) push("cup", amount, serving);
    else if (!MASS_OR_VOLUME.test(word.split(/[\s(]/)[0])) push("piece", amount, serving);
  }
  return out;
}

// Grams for an amount in a unit, or null when the food states no weight for that unit.
export function toGrams(quantity: number, unit: Unit, portions: FoodPortion[]): number | null {
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (unit === "g") return quantity;
  if (unit === "oz") return quantity * OZ_G;
  const portion = portions.find((entry) => entry.unit === unit);
  return portion ? quantity * portion.gramsPerUnit : null;
}

export const roundGrams = (grams: number): number => Math.round(grams * 100) / 100;
