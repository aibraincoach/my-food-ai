// Barcode lookup against FDC Branded Foods by gtin_upc.
// FDC stores the code as printed on the package (UPC-A is 12 digits, with its leading zero) and matches it
// exactly, so a scanned EAN-13 that is a UPC-A with a leading 0 must be trimmed back to 12 digits.
import { recordCall } from "@/lib/trace/record";
import { ApiError } from "@/lib/worker/errors";
import { gtinCandidates } from "@/lib/fdc/gtin";

export { gtinCandidates, validGtin } from "@/lib/fdc/gtin";

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const MAX_PAGES = 3;

export interface BarcodeNutrition {
  calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null;
  fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null;
}
export interface BarcodeProduct {
  fdcId: number; gtin: string; name: string; brand: string | null;
  // FDC standardises branded values to 100 g or 100 ml; no density conversion is made between them.
  basisUnit: "g" | "ml";
  servingSize: number | null; servingSizeUnit: string | null; servingText: string | null;
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
    per100g,
  };
}

// Throws ApiError on FDC 429/5xx; returns null when FDC has no usable product for the code.
export async function lookupBarcode(raw: string): Promise<BarcodeProduct | null> {
  const candidates = gtinCandidates(raw);
  if (!candidates.length) return null;
  const key = process.env.FDC_API_KEY;
  if (!key) throw new Error("fdc: FDC_API_KEY is not set.");
  return recordCall("fdc", { query: `gtin:${candidates[0]}` }, async () => {
    for (const gtin of candidates) {
      // The search is a text search: page through it (bounded) until the exact gtinUpc turns up with usable nutrition.
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const params = new URLSearchParams({ query: gtin, dataType: "Branded", pageSize: "50", pageNumber: String(page), api_key: key });
        const response = await fetch(`${FDC_BASE_URL}/foods/search?${params}`);
        if (!response.ok) throw new ApiError(response.status, await response.text(), `fdc: barcode search failed with ${response.status}.`);
        const payload = (await response.json()) as { foods?: unknown; totalPages?: unknown };
        const foods = Array.isArray(payload.foods) ? payload.foods : [];
        const exact = foods.filter((food) => (food as { gtinUpc?: unknown })?.gtinUpc === gtin);
        for (const food of exact) { const product = productFromFood(food, gtin); if (product) return product; }
        if (typeof payload.totalPages !== "number" || page >= payload.totalPages) break;
      }
    }
    return null;
  }, (product) => ({ text: product, fdcId: product?.fdcId ?? null }));
}
