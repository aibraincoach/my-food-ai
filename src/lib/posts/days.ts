import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { groupIntakeByDay, emptyIntake, type IntakeRow, type IntakeTotals } from "@/lib/intake/intake";
import { getCurrentItems, normalizeStoredNutrition, sumNutrition, type CurrentItem, type MealTotals, type NutritionRow } from "@/lib/nutrition/totals";

export interface DayPost { id: string; caption: string; eatenAt: string; photoUrl: string | null; items: CurrentItem[]; totals: MealTotals }
export interface LoggedDay { date: string; posts: DayPost[]; totals: MealTotals; intake: IntakeTotals }
export function validZone(zone?: string | null): string {
  try { if (zone) { zone = decodeURIComponent(zone); new Intl.DateTimeFormat("en", { timeZone: zone }); return zone; } } catch {}
  return "UTC";
}
// A time zone that came from the UTC fallback is not the reader's choice: only a zone from the
// query string or the cookie is carried in links, so the browser's zone can still replace the fallback.
export function withZone(path: string, zone: string, known: boolean): string {
  return known ? `${path}${path.includes("?") ? "&" : "?"}tz=${encodeURIComponent(zone)}` : path;
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
// Date.UTC reads years 0-99 as 19xx, so only 2000-2999 are supported.
export function validMonth(month: string | undefined): month is string {
  return typeof month === "string" && /^2\d{3}-(0[1-9]|1[0-2])$/.test(month);
}
export function validDate(date: string): boolean {
  return /^2\d{3}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
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
    const rows = data ?? [];
    // Keep latency bounded without issuing every month's request at once.
    for (let start = 0; start < rows.length; start += 8) {
      const loaded = await Promise.all(rows.slice(start, start + 8).map(async (row) => {
        const date = dateInZone(row.eaten_at, zone);
        if (date < from || date > through) return null;
        const [items, media] = await Promise.all([
          getCurrentItems(supabase, row.id),
          supabase.from("post_media").select("storage_path").eq("post_id", row.id).order("position", { ascending: true }).limit(1).maybeSingle(),
        ]);
        const path = media.error ? undefined : media.data?.storage_path as string | undefined;
        let photoUrl: string | null = null;
        if (path) {
          try {
            photoUrl = await feedCopyUrl(supabase, path.endsWith("/card.png") ? path : `${path.replace(/\.[^/.]+$/, "")}.feed.jpg`);
          } catch {
            // A missing optional feed copy must not hide meals or their totals.
          }
        }
        const totals = sumNutrition(items);
        const post: DayPost = { id: row.id, caption: row.caption, eatenAt: row.eaten_at, photoUrl, items, totals };
        return { date, post };
      }));
      // Promise.all retains source order, including within each local day.
      for (const entry of loaded) {
        if (!entry) continue;
        const { date, post } = entry;
        const day = groups.get(date) ?? { date, posts: [], totals: sumNutrition([]), intake: emptyIntake() };
        day.posts.push(post); day.totals = sumNutrition([day.totals, post.totals]); groups.set(date, day);
      }
    }
    if ((data?.length ?? 0) < 100) break;
  }
  // Water and caffeine logged on a day that has meals appear as that day's intake totals (never a target).
  if (groups.size) {
    // Every row, in a fixed order, a page at a time: a capped response must never pass for the full total.
    const intake: IntakeRow[] = [];
    let intakeError = false;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("intake_logs").select("kind,amount,logged_at")
        .eq("user_id", userId).gte("logged_at", lower).lt("logged_at", upper)
        .order("logged_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
      if (error) { intakeError = true; break; }
      intake.push(...((data ?? []) as IntakeRow[]));
      if ((data?.length ?? 0) < 1000) break;
    }
    if (!intakeError) {
      const byDay = groupIntakeByDay(intake, (instant) => dateInZone(instant, zone));
      for (const day of groups.values()) day.intake = byDay.get(day.date) ?? emptyIntake();
    }
  }
  return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// A day is logged as soon as a meal was posted for it, even while it is still being analysed or waiting for a reply
// (only a failed meal does not count); the story and totals still show ready meals only.
export const LOGGED_STATUSES = ["ready", "queued", "processing", "needs_input"];

// Home's bubbles only need which local days have a logged meal: no items,
// nutrition or photos, so an optional read cannot hide the strip.
export async function getLoggedDates(supabase: SupabaseClient, userId: string, zone: string, from: string, through: string): Promise<{ date: string }[]> {
  const dates = new Set<string>();
  const lower = `${shiftDay(from, -1)}T00:00:00Z`;
  const upper = `${shiftDay(through, 2)}T00:00:00Z`;
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from("posts").select("id,eaten_at")
      .eq("user_id", userId).in("status", LOGGED_STATUSES).gte("eaten_at", lower).lt("eaten_at", upper)
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 99);
    if (error) throw new Error("Days could not be loaded.");
    for (const row of data ?? []) {
      const date = dateInZone(row.eaten_at, zone);
      if (date >= from && date <= through) dates.add(date);
    }
    if ((data?.length ?? 0) < 100) break;
  }
  return [...dates].sort().map((date) => ({ date }));
}

