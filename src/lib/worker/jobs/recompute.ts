import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { searchFoods } from "@/lib/fdc/client";
import { chooseBestMatch, scaleNutrition } from "@/lib/fdc/nutrients";
import { markReady } from "@/lib/pipeline/persist";
import { rescaleStoredNutrition, type NutritionRow, toNumber } from "@/lib/nutrition/totals";

export default async function recompute(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.post_id) throw new Error("recompute: post is required.");
  const { data: items, error } = await admin.from("current_post_items")
    .select("id,name,portion_grams,supersedes").eq("post_id", job.post_id);
  if (error) throw new Error(`recompute items: ${error.message}`);
  if (items?.length) {
    const { data: existing, error: nutritionError } = await admin.from("item_nutrition")
      .select("post_item_id").in("post_item_id", items.map((item) => item.id));
    if (nutritionError) throw new Error(`recompute nutrition: ${nutritionError.message}`);
    const complete = new Set((existing ?? []).map((row) => row.post_item_id));
    for (const item of items) {
      if (complete.has(item.id)) continue;
      // A portion revision must not silently choose a different search result.
      let retained: NutritionRow | null = null;
      if (item.supersedes) {
        const { data: prior, error: priorError } = await admin.from("post_items")
          .select("name,portion_grams").eq("id", item.supersedes).eq("post_id", job.post_id).maybeSingle();
        if (priorError) throw new Error("recompute: prior item could not be read.");
        if (prior && prior.name === item.name) {
          const { data: previous, error: previousError } = await admin.from("item_nutrition")
            .select("post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref")
            .eq("post_item_id", item.supersedes).maybeSingle();
          if (previousError) throw new Error("recompute: prior nutrition could not be read.");
          if (previous) retained = rescaleStoredNutrition(previous as NutritionRow, prior.portion_grams, item.portion_grams);
        }
      }
      if (retained) {
        const { error: retainedError } = await admin.from("item_nutrition").upsert({ ...retained, post_item_id: item.id }, { onConflict: "post_item_id", ignoreDuplicates: true });
        if (retainedError) throw new Error("recompute: retained food could not be saved.");
        continue;
      }
      const food = chooseBestMatch(await searchFoods(admin, item.name));
      const n = scaleNutrition(food, item.portion_grams == null ? null : toNumber(item.portion_grams));
      const { error: writeError } = await admin.from("item_nutrition").upsert({
        post_item_id: item.id, calories: n.calories, protein_g: n.proteinG,
        carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG,
        sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef,
      }, { onConflict: "post_item_id", ignoreDuplicates: true });
      if (writeError) throw new Error(`recompute save: ${writeError.message}`);
    }
  }
  await markReady(job.post_id, admin);
}
