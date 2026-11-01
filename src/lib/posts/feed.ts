import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { dateInZone, getDayTotals, type FeedDayTotal } from "./days";
import { encodeFeedCursor, parseFeedCursor } from "./feed-cursor";
import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { getCurrentItems, type Numeric } from "@/lib/nutrition/totals";

export type PostStatus =
  | "queued"
  | "processing"
  | "needs_input"
  | "ready"
  | "failed";

export interface FeedItem {
  id: string;
  name: string;
  portion_text: string | null;
  portion_grams: Numeric;
  calories: Numeric;
  protein_g: Numeric;
  carbs_g: Numeric;
  fat_g: Numeric;
  fibre_g: Numeric;
  sugar_g: Numeric;
  sodium_mg: Numeric;
  micronutrients?: import("@/lib/nutrition/totals").StoredNutrient[];
}

export interface FeedPost {
  saved_meal_id?:string|null;
  source_post_id?:string|null;
  day?: string;
  modelCommentId?: string | null;
  analysisFingerprint?: string | null;
  kind?: "meal" | "drink";
  foodWaterMl?: number;
  dayHydration?: HydrationRecord;
  drink?: DrinkCardData | null;
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
  photoUrl: string | null;
  slides: {url:string;kind?:"photo"|"card";not_eaten?:boolean}[];
  count_text?: string | null;
  created_at: string;
  items: FeedItem[];
}

export const FEED_PAGE_SIZE = 20;

const UNSETTLED: PostStatus[] = ["queued", "processing", "needs_input"];

export function isSettled(status: PostStatus): boolean {
  return !UNSETTLED.includes(status);
}

// post_media stores the original shot; the feed copy shares the path
// with ".feed" inserted before the extension (item 5).
function feedPathFor(storagePath: string): string {
  const dot = storagePath.lastIndexOf(".");
  const base = dot < 0 ? storagePath : storagePath.slice(0, dot);
  return `${base}.feed.jpg`;
}

interface PostRow {
  user_id: string;
  created_at: string;
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
}


async function latestRevision(client:SupabaseClient,postId:string):Promise<{modelCommentId:string|null;fingerprint:string}|null> {
 const {data,error}=await client.rpc('feedback_revision',{p_post_id:postId});
 if(error)throw new Error('Analysis revision could not be read.');
 return data;
}

async function toFeedPost(
  supabase: SupabaseClient,
  row: PostRow,
  zone?: string
): Promise<FeedPost> {
  const revisionBefore=row.status==="ready"?await latestRevision(supabase,row.id):null;
  const { data: media, error: mediaError } = await supabase.from("post_media")
    .select("storage_path,kind,not_eaten").eq("post_id",row.id).order("position");
  if(mediaError) throw new Error(mediaError.message);
  const slides = (await Promise.all((media ?? []).map(async (entry) => {
    try { return {url: await feedCopyUrl(supabase, entry.kind === "card" ? entry.storage_path : feedPathFor(entry.storage_path),row.user_id),kind:entry.kind as "photo"|"card",not_eaten:Boolean(entry.not_eaten)}; }
    catch { return null; }
  }))).filter((entry): entry is {url:string;kind:"photo"|"card"} => entry !== null);
  const photoUrl = slides[0]?.url ?? null;

  const items: FeedItem[] = row.status === "ready" ? await getCurrentItems(supabase, row.id) : [];

  const {data:saved,error:savedError}=await supabase.from('saved_meals').select('id').eq('source_post_id',row.id).maybeSingle();
  if(savedError)throw new Error('Saved meal state could not be read.');
  const revisionAfter=row.status==="ready"?await latestRevision(supabase,row.id):null;
  return {
    saved_meal_id:saved?.id??null,
    modelCommentId: row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.modelCommentId??null:null,
    analysisFingerprint:row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.fingerprint??null:null,
    day: zone ? dateInZone(row.eaten_at, zone) : undefined,
    id: row.id,
    caption: row.caption,
    eaten_at: row.eaten_at,
    status: row.status,
    photoUrl,
    slides,
    created_at: row.created_at,
    items,
    count_text: (items[0] as FeedItem & {count_text?:string|null})?.count_text??null,
  };
}

