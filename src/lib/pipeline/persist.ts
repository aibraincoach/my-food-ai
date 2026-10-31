import { sendPostPush } from "@/lib/push/send";
import { ioError } from "@/lib/worker/errors";
// One-RPC persist for a finished analysis (item 10). Inserts one
// post_items row per item (source model, mask_path, box), the matching
// item_nutrition row after an FDC lookup, the summary as the first
// post_comments row (author model), and flips the post to ready.
// Zero items is a ready post with no rows: the card reads "No food found".
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveFoodMatch, traceNutritionReuse, nutritionResolutionBudget } from "@/lib/fdc/match";
import { sumNutrition } from "@/lib/nutrition/totals";
import {
  scaleNutrition,
} from "@/lib/fdc/nutrients";
import { renderResultsCard } from "./results-card";
import { safeSummary, type ConsumedTotals } from "./wording";
import type { NamedPost } from "./analyze";

export async function persistAnalysis(
  admin: SupabaseClient,
  named: NamedPost,
  copiedNutrition?: Record<string, unknown>[],
  jobId?: string
): Promise<void> {
  const rows: {
    name: string;
    portionText: string | null;
    portionGrams: number | null;
    confidence: number | null;
    box: unknown;
    maskPath: string | null;
  }[] = [];
  for (const region of named.regions) {
    if (!region.item) continue;
    rows.push({
      name: region.item.name,
      portionText: region.item.portionText,
      portionGrams: region.item.portionGrams,
      confidence: region.item.confidence,
      box: region.box,
      maskPath: region.maskPath,
    });
  }
  for (const item of named.captionOnly) {
    rows.push({
      name: item.name,
      portionText: item.portionText,
      portionGrams: item.portionGrams,
      confidence: item.confidence,
      box: null,
      maskPath: null,
    });
  }
  // Complete every external lookup before changing the post. A lookup failure
  // leaves the previous analysis intact; the RPC commits the whole replacement.
  const items: {
    name: string; portion_text: string | null; portion_grams: number | null;
    box: unknown; mask_path: string | null; confidence: number | null;
    nutrition: ConsumedTotals & { fibre_g: number | null; sugar_g: number | null; sodium_mg: number | null; micronutrients: unknown; source_ref: string | null };
  }[] = [];
 const resolutionBudget=nutritionResolutionBudget();
  const {data:context,error:contextError,status:contextStatus}=await admin.from("posts").select("caption").eq("id",named.postId).abortSignal(resolutionBudget).single();
  if(contextError)throw ioError("Meal context could not be read.",contextError,resolutionBudget.aborted?503:contextStatus);
  for (const [index,row] of rows.entries()) {
    const copied=copiedNutrition?.[index];
    if(copied)await traceNutritionReuse(row.name,copied,"copied",typeof copied.post_item_id==="string"?copied.post_item_id:undefined);
    const food=copied?null:await resolveFoodMatch(admin,row.name,context.caption??"",resolutionBudget);
    const scaled = scaleNutrition(food, row.portionGrams);
    items.push({
      name: row.name,
      portion_text: row.portionText,
      portion_grams: row.portionGrams,
      box: row.box,
      mask_path: row.maskPath,
      confidence: row.confidence,
      nutrition: {
        calories: scaled.calories,
        protein_g: scaled.proteinG,
        carbs_g: scaled.carbsG,
        fat_g: scaled.fatG,
        fibre_g: scaled.fibreG,
        sugar_g: scaled.sugarG,
        sodium_mg: scaled.sodiumMg,
        micronutrients: scaled.micronutrients,
        source_ref: scaled.sourceRef,
        ...(copied ?? {}),
      },
    });
  }
  const totals = sumNutrition(items.map(item=>({...item.nutrition,name:item.name})));
  const summary = await safeSummary(named.summary, totals);
  const { error, status } = await admin.rpc("persist_owned_analysis", {
    p_job_id: jobId ?? null,
    p_post_id: named.postId,
    p_items: items,
    p_summary: summary,
    p_needs_input: named.needsInput ?? null,
  });
  if (error) {
    throw ioError(`persist: analysis transaction failed: ${error.message}`, error, status);
  }
  if (!named.needsInput) await markReady(named.postId, admin, jobId);
}

// Publication clears clarification atomically with ready under the post lock. The stored card is optional:
// a render or upload failure is logged and the meal is marked ready on its nutrition anyway; the live card
// is the fallback. (An outdated card after a failed regeneration is tracked in the backlog.)
export async function markReady(postId: string, admin: SupabaseClient = createAdminClient(), jobId?:string, options: { notify?: boolean } = {}): Promise<boolean> {
  let ready: boolean;
  try {
    ready = await renderResultsCard(admin, postId, jobId);
  } catch (cardError) {
    console.error("results card failed; marking the meal ready without it", postId, cardError instanceof Error ? cardError.message : cardError);
    const { data, error, status } = await admin.rpc("mark_post_ready", { p_post_id: postId, p_job_id: jobId ?? null });
    if (error) throw ioError("Post readiness could not be saved.", error, status);
    ready = data === true;
  }
  if (ready && options.notify !== false) await sendPostPush(admin, postId);
  return ready;
}
