import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, dayTotalFromMeals, getDays, type FeedDayTotal } from "@/lib/posts/days";
import { sumNutrition } from "@/lib/nutrition/totals";
import type { TodayView } from "@/lib/posts/today-view";

// One read of today's meals. The desktop Today column shows `view`; today's day
// circle on Home shows `total`. Home never reads today's nutrition twice.
export interface TodayRead { view: TodayView; total: FeedDayTotal }

export async function readToday(supabase: SupabaseClient, userId: string, zone: string): Promise<TodayRead> {
  const today = dateInZone(new Date(), zone);
  const [day] = await getDays(supabase, userId, zone, today, today);
  const meals = day?.posts ?? [];
  const posts = meals.map((post) => ({
    id: post.id,
    caption: post.caption,
    eatenAt: post.eatenAt,
    photoUrl: post.photoUrl,
    items: post.items.map((item) => ({ name: item.name })),
    totals: post.totals,
  }));
  return {
    view: { date: today, posts, totals: day?.totals ?? sumNutrition([]) },
    // The same function getDayTotals uses for every other day circle.
    total: dayTotalFromMeals(today, meals),
  };
}

export async function homeToday(supabase: SupabaseClient, userId: string, zone: string): Promise<TodayView> {
  return (await readToday(supabase, userId, zone)).view;
}
