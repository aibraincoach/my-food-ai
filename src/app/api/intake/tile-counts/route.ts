import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {DRINK_TILES, TILE_SIZES} from "@/lib/intake/intake";

export async function GET() {
  const db = await createClient();
  const {data: {user}} = await db.auth.getUser();
  if (!user) return NextResponse.json({error: "Sign in required."}, {status: 401});
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86400000).toISOString();
  const posts = DRINK_TILES.map(() => new Set<string>());
  const volumes = DRINK_TILES.map(() => new Map<number, number>());
  for (let offset = 0; ; offset += 1000) {
    const {data, error} = await db.from("intake_logs").select("label,ml,post_id")
      .eq("user_id", user.id).not("post_id", "is", null).gte("logged_at", since).lte("logged_at", now.toISOString())
      .order("logged_at", {ascending: false}).order("id", {ascending: false}).range(offset, offset + 999);
    if (error) return NextResponse.json({error: "Drink history could not be read."}, {status: 500});
    for (const row of data ?? []) {
      const index = DRINK_TILES.findIndex((tile, index) => TILE_SIZES[index].some(size => row.label === `${tile.name}, ${size.word}`));
      if (index < 0 || !row.post_id || posts[index].has(row.post_id)) continue;
      posts[index].add(row.post_id);
      if (TILE_SIZES[index].some(size => size.ml === row.ml)) volumes[index].set(row.ml, (volumes[index].get(row.ml) ?? 0) + 1);
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  const usualMl = DRINK_TILES.map((tile, index) => [...TILE_SIZES[index]].sort((a, b) =>
    (volumes[index].get(b.ml) ?? 0) - (volumes[index].get(a.ml) ?? 0) || Number(b.ml === tile.ml) - Number(a.ml === tile.ml))[0].ml);
  return NextResponse.json({counts: posts.map(ids => ids.size), usualMl}, {headers: {"Cache-Control": "private, no-store"}});
}
