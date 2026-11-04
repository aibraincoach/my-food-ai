import type { FdcFood } from "./client";
import { createResponse, MetaApiError } from "@/lib/meta/client";
import { recordCall } from "@/lib/trace/record";

// Owner ruling (Nov 4): a blank value is worse than a bad estimate. When no
// USDA record is close, the model estimates typical per-100 g nutrition for
// the food, labelled as an estimate. Non-foods are refused and stay unavailable.
const OUTPUT_TOKENS = [2048, 4096] as const;
const ESTIMATE_INSTRUCTIONS = `No USDA record matches this food. Estimate its typical nutrition per 100 g as eaten: calories (kcal), protein, carbohydrate, fat, fibre and sugar in grams, sodium in milligrams. Base the estimate on the closest common foods and preparation and name them in basis, in a few words (for example "fried wheat pasta snack, seasoned"). If the item is not a food or drink (a plate, a napkin, a hand), set food to false and every number to null.`;
const SCHEMA = { type: "object", additionalProperties: false, properties: { food: { type: "boolean" }, basis: { type: "string" }, calories: { type: ["number", "null"] }, protein_g: { type: ["number", "null"] }, carbs_g: { type: ["number", "null"] }, fat_g: { type: ["number", "null"] }, fibre_g: { type: ["number", "null"] }, sugar_g: { type: ["number", "null"] }, sodium_mg: { type: ["number", "null"] } }, required: ["food", "basis", "calories", "protein_g", "carbs_g", "fat_g", "fibre_g", "sugar_g", "sodium_mg"] };
type Estimate = { food: boolean; basis: string; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null; fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null };
const nutrient = (nutrientId: number, nutrientName: string, unitName: string, value: number | null) => value === null ? [] : [{ nutrientId, nutrientName, unitName, value }];
const within = (value: number | null, max: number) => value === null || (Number.isFinite(value) && value >= 0 && value <= max);

export async function estimateFood(name: string, caption: string, signal?: AbortSignal): Promise<FdcFood | null> {
  return recordCall("fdc", { event: "food_estimate", name }, async () => {
    let result: Awaited<ReturnType<typeof createResponse>> | undefined;
    for (const maxOutputTokens of OUTPUT_TOKENS) {
      if (signal?.aborted) throw new MetaApiError(503, "Food resolution budget was exhausted.");
      result = await createResponse({ model: "muse-spark-1.3", reasoning: { effort: "low" }, instructions: ESTIMATE_INSTRUCTIONS,
        input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ name, caption }) }] }],
        text: { format: { type: "json_schema", name: "nutrition_estimate", strict: true, schema: SCHEMA } },
        max_output_tokens: maxOutputTokens }, { signal });
      if (result.status !== "incomplete" || result.refusal) break;
    }
    if (!result || result.status !== "completed" || !result.outputText || result.refusal) throw new MetaApiError(502, "Nutrition estimate did not complete.");
    let parsed: Estimate;
    try { parsed = JSON.parse(result.outputText) as Estimate; } catch { throw new MetaApiError(502, "Nutrition estimate was invalid."); }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed) || typeof parsed.food !== "boolean" || typeof parsed.basis !== "string") throw new MetaApiError(502, "Nutrition estimate was invalid.");
    if (!parsed.food) return null;
    // A food answer without usable numbers is a provider failure, not a non-food.
    if (parsed.calories === null || parsed.protein_g === null || parsed.carbs_g === null || parsed.fat_g === null || !parsed.basis.trim()) throw Object.assign(new MetaApiError(502, "Nutrition estimate had no usable numbers."), {noEstimate: true});
    if (![within(parsed.calories, 900), within(parsed.protein_g, 100), within(parsed.carbs_g, 100), within(parsed.fat_g, 100), within(parsed.fibre_g, 100), within(parsed.sugar_g, 100), within(parsed.sodium_mg, 40000)].every(Boolean)) throw new MetaApiError(502, "Nutrition estimate was out of range.");
    const basis = parsed.basis.trim();
    return {
      fdcId: 0, description: `Model estimate: ${basis}`, dataType: "Estimate",
      foodNutrients: [...nutrient(1008, "Energy", "KCAL", parsed.calories), ...nutrient(1003, "Protein", "G", parsed.protein_g), ...nutrient(1005, "Carbohydrate, by difference", "G", parsed.carbs_g), ...nutrient(1004, "Total lipid (fat)", "G", parsed.fat_g), ...nutrient(1079, "Fiber, total dietary", "G", parsed.fibre_g), ...nutrient(2000, "Sugars, total including NLEA", "G", parsed.sugar_g), ...nutrient(1093, "Sodium, Na", "MG", parsed.sodium_mg)],
      approximation: { kind: "estimate", basis },
    };
  }, food => ({ text: { source: food ? "estimate" : "unavailable", basis: food?.approximation?.basis ?? null }, fdcId: null }));
}
