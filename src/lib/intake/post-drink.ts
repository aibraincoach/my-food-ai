import {saveCaptureZone} from "@/lib/pipeline/capture-zone";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFoodById, searchFoods } from "@/lib/fdc/client";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { dateInZone } from "@/lib/posts/days";
import { hydrationSoFar, type DrinkCardData } from "./hydration";
import {TEA_REFERENCES,isTeaId,teaCaffeine,type TeaId} from "./tea-references";
import { DRINK_TILES, TILE_SIZES } from "./intake";
import { renderResultsCard } from "@/lib/pipeline/results-card";

export interface DrinkInput { id: typeof DRINK_TILES[number]["id"] | TeaId; kind: "water" | "caffeine"; label: string; ml: number; caffeineMg: number }
// The client chooses kind/volume only; caffeine and labels are resolved here.
export function parseDrinkInput(body: unknown): DrinkInput | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if ("tile" in value) {
    if (typeof value.tile !== "number" || !Number.isInteger(value.tile) || value.tile < 0 || value.tile >= DRINK_TILES.length) return null;
    const tile = DRINK_TILES[value.tile];
    const ml = "ml" in value ? value.ml : tile.ml;
    const size = TILE_SIZES[value.tile].find(size => size.ml === ml);
    if (!size) return null;
    if(tile.id==='tea-black'){
      const teaId=value.tea_id===undefined?'tea-black':value.tea_id;
      if(!isTeaId(teaId))return null;
      const tea=TEA_REFERENCES[teaId];
      return {id:teaId,kind:'caffeine',label:`${tea.name}, ${size.word}`,ml:size.ml,caffeineMg:teaCaffeine(teaId,size.ml)};
    }
    if(Object.hasOwn(value,'tea_id'))return null;
    return { id:tile.id,kind: tile.kind, label: `${tile.name}, ${size.word}`, ml: size.ml, caffeineMg: size.caffeineMg ?? Math.round(tile.caffeineMg * size.ml / tile.ml) };
  }
  return null;
}

export async function postDrink(admin: SupabaseClient, userId: string, input: DrinkInput, tz: string, operation:{id:string;key:string;eatenAt:string}): Promise<{ postId: string; drink: DrinkCardData | null }> {
  const eatenAt = operation.eatenAt;
  let nutrition: Record<string, unknown> = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fibre_g: 0, sugar_g: 0, sodium_mg: 0,
    micronutrients: [{ nutrientId: 1051, nutrientName: "Water", unitName: "G", value: input.ml, basis: "portion" }], source_ref: "user:drink-tile" };
  let caffeineMg=input.caffeineMg;
  if(isTeaId(input.id)){
    const reference=TEA_REFERENCES[input.id],food=await getFoodById(admin,reference.fdcId);
    if(food.description!==reference.description)throw new Error('Tea reference identity changed.');
    const caffeine=food.foodNutrients.find(row=>row.nutrientId===1057);
    if(!caffeine||!Number.isFinite(caffeine.value)||caffeine.value<0)throw new Error('Tea caffeine is not available.');
    const n=scaleNutrition(food,input.ml*reference.gramsPerMl);
    caffeineMg=caffeine.value*input.ml*reference.gramsPerMl/100;
    nutrition={calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg,micronutrients:n.micronutrients,source_ref:n.sourceRef,food_category:n.foodCategory??null};
  }else if (input.kind === "caffeine") {
    const sources={
      cola:{ query: "Beverages, carbonated, cola, regular", match: /carbonated.*cola.*regular/i,kind:/cola/i },
      espresso:{ query: "Coffee, brewed, espresso, restaurant-prepared", match: /coffee.*espresso/i,kind:/espresso/i },
      coffee:{ query: "Coffee, brewed from grounds, prepared with tap water", match: /coffee,? brewed from grounds,? prepared with tap water/i,kind:/coffee/i },
    };
    if(!(input.id in sources))throw new Error('Unknown drink reference.');
    const source=sources[input.id as keyof typeof sources];
    const foods = await searchFoods(admin, source.query);
    const plain = (f: {description: string}) => !/decaffeinated|diet|sugar.free|milk|creamer|substitute|instant/i.test(f.description);

    // Exact reference first; otherwise the first plain search result of the same drink (pre-Fleet 9 behaviour for coffee).
    const food = foods.find(f => source.match.test(f.description) && plain(f)) ?? foods.find(f => source.kind.test(f.description) && plain(f));
    if (!food) throw new Error("Drink nutrition could not be found.");
    const n = scaleNutrition(food, input.ml);
    nutrition = { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg,
      micronutrients: [...n.micronutrients.filter(row => (row as { nutrientId?: number }).nutrientId !== 1057),
        { nutrientId: 1057, nutrientName: "Caffeine", unitName: "MG", value: input.caffeineMg, basis: "portion" }], source_ref: n.sourceRef };
  }
  const { data, error } = await admin.rpc("publish_drink_operation", { p_operation_id:operation.id,p_request_key:operation.key,p_user_id: userId, p_eaten_at: eatenAt,
    p_kind: input.kind, p_ml: input.ml, p_label: input.label, p_caffeine_mg: caffeineMg, p_nutrition: nutrition });
  if(error)throw Object.assign(new Error("The drink could not be saved."),{code:error.code});
  if(typeof data!=="string")throw new Error("The drink could not be confirmed.");
  const postId = data;
  const zone = tz;
  await saveCaptureZone(admin,postId,zone);
  let drink: DrinkCardData | null = null;
  try {
  const hydration = await hydrationSoFar(admin, userId, dateInZone(eatenAt, zone), zone, eatenAt);
  drink = { ...hydration, dayCaffeineMg: hydration.caffeineMg,
    ml: input.ml, label: input.label, caffeineMg };
  // The committed post remains readable with its live card if optional PNG rendering fails.
  await renderResultsCard(admin, postId, undefined, drink, zone);
  } catch {
    // Do not turn a committed drink into a failed POST; the live card retries the read.
    console.error("Drink hydration/card rendering failed.", { postId });
  }
  return { postId, drink };
}
