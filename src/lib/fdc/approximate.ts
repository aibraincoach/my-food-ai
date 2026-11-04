import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods, type FdcFood } from "./client";
import { gramBasis, hasNutrition } from "./nutrients";
import { createResponse, MetaApiError } from "@/lib/meta/client";
import { recordCall } from "@/lib/trace/record";

// Generic USDA record types only; Branded stays out so a manufacturer is never presented as a plain food.
const GENERIC = new Set(["Foundation", "SR Legacy", "Survey (FNDDS)"]);
const OUTPUT_TOKENS = [4096, 8192] as const;

const CLOSEST_INSTRUCTIONS = `The exact preparation of a food is not in USDA data. Pick the ONE candidate that is the closest generic version of the target food, even if the cooking method or a seasoning differs (for example boiled pasta for a fried pasta snack). Prefer the plain food over a compound recipe. Reject a candidate that is a different kind of food (seafood, vegetable, dessert for a pasta, and so on) or that adds substantial ingredients the target does not have (cheese, meat, sauce). Return id null only when every candidate is a different kind of food. The reason must say how the chosen record differs from the target.`;

async function choose(name: string, caption: string, found: FdcFood[], signal?: AbortSignal): Promise<{ id: number | null; reason: string }> {
  let result: Awaited<ReturnType<typeof createResponse>> | undefined;
  for (const maxOutputTokens of OUTPUT_TOKENS) {
    if (signal?.aborted) throw new MetaApiError(503, "Food resolution budget was exhausted.");
    result = await createResponse({ model: "muse-spark-1.3", reasoning: { effort: "low" }, instructions: CLOSEST_INSTRUCTIONS,
      input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ name, caption, candidates: found.map(f => ({ id: f.fdcId, description: f.description, additionalDescriptions: f.additionalDescriptions, dataType: f.dataType, category: f.foodCategory })) }) }] }],
      text: { format: { type: "json_schema", name: "closest_food", strict: true, schema: { type: "object", additionalProperties: false, properties: { id: { type: ["integer", "null"] }, reason: { type: "string" } }, required: ["id", "reason"] } } },
      max_output_tokens: maxOutputTokens }, { signal });
    if (result.status !== "incomplete" || result.refusal) break;
  }
  if (!result || result.status !== "completed" || !result.outputText || result.refusal) throw new MetaApiError(502, "Closest-food decision did not complete.");
  let parsed: unknown;
  try { parsed = JSON.parse(result.outputText); } catch { throw new MetaApiError(502, "Closest-food decision was invalid."); }
  const value = parsed as { id?: unknown; reason?: unknown };
  if (typeof parsed !== "object" || parsed === null || (value.id !== null && !Number.isSafeInteger(value.id)) || typeof value.reason !== "string") throw new MetaApiError(502, "Closest-food decision was invalid.");
  return value as { id: number | null; reason: string };
}

// Searches the bare food noun among generic USDA records and accepts the closest one, labelled with its name.
// A rejected reference retains its reason for the item and meal comment.
export async function closestGenericFood(admin: SupabaseClient, name: string, caption: string, baseFood: string, signal?: AbortSignal): Promise<{food: FdcFood | null; reason: string}> {
  const result=await recordCall("fdc", { event: "food_approximation", name, query: baseFood }, async () => {
    const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f)).slice(0, 30);
    if (!found.length) return {food:null,reason:"No generic USDA record with nutrition was found for this food."};
    const decision = await choose(name, caption, found, signal);
    if (decision.id === null) return {food:null,reason:decision.reason};
    const food = found.find(f => f.fdcId === decision.id);
    if (!food) throw new Error("Closest-food decision selected an ineligible candidate.");
    return {food:{ ...food, approximation: { kind: "closest" as const, basis: food.description } },reason:decision.reason};
  }, result => ({ text: { source: result.food ? "closest" : "unavailable", basis: result.food?.description ?? null, reason:result.reason }, fdcId: result.food?.fdcId ?? null }));
  return result;
}
