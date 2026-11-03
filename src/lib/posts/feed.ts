import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { dateInZone, getDayTotals, type FeedDayTotal } from "./days";
import { encodeFeedCursor, parseFeedCursor } from "./feed-cursor";
import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import { getCurrentItems, getCurrentItemsForPosts, type Numeric, type CurrentItem } from "@/lib/nutrition/totals";

export type PostStatus =
  | "queued"
  | "processing"
  | "needs_input"
  | "ready"
  | "failed";

export interface FeedItem {
  not_eaten_grams?:number|null;
  gtin?: string | null;
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
  fail_reason?: string | null;
  agentName?: string | null;
  agent_token_id?: string | null;
  saved_meal_id?:string|null;
  source_post_id?:string|null;
  gtin?: string | null;
  day?: string;
  modelCommentId?: string | null;
  analysisFingerprint?: string | null;
  kind?: "meal" | "drink";
  drinkSource?: "sheet" | "item";
  itemDrinks?: import("@/lib/intake/hydration").ItemDrinkRecord[];
  foodWaterMl?: number;
  dayHydration?: HydrationRecord;
  drink?: DrinkCardData | null;
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
  photoUrl: string | null;
  slides: {id?:string;url:string;kind?:"photo"|"card";not_eaten?:boolean}[];
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
  fail_reason?: string | null;
  agent_token_id?: string | null;
  agent_tokens?: { name: string } | { name: string }[] | null;
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
    .select("id,storage_path,kind,not_eaten").eq("post_id",row.id).order("position");
  if(mediaError) throw new Error(mediaError.message);
  const slides = (await Promise.all((media ?? []).map(async (entry) => {
    try { return {id:entry.id,url: await feedCopyUrl(supabase, entry.kind === "card" ? entry.storage_path : feedPathFor(entry.storage_path),row.user_id),kind:entry.kind as "photo"|"card",not_eaten:Boolean(entry.not_eaten)}; }
    catch { return null; }
  }))).filter((entry): entry is {id:string;url:string;kind:"photo"|"card";not_eaten:boolean} => entry !== null);
  const photoUrl = slides[0]?.url ?? null;

  const items: FeedItem[] = row.status === "ready" ? await getCurrentItems(supabase, row.id) : [];

  const {data:saved,error:savedError}=await supabase.from('saved_meals').select('id').eq('source_post_id',row.id).maybeSingle();
  if(savedError)throw new Error('Saved meal state could not be read.');
  const revisionAfter=row.status==="ready"?await latestRevision(supabase,row.id):null;
  return {
    fail_reason: row.fail_reason ?? null,
    agentName: (Array.isArray(row.agent_tokens) ? row.agent_tokens[0] : row.agent_tokens)?.name ?? null,
    agent_token_id: row.agent_token_id ?? null,
    saved_meal_id:saved?.id??null,
    modelCommentId: row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.modelCommentId??null:null,
    analysisFingerprint:row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.fingerprint??null:null,
    day: zone ? dateInZone(row.eaten_at, zone) : undefined,
    gtin: items.find(item=>item.gtin)?.gtin,
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

// Batch optional card fields by page; a failed auxiliary read never strands Home.
async function optionalRead<T>(stage: string, read: () => PromiseLike<T>, fallback: T): Promise<T> {
  const started = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([Promise.resolve().then(read), new Promise<T>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Feed read timed out.')), 8000);
    })]);
  } catch { return fallback; }
  finally { if (timeout) clearTimeout(timeout); if (typeof window === 'undefined') console.info(`feed read ${stage} ${Date.now() - started}`); }
}

