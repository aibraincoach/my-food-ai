// Open Food Facts product lookup by barcode: https://openfoodfacts.github.io/openfoodfacts-server/api/
// Used only when USDA FDC has no product for the code. Values are per 100 g or 100 ml as printed.
import { recordCall } from "@/lib/trace/record";
import { gtinCandidates } from "@/lib/fdc/gtin";
import type { BarcodeProduct } from "./barcode-product";

const OFF_URL = "https://world.openfoodfacts.org/api/v2/product";
const FIELDS = "code,product_name,product_name_en,brands,quantity,serving_size,serving_quantity,nutriments";
const USER_AGENT = "MyFoodAI/1.0 (+https://github.com/aibraincoach/my-food-ai)";

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null);

export function productFromOff(body: unknown, gtin: string): BarcodeProduct | null {
  const p = (body as { status?: unknown; product?: Record<string, unknown> })?.product;
  if (!p || (body as { status?: unknown }).status !== 1) return null;
  const n = (p.nutriments ?? {}) as Record<string, unknown>;
  const kcal = num(n["energy-kcal_100g"]) ?? (num(n["energy_100g"]) === null ? null : num(n["energy_100g"])! / 4.184);
  const per100g = {
    calories: kcal, protein_g: num(n.proteins_100g), carbs_g: num(n.carbohydrates_100g), fat_g: num(n.fat_100g),
    fibre_g: num(n.fiber_100g), sugar_g: num(n.sugars_100g), sodium_mg: num(n.sodium_100g) === null ? null : num(n.sodium_100g)! * 1000,
  };
  if (per100g.calories === null && per100g.protein_g === null && per100g.carbs_g === null && per100g.fat_g === null) return null;
  const name = String(p.product_name_en || p.product_name || "").trim();
  if (!name) return null;
  const quantity = typeof p.quantity === "string" ? p.quantity.trim() : "";
  const servingQty = num(p.serving_quantity);
  const basisUnit: "g" | "ml" = /(?:\d|\b)\s*[mcd]?l\b/i.test(quantity) && !/(?:\d|\b)\s*k?g\b/i.test(quantity) ? "ml" : "g";
  return {
    attribution: "off", fdcId: 0, gtin, name, brand: typeof p.brands === "string" && p.brands.trim() ? p.brands.split(",")[0].trim() : null,
    foodCategory: null, basisUnit,
    servingSize: servingQty, servingSizeUnit: servingQty === null ? null : basisUnit,
    servingText: typeof p.serving_size === "string" ? p.serving_size : null,
    packageWeight: quantity || null, micronutrients: [], per100g,
  };
}

export async function lookupOpenFoodFacts(raw: string): Promise<BarcodeProduct | null> {
  const candidates = gtinCandidates(raw);
  if (!candidates.length) return null;
  return recordCall("fdc", { event: "open_food_facts", query: `gtin:${candidates[0]}` }, async () => {
    for (const code of [...new Set(candidates.map(c => c.replace(/^0+(?=\d{8,13}$)/, "")))]) {
      const response = await fetch(`${OFF_URL}/${code}.json?fields=${FIELDS}`, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (response.status === 404) continue;
      if (!response.ok) return null;
      const product = productFromOff(await response.json(), candidates[0]);
      if (product) return product;
    }
    return null;
  }, (product) => ({ text: product }));
}
