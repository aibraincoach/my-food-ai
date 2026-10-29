import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods } from "@/lib/fdc/client";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { dateInZone, validZone } from "@/lib/posts/days";
import { hydrationSoFar, type DrinkCardData } from "./hydration";
import { renderResultsCard } from "@/lib/pipeline/results-card";

export interface DrinkInput { kind: "water" | "caffeine"; label: string; ml: number; caffeineMg: number }
const presets = [{ ml: 30, mg: 63, label: "Coffee, espresso" }, { ml: 240, mg: 95, label: "Coffee, cup" }, { ml: 350, mg: 150, label: "Coffee, large" }];
// The client chooses kind/volume only; caffeine and labels are resolved here.
export function parseDrinkInput(body: unknown): DrinkInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if ((value.kind !== "water" && value.kind !== "caffeine") || !Number.isInteger(value.ml) || (value.ml as number) < 1 || (value.ml as number) > 5000) return null;
  const ml = value.ml as number;
  if (value.kind === "water") return { kind: "water", label: "Water", ml, caffeineMg: 0 };
  const preset = value.custom === true ? undefined : presets.find(row => row.ml === ml);
  const caffeineMg = preset?.mg ?? Math.round(ml * 95 / 240);
  if (caffeineMg < 1 || caffeineMg > 1000) return null;
  return { kind: "caffeine", label: preset?.label ?? "Coffee", ml, caffeineMg };
}

export async function postDrink(admin: SupabaseClient, userId: string, input: DrinkInput, tz: string): Promise<{ postId: string; drink: DrinkCardData | null }> {
  const eatenAt = new Date().toISOString();
  let nutrition: Record<string, unknown> = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0,
    micronutrients: [{ nutrientId: 1051, nutrientName: "Water", unitName: "G", value: input.ml, basis: "portion" }], source_ref: null };
  if (input.kind === "caffeine") {
    const foods = await searchFoods(admin, "Coffee, brewed from grounds, prepared with tap water");
    const food = foods.find(f => /coffee,? brewed from grounds,? prepared with tap water/i.test(f.description))
      ?? foods.find(f => /coffee/i.test(f.description) && !/milk|sugar|creamer|substitute|instant|decaffeinated/i.test(f.description));
    if (!food) throw new Error("Coffee nutrition could not be found.");
    const n = scaleNutrition(food, input.ml);
    nutrition = { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg,
      micronutrients: [...n.micronutrients.filter(row => (row as { nutrientId?: number }).nutrientId !== 1057),
        { nutrientId: 1057, nutrientName: "Caffeine", unitName: "MG", value: input.caffeineMg, basis: "portion" }], source_ref: n.sourceRef };
  }
  const { data, error } = await admin.rpc("create_food_post", { p_user_id: userId, p_eaten_at: eatenAt, p_name: input.label, p_grams: input.ml, p_nutrition: nutrition });
  if (error || typeof data !== "string") throw new Error("The drink could not be saved.");
  const postId = data;
  const { error: intakeError } = await admin.from("intake_logs").insert({ user_id: userId, kind: input.kind,
    amount: input.kind === "water" ? input.ml : input.caffeineMg, ml: input.ml, label: input.label, post_id: postId, logged_at: eatenAt });
  if (intakeError) {
    const cleanup = await admin.from("posts").delete().eq("id", postId).eq("user_id", userId);
    if (cleanup.error) throw new Error("The intake could not be saved and its meal could not be removed.");
    throw new Error("The drink could not be saved.");
  }
  const zone = validZone(tz);
  let drink: DrinkCardData | null = null;
  try {
  drink = { ...await hydrationSoFar(admin, userId, dateInZone(eatenAt, zone), zone, eatenAt),
    ml: input.ml, label: input.label, caffeineMg: input.caffeineMg };
  // The committed post remains readable with its live card if optional PNG rendering fails.
  await renderResultsCard(admin, postId, undefined, drink, zone);
  } catch { /* A committed drink remains a success; its live card retries the read. */ }
  return { postId, drink };
}