export async function toFeedPosts(db: SupabaseClient, rows: PostRow[], zone = "UTC"): Promise<FeedPost[]> {
  if (!rows.length) return [];
  const ids = rows.map(row => row.id), ready = rows.filter(row => row.status === 'ready');
  const revisions = () => Promise.all(ready.map(row => optionalRead('revision', () => latestRevision(db, row.id), null)));
  // Preserve the revision snapshot fence around nutrition reads, so a concurrent
  // correction cannot attach feedback to nutrition from another revision.
  const before = await revisions();
  const [media, nutrition, saved] = await Promise.all([
    optionalRead('media', async () => {
      const result = await db.from('post_media').select('id,post_id,storage_path,kind,not_eaten,position').in('post_id', ids).order('position').abortSignal(AbortSignal.timeout(8000));
      if (result.error) throw result.error; return result.data ?? [];
    }, []),
    optionalRead('items', () => getCurrentItemsForPosts(db, ready.map(row => row.id)), new Map<string, CurrentItem[]>()),
    optionalRead('saved', async () => {
      const result = await db.from('saved_meals').select('id,source_post_id').in('source_post_id', ids).abortSignal(AbortSignal.timeout(8000));
      if (result.error) throw result.error; return result.data ?? [];
    }, []),
  ]);
  const paths = [...new Set(media.map(entry => entry.kind === 'card' ? entry.storage_path : feedPathFor(entry.storage_path)))];
  const urls = await optionalRead('signed-urls', async () => {
    if (!paths.length) return new Map<string, string>();
    const result = await db.storage.from('media').createSignedUrls(paths, 3600);
    if (result.error) throw result.error;
    return new Map((result.data ?? []).filter(entry => entry.signedUrl && !entry.error).map(entry => [entry.path!, entry.signedUrl]));
  }, new Map<string, string>());
  const after = await revisions();
  const revisionById = new Map(ready.map((row, index) => [row.id, before[index] && JSON.stringify(before[index]) === JSON.stringify(after[index]) ? after[index] : null]));
  return rows.map(row => {
    const items = nutrition.get(row.id) ?? [];
    const slides = media.filter(entry => entry.post_id === row.id).flatMap(entry => {
      const url = urls.get(entry.kind === 'card' ? entry.storage_path : feedPathFor(entry.storage_path));
      return url ? [{ id: entry.id, url, kind: entry.kind as 'photo' | 'card', not_eaten: Boolean(entry.not_eaten) }] : [];
    });
    const revision = revisionById.get(row.id);
    return { fail_reason: row.fail_reason ?? null, agentName: (Array.isArray(row.agent_tokens) ? row.agent_tokens[0] : row.agent_tokens)?.name ?? null,
      agent_token_id: row.agent_token_id ?? null, saved_meal_id: saved.find(entry => entry.source_post_id === row.id)?.id ?? null,
      modelCommentId: revision?.modelCommentId ?? null, analysisFingerprint: revision?.fingerprint ?? null,
      day: dateInZone(row.eaten_at, zone), gtin: items.find(item => item.gtin)?.gtin,
      id: row.id, caption: row.caption, eaten_at: row.eaten_at, status: row.status, created_at: row.created_at,
      photoUrl: slides[0]?.url ?? null, slides, items, count_text: items[0]?.count_text ?? null };
  });
}

export const VISIBLE_MEAL_FILTER="needs_input.is.null,status.eq.failed";

// Stable keyset pagination by eaten_at (when the meal was eaten): the ID breaks ties between equal timestamps.
export async function getFeed(
  supabase: SupabaseClient,
  userId: string,
  before: string | null = null,
  zone = "UTC",
  limit = FEED_PAGE_SIZE
): Promise<{posts: FeedPost[]; nextCursor:string|null; days: FeedDayTotal[]}> {
  const cursor = before === null ? null : parseFeedCursor(before);
  limit = Math.max(1, Math.min(FEED_PAGE_SIZE, Math.trunc(limit) || FEED_PAGE_SIZE));
  let query = supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)")
    .eq("user_id", userId).neq("status","needs_input")
    .order("eaten_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  query = cursor ? query.or(`and(or(${VISIBLE_MEAL_FILTER}),or(eaten_at.lt.${cursor.eaten_at},and(eaten_at.eq.${cursor.eaten_at},id.lt.${cursor.id})))`) : query.or(VISIBLE_MEAL_FILTER);
  const {data,error} = await query.abortSignal(AbortSignal.timeout(8000));
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as PostRow[];
  const page = rows.slice(0,limit);
  const posts = await toFeedPosts(supabase,page,zone);
  const [hydration, days] = await Promise.all([
    optionalRead('hydration', () => getPostHydrationData(supabase, userId, posts.map(post => ({...post,items:post.items.map(item=>({...item,micronutrients:item.micronutrients??[]}))})), zone), {}),
    optionalRead('day-totals', () => getDayTotals(supabase,userId,zone,page.map(row=>dateInZone(row.eaten_at,zone))), []),
  ]);
  return {posts:posts.map(post => ({ ...post, ...hydration[post.id] })), days, nextCursor: rows.length>limit ? encodeFeedCursor(page.at(-1)!) : null};
}

// One card's worth of data, used for realtime refreshes and polling.
export async function getPostCard(
  supabase: SupabaseClient,
  postId: string,
  // Realtime refreshes run in the browser and must retain its local-day record.
  // Server entry points pass the request's explicit/cookie zone.
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)")
    .eq("id", postId).or(VISIBLE_MEAL_FILTER)
    .maybeSingle<PostRow>();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  const post = await toFeedPost(supabase, data, zone);
  const hydration = await optionalRead('hydration', () => getPostHydrationData(supabase, data.user_id, [{...post,items:post.items.map(item=>({...item,micronutrients:item.micronutrients??[]}))}], zone), {});
  return { ...post, ...hydration[post.id] };
}

// Search preserves the RPC's relevance order while sharing hydration reads for
// every result on a page, just like the Home feed.
export async function getPostCards(supabase: SupabaseClient, postIds: string[], zone = "UTC"): Promise<FeedPost[]> {
  if (!postIds.length) return [];
  const { data, error } = await supabase.from("posts").select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)")
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
