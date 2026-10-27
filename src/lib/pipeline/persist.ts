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
import type { NamedPost } from "./analyze";

export async function persistAnalysis(
  admin: SupabaseClient,
  named: NamedPost
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
  const items = [];
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
  const { error, status } = await admin.rpc("persist_analysis", {
    p_post_id: named.postId,
    p_items: items,
    p_summary: named.summary,
  });
  if (error) {
    throw ioError(`persist: analysis transaction failed: ${error.message}`, error, status);
  }
  await markReady(named.postId, admin);
}

// The shared application completion hook. Stored cards and push attach here.
export async function markReady(postId: string, admin: SupabaseClient = createAdminClient()): Promise<boolean> {
  const { data, error, status } = await admin.rpc("mark_post_ready", { p_post_id: postId });
  if (error) throw ioError("Post readiness could not be saved.", error, status);
  return data === true;
}
