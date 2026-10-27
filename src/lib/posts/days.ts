import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { getCurrentItems, sumNutrition, type CurrentItem, type MealTotals } from "@/lib/nutrition/totals";

export interface DayPost { id: string; caption: string; eatenAt: string; photoUrl: string | null; items: CurrentItem[]; totals: MealTotals }
export interface LoggedDay { date: string; posts: DayPost[]; totals: MealTotals }
export function validZone(zone?: string | null): string {
  try { if (zone) { zone = decodeURIComponent(zone); new Intl.DateTimeFormat("en", { timeZone: zone }); return zone; } } catch {}
  return "UTC";
}
export function dateInZone(value: string | Date, zone: string): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function shiftDay(date: string, offset: number): string {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}
export function validDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}

// Calendar grouping is equivalent to (eaten_at AT TIME ZONE zone)::date,
// using IANA Intl conversion before grouping, including DST transitions.
// Session-client reads keep both post and current-item RLS in force.
export async function getDays(supabase: SupabaseClient, userId: string, zone: string, from: string, through: string): Promise<LoggedDay[]> {
  const groups = new Map<string, LoggedDay>();
  // Wide UTC bounds include every local day even at UTC-12/UTC+14; the exact
  // local date check below removes the padding without DST assumptions.
  const lower = `${shiftDay(from, -1)}T00:00:00Z`;
  const upper = `${shiftDay(through, 2)}T00:00:00Z`;
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from("posts").select("id,caption,eaten_at")
      .eq("user_id", userId).eq("status", "ready").gte("eaten_at", lower).lt("eaten_at", upper)
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 99);
    if (error) throw new Error("Days could not be loaded.");
    for (const row of data ?? []) {
      const date = dateInZone(row.eaten_at, zone);
      if (date < from || date > through) continue;
      const [items, media] = await Promise.all([
        getCurrentItems(supabase, row.id),
        supabase.from("post_media").select("storage_path").eq("post_id", row.id).order("position", { ascending: true }).limit(1).maybeSingle(),
      ]);
      if (media.error) throw new Error("Day media could not be loaded.");
      const path = media.data?.storage_path as string | undefined;
      const photoUrl = path ? await feedCopyUrl(supabase, path.endsWith("/card.png") ? path : `${path.replace(/\.[^/.]+$/, "")}.feed.jpg`) : null;
      const totals = sumNutrition(items);
      const post: DayPost = { id: row.id, caption: row.caption, eatenAt: row.eaten_at, photoUrl, items, totals };
      const day = groups.get(date) ?? { date, posts: [], totals: sumNutrition([]) };
      day.posts.push(post); day.totals = sumNutrition([day.totals, totals]); groups.set(date, day);
    }
    if ((data?.length ?? 0) < 100) break;
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}
