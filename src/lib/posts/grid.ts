import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { toNumber, type Numeric } from "@/lib/nutrition/totals";

export interface GridPost {
  id: string;
  caption: string;
  status: string;
  photoUrl: string | null;
  calories: number | null;
}

interface GridRow {
  id: string;
  caption: string;
  status: string;
  post_media: { position: number; storage_path: string }[];
  post_items: { item_nutrition: { calories: Numeric } | null }[];
}

// Read with the session client, retaining RLS as well as the explicit owner filter.
// Page through the grid so a user's older posts are not silently omitted.
export async function getProfileGrid(supabase: SupabaseClient, userId: string): Promise<GridPost[]> {
  const posts: GridPost[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("posts")
      .select("id,caption,status,post_media(position,storage_path),post_items(item_nutrition(calories))")
      .eq("user_id", userId)
      .is("post_items.superseded_at", null)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error("Profile posts could not be loaded.");
    const rows = data as unknown as GridRow[];
    posts.push(...await Promise.all(rows.map(async (row) => {
      const first = [...row.post_media].sort((a, b) => a.position - b.position)[0];
      let photoUrl: string | null = null;
      if (first) {
        const dot = first.storage_path.lastIndexOf(".");
        const base = dot < 0 ? first.storage_path : first.storage_path.slice(0, dot);
        try {
          photoUrl = await feedCopyUrl(supabase, `${base}.feed.jpg`);
        } catch {
          // One unavailable private image must not hide the whole post grid.
          photoUrl = null;
        }
      }
      return {
        id: row.id,
        caption: row.caption,
        status: row.status,
        photoUrl,
        calories: row.status === "ready"
          ? row.post_items.reduce((sum, item) => sum + toNumber(item.item_nutrition?.calories), 0)
          : null,
      };
    })));
    if (rows.length < pageSize) return posts;
  }
}