export interface FeedDayTotal { day: string; kcal: number | null; ready: boolean; missing?:string[]; known?:number }

// Read all current nutrition for the touched days together, never one query per card.
// The relationships are inferred from the view's underlying post_items foreign keys.
export async function getDayTotals(db: SupabaseClient, userId: string, zone: string, dates: string[]): Promise<FeedDayTotal[]> {
  const wanted = [...new Set(dates)].sort();
  if (!wanted.length) return [];
  const groups = new Map(wanted.map(day => [day, { day, kcal: 0 as number | null, ready: false, missing:[] as string[], known:0 }]));
  const lower = `${shiftDay(wanted[0], -1)}T00:00:00Z`;
  const upper = `${shiftDay(wanted.at(-1)!, 2)}T00:00:00Z`;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('posts')
      .select('id,eaten_at,current_post_items(name,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref))')
      .eq('user_id', userId).eq('status', 'ready').or('needs_input.is.null,status.eq.failed')
      .gte('eaten_at', lower).lt('eaten_at', upper).order('eaten_at').order('id').range(offset, offset + 999);
    if (error) throw new Error('Day totals could not be loaded.');
    for (const row of data ?? []) {
      const group = groups.get(dateInZone(row.eaten_at, zone));
      if (!group) continue;
      group.ready = true;
      for (const item of row.current_post_items ?? []) {
        const nutrients = Array.isArray(item.item_nutrition) ? item.item_nutrition : [item.item_nutrition];
        const nutrition = nutrients[0];
        const value = nutrition ? normalizeStoredNutrition(nutrition as NutritionRow, item.portion_grams).calories : null;
        if(value==null)group.missing.push(item.name); else {group.kcal=(group.kcal??0)+Number(value);group.known++;}
      }
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  return [...groups.values()].map(group=>({...group,kcal:group.known===0&&group.missing.length?null:group.kcal}));
}

export interface MonthDay { day: string; kcal: number | null; posts: number; ready: boolean; missing?:string[]; known?:number }
export interface MonthSummary { days: MonthDay[]; posted: number }
export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export async function getEarliestPostDate(supabase: SupabaseClient, userId: string, zone: string): Promise<string | null> {
  const { data, error } = await supabase.from("posts").select("eaten_at").eq("user_id", userId)
    .order("eaten_at", { ascending: true }).order("id", { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error("The first posted day could not be read.");
  return data ? dateInZone(data.eaten_at, zone) : null;
}

// Month grids need no photos, signed URLs or per-post requests. Read current
// nutrition in the same paginated query as posts and group by the local day.
export async function getMonthSummary(supabase: SupabaseClient, userId: string, zone: string, month: string): Promise<MonthSummary> {
  if (!validMonth(month)) throw new Error("Invalid month.");
  const from = `${month}-01`, through = shiftDay(`${shiftMonth(month, 1)}-01`, -1);
  const groups = new Map<string, MonthDay>();
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from("posts")
      .select("id,eaten_at,status,current_post_items(id,name,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref))")
      .eq("user_id", userId).in("status", LOGGED_STATUSES)
      .gte("eaten_at", `${shiftDay(from, -1)}T00:00:00Z`).lt("eaten_at", `${shiftDay(through, 2)}T00:00:00Z`)
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 99);
    if (error) throw new Error("The month's posted days could not be loaded.");
    for (const row of data ?? []) {
      const date = dateInZone(row.eaten_at, zone);
      if (date < from || date > through) continue;
      const day = groups.get(date) ?? { day: date, kcal: 0, posts: 0, ready: false, missing:[],known:0 };
      day.posts++;
      if (row.status === "ready") {
        day.ready = true;
        for (const item of row.current_post_items ?? []) {
          const stored = Array.isArray(item.item_nutrition) ? item.item_nutrition[0] : item.item_nutrition;
          const normalized = stored ? normalizeStoredNutrition(stored as NutritionRow, item.portion_grams) : null;
          const calories = normalized?.calories;
          if(calories==null)(day.missing??=[]).push(item.name); else {day.kcal=(day.kcal??0)+Number(calories);day.known=(day.known??0)+1;}
        }
      }
      groups.set(date, day);
    }
    if ((data?.length ?? 0) < 100) break;
  }
  return { days: [...groups.values()].map(day => ({ ...day, kcal: day.ready && !((day.known??0)===0&&day.missing?.length) ? day.kcal : null })).sort((a, b) => a.day.localeCompare(b.day)), posted: groups.size };
}

export async function getPostedMonthCounts(supabase: SupabaseClient, userId: string, zone: string): Promise<Record<string, number>> {
  const dates = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("posts").select("id,eaten_at").eq("user_id", userId).in("status", LOGGED_STATUSES)
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
    if (error) throw new Error("Posted months could not be loaded.");
    for (const post of data ?? []) dates.add(dateInZone(post.eaten_at, zone));
    if ((data?.length ?? 0) < 1000) break;
  }
  const months: Record<string, number> = {};
  for (const date of dates) months[date.slice(0, 7)] = (months[date.slice(0, 7)] ?? 0) + 1;
  return months;
}
