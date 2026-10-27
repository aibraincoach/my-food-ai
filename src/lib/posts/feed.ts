import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { normalizeStoredNutrition, type StoredNutrient, type Numeric } from "@/lib/nutrition/totals";

export type PostStatus =
  | "queued"
  | "processing"
  | "needs_input"
  | "ready"
  | "failed";

export interface FeedItem {
  id: string;
  name: string;
  portion_text: string | null;
  portion_grams: Numeric;
  calories: Numeric;
  protein_g: Numeric;
  carbs_g: Numeric;
  fat_g: Numeric;
  fibre_g: Numeric;
  sugar_g: Numeric;
  sodium_mg: Numeric;
}

export interface FeedPost {
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
  photoUrl: string | null;
  slides: {url:string;kind?:"photo"|"card"}[];
  created_at: string;
  items: FeedItem[];
}

export const FEED_PAGE_SIZE = 20;

const UNSETTLED: PostStatus[] = ["queued", "processing", "needs_input"];

export function isSettled(status: PostStatus): boolean {
  return !UNSETTLED.includes(status);
}

// post_media stores the original shot; the feed copy shares the path
// with ".feed" inserted before the extension (item 5).
function feedPathFor(storagePath: string): string {
  const dot = storagePath.lastIndexOf(".");
  const base = dot < 0 ? storagePath : storagePath.slice(0, dot);
  return `${base}.feed.jpg`;
}

interface PostRow {
  created_at: string;
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
}


interface ItemRow {
  id: string;
  name: string;
  portion_text: string | null;
  portion_grams: Numeric;
}

interface NutritionRow {
  micronutrients: StoredNutrient[];
  source_ref: string | null;
  post_item_id: string;
  calories: Numeric;
  protein_g: Numeric;
  carbs_g: Numeric;
  fat_g: Numeric;
  fibre_g: Numeric;
  sugar_g: Numeric;
  sodium_mg: Numeric;
}

async function toFeedPost(
  supabase: SupabaseClient,
  row: PostRow
): Promise<FeedPost> {
  const { data: media, error: mediaError } = await supabase.from("post_media")
    .select("storage_path").eq("post_id",row.id).order("position");
  if(mediaError) throw new Error(mediaError.message);
  const slides = (await Promise.all((media ?? []).map(async (entry) => {
    try { return {url: await feedCopyUrl(supabase,feedPathFor(entry.storage_path)),kind:"photo" as const}; }
    catch { return null; }
  }))).filter((entry): entry is {url:string;kind:"photo"} => entry !== null);
  const photoUrl = slides[0]?.url ?? null;

  let items: FeedItem[] = [];
  if (row.status === "ready") {
    const { data: itemRows } = await supabase
      .from("current_post_items")
      .select("id,name,portion_text,portion_grams")
      .eq("post_id", row.id)
      .order("created_at", { ascending: true });
    const typed = (itemRows ?? []) as ItemRow[];
    if (typed.length > 0) {
      const { data: nutritionRows } = await supabase
        .from("item_nutrition")
        .select(
          "post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref"
        )
        .in(
          "post_item_id",
          typed.map((item) => item.id)
        );
      const byItem = new Map<string, NutritionRow>();
      for (const nutrition of (nutritionRows ?? []) as NutritionRow[]) {
        byItem.set(nutrition.post_item_id, nutrition);
      }
      items = typed.map((item) => {
        const stored = byItem.get(item.id);
        const nutrition = stored ? normalizeStoredNutrition(stored, item.portion_grams) : null;
        return {
          id: item.id,
          name: item.name,
          portion_text: item.portion_text,
          portion_grams: item.portion_grams,
          calories: nutrition?.calories ?? null,
          protein_g: nutrition?.protein_g ?? null,
          carbs_g: nutrition?.carbs_g ?? null,
          fat_g: nutrition?.fat_g ?? null,
          fibre_g: nutrition?.fibre_g ?? null,
          sugar_g: nutrition?.sugar_g ?? null,
          sodium_mg: nutrition?.sodium_mg ?? null,
        };
      });
    }
  }

  return {
    id: row.id,
    caption: row.caption,
    eaten_at: row.eaten_at,
    status: row.status,
    photoUrl,
    slides,
    created_at: row.created_at,
    items,
  };
}

// The user's own posts, newest first, 20 per page with no cursor yet.
export async function getFeed(
  supabase: SupabaseClient,
  userId: string,
  before: string | null = null
): Promise<{posts: FeedPost[]; nextCursor:string|null}> {
  let query = supabase
    .from("posts")
    .select("id,caption,eaten_at,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);
  if(before) query = query.lt("created_at",before);
  const {data,error} = await query;
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as PostRow[];
  const page = rows.slice(0,FEED_PAGE_SIZE);
  return {posts:await Promise.all(page.map((row)=>toFeedPost(supabase,row))), nextCursor: rows.length>FEED_PAGE_SIZE ? page.at(-1)!.created_at : null};
}

// One card's worth of data, used for realtime refreshes and polling.
export async function getPostCard(
  supabase: SupabaseClient,
  postId: string
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id,caption,eaten_at,status,created_at")
    .eq("id", postId)
    .maybeSingle<PostRow>();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return toFeedPost(supabase, data);
}
