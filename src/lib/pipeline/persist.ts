// One-RPC persist for a finished analysis (item 10). Inserts one
// post_items row per item (source model, mask_path, box), the matching
// item_nutrition row after an FDC lookup, the summary as the first
// post_comments row (author model), and flips the post to ready.
// Zero items is a ready post with no rows: the card reads "No food found".
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods } from "@/lib/fdc/client";
import {
  chooseBestMatch,
  scaleNutrition,
} from "@/lib/fdc/nutrients";
import type { NamedPost } from "./analyze";

interface InsertedItem {
  id: string;
}

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
  for (const row of rows) {
    const { data: inserted, error: itemError } = await admin
      .from("post_items")
      .insert({
        post_id: named.postId,
        name: row.name,
        portion_text: row.portionText,
        portion_grams: row.portionGrams,
        box: row.box,
        mask_path: row.maskPath,
        confidence: row.confidence,
        source: "model",
      })
      .select("id")
      .single<InsertedItem>();
    if (itemError || !inserted) {
      throw new Error(
        `persist: post_items insert failed: ${itemError?.message ?? "no row."}`
      );
    }
    const foods = await searchFoods(admin, row.name);
    const scaled = scaleNutrition(
      chooseBestMatch(foods),
      row.portionGrams
    );
    const { error: nutritionError } = await admin
      .from("item_nutrition")
      .insert({
        post_item_id: inserted.id,
        calories: scaled.calories,
        protein_g: scaled.proteinG,
        carbs_g: scaled.carbsG,
        fat_g: scaled.fatG,
        fibre_g: scaled.fibreG,
        sugar_g: scaled.sugarG,
        sodium_mg: scaled.sodiumMg,
        micronutrients: scaled.micronutrients,
        source_ref: scaled.sourceRef,
      });
    if (nutritionError) {
      throw new Error(
        `persist: item_nutrition insert failed: ${nutritionError.message}`
      );
    }
  }
  const { error: commentError } = await admin.from("post_comments").insert({
    post_id: named.postId,
    author: "model",
    body: named.summary,
  });
  if (commentError) {
    throw new Error(
      `persist: summary comment insert failed: ${commentError.message}`
    );
  }
  const { error: statusError } = await admin
    .from("posts")
    .update({ status: "ready" })
    .eq("id", named.postId);
  if (statusError) {
    throw new Error(
      `persist: ready update failed: ${statusError.message}`
    );
  }
}
