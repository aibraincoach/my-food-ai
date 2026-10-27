import { sendPostPush } from "@/lib/push/send";
import { ioError } from "@/lib/worker/errors";
// One-RPC persist for a finished analysis (item 10). Inserts one
// post_items row per item (source model, mask_path, box), the matching
// item_nutrition row after an FDC lookup, the summary as the first
// post_comments row (author model), and flips the post to ready.
// Zero items is a ready post with no rows: the card reads "No food found".
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods } from "@/lib/fdc/client";
import {
  chooseBestMatch,
  scaleNutrition,
} from "@/lib/fdc/nutrients";
import { renderResultsCard } from "./results-card";
import { safeSummary, type ConsumedTotals } from "./wording";
import type { NamedPost } from "./analyze";

export async function persistAnalysis(
  admin: SupabaseClient,
  named: NamedPost,
  copiedNutrition?: Record<string, unknown>[]
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
  for (const [index,row] of rows.entries()) {
    const foods = copiedNutrition ? [] : await searchFoods(admin, row.name);
    const scaled = scaleNutrition(chooseBestMatch(foods), row.portionGrams);
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
        ...(copiedNutrition?.[index] ?? {}),
      },
    });
  }
  const totals = Object.fromEntries(["calories", "protein_g", "carbs_g", "fat_g"].map((key) => {
    const values = items.map((item) => item.nutrition[key as keyof ConsumedTotals]);
    return [key, values.some((value) => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0)];
  })) as ConsumedTotals;
  const summary = await safeSummary(named.summary, totals);
  const { error, status } = await admin.rpc(named.needsInput ? "persist_analysis_question" : "persist_analysis", {
    p_post_id: named.postId,
    p_items: items,
    p_summary: summary,
    ...(named.needsInput ? {p_question:named.needsInput} : {}),
  });
  if (error) {
    throw ioError(`persist: analysis transaction failed: ${error.message}`, error, status);
  }
  if (!named.needsInput) await markReady(named.postId, admin);
}

// The shared application completion hook. Stored cards and push attach here.
export async function markReady(postId: string, admin: SupabaseClient = createAdminClient()): Promise<boolean> {
  const state = await admin.from("posts").select("status").eq("id",postId).maybeSingle();
  if(state.error)throw ioError("Could not read completion state.",state.error,state.status);
  if(!state.data || state.data.status === "needs_input")return false;
  const ready = await renderResultsCard(admin, postId);
  if (ready) {
    const {error,status}=await admin.from("posts").update({needs_input:null}).eq("id",postId).eq("status","ready");
    if(error)throw ioError("Could not clear clarification.",error,status);
    await sendPostPush(admin, postId);
  }
  return ready;
}
