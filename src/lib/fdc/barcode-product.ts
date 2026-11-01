// Pure product/portion data shared by the capture client and the server-only FDC resolver.
export interface BarcodeNutrition {
  calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null;
  fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null;
}
export interface BarcodeProduct {
  fdcId: number; gtin: string; name: string; brand: string | null;
  // FDC standardises branded values to 100 g or 100 ml; no density conversion is made between them.
  basisUnit: "g" | "ml";
  servingSize: number | null; servingSizeUnit: string | null; servingText: string | null;
  packageWeight: string | null;
  micronutrients: { nutrientId: number; nutrientName: string; unitName: string; value: number; basis: "portion" }[];
  per100g: BarcodeNutrition;
}

const NUTRIENT_IDS: Record<keyof BarcodeNutrition, number[]> = {
  calories: [1008], protein_g: [1003], carbs_g: [1005], fat_g: [1004], fibre_g: [1079], sugar_g: [2000, 1063], sodium_mg: [1093],
};

export function productFromFood(food: unknown, gtin: string): BarcodeProduct | null {
  if (typeof food !== "object" || food === null) return null;
  const f = food as Record<string, unknown>;
  if (typeof f.fdcId !== "number" || typeof f.description !== "string" || !Array.isArray(f.foodNutrients)) return null;
  const amounts = new Map<number, number>();
  for (const raw of f.foodNutrients as unknown[]) {
    const n = raw as { nutrientId?: unknown; value?: unknown };
    if (typeof n?.nutrientId === "number" && typeof n.value === "number" && !amounts.has(n.nutrientId)) amounts.set(n.nutrientId, n.value);
  }
  const pick = (ids: number[]) => { for (const id of ids) if (amounts.has(id)) return amounts.get(id)!; return null; };
  const per100g = Object.fromEntries((Object.keys(NUTRIENT_IDS) as (keyof BarcodeNutrition)[]).map((key) => [key, pick(NUTRIENT_IDS[key])])) as unknown as BarcodeNutrition;
  // A product with no energy and no macros is not usable nutrition.
  if (per100g.calories === null && per100g.protein_g === null && per100g.carbs_g === null && per100g.fat_g === null) return null;
  return {
    fdcId: f.fdcId, gtin, name: f.description,
    basisUnit: typeof f.servingSizeUnit === "string" && f.servingSizeUnit.toLowerCase() === "ml" ? "ml" : "g",
    brand: typeof f.brandOwner === "string" ? f.brandOwner : typeof f.brandName === "string" ? f.brandName : null,
    servingSize: typeof f.servingSize === "number" ? f.servingSize : null,
    servingSizeUnit: typeof f.servingSizeUnit === "string" ? f.servingSizeUnit : null,
    servingText: typeof f.householdServingFullText === "string" ? f.householdServingFullText : null,
    packageWeight: typeof f.packageWeight === "string" ? f.packageWeight : null,
    micronutrients: (f.foodNutrients as { nutrientId?: number; nutrientName?: string; unitName?: string; value?: number }[])
      .filter((n) => typeof n.nutrientId === "number" && typeof n.value === "number" && Number.isFinite(n.value))
      .map((n) => ({ nutrientId: n.nutrientId!, nutrientName: n.nutrientName ?? "", unitName: n.unitName ?? "", value: n.value!, basis: "portion" as const })),
    per100g,
  };
}


// A conversion within mass or volume only: grams are never guessed from millilitres.
export function amountInBasis(amount: number, unit: string, basis: "g" | "ml"): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const normalized = unit.trim().toLowerCase().replace(/\./g, "");
  const mass: Record<string, number> = { g: 1, oz: 28.349523125 };
  const volume: Record<string, number> = { ml: 1, l: 1000, "fl oz": 29.5735295625 };
  const factor = (basis === "g" ? mass : volume)[normalized];
  return factor ? amount * factor : null;
}

export function packageAmount(product: BarcodeProduct): number | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*(fl\.?\s*oz\.?|ml|l|g|oz\.?)\s*$/i.exec(product.packageWeight ?? "");
  return match ? amountInBasis(Number(match[1]), match[2].replace(/\s+/g, " "), product.basisUnit) : null;
}

export function barcodeAmounts(product: BarcodeProduct): number[] {
  const serving = product.servingSize && product.servingSizeUnit
    ? amountInBasis(product.servingSize, product.servingSizeUnit, product.basisUnit) : null;
  const pack = packageAmount(product);
  return [...new Set([100, ...(serving ? [serving, serving * 2] : [200, 250]), ...(pack ? [pack] : [])])];
}

export function barcodeNutrition(product: BarcodeProduct, amount: number) {
  const factor = amount / 100;
  return {
    ...Object.fromEntries(Object.entries(product.per100g).map(([key, value]) => [key, value === null ? null : value * factor])),
    micronutrients: product.micronutrients.map((n) => ({ ...n, value: n.value * factor })),
    source_ref: "source" in product && product.source === "own" ? `barcode:${product.gtin}` : String(product.fdcId),
    portion_unit: product.basisUnit,
  };
}

export interface BarcodeCorrection {
  name?: string | null; pack_amount?: number | null; pack_unit?: "g" | "ml" | null;
  serving_amount?: number | null; serving_unit?: "g" | "ml" | null;
  per_100?: BarcodeNutrition | null; source?: "user" | "label";
}
export type ResolvedProduct = BarcodeProduct & { source: "database" | "own" | "shared"; originalName?: string };

// Pure precedence rule is also used by access tests; no server module enters the camera bundle.
export function mergeProduct(gtin: string, base: BarcodeProduct | null, own: BarcodeCorrection | null, sharedName: string | null): ResolvedProduct | null {
  if (!base && !(own?.per_100 && own.name && own.serving_unit)) return null;
  const original = base ?? { fdcId: 0, gtin, name: "Packaged food", brand: null, basisUnit: own?.serving_unit ?? "g", servingSize: null,
    servingSizeUnit: null, servingText: null, packageWeight: null, micronutrients: [], per100g: own!.per_100! };
  return { ...original, source: own ? "own" : sharedName ? "shared" : "database", originalName: original.name,
    name: own?.name ?? sharedName ?? original.name,
    ...(own?.per_100 ? { per100g: own.per_100, micronutrients: [], basisUnit: own.serving_unit ?? original.basisUnit } : {}),
    ...(own?.serving_amount ? { servingSize: Number(own.serving_amount), servingSizeUnit: own.serving_unit ?? original.basisUnit } : {}),
    ...(own?.pack_amount ? { packageWeight: `${own.pack_amount} ${own.pack_unit ?? original.basisUnit}` } : {}),
  };
}
