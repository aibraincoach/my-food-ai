// Barcode lookup against FDC Branded Foods by gtin_upc.
// FDC stores the code as printed on the package (UPC-A is 12 digits, with its leading zero) and matches it
// exactly, so a scanned EAN-13 that is a UPC-A with a leading 0 must be trimmed back to 12 digits.
import { recordCall } from "@/lib/trace/record";
import { ApiError } from "@/lib/worker/errors";
import { gtinCandidates, sameGtin } from "@/lib/fdc/gtin";

export { gtinCandidates, validGtin } from "@/lib/fdc/gtin";

const FDC_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const MAX_PAGES = 3;

import { productFromFood, type BarcodeProduct } from "./barcode-product";
export { productFromFood, barcodeAmounts, barcodeNutrition, amountInBasis, packageAmount } from "./barcode-product";
export type { BarcodeProduct, BarcodeNutrition } from "./barcode-product";

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
        const exact = foods.filter((food) => { const stored = (food as { gtinUpc?: unknown })?.gtinUpc; return typeof stored === "string" && sameGtin(stored, gtin); });
        for (const food of exact) { const product = productFromFood(food, candidates[0]); if (product) return product; }
        if (typeof payload.totalPages !== "number" || page >= payload.totalPages) break;
      }
    }
    return null;
  }, (product) => ({ text: product, fdcId: product?.fdcId ?? null }));
}
