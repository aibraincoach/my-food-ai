import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeStoredNutrition, sumNutrition, type NutritionRow } from "@/lib/nutrition/totals";
import type { CardNutritionItem } from "@/components/LiveNutritionCard";

export interface GridPost {
  id: string;
  caption: string;
  status: string;
  eaten_at: string;
  photoUrl: string | null;
  calories: number | null;
  items: CardNutritionItem[];
  isDrink: boolean;
}
interface GridRow {
  id: string; caption: string; status: string; eaten_at: string;
  post_media: { position: number; storage_path: string; kind: "photo" | "card" }[];
}
interface GridItem { id: string; post_id: string; name: string; portion_grams: string | number | null }
const NUTRITION_COLUMNS = "post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref";

// Read current rows for an entire page, then nutrition in bounded batches. No
// generated card bitmap is used as a source for the numbers shown in the grid.
async function gridNutrition(db: SupabaseClient, postIds: string[]): Promise<Map<string, CardNutritionItem[]>> {
  const output = new Map<string, CardNutritionItem[]>(postIds.map(id => [id, []]));
  if (!postIds.length) return output;
  for (let offset = 0;; offset += 200) {
    const { data, error } = await db.from("current_post_items").select("id,post_id,name,portion_grams")
      .in("post_id", postIds).order("id").range(offset, offset + 199);
    if (error) throw new Error("Profile nutrition items could not be read.");
    const items = (data ?? []) as GridItem[];
    for (let start = 0; start < items.length; start += 100) {
      const chunk = items.slice(start, start + 100);
      const { data: nutrition, error: nutritionError } = await db.from("item_nutrition").select(NUTRITION_COLUMNS).in("post_item_id", chunk.map(item => item.id));
      if (nutritionError) throw new Error("Profile nutrition could not be read.");
      const byId = new Map((nutrition as NutritionRow[] | null ?? []).map(row => [row.post_item_id, row]));
      for (const item of chunk) {
        const row = byId.get(item.id);
        const normalized = row ? normalizeStoredNutrition(row, item.portion_grams) : null;
        output.get(item.post_id)?.push({ name: item.name, portion_grams: item.portion_grams,
          calories: normalized?.calories ?? null, protein_g: normalized?.protein_g ?? null,
          carbs_g: normalized?.carbs_g ?? null, fat_g: normalized?.fat_g ?? null,
          fibre_g: normalized?.fibre_g ?? null, sugar_g: normalized?.sugar_g ?? null, sodium_mg: normalized?.sodium_mg ?? null });
      }
    }
    if (items.length < 200) return output;
  }
}

// The session client preserves RLS. Only actual photo derivatives are signed;
// ready posts without a photo render current calculated nutrition in the client.
export async function getProfileGrid(db: SupabaseClient, userId: string): Promise<GridPost[]> {
  const posts: GridPost[] = [];
  for (let offset = 0;; offset += 100) {
    const { data, error } = await db.from("posts").select("id,caption,status,eaten_at,post_media(position,storage_path,kind)")
      .eq("user_id", userId).order("eaten_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 99);
    if (error) throw new Error("Profile posts could not be loaded.");
    const rows = (data ?? []) as unknown as GridRow[];
    const photoPaths = new Map<string, string>();
    for (const row of rows) {
      const photo = [...row.post_media].filter(media => media.kind === "photo").sort((a, b) => a.position - b.position)[0];
      if (photo) {
        const dot = photo.storage_path.lastIndexOf(".");
        photoPaths.set(row.id, `${dot < 0 ? photo.storage_path : photo.storage_path.slice(0, dot)}.feed.jpg`);
      }
    }
    const signed = new Map<string, string>();
    if (photoPaths.size) {
      const { data: urls, error: signError } = await db.storage.from("media").createSignedUrls([...new Set(photoPaths.values())], 3600);
      if (!signError) for (const url of urls ?? []) if (url.path && url.signedUrl && !url.error) signed.set(url.path, url.signedUrl);
    }
    const needsNutrition = rows.filter(row => row.status === "ready" && !signed.has(photoPaths.get(row.id) ?? "")).map(row => row.id);
    const nutrition = await gridNutrition(db, needsNutrition);
    const drinkIds = new Set<string>();
    if (needsNutrition.length) {
      const { data: drinks, error: drinkError } = await db.from("intake_logs").select("post_id").in("post_id", needsNutrition);
      if (drinkError) throw new Error("Profile drink records could not be read.");
      for (const drink of drinks ?? []) if (drink.post_id) drinkIds.add(drink.post_id);
    }
    for (const row of rows) {
      const items = nutrition.get(row.id) ?? [];
      posts.push({ id: row.id, caption: row.caption, status: row.status, eaten_at: row.eaten_at,
        photoUrl: signed.get(photoPaths.get(row.id) ?? "") ?? null, items, isDrink: drinkIds.has(row.id),
        calories: row.status === "ready" && nutrition.has(row.id) ? sumNutrition(items).calories : null });
    }
    if (rows.length < 100) return posts;
  }
}