export const VISIBLE_MEAL_FILTER="needs_input.is.null,status.eq.failed";

// Stable keyset pagination by eaten_at (when the meal was eaten): the ID breaks ties between equal timestamps.
export async function getFeed(
  supabase: SupabaseClient,
  userId: string,
  before: string | null = null,
  zone = "UTC"
): Promise<{posts: FeedPost[]; nextCursor:string|null; days: FeedDayTotal[]}> {
  const cursor = before === null ? null : parseFeedCursor(before);
  let query = supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at")
    .eq("user_id", userId).neq("status","needs_input")
    .order("eaten_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);
  query = cursor ? query.or(`and(or(${VISIBLE_MEAL_FILTER}),or(eaten_at.lt.${cursor.eaten_at},and(eaten_at.eq.${cursor.eaten_at},id.lt.${cursor.id})))`) : query.or(VISIBLE_MEAL_FILTER);
  const {data,error} = await query;
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as PostRow[];
  const page = rows.slice(0,FEED_PAGE_SIZE);
  const posts = await Promise.all(page.map((row)=>toFeedPost(supabase,row,zone)));
  const hydration = await getPostHydrationData(supabase, userId, posts.map(post => ({...post,items:post.items.map(item=>({...item,micronutrients:item.micronutrients??[]}))})), zone);
  return {posts:posts.map(post => ({ ...post, ...hydration[post.id] })), days:await getDayTotals(supabase,userId,zone,page.map(row=>dateInZone(row.eaten_at,zone))), nextCursor: rows.length>FEED_PAGE_SIZE ? encodeFeedCursor(page.at(-1)!) : null};
}

// One card's worth of data, used for realtime refreshes and polling.
export async function getPostCard(
  supabase: SupabaseClient,
  postId: string,
  zone = "UTC"
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at")
    .eq("id", postId).or(VISIBLE_MEAL_FILTER)
    .maybeSingle<PostRow>();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  const post = await toFeedPost(supabase, data, zone);
  const hydration = await getPostHydrationData(supabase, data.user_id, [{...post,items:post.items.map(item=>({...item,micronutrients:item.micronutrients??[]}))}], zone);
  return { ...post, ...hydration[post.id] };
}

// Search preserves the RPC's relevance order while sharing hydration reads for
// every result on a page, just like the Home feed.
export async function getPostCards(supabase: SupabaseClient, postIds: string[], zone = "UTC"): Promise<FeedPost[]> {
  if (!postIds.length) return [];
  const { data, error } = await supabase.from("posts").select("id,user_id,caption,eaten_at,status,created_at")
    .in("id", postIds).or(VISIBLE_MEAL_FILTER);
  if (error) throw new Error("Meals could not be loaded.");
  const rows = (data ?? []) as PostRow[];
  const cards: FeedPost[] = [];
  for (let offset = 0; offset < rows.length; offset += 4) {
    cards.push(...await Promise.all(rows.slice(offset, offset + 4).map(row => toFeedPost(supabase, row, zone))));
  }
  const hydrated = new Map<string, FeedPost>();
  for (const userId of new Set(rows.map(row => row.user_id))) {
    const ids = new Set(rows.filter(row => row.user_id === userId).map(row => row.id));
    const owned = cards.filter(post => ids.has(post.id));
    const values = await getPostHydrationData(supabase, userId, owned.map(post => ({ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) })), zone);
    for (const post of owned) hydrated.set(post.id, { ...post, ...values[post.id] });
  }
  return postIds.flatMap(id => { const post = hydrated.get(id); return post ? [post] : []; });
}
