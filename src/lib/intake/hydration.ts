import {alcoholGrams,isAlcoholic,keepsCaffeine} from './alcohol';
import type { SupabaseClient } from "@supabase/supabase-js";
import { dateInZone, shiftDay, validZone } from "@/lib/posts/days";
import { normalizeStoredNutrition, toNumber, type NutritionRow, type Numeric, type StoredNutrient } from "@/lib/nutrition/totals";

// Hydration is a record: full water for drinks/ml portions, otherwise 80% of
// database food water. Round the sum once, rather than each food's contribution.
export const FOOD_WATER_SHARE_FULL = 1.0;
export const FOOD_WATER_SHARE_OTHER = 0.8;
export const ROUND_ML = 10;
export const roundWaterMl = (ml: number) => Math.round(ml / ROUND_ML) * ROUND_ML;

export interface DrinkRow {
  caffeineMg?:number;
  alcoholG?:number;
  kind: "water" | "caffeine" | "alcohol";
  amount: number;
  logged_at: string;
  ml: number | null;
  label: string | null;
  post_id: string | null;
  source?: "sheet" | "item";
  post_item_id?: string | null;
}
export interface HydrationRecord { drinksMl: number; foodMl: number; totalMl: number; caffeineMg: number }
// caffeineMg remains the drink's own amount for existing consumers. The day's
// caffeine is separate, and dayHydration exposes it as caffeineMg.
export interface DrinkCardData extends Omit<HydrationRecord, "caffeineMg"> { source?: "sheet" | "item"; ml: number; label: string; caffeineMg: number; dayCaffeineMg?: number }
export interface ItemDrinkRecord { kind?: "water"|"caffeine"|"alcohol"; alcoholG?:number; post_item_id?: string | null; label: string; ml: number; caffeineMg: number }
export interface PostHydrationData { itemDrinks: ItemDrinkRecord[]; drinkSource?: "sheet" | "item"; kind: "meal" | "drink"; foodWaterMl: number; dayHydration: HydrationRecord; drink: DrinkCardData | null }
type WaterItem = { food_category?:string|null; id?: string; portion_text?: string | null; portion_grams: Numeric; micronutrients: StoredNutrient[] };
export function itemWaterMl(item: WaterItem, isDrink = false): number {
  if (isDrink || isAlcoholic(item)) return 0;
  const nutrient = item.micronutrients.find(n => n.nutrientId === 1051 && n.basis === "portion"
    && (n.unitName ?? n.unit)?.toLowerCase() === "g");
  if (!nutrient) return 0;
  const share = /(?:^|\s)ml\b/i.test(item.portion_text ?? "") ? FOOD_WATER_SHARE_FULL : FOOD_WATER_SHARE_OTHER;
  return Math.max(0, toNumber(nutrient.value)) * share;
}
export function foodWaterMl(items: WaterItem[]): number { return roundWaterMl(items.reduce((sum, item) => sum + itemWaterMl(item), 0)); }

// Service clients bypass intake RLS; retain legacy unlinked entries while
// excluding any drink whose parent post is retained in the deleted archive.
export async function visibleDrinkRows<T extends {post_id?:string|null}>(db:SupabaseClient,userId:string,rows:T[]):Promise<T[]>{
 const ids=[...new Set(rows.flatMap(row=>row.post_id?[row.post_id]:[]))];
 if(!ids.length)return rows;
 const active=new Set<string>();
 for(let offset=0;offset<ids.length;offset+=100){const {data,error}=await db.from('posts').select('id').eq('user_id',userId).is('deleted_at',null).in('id',ids.slice(offset,offset+100));if(error)throw new Error('Drink records could not be read.');for(const post of data??[])active.add(post.id);}
 return rows.filter(row=>!row.post_id||active.has(row.post_id));
}

