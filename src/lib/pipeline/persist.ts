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
  _priorNutrition?: unknown,
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
  for (const row of rows) {
    const foods = await searchFoods(admin, row.name);
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
      },
    });
  }
  const totals = Object.fromEntries(["calories", "protein_g", "carbs_g", "fat_g"].map((key) => {
    const values = items.map((item) => item.nutrition[key as keyof ConsumedTotals]);
    return [key, values.some((value) => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0)];
  })) as ConsumedTotals;
  const summary = await safeSummary(named.summary, totals);
  const { error, status } = await admin.rpc("persist_owned_analysis", {
    p_job_id: jobId ?? null,
    p_post_id: named.postId,
    p_items: items,
    p_summary: summary,
  });
  if (error) {
    throw ioError(`persist: analysis transaction failed: ${error.message}`, error, status);
  }
  await markReady(named.postId, admin,jobId);
}

// The shared application completion hook. Stored cards and push attach here.
// The meal becomes ready on its nutrition alone. The stored card is optional: a render or upload failure
// never fails a meal whose analysis is complete. It drops the old card (which would show outdated numbers),
// so the feed falls back to the live nutrition, and queues card maintenance (a retriable card_backfill job).
// The card_backfill job itself passes requireCard so a failed or rejected publication is retried.
export async function markReady(postId: string, admin: SupabaseClient = createAdminClient(),jobId?:string,options: { requireCard?: boolean } = {}): Promise<boolean> {
  const { data, error, status } = await admin.rpc("mark_post_ready", { p_post_id: postId,p_job_id:jobId??null });
  if (error) throw ioError("Post readiness could not be saved.", error, status);
  if (data !== true) return false;
  let published = false;
  try {
    published = await renderResultsCard(admin, postId, jobId);
  } catch (cardError) {
    if (options.requireCard) throw cardError;
    await dropStaleCard(admin, postId);
    await admin.rpc("enqueue_card_backfill").then(() => undefined, () => undefined);
    return true;
  }
  if (!published && options.requireCard) {
    // Rejected publication: superseded work is fine, but a ready meal still without a card must be retried.
    const card = await admin.from("post_media").select("id").eq("post_id", postId).eq("kind", "card").maybeSingle();
    if (!card.error && !card.data) throw Object.assign(new Error("Card was not published."), { status: 503 });
  }
  return true;
}

async function dropStaleCard(admin: SupabaseClient, postId: string): Promise<void> {
  try {
    const { data } = await admin.from("post_media").select("storage_path").eq("post_id", postId).eq("kind", "card").maybeSingle();
    if (!data) return;
    await admin.from("post_media").delete().eq("post_id", postId).eq("kind", "card");
    // Only generated card objects of this meal are ever removed.
    if (typeof data.storage_path === "string" && data.storage_path.includes(`/${postId}/cards/`) && data.storage_path.endsWith("/card.png")) {
      await admin.storage.from("media").remove([data.storage_path]);
    }
  } catch {
    // Best effort: the backfill job below still replaces the card.
  }
}
