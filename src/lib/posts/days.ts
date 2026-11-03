import {visibleDrinkRows} from '@/lib/intake/hydration';
import type { SupabaseClient } from "@supabase/supabase-js";
import { groupIntakeByDay, emptyIntake, type IntakeRow, type IntakeTotals } from "@/lib/intake/intake";
import { CURRENT_ITEM_COLUMNS, CURRENT_NUTRITION_COLUMNS, mapCurrentItems, normalizeStoredNutrition, nutritionNumber, sumNutrition, type CurrentItem, type MealTotals, type NutritionRow } from "@/lib/nutrition/totals";

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
  const photos: {post: DayPost; path: string}[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from("posts")
      .select(`id,caption,eaten_at,post_media(storage_path,position),current_post_items(${CURRENT_ITEM_COLUMNS},created_at,item_nutrition(${CURRENT_NUTRITION_COLUMNS}))`).is("deleted_at", null)
      .eq("user_id", userId).eq("status", "ready").gte("eaten_at", lower).lt("eaten_at", upper)
      .eq("post_media.kind", "photo").order("position", { referencedTable: "post_media", ascending: true })
      .limit(1, { referencedTable: "post_media" })
      .order("created_at", { referencedTable: "current_post_items", ascending: true })
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 99);
    if (error) throw new Error("Days could not be loaded.");
    for (const row of data ?? []) {
      const date = dateInZone(row.eaten_at, zone);
      if (date < from || date > through) continue;
      // Use the shared current-item mapper, including unknown nutrition and
      // consumed-portion normalization; retain every item field and its order.
      const items = mapCurrentItems((row.current_post_items ?? []).map(({created_at: _created, ...item}) => {
        void _created;
        return item;
      }) as Parameters<typeof mapCurrentItems>[0]);
      const post: DayPost = { id: row.id, caption: row.caption, eatenAt: row.eaten_at, photoUrl: null, items, totals: sumNutrition(items) };
      const path = row.post_media?.[0]?.storage_path;
      if (path) photos.push({post, path: path.endsWith("/card.png") ? path : `${path.replace(/\.[^/.]+$/, "")}.feed.jpg`});
      const day = groups.get(date);
      if (day) { day.posts.push(post); day.totals = sumNutrition([day.totals, post.totals]); }
      else groups.set(date, { date, posts: [post], totals: post.totals, intake: emptyIntake() });
    }
    if ((data?.length ?? 0) < 100) break;
  }
  if (photos.length) {
    try {
      const paths = [...new Set(photos.map(photo => photo.path))];
      const {data, error} = await supabase.storage.from("media").createSignedUrls(paths, 3600);
      if (!error) {
        const urls = new Map((data ?? []).filter(row => !row.error && row.signedUrl).map(row => [row.path, row.signedUrl]));
        for (const photo of photos) photo.post.photoUrl = urls.get(photo.path) ?? null;
      }
    } catch {
      // Optional missing photos must never hide a meal or its nutrition.
    }
  }
  // Water and caffeine logged on a day that has meals appear as that day's intake totals (never a target).
  if (groups.size) {
    // Every row, in a fixed order, a page at a time: a capped response must never pass for the full total.
    const intake: (IntakeRow & {post_id?:string|null})[] = [];
    let intakeError = false;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from("intake_logs").select("kind,amount,logged_at,post_id")
        .eq("user_id", userId).gte("logged_at", lower).lt("logged_at", upper)
        .order("logged_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
      if (error) { intakeError = true; break; }
      intake.push(...((data ?? []) as IntakeRow[]));
      if ((data?.length ?? 0) < 1000) break;
    }
    if (!intakeError) {
      const byDay = groupIntakeByDay(await visibleDrinkRows(supabase,userId,intake), (instant) => dateInZone(instant, zone));
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
    const { data, error } = await supabase.from("posts").select("id,eaten_at").is("deleted_at", null)
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

export interface DayPostReceipt { id: string; eatenAt: string; kcal: number; missing: string[]; known: number }
export interface FeedDayTotal { day: string; kcal: number | null; ready: boolean; missing?:string[]; known?:number; posts?: DayPostReceipt[] }
// A compact contribution receipt from the same owner/RLS read as the total.
// It lets discovery recognize an older meal already included by SSR.
export function dayPostReceipt(id: string, eatenAt: string, items: {name:string;calories:import('@/lib/nutrition/totals').Numeric}[]): DayPostReceipt {
  const receipt: DayPostReceipt = {id,eatenAt,kcal:0,missing:[],known:0};
  for (const item of items) {
    const value=nutritionNumber(item.calories);
    if(value===null)receipt.missing.push(item.name);else{receipt.kcal+=value;receipt.known++;}
  }
  receipt.missing=[...new Set(receipt.missing)].sort();return receipt;
}

// Read all current nutrition for the touched days together, never one query per card.
// The relationships are inferred from the view's underlying post_items foreign keys.
export async function getDayTotals(db: SupabaseClient, userId: string, zone: string, dates: string[]): Promise<FeedDayTotal[]> {
  const wanted = [...new Set(dates)].sort();
  if (!wanted.length) return [];
  const groups = new Map(wanted.map(day => [day, { day, kcal: 0 as number | null, ready: false, missing:[] as string[], known:0, posts:[] as DayPostReceipt[] }]));
  // Group contiguous requested days only; widely separated card events must
  // not rescan every meal between the two days.
  const windows: {from: string; through: string}[] = [];
  for (const day of wanted) {
    const last = windows.at(-1);
    if (last && shiftDay(last.through, 1) === day) last.through = day;
    else windows.push({from: day, through: day});
  }
  for (const window of windows) {
  const lower = `${shiftDay(window.from, -1)}T00:00:00Z`;
  const upper = `${shiftDay(window.through, 2)}T00:00:00Z`;
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('posts')
      .select('id,eaten_at,current_post_items(name,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref))').is("deleted_at", null)
      .eq('user_id', userId).eq('status', 'ready').or('needs_input.is.null,status.eq.failed')
      .gte('eaten_at', lower).lt('eaten_at', upper).order('eaten_at').order('id').range(offset, offset + 999).abortSignal(AbortSignal.timeout(8000));
    if (error) throw new Error('Day totals could not be loaded.');
    for (const row of data ?? []) {
      const group = groups.get(dateInZone(row.eaten_at, zone));
      if (!group || group.day < window.from || group.day > window.through) continue;
      group.ready = true;
      const contributions: {name:string;calories:number|null}[]=[];
      for (const item of row.current_post_items ?? []) {
        const nutrients = Array.isArray(item.item_nutrition) ? item.item_nutrition : [item.item_nutrition];
        const nutrition = nutrients[0];
        const value = nutrition ? normalizeStoredNutrition(nutrition as NutritionRow, item.portion_grams).calories : null;
        contributions.push({name:item.name,calories:nutritionNumber(value)});
        if(value==null)group.missing.push(item.name); else {group.kcal=(group.kcal??0)+Number(value);group.known++;}
      }
      group.posts.push(dayPostReceipt(row.id,row.eaten_at,contributions));
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  }
  return [...groups.values()].map(group=>({...group,missing:[...new Set(group.missing)],kcal:group.known===0&&group.missing.length?null:group.kcal}));
}

export interface MonthDay { day: string; kcal: number | null; posts: number; ready: boolean; missing?:string[]; known?:number }
export interface MonthSummary { days: MonthDay[]; posted: number }
export function shiftMonth(month: string, offset: number): string {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}
export async function getEarliestPostDate(supabase: SupabaseClient, userId: string, zone: string): Promise<string | null> {
  const { data, error } = await supabase.from("posts").select("eaten_at").is("deleted_at", null).eq("user_id", userId)
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
      .select("id,eaten_at,status,current_post_items(id,name,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref))").is("deleted_at", null)
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
  return { days: [...groups.values()].map(day => ({ ...day, missing:[...new Set(day.missing??[])], kcal: day.ready && !((day.known??0)===0&&day.missing?.length) ? day.kcal : null })).sort((a, b) => a.day.localeCompare(b.day)), posted: groups.size };
}

export async function getPostedMonthCounts(supabase: SupabaseClient, userId: string, zone: string): Promise<Record<string, number>> {
  const dates = new Set<string>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from("posts").select("id,eaten_at").is("deleted_at", null).eq("user_id", userId).in("status", LOGGED_STATUSES)
      .order("eaten_at", { ascending: true }).order("id", { ascending: true }).range(offset, offset + 999);
    if (error) throw new Error("Posted months could not be loaded.");
    for (const post of data ?? []) dates.add(dateInZone(post.eaten_at, zone));
    if ((data?.length ?? 0) < 1000) break;
  }
  const months: Record<string, number> = {};
  for (const date of dates) months[date.slice(0, 7)] = (months[date.slice(0, 7)] ?? 0) + 1;
  return months;
}