// Alcohol rows store grams in amount. Rehydrate their independently recorded
// caffeine from the consumed item revision, without counting their liquid as water.
async function withAlcoholNutrition(db:SupabaseClient,rows:DrinkRow[]):Promise<DrinkRow[]>{
 const ids=[...new Set(rows.filter(row=>row.kind==='alcohol'&&row.post_item_id).map(row=>row.post_item_id!))];
 if(!ids.length)return rows;
 const amounts=new Map<string,{alcoholG:number;caffeineMg:number}>();
 for(let offset=0;offset<ids.length;offset+=100){
  const {data,error}=await db.from('current_post_items').select('id,name,portion_grams,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)').in('id',ids.slice(offset,offset+100)).abortSignal(AbortSignal.timeout(8000));
  if(error)throw new Error('Alcohol nutrition could not be read.');
  for(const item of data??[]){
   const stored=Array.isArray(item.item_nutrition)?item.item_nutrition[0]:item.item_nutrition;
   const nutrition=stored?normalizeStoredNutrition(stored as NutritionRow,item.portion_grams):null;
   const nutrients=nutrition?.micronutrients??[];
   const caffeine=keepsCaffeine({name:item.name,food_category:stored?.food_category,micronutrients:nutrients})?nutrients.find(n=>n.nutrientId===1057&&n.basis==='portion'):null;
   amounts.set(item.id,{alcoholG:alcoholGrams(nutrients),caffeineMg:Math.min(1000,Math.max(0,Math.round(toNumber(caffeine?.value))))});
  }
 }
 return rows.map(row=>row.kind==='alcohol'?{...row,...(amounts.get(row.post_item_id??'')??{alcoholG:0,caffeineMg:0})}:row);
}

export async function drinksForDay(db: SupabaseClient, userId: string, day: string, zone: string): Promise<DrinkRow[]> {
  const rows: DrinkRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from("intake_logs").select("kind,amount,logged_at,ml,label,post_id,source,post_item_id")
      .eq("user_id", userId).gte("logged_at", `${shiftDay(day, -1)}T00:00:00Z`)
      .lt("logged_at", `${shiftDay(day, 2)}T00:00:00Z`)
      .order("logged_at").order("id").range(offset, offset + 999);
    if (error) throw new Error("Drinks could not be read.");
    rows.push(...((data ?? []) as DrinkRow[]).filter(row => dateInZone(row.logged_at, validZone(zone)) === day));
    if ((data?.length ?? 0) < 1000) break;
  }
  return withAlcoholNutrition(db,await visibleDrinkRows(db,userId,rows));
}

type HydrationTimeline = { drinks: DrinkRow[]; foods: { postId: string; eatenAt: string; waterMl: number }[] };

// One set of reads for every requested local day on a feed page. Bounds are
// padded for IANA offsets and filtered locally; gaps are excluded in PostgREST.
async function hydrationTimelines(db: SupabaseClient, userId: string, latestByDay: Map<string, string>, tz: string): Promise<Map<string, HydrationTimeline>> {
  const zone = validZone(tz), days = [...latestByDay.keys()].sort();
  const timelines = new Map(days.map(day => [day, {drinks: [], foods: []} as HydrationTimeline]));
  if (!days.length) return timelines;
  const ranges = (column: string) => days.map(day => `and(${column}.gte.${shiftDay(day, -1)}T00:00:00Z,${column}.lt.${shiftDay(day, 2)}T00:00:00Z)`).join(',');
  const drinks: DrinkRow[] = [];
  const posts: {id: string; eaten_at: string}[] = [];
  await Promise.all([
    (async () => { for (let offset = 0; ; offset += 1000) {
      const {data, error} = await db.from('intake_logs').select('kind,amount,logged_at,ml,label,post_id,source,post_item_id')
        .eq('user_id', userId).or(ranges('logged_at')).order('logged_at').order('id').range(offset, offset + 999).abortSignal(AbortSignal.timeout(8000));
      if (error) throw new Error('Drinks could not be read.');
      drinks.push(...(data ?? []) as DrinkRow[]); if ((data?.length ?? 0) < 1000) break;
    } })(),
    (async () => { for (let offset = 0; ; offset += 1000) {
      const {data, error} = await db.from('posts').select('id,eaten_at').is("deleted_at", null).eq('user_id', userId).eq('status', 'ready')
        .or(ranges('eaten_at')).order('eaten_at').order('id').range(offset, offset + 999).abortSignal(AbortSignal.timeout(8000));
      if (error) throw new Error('Food hydration could not be read.');
      posts.push(...(data ?? [])); if ((data?.length ?? 0) < 1000) break;
    } })(),
  ]);
  for (const drink of await withAlcoholNutrition(db,await visibleDrinkRows(db,userId,drinks))) timelines.get(dateInZone(drink.logged_at, zone))?.drinks.push(drink);
  const candidates = posts.filter(post => {
    const cutoff = latestByDay.get(dateInZone(post.eaten_at, zone));
    return cutoff && new Date(post.eaten_at).getTime() <= new Date(cutoff).getTime();
  });
  if (!candidates.length) return timelines;
  const {data: links, error: linkError} = await db.from('intake_logs').select('post_id,source,post_item_id').eq('user_id', userId)
    .in('post_id', candidates.map(post => post.id)).abortSignal(AbortSignal.timeout(8000));
  if (linkError) throw new Error('Drink links could not be read.');
  const drinkPosts = new Set((links ?? []).filter(row => row.source === 'sheet' || row.source == null).map(row => row.post_id));
  const drinkItems = new Set((links ?? []).filter(row => row.source === 'item').map(row => row.post_item_id));
  const foods = new Map(candidates.filter(post => !drinkPosts.has(post.id)).map(post => [post.id, {postId: post.id, eatenAt: post.eaten_at, waterMl: 0}]));
  if (foods.size) for (let offset = 0; ; offset += 1000) {
    const {data, error} = await db.from('current_post_items').select('id,post_id,portion_grams,portion_text,item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients,source_ref,food_category)')
      .in('post_id', [...foods.keys()]).order('id').range(offset, offset + 999).abortSignal(AbortSignal.timeout(8000));
    if (error) throw new Error('Food water could not be read.');
    for (const item of data ?? []) {
      const stored = Array.isArray(item.item_nutrition) ? item.item_nutrition[0] : item.item_nutrition;
      const food = foods.get(item.post_id);
      if (stored && food) food.waterMl += itemWaterMl({...item, food_category:stored.food_category, micronutrients: normalizeStoredNutrition(stored as NutritionRow, item.portion_grams).micronutrients}, drinkItems.has(item.id));
    }
    if ((data?.length ?? 0) < 1000) break;
  }
  for (const food of foods.values()) timelines.get(dateInZone(food.eatenAt, zone))?.foods.push(food);
  return timelines;
}
async function hydrationTimeline(db: SupabaseClient, userId: string, day: string, tz: string, upToEatenAt: string): Promise<HydrationTimeline> {
  if (!Number.isFinite(new Date(upToEatenAt).getTime())) throw new Error('Invalid hydration time.');
  return (await hydrationTimelines(db, userId, new Map([[day, upToEatenAt]]), tz)).get(day)!;
}

