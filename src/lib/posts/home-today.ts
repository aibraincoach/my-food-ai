import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, getDays } from "@/lib/posts/days";
import { sumNutrition, type MealTotals } from "@/lib/nutrition/totals";
import type { TodayView } from "@/lib/posts/today-view";

interface TodaySummaryPayload {
  date?: string;
  kcal?: number | string | null;
  protein_g?: number | string | null;
  carbs_g?: number | string | null;
  fat_g?: number | string | null;
  posted?: number;
  pending?: number;
}

function summaryNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function homeToday(supabase: SupabaseClient, userId: string, zone: string): Promise<TodayView> {
  const today = dateInZone(new Date(), zone);
  const { data, error } = await supabase.rpc("today_summary", { p_zone: zone }).abortSignal(AbortSignal.timeout(8000));
  if (error) throw new Error("Today could not be loaded.");
  const summary = (data ?? null) as TodaySummaryPayload | null;
  const days = await getDays(supabase, userId, zone, today, today);
  const day = days[0];
  const posts = (day?.posts ?? []).map((post) => ({
    id: post.id,
    caption: post.caption,
    eatenAt: post.eatenAt,
    photoUrl: post.photoUrl,
    items: post.items.map((item) => ({ name: item.name })),
    totals: sumNutrition(post.items),
  }));
  const totals: MealTotals = {
    calories: summaryNumber(summary?.kcal),
    protein_g: summaryNumber(summary?.protein_g),
    carbs_g: summaryNumber(summary?.carbs_g),
    fat_g: summaryNumber(summary?.fat_g),
    fibre_g: day?.totals.fibre_g ?? null,
    sugar_g: day?.totals.sugar_g ?? null,
    sodium_mg: day?.totals.sodium_mg ?? null,
    missing: day?.totals.missing,
  };
  return { date: summary?.date ?? today, posts, totals };
}
