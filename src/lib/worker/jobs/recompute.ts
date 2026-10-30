import { resolvePortionNutrition } from "@/lib/nutrition/portion";
import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { searchFoods } from "@/lib/fdc/client";
import { chooseBestMatch, scaleNutrition } from "@/lib/fdc/nutrients";
import { markReady } from "@/lib/pipeline/persist";
import { toNumber } from "@/lib/nutrition/totals";

export default async function recompute(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.post_id) throw new Error("recompute: post is required.");
  const { data: items, error, status: itemsStatus } = await admin.from("current_post_items")
    .select("id,name,portion_grams,portion_text,supersedes").eq("post_id", job.post_id);
  if (error) throw ioError(`recompute items: ${error.message}`, error, itemsStatus);
  if (items?.length) {
    const { data: existing, error: nutritionError, status: nutritionStatus } = await admin.from("item_nutrition")
      .select("post_item_id").in("post_item_id", items.map((item) => item.id));
    if (nutritionError) throw ioError(`recompute nutrition: ${nutritionError.message}`, nutritionError, nutritionStatus);
    const complete = new Set((existing ?? []).map((row) => row.post_item_id));
    for (const item of items) {
      if (complete.has(item.id)) continue;
      // A portion revision must not silently choose a different search result.
      const retained = await resolvePortionNutrition(admin, job.post_id, item.supersedes, item.name, item.portion_grams, item.portion_text);
      if (retained) {
        const { error: retainedError, status: retainedStatus } = await admin.from("item_nutrition").upsert({ ...retained, post_item_id: item.id }, { onConflict: "post_item_id", ignoreDuplicates: true });
        if (retainedError) throw ioError("recompute: retained food could not be saved.", retainedError, retainedStatus);
        continue;
      }
      const food = chooseBestMatch(await searchFoods(admin, item.name), item.name);
      const n = scaleNutrition(food, item.portion_grams == null ? null : toNumber(item.portion_grams));
      const { error: writeError, status: writeStatus } = await admin.from("item_nutrition").upsert({
        post_item_id: item.id, calories: n.calories, protein_g: n.proteinG,
        carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG,
        sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef,
      }, { onConflict: "post_item_id", ignoreDuplicates: true });
      if (writeError) throw ioError(`recompute save: ${writeError.message}`, writeError, writeStatus);
    }
  }
  await markReady(job.post_id, admin,job.id);
}
