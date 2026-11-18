import { approximationLabels } from "@/lib/fdc/approximation-metadata";
import {writePendingNames,writePendingKcal} from './pending-items';
import { syncItemDrinks } from "@/lib/intake/drinks-from-items";
import { sendPostPush } from "@/lib/push/send";
import { ioError } from "@/lib/worker/errors";
// One-RPC persist for a finished analysis (item 10). Inserts one
// post_items row per item (source model, mask_path, box), the matching
// item_nutrition row after an FDC lookup, the summary as the first
// post_comments row (author model), and flips the post to ready.
// Zero items is a ready post with no rows: the card reads "No food found".
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveNutritionItems } from "@/lib/fdc/resolve-items";
import { resolveFoodMatchDetailed, traceNutritionReuse, nutritionResolutionBudget } from "@/lib/fdc/match";
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
 await writePendingNames(admin,named.postId,rows.map(row=>row.name),jobId);
 const resolutionBudget=nutritionResolutionBudget();
  const {data:context,error:contextError,status:contextStatus}=await admin.from("posts").select("caption").eq("id",named.postId).abortSignal(resolutionBudget).single();
  if(contextError)throw ioError("Meal context could not be read.",contextError,resolutionBudget.aborted?503:contextStatus);
  const resolved = await resolveNutritionItems(rows,resolutionBudget,async (row,index,signal) => {
    const copied=copiedNutrition?.[index];
    if(copied)await traceNutritionReuse(row.name,copied,"copied",typeof copied.post_item_id==="string"?copied.post_item_id:undefined);
    const match=copied?{food:null,unavailable:null}:await resolveFoodMatchDetailed(admin,row.name,context.caption??"",signal,{approximate:true});
    const scaled = scaleNutrition(match.food, row.portionGrams, match.unavailable);
    const nutritionProgress=copied?.calories??scaled.calories;
    await writePendingKcal(admin,named.postId,index,typeof nutritionProgress==='number'?nutritionProgress:null,jobId);
    return {
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
        food_category: scaled.foodCategory ?? null,
        ...(copied ?? {}),
      },
    };
  });
  items.push(...resolved);
  const totals = sumNutrition(items.map(item=>({...item.nutrition,name:item.name})));
  const approximations=approximationLabels(items.map(item=>({name:item.name,...item.nutrition})));
  const summary = await safeSummary(named.summary, totals, approximations, items.map(item=>({name:item.name,sourceRef:item.nutrition.source_ref})));
  // Owner ruling (Nov 4, #615): a question about a meal the model could still name does not hold
  // the post back. The meal publishes with the named items; the question is kept in posts.question,
  // shown in the Home strip, and sent as the "needs a reply" push. No food found keeps the held route.
  const visibleQuestion = Boolean(named.needsInput && named.needsInput.short === "Clarification needed" && items.length > 0);
  const args = {
    p_job_id: jobId ?? null,
    p_post_id: named.postId,
    p_items: items,
    p_summary: summary,
    p_needs_input: visibleQuestion ? null : named.needsInput ?? null,
  };
  const identificationArgs={...args,
    p_identify_model:named.labelNutrition?null:named.identification?.model??null,
    p_identify_host:named.labelNutrition?null:named.identification?.host??null,
    p_is_label:Boolean(named.labelNutrition),
  };
  // #626: a question beside a published meal commits with the items, the ready flip and the question's
  // comment in one database transaction. A failure leaves none of them, and the job retries cleanly.
  if (visibleQuestion && named.needsInput) {
    const question = named.needsInput;
    const published = await admin.rpc("persist_analysis_with_question", {
      p_post_id: named.postId,
      p_job_id: jobId ?? null,
      p_items: items,
      p_summary: summary,
      p_question: question,
      p_identify_model: identificationArgs.p_identify_model,
      p_identify_host: identificationArgs.p_identify_host,
      p_is_label: identificationArgs.p_is_label,
    });
    if (published.error) throw ioError(`persist: question transaction failed: ${published.error.message}`, published.error, published.status);
    named.questionShown = true;
    // false: a comment arrived first; its queued correction publishes the meal, and no question was written.
    if (published.data !== true) return;
    // The card and the saved meal follow the committed ready flip; a retry of this step re-runs them.
    const ready = await markReady(named.postId, admin, jobId, { notify: false, saveMeal: !named.hasNotEaten });
    if (ready) await sendPostPush(admin, named.postId, question.question);
    return;
  }
  // The wrapper also clears a prior closest-record disclosure when the new
  // analysis is exact; its transaction preserves ordinary historical summaries.
  // #1104, rule 5: one call to the current function (migrations 0051 to 0065). If it is missing or fails, the job
  // fails visibly and retries as any failed job does; it never falls back to an older persistence function.
  const {error,status} = await admin.rpc("persist_approximated_analysis",identificationArgs);
  if (error) {
    throw ioError(`persist: analysis transaction failed: ${error.message}`, error, status);
  }
  if (!named.needsInput) await markReady(named.postId, admin, jobId,{notify:!named.hasNotEaten,saveMeal:!named.hasNotEaten});
}

// #985: after an operator re-analysis, re-match or restore (scripts/numbers) has made the meal ready,
// its saved-meal copy takes the meal's current numbers. The database refuses any other job.
export async function refreshOperatorSavedMeal(admin: SupabaseClient, job: { id: string; post_id: string | null; payload: Record<string, unknown> }): Promise<void> {
  if (!job.post_id || !("operator" in job.payload)) return;
  const { error, status } = await admin.rpc("refresh_operator_saved_meal", { p_post_id: job.post_id, p_job_id: job.id });
  if (error) throw ioError("The saved meal could not be refreshed.", error, status);
}

// Publication clears clarification atomically with ready under the post lock. The stored card is optional:
// a render or upload failure is logged and the meal is marked ready on its nutrition anyway; the live card
// is the fallback. (An outdated card after a failed regeneration is tracked in the backlog.)
export async function markReady(postId: string, admin: SupabaseClient = createAdminClient(), jobId?:string, options: { notify?: boolean;saveMeal?:boolean;timeZone?:string } = {}): Promise<boolean> {
  await syncItemDrinks(admin, postId);
  let ready: boolean;
  try {
    ready = await renderResultsCard(admin, postId, jobId,undefined,options.timeZone);
  } catch (cardError) {
    console.error("results card failed; marking the meal ready without it", postId, cardError instanceof Error ? cardError.message : cardError);
    const { data, error, status } = await admin.rpc("mark_post_ready", { p_post_id: postId, p_job_id: jobId ?? null });
    if (error) throw ioError("Post readiness could not be saved.", error, status);
    ready = data === true;
  }
  if(ready&&options.saveMeal!==false){const {error}=await admin.rpc('save_ready_meal',{p_post_id:postId});if(error)throw ioError('The saved meal could not be recorded.',error);}
  if (ready && options.notify !== false) await sendPostPush(admin, postId);
  return ready;
}
