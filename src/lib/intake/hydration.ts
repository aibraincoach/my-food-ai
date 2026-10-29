import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, shiftDay, validZone } from "@/lib/posts/days";
import { getCurrentItems, toNumber } from "@/lib/nutrition/totals";

export interface DrinkRow {
  kind: "water" | "caffeine";
  amount: number;
  logged_at: string;
  ml: number | null;
  label: string | null;
  post_id: string | null;
}
export interface HydrationRecord { drinksMl: number; foodMl: number; totalMl: number }
export interface DrinkCardData extends HydrationRecord { ml: number; label: string; caffeineMg: number }

export async function drinksForDay(db: SupabaseClient, userId: string, day: string, zone: string): Promise<DrinkRow[]> {
  const rows: DrinkRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("intake_logs").select("kind,amount,logged_at,ml,label,post_id")
      .eq("user_id", userId).gte("logged_at", `${shiftDay(day, -1)}T00:00:00Z`)
      .lt("logged_at", `${shiftDay(day, 2)}T00:00:00Z`)
      .order("logged_at").order("id").range(offset, offset + 999);
    if (error) throw new Error("Drinks could not be read.");
    rows.push(...((data ?? []) as DrinkRow[]).filter(row => dateInZone(row.logged_at, validZone(zone)) === day));
    if ((data?.length ?? 0) < 1000) break;
  }
  return rows;
}

// Explicit db dependency lets the same read retain owner RLS in routes and use the admin in the renderer.
export async function hydrationSoFar(db: SupabaseClient, userId: string, day: string, tz: string, upToEatenAt: string): Promise<HydrationRecord> {
  const zone = validZone(tz);
  const cutoff = new Date(upToEatenAt).getTime();
  if (!Number.isFinite(cutoff)) throw new Error("Invalid hydration time.");
  const rows = (await drinksForDay(db, userId, day, zone)).filter(row => new Date(row.logged_at).getTime() <= cutoff);
  const drinksMl = rows.reduce((total, row) => total + (row.ml ?? (row.kind === "water" ? row.amount : 0)), 0);
  // Exclude every linked drink, including a moved post whose intake time differs from its eaten-at time.
  const drinkPosts = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("intake_logs").select("post_id").eq("user_id", userId)
      .not("post_id", "is", null).order("id").range(offset, offset + 999);
    if (error) throw new Error("Drink links could not be read.");
    for (const row of data ?? []) drinkPosts.add(row.post_id);
    if ((data?.length ?? 0) < 1000) break;
  }
  let foodMl = 0;
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await db.from("posts").select("id,eaten_at").eq("user_id", userId).eq("status", "ready")
      .gte("eaten_at", `${shiftDay(day, -1)}T00:00:00Z`).lte("eaten_at", upToEatenAt)
      .order("eaten_at").order("id").range(offset, offset + 99);
    if (error) throw new Error("Food hydration could not be read.");
    for (const post of data ?? []) {
      if (drinkPosts.has(post.id) || dateInZone(post.eaten_at, zone) !== day) continue;
      for (const item of await getCurrentItems(db, post.id)) {
        const nutrient = item.micronutrients.find(n => n.nutrientId === 1051 && n.basis === "portion");
        if (nutrient && (nutrient.unitName ?? nutrient.unit)?.toLowerCase() === "g") foodMl += Math.max(0, toNumber(nutrient.value));
      }
    }
    if ((data?.length ?? 0) < 100) break;
  }
  return { drinksMl: Math.round(drinksMl), foodMl: Math.round(foodMl), totalMl: Math.round(drinksMl + foodMl) };
}

export async function getDrinkCardData(db: SupabaseClient, userId: string, postId: string, tz: string): Promise<DrinkCardData | null> {
  const { data: drink, error } = await db.from("intake_logs").select("kind,amount,ml,label,logged_at")
    .eq("user_id", userId).eq("post_id", postId).maybeSingle();
  if (error) throw new Error("Drink could not be read.");
  if (!drink || drink.ml == null || !drink.label) return null;
  const { data: post, error: postError } = await db.from("posts").select("eaten_at").eq("user_id", userId).eq("id", postId).maybeSingle();
  if (postError) throw new Error("Drink time could not be read.");
  if (!post) return null;
  const zone = validZone(tz);
  const hydration = await hydrationSoFar(db, userId, dateInZone(post.eaten_at, zone), zone, post.eaten_at);
  return { ...hydration, ml: drink.ml, label: drink.label, caffeineMg: drink.kind === "caffeine" ? drink.amount : 0 };
}
