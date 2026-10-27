import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { getCurrentItems, sumNutrition } from "@/lib/nutrition/totals";

export interface GridPost {
  id: string;
  caption: string;
  photoUrl: string | null;
  calories: number | null;
}

interface GridRow {
  id: string;
  caption: string;
  status: string;
  post_media: { position: number; storage_path: string; kind: "photo" | "card" }[];
}

// Read with the session client, retaining RLS as well as the explicit owner filter.
// Page through the grid so a user's older posts are not silently omitted.
export async function getProfileGrid(supabase: SupabaseClient, userId: string): Promise<GridPost[]> {
  const posts: GridPost[] = [];
  const pageSize = 100;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("posts")
      .select("id,caption,status,post_media(position,storage_path,kind)")
      .eq("user_id", userId)
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
        photoUrl = await feedCopyUrl(supabase, first.kind === "card" ? first.storage_path : `${base}.feed.jpg`);
      }
      return {
        id: row.id,
        caption: row.caption,
        photoUrl,
        calories: row.status === "ready"
          ? (sumNutrition(await getCurrentItems(supabase, row.id))).calories
          : null,
      };
    })));
    if (rows.length < pageSize) return posts;
  }
}
