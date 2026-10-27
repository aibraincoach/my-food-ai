import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { searchFoods } from "@/lib/fdc/client";
import { chooseBestMatch, scaleNutrition } from "@/lib/fdc/nutrients";
import { markReady } from "@/lib/pipeline/persist";
import { toNumber } from "@/lib/nutrition/totals";

export default async function recompute(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.post_id) throw new Error("recompute: post is required.");
  const { data: items, error } = await admin.from("current_post_items")
    .select("id,name,portion_grams").eq("post_id", job.post_id);
  if (error) throw new Error(`recompute items: ${error.message}`);
  if (items?.length) {
    const { data: existing, error: nutritionError } = await admin.from("item_nutrition")
      .select("post_item_id").in("post_item_id", items.map((item) => item.id));
    if (nutritionError) throw new Error(`recompute nutrition: ${nutritionError.message}`);
    const complete = new Set((existing ?? []).map((row) => row.post_item_id));
    for (const item of items) {
      if (complete.has(item.id)) continue;
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