function hydrationAt(timeline: HydrationTimeline, upToEatenAt: string): HydrationRecord {
  const cutoff = new Date(upToEatenAt).getTime();
  const drinks = timeline.drinks.filter(row => new Date(row.logged_at).getTime() <= cutoff);
  const drinksMl = Math.round(drinks.reduce((total, row) => total + (row.kind === "alcohol" ? 0 : toNumber(row.ml ?? (row.kind === "water" ? row.amount : 0))), 0));
  const caffeineMg = Math.round(drinks.reduce((total, row) => total + (row.kind === "caffeine" ? toNumber(row.amount) : row.kind === "alcohol" ? row.caffeineMg??0 : 0), 0));
  const foodMl = roundWaterMl(timeline.foods.filter(row => new Date(row.eatenAt).getTime() <= cutoff).reduce((total, row) => total + row.waterMl, 0));
  return { drinksMl, foodMl, totalMl: drinksMl + foodMl, caffeineMg };
}

// Explicit db dependency retains owner RLS in routes and supports the renderer.
export async function hydrationSoFar(db: SupabaseClient, userId: string, day: string, tz: string, upToEatenAt: string): Promise<HydrationRecord> {
  return hydrationAt(await hydrationTimeline(db, userId, day, tz, upToEatenAt), upToEatenAt);
}

