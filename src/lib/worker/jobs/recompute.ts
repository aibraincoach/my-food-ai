import { resolvePortionNutrition } from "@/lib/nutrition/portion";
import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { resolveNutritionItems } from "@/lib/fdc/resolve-items";
import { resolveFoodMatch, traceNutritionReuse, nutritionResolutionBudget } from "@/lib/fdc/match";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { markReady } from "@/lib/pipeline/persist";
import { toNumber } from "@/lib/nutrition/totals";

export default async function recompute(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.post_id) throw new Error("recompute: post is required.");
  const { data: items, error, status: itemsStatus } = await admin.from("current_post_items")
    .select("id,name,portion_grams,portion_text,supersedes").eq("post_id", job.post_id);
  if (error) throw ioError(`recompute items: ${error.message}`, error, itemsStatus);
 const resolutionBudget=nutritionResolutionBudget();
  const {data:context,error:contextError,status:contextStatus}=await admin.from("posts").select("caption").eq("id",job.post_id).abortSignal(resolutionBudget).single();
  if(contextError)throw ioError("Recompute context could not be read.",contextError,resolutionBudget.aborted?503:contextStatus);
  if (items?.length) {
    const { data: existing, error: nutritionError, status: nutritionStatus } = await admin.from("item_nutrition")
      .select("post_item_id,source_ref").in("post_item_id", items.map((item) => item.id)).abortSignal(resolutionBudget);
    if (nutritionError) throw ioError(`recompute nutrition: ${nutritionError.message}`, nutritionError, nutritionStatus);
    const complete = new Map((existing ?? []).map((row) => [row.post_item_id,row]));
    const resolved = await resolveNutritionItems(items,resolutionBudget,async (item,_index,signal) => {
      if (complete.has(item.id)) {
        await traceNutritionReuse(item.name,complete.get(item.id)!,"existing_item",item.id);
        return null;
      }
      // Resolve all item data before issuing the one atomic nutrition write.
      const retained = await resolvePortionNutrition(admin, job.post_id!, item.supersedes, item.name, item.portion_grams, item.portion_text,signal);
      if (retained) return {...retained,post_item_id:item.id};
      const food = await resolveFoodMatch(admin,item.name,context.caption??"",signal);
      const n = scaleNutrition(food, item.portion_grams == null ? null : toNumber(item.portion_grams));
      return {
        post_item_id: item.id, calories: n.calories, protein_g: n.proteinG,
        carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG,
        sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef,
      };
    });
    const writes=resolved.filter(row=>row!==null);
    if(writes.length){
      const {error:writeError,status:writeStatus}=await admin.from("item_nutrition")
        .upsert(writes,{onConflict:"post_item_id",ignoreDuplicates:true});
      if(writeError)throw ioError(`recompute save: ${writeError.message}`,writeError,writeStatus);
    }
  }
  await markReady(job.post_id, admin,job.id);
}
