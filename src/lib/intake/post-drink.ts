import {renderTimeZone} from "@/lib/pipeline/render-zone";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods } from "@/lib/fdc/client";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { dateInZone, validZone } from "@/lib/posts/days";
import { hydrationSoFar, type DrinkCardData } from "./hydration";
import { customCoffeeCaffeine, DRINK_TILES } from "./intake";
import { renderResultsCard } from "@/lib/pipeline/results-card";

export interface DrinkInput { kind: "water" | "caffeine"; label: string; ml: number; caffeineMg: number }
const presets = [{ ml: 30, mg: 63, label: "Coffee, espresso" }, { ml: 240, mg: 95, label: "Coffee, cup" }, { ml: 350, mg: 150, label: "Coffee, large" }];
// The client chooses kind/volume only; caffeine and labels are resolved here.
export function parseDrinkInput(body: unknown): DrinkInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if ("tile" in value) {
    if (typeof value.tile !== "number" || !Number.isInteger(value.tile) || value.tile < 0 || value.tile >= DRINK_TILES.length) return null;
    const tile = DRINK_TILES[value.tile];
    return { kind: tile.kind, label: `${tile.name}, ${tile.size}`, ml: tile.ml, caffeineMg: tile.caffeineMg };
  }
  if ((value.kind !== "water" && value.kind !== "caffeine") || !Number.isInteger(value.ml) || (value.ml as number) < 1 || (value.ml as number) > 5000) return null;
  const ml = value.ml as number;
  if (value.kind === "water") return { kind: "water", label: "Water", ml, caffeineMg: 0 };
  const preset = value.custom === true ? undefined : presets.find(row => row.ml === ml);
  const caffeineMg = preset?.mg ?? customCoffeeCaffeine(ml);
  if (caffeineMg === null) return null;
  return { kind: "caffeine", label: preset?.label ?? "Coffee", ml, caffeineMg };
}

export async function postDrink(admin: SupabaseClient, userId: string, input: DrinkInput, tz: string): Promise<{ postId: string; drink: DrinkCardData | null }> {
  const eatenAt = new Date().toISOString();
  let nutrition: Record<string, unknown> = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0,
    micronutrients: [{ nutrientId: 1051, nutrientName: "Water", unitName: "G", value: input.ml, basis: "portion" }], source_ref: null };
  if (input.kind === "caffeine") {
    const source = input.label.startsWith("Coca-Cola")
      ? { query: "Beverages, carbonated, cola, regular", match: /carbonated.*cola.*regular/i }
      : input.label.startsWith("Tea")
        ? { query: "Beverages, tea, black, brewed, prepared with tap water", match: /tea.*black.*brewed/i }
        : input.label.startsWith("Espresso")
          ? { query: "Coffee, brewed, espresso, restaurant-prepared", match: /coffee.*espresso/i }
          : { query: "Coffee, brewed from grounds, prepared with tap water", match: /coffee,? brewed from grounds,? prepared with tap water/i };
    const foods = await searchFoods(admin, source.query);
    const food = foods.find(f => source.match.test(f.description) && !/decaffeinated|diet|sugar.free/i.test(f.description));
    if (!food) throw new Error("Drink nutrition could not be found.");
    const n = scaleNutrition(food, input.ml);
    nutrition = { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg,
      micronutrients: [...n.micronutrients.filter(row => (row as { nutrientId?: number }).nutrientId !== 1057),
        { nutrientId: 1057, nutrientName: "Caffeine", unitName: "MG", value: input.caffeineMg, basis: "portion" }], source_ref: n.sourceRef };
  }
  const { data, error } = await admin.rpc("create_drink_post", { p_user_id: userId, p_eaten_at: eatenAt,
    p_kind: input.kind, p_ml: input.ml, p_label: input.label, p_caffeine_mg: input.caffeineMg, p_nutrition: nutrition });
  if (error || typeof data !== "string") throw new Error("The drink could not be saved.");
  const postId = data;
  const zone = validZone(tz);
  let drink: DrinkCardData | null = null;
  try {
  await renderTimeZone(admin,postId,zone);
  const hydration = await hydrationSoFar(admin, userId, dateInZone(eatenAt, zone), zone, eatenAt);
  drink = { ...hydration, dayCaffeineMg: hydration.caffeineMg,
    ml: input.ml, label: input.label, caffeineMg: input.caffeineMg };
  // The committed post remains readable with its live card if optional PNG rendering fails.
  await renderResultsCard(admin, postId, undefined, drink, zone);
  } catch {
    // Do not turn a committed drink into a failed POST; the live card retries the read.
    console.error("Drink hydration/card rendering failed.", { postId });
  }
  return { postId, drink };
}