type HydrationPost = { id: string; eaten_at: string; items?: WaterItem[] };
export async function getPostHydrationData(db: SupabaseClient, userId: string, posts: HydrationPost[], tz: string): Promise<Record<string, PostHydrationData>> {
  const output: Record<string, PostHydrationData> = {};
  if (!posts.length) return output;
  const zone = validZone(tz);
  const byDay = new Map<string, HydrationPost[]>();
  for (const post of posts) {
    const day = dateInZone(post.eaten_at, zone);
    byDay.set(day, [...(byDay.get(day) ?? []), post]);
  }
  const latestByDay = new Map([...byDay].map(([day, dayPosts]) => [day, dayPosts.reduce((a, b) => new Date(a.eaten_at) > new Date(b.eaten_at) ? a : b).eaten_at]));
  const timelines = await hydrationTimelines(db, userId, latestByDay, zone);
  for (const [day, dayPosts] of byDay) {
    const timeline = timelines.get(day)!;
    const drinksByPost = new Map<string, DrinkRow[]>();
    for (const row of timeline.drinks.filter(row => row.post_id && row.ml != null && row.label)) {
      drinksByPost.set(row.post_id!, [...(drinksByPost.get(row.post_id!) ?? []), row]);
    }
    // The batch drink-card endpoint supplies no item snapshot. Read identities
    // to distinguish a mixed meal from a post consisting entirely of beverages.
    const missing = dayPosts.filter(post => post.items === undefined).map(post => post.id);
    const itemIds = new Map<string, string[]>();
    if (missing.length) {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await db.from("current_post_items").select("id,post_id").in("post_id", missing).order("id").range(offset, offset + 999);
        if (error) throw new Error("Drink items could not be read.");
        for (const item of data ?? []) itemIds.set(item.post_id, [...(itemIds.get(item.post_id) ?? []), item.id]);
        if ((data?.length ?? 0) < 1000) break;
      }
    }
    for (const post of dayPosts) {
      const links = drinksByPost.get(post.id) ?? [];
      const sheet = links.some(row => row.source !== "item");
      if (!sheet && post.items) {
        const linked = new Set(links.map(row => row.post_item_id));
        const own = { postId: post.id, eatenAt: post.eaten_at, waterMl: post.items.reduce((sum, item) => sum + itemWaterMl(item, linked.has(item.id)), 0) };
        const index = timeline.foods.findIndex(row => row.postId === post.id);
        if (index < 0) timeline.foods.push(own); else timeline.foods[index] = own;
      }
    }
    for (const post of dayPosts) {
      const links = drinksByPost.get(post.id) ?? [];
      const source = links.some(row => row.source !== "item") ? "sheet" as const : "item" as const;
      const itemDrinks = links.filter(row => row.source === "item").map(row => ({ post_item_id: row.post_item_id, label: row.label!, ...(row.kind==="alcohol"?{kind:row.kind,alcoholG:row.alcoholG??alcoholGrams(post.items?.find(item=>item.id===row.post_item_id)?.micronutrients)}:{}), ml: toNumber(row.ml), caffeineMg: row.kind === "caffeine" ? toNumber(row.amount) : row.kind === "alcohol" ? row.caffeineMg??0 : 0 }));
      const currentIds = post.items ? post.items.map(item => item.id) : itemIds.get(post.id) ?? [];
      const linkedIds = new Set(links.map(row => row.post_item_id));
      const isDrink = links.length > 0 && (source === "sheet" || currentIds.length > 0 && currentIds.every(id => id && linkedIds.has(id)));
      const hydration = hydrationAt(timeline, post.eaten_at);
      output[post.id] = { kind: isDrink ? "drink" : "meal", itemDrinks, drinkSource: links.length ? source : undefined, dayHydration: hydration,
        foodWaterMl: isDrink ? 0 : roundWaterMl(timeline.foods.find(row => row.postId === post.id)?.waterMl ?? 0),
        drink: isDrink ? { ...hydration, source, ml: links.reduce((sum, row) => sum + (row.kind === "alcohol" ? 0 : toNumber(row.ml)), 0), label: links.map(row => row.label!).join(" · "), caffeineMg: links.reduce((sum, row) => sum + (row.kind === "caffeine" ? toNumber(row.amount) : row.kind === "alcohol" ? row.caffeineMg??0 : 0), 0), dayCaffeineMg: hydration.caffeineMg } : null };
    }
  }
  return output;
}

export async function getDrinkCardsData(db: SupabaseClient, userId: string, postIds: string[], tz: string): Promise<Record<string, DrinkCardData | null>> {
  const output: Record<string, DrinkCardData | null> = Object.fromEntries(postIds.map(id => [id, null]));
  if (!postIds.length) return output;
  const { data: posts, error } = await db.from("posts").select("id,eaten_at").is("deleted_at", null).eq("user_id", userId).in("id", postIds);
  if (error) throw new Error("Drink times could not be read.");
  const cards = await getPostHydrationData(db, userId, posts ?? [], tz);
  for (const post of posts ?? []) output[post.id] = cards[post.id]?.drink ?? null;
  return output;
}

export async function getDrinkCardData(db: SupabaseClient, userId: string, postId: string, tz: string): Promise<DrinkCardData | null> {
  return (await getDrinkCardsData(db, userId, [postId], tz))[postId];
}
