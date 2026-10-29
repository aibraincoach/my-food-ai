import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, shiftDay, validZone } from "@/lib/posts/days";
import { normalizeStoredNutrition, toNumber, type NutritionRow } from "@/lib/nutrition/totals";

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

type HydrationTimeline = { drinks: DrinkRow[]; foods: { eatenAt: string; waterMl: number }[] };

// One day's timeline is shared by all drink cards requested for that day.
async function hydrationTimeline(db: SupabaseClient, userId: string, day: string, tz: string, upToEatenAt: string): Promise<HydrationTimeline> {
  const zone = validZone(tz);
  if (!Number.isFinite(new Date(upToEatenAt).getTime())) throw new Error("Invalid hydration time.");
  const drinks = await drinksForDay(db, userId, day, zone);
  const foods: HydrationTimeline["foods"] = [];
  for (let offset = 0; ; offset += 100) {
    const { data: posts, error } = await db.from("posts").select("id,eaten_at").eq("user_id", userId).eq("status", "ready")
      .gte("eaten_at", `${shiftDay(day, -1)}T00:00:00Z`).lte("eaten_at", upToEatenAt)
      .order("eaten_at").order("id").range(offset, offset + 99);
    if (error) throw new Error("Food hydration could not be read.");
    const candidates = (posts ?? []).filter(post => dateInZone(post.eaten_at, zone) === day);
    if (candidates.length) {
      // Match links by candidate post id, not intake time: moved drink posts remain excluded,
      // without scanning the user's lifetime intake history.
      const { data: links, error: linkError } = await db.from("intake_logs").select("post_id")
        .eq("user_id", userId).in("post_id", candidates.map(post => post.id));
      if (linkError) throw new Error("Drink links could not be read.");
      const drinkIds = new Set((links ?? []).map(row => row.post_id));
      const meals = candidates.filter(post => !drinkIds.has(post.id));
      const byPost = new Map(meals.map(post => [post.id, { eatenAt: post.eaten_at as string, waterMl: 0 }]));
      if (meals.length) {
        // Page every current item rather than one getCurrentItems call per post. Nutrition reads
        // are bounded batches too; legacy nutrient arrays retain their normalization semantics.
        for (let itemOffset = 0; ; itemOffset += 100) {
          const { data: items, error: itemError } = await db.from("current_post_items").select("id,post_id,portion_grams")
            .in("post_id", meals.map(post => post.id)).order("id").range(itemOffset, itemOffset + 99);
          if (itemError) throw new Error("Food hydration items could not be read.");
          if (items?.length) {
            const { data: nutrition, error: nutritionError } = await db.from("item_nutrition")
              .select("post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref")
              .in("post_item_id", items.map(item => item.id));
            if (nutritionError) throw new Error("Food water could not be read.");
            const byItem = new Map((nutrition as NutritionRow[] | null ?? []).map(row => [row.post_item_id, row]));
            for (const item of items) {
              const stored = byItem.get(item.id);
              const contribution = byPost.get(item.post_id);
              if (!stored || !contribution) continue;
              const nutrient = normalizeStoredNutrition(stored, item.portion_grams).micronutrients
                .find(n => n.nutrientId === 1051 && n.basis === "portion");
              if (nutrient && (nutrient.unitName ?? nutrient.unit)?.toLowerCase() === "g") contribution.waterMl += Math.max(0, toNumber(nutrient.value));
            }
          }
          if ((items?.length ?? 0) < 100) break;
        }
      }
      foods.push(...byPost.values());
    }
    if ((posts?.length ?? 0) < 100) break;
  }
  return { drinks, foods };
}

function hydrationAt(timeline: HydrationTimeline, upToEatenAt: string): HydrationRecord {
  const cutoff = new Date(upToEatenAt).getTime();
  const drinksMl = timeline.drinks.filter(row => new Date(row.logged_at).getTime() <= cutoff)
    .reduce((total, row) => total + (row.ml ?? (row.kind === "water" ? row.amount : 0)), 0);
  const foodMl = timeline.foods.filter(row => new Date(row.eatenAt).getTime() <= cutoff).reduce((total, row) => total + row.waterMl, 0);
  return { drinksMl: Math.round(drinksMl), foodMl: Math.round(foodMl), totalMl: Math.round(drinksMl + foodMl) };
}

// Explicit db dependency retains owner RLS in routes and supports the admin renderer.
export async function hydrationSoFar(db: SupabaseClient, userId: string, day: string, tz: string, upToEatenAt: string): Promise<HydrationRecord> {
  return hydrationAt(await hydrationTimeline(db, userId, day, tz, upToEatenAt), upToEatenAt);
}

export async function getDrinkCardsData(db: SupabaseClient, userId: string, postIds: string[], tz: string): Promise<Record<string, DrinkCardData | null>> {
  const output: Record<string, DrinkCardData | null> = Object.fromEntries(postIds.map(id => [id, null]));
  if (!postIds.length) return output;
  const { data: drinks, error } = await db.from("intake_logs").select("kind,amount,ml,label,post_id")
    .eq("user_id", userId).in("post_id", postIds);
  if (error) throw new Error("Drinks could not be read.");
  const eligible = (drinks ?? []).filter(row => row.post_id && row.ml != null && row.label);
  if (!eligible.length) return output;
  const { data: posts, error: postError } = await db.from("posts").select("id,eaten_at").eq("user_id", userId).in("id", eligible.map(row => row.post_id));
  if (postError) throw new Error("Drink times could not be read.");
  const zone = validZone(tz);
  const byDay = new Map<string, { id: string; eaten_at: string }[]>();
  for (const post of posts ?? []) {
    const day = dateInZone(post.eaten_at, zone);
    byDay.set(day, [...(byDay.get(day) ?? []), post]);
  }
  for (const [day, dayPosts] of byDay) {
    const latest = dayPosts.reduce((a, b) => new Date(a.eaten_at) > new Date(b.eaten_at) ? a : b).eaten_at;
    const timeline = await hydrationTimeline(db, userId, day, zone, latest);
    for (const post of dayPosts) {
      const drink = eligible.find(row => row.post_id === post.id)!;
      output[post.id] = { ...hydrationAt(timeline, post.eaten_at), ml: drink.ml, label: drink.label, caffeineMg: drink.kind === "caffeine" ? drink.amount : 0 };
    }
  }
  return output;
}

export async function getDrinkCardData(db: SupabaseClient, userId: string, postId: string, tz: string): Promise<DrinkCardData | null> {
  return (await getDrinkCardsData(db, userId, [postId], tz))[postId];
}
