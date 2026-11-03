import { getPostHydrationData, type DrinkCardData, type HydrationRecord } from "@/lib/intake/hydration";
import { dateInZone, getDayTotals, type FeedDayTotal } from "./days";
import { encodeFeedCursor, parseFeedCursor } from "./feed-cursor";
import type { SupabaseClient } from "@supabase/supabase-js";
import { feedCopyUrl } from "@/lib/media/media-url";
import {smallFeedPhotoUrl} from '@/lib/posts/feed-photo-url';
import { getCurrentItems, getCurrentItemsForPosts, type Numeric, type CurrentItem } from "@/lib/nutrition/totals";

export type PostStatus =
  | "queued"
  | "processing"
  | "needs_input"
  | "ready"
  | "failed";

export interface FeedItem {
  not_eaten_grams?:number|null;
  not_eaten_calories?:number|null;
  not_eaten_count_text?:string|null;
  count_text?:string|null;
  supersedes?:string|null;
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
  itemsUnavailable?: boolean;
  mediaUnavailable?: boolean;
  expectedMediaIds?: string[];
  savedStateUnavailable?: boolean;
  hydrationUnavailable?: boolean;
  summariesDeferred?: boolean;
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

export function hasUnavailableFields(post: FeedPost): boolean {
  return Boolean(post.itemsUnavailable || post.mediaUnavailable || post.savedStateUnavailable || post.hydrationUnavailable);
}
// A failed optional read is not a removal, an unsave or a zero. Preserve each
// previous field only when it still describes this owned post; nutrition also
// requires an identical analysis revision, and media respects known removals.
export function retainCompleteItems(previous: FeedPost | undefined, fresh: FeedPost): FeedPost {
  if (!previous || previous.id !== fresh.id) return fresh;
  const next = {...fresh};
  if (fresh.itemsUnavailable && previous.status === 'ready' && previous.items.length > 0
    && fresh.analysisFingerprint && fresh.analysisFingerprint === previous.analysisFingerprint) next.items = previous.items;
  if (fresh.savedStateUnavailable) next.saved_meal_id = previous.saved_meal_id;
  if (fresh.mediaUnavailable) {
    const expected = fresh.expectedMediaIds && new Set(fresh.expectedMediaIds);
    const keep = previous.slides.filter(slide => !expected || Boolean(slide.id && expected.has(slide.id)));
    const byId = new Map([...keep, ...fresh.slides].map(slide=>[slide.id ?? slide.url,slide]));
    next.slides = expected ? fresh.expectedMediaIds!.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]) : [...byId.values()];
    next.photoUrl = next.slides[0]?.url ?? null;
  }
  if (fresh.hydrationUnavailable && previous.eaten_at === fresh.eaten_at && previous.day === fresh.day) {
    next.kind=previous.kind;next.drink=previous.drink;next.drinkSource=previous.drinkSource;
    next.itemDrinks=previous.itemDrinks;next.foodWaterMl=previous.foodWaterMl;next.dayHydration=previous.dayHydration;
  }
  return next;
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
 const {data,error}=await client.rpc('feedback_revision',{p_post_id:postId}).abortSignal(AbortSignal.timeout(8000));
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

export async function toFeedPosts(db: SupabaseClient, rows: PostRow[], zone = "UTC", onFirstPhoto?: (url: string) => void): Promise<FeedPost[]> {
  if (!rows.length) return [];
  const ids = rows.map(row => row.id), ready = rows.filter(row => row.status === 'ready');
  const revisions = () => Promise.all(ready.map(row => optionalRead('revision', () => latestRevision(db, row.id), null)));
  // Start immutable media and its signed URLs immediately. SSR can emit the
  // first-photo preload while the revision-fenced nutrition is still reading.
  const mediaRead = optionalRead<null | {id:string;post_id:string;storage_path:string;kind:string;not_eaten:boolean;position:number}[]>('media', async () => {
    const result = await db.from('post_media').select('id,post_id,storage_path,kind,not_eaten,position').in('post_id', ids).order('position').abortSignal(AbortSignal.timeout(8000));
    if (result.error) throw result.error; return result.data ?? [];
  }, null);
  const savedRead = optionalRead<null | {id:string;source_post_id:string}[]>('saved', async () => {
    const result = await db.from('saved_meals').select('id,source_post_id').in('source_post_id', ids).abortSignal(AbortSignal.timeout(8000));
    if (result.error) throw result.error; return result.data ?? [];
  }, null);
  const urlRead = mediaRead.then(async media => {
    const paths = [...new Set((media ?? []).map(entry => entry.kind === 'card' ? entry.storage_path : feedPathFor(entry.storage_path)))];
    const first = media?.find(entry => entry.post_id === rows[0].id);
    const firstPath = first && first.kind !== 'card' ? feedPathFor(first.storage_path) : null;
    const smallFirst = firstPath && first ? smallFeedPhotoUrl(rows[0].user_id, rows[0].id, first.id) : null;
    if (smallFirst) onFirstPhoto?.(smallFirst);
    // Fast SSR and the full page share one immutable private photo URL.
    // Legacy identifiers retain the shared owner/path signing fallback.
    const firstRead = smallFirst ? Promise.resolve(smallFirst) : firstPath ? optionalRead('first-photo', () => feedCopyUrl(db, firstPath, rows[0].user_id), null) : Promise.resolve(null);
    const batchRead = optionalRead('signed-urls', async () => {
      if (!paths.length) return new Map<string, string>();
      const signedPaths = smallFirst ? paths.filter(path => path !== firstPath) : paths;
      if (!signedPaths.length) return new Map<string, string>();
      const result = await db.storage.from('media').createSignedUrls(signedPaths, 3600);
      if (result.error) throw result.error;
      return new Map((result.data ?? []).filter(entry => entry.signedUrl && !entry.error).map(entry => [entry.path!, entry.signedUrl]));
    }, new Map<string, string>());
    const [urls, firstUrl] = await Promise.all([batchRead, firstRead]);
    if (firstPath && firstUrl) urls.set(firstPath, firstUrl);
    const url = first && urls.get(first.kind === 'card' ? first.storage_path : feedPathFor(first.storage_path));
    if (url && !smallFirst) onFirstPhoto?.(url);
    return urls;
  });
  const beforeRead = revisions();
  const nutritionRead = beforeRead.then(() => optionalRead('items', () => getCurrentItemsForPosts(db, ready.map(row => row.id)), new Map<string, CurrentItem[]>()));
  const afterRead = nutritionRead.then(() => revisions());
  const [media, nutrition, saved, urls, before, after] = await Promise.all([mediaRead, nutritionRead, savedRead, urlRead, beforeRead, afterRead]);
  const revisionById = new Map(ready.map((row, index) => [row.id, before[index] && JSON.stringify(before[index]) === JSON.stringify(after[index]) ? after[index] : null]));
  return rows.map(row => {
    const items: FeedItem[] = (nutrition.get(row.id) ?? []).map(item => ({
      id: item.id, name: item.name, gtin: item.gtin, portion_text: item.portion_text, portion_grams: item.portion_grams,
      not_eaten_grams: item.not_eaten_grams, not_eaten_calories: item.not_eaten_calories, not_eaten_count_text: item.not_eaten_count_text,
      count_text: item.count_text, supersedes: item.supersedes, calories: item.calories, protein_g: item.protein_g, carbs_g: item.carbs_g,
      fat_g: item.fat_g, fibre_g: item.fibre_g, sugar_g: item.sugar_g, sodium_mg: item.sodium_mg,
      // Feed cards need water only; full micronutrients belong to post detail.
      micronutrients: item.micronutrients.filter(entry => entry.nutrientId === 1051),
    }));
    const ownMedia = media?.filter(entry => entry.post_id === row.id);
    const slides = (ownMedia ?? []).flatMap(entry => {
      const url = urls.get(entry.kind === 'card' ? entry.storage_path : feedPathFor(entry.storage_path));
      return url ? [{ id: entry.id, url, kind: entry.kind as 'photo' | 'card', not_eaten: Boolean(entry.not_eaten) }] : [];
    });
    const revision = revisionById.get(row.id);
    return { mediaUnavailable: media === null || slides.length !== (ownMedia?.length ?? 0), expectedMediaIds: ownMedia?.map(entry=>entry.id), savedStateUnavailable: saved === null, itemsUnavailable: row.status === 'ready' && !nutrition.has(row.id), fail_reason: row.fail_reason ?? null, agentName: (Array.isArray(row.agent_tokens) ? row.agent_tokens[0] : row.agent_tokens)?.name ?? null,
      agent_token_id: row.agent_token_id ?? null, saved_meal_id: saved?.find(entry => entry.source_post_id === row.id)?.id ?? null,
      modelCommentId: revision?.modelCommentId ?? null, analysisFingerprint: revision?.fingerprint ?? null,
      day: dateInZone(row.eaten_at, zone), gtin: items.find(item => item.gtin)?.gtin,
      id: row.id, caption: row.caption, eaten_at: row.eaten_at, status: row.status, created_at: row.created_at,
      photoUrl: slides[0]?.url ?? null, slides, items, count_text: items[0]?.count_text ?? null };
  });
}

export const VISIBLE_MEAL_FILTER="needs_input.is.null,status.eq.failed";

// The critical first-photo path does not wait for six meals' nutrition and
// feedback fences. Embedded media remains authorized by the caller's RLS.
export async function getFirstFeedPhoto(db: SupabaseClient, userId: string) {
  const {data, error} = await db.from('posts').select('id,user_id,caption,eaten_at,post_media(id,storage_path,kind,position)').is("deleted_at", null)
    .eq('user_id',userId).neq('status','needs_input').or(VISIBLE_MEAL_FILTER)
    .order('eaten_at',{ascending:false}).order('id',{ascending:false}).limit(1).abortSignal(AbortSignal.timeout(8000)).maybeSingle();
  if(error)throw new Error('The first meal could not be read.');
  if(!data)return null;
  if(data.user_id!==userId)throw new Error('The first meal owner did not match.');
  const photo=[...(data.post_media??[])].filter(row=>row.kind==='photo').sort((a,b)=>a.position-b.position)[0];
  const photoUrl=photo?(smallFeedPhotoUrl(data.user_id,data.id,photo.id)??await feedCopyUrl(db,feedPathFor(photo.storage_path),data.user_id)):null;
  return {id:data.id,caption:data.caption??'',eaten_at:data.eaten_at,photoUrl};
}


// Stable keyset pagination by eaten_at (when the meal was eaten): the ID breaks ties between equal timestamps.
export async function getFeed(
  supabase: SupabaseClient,
  userId: string,
  before: string | null = null,
  zone = "UTC",
  limit = FEED_PAGE_SIZE,
  options: { summaries?: boolean; knownDays?: readonly string[]; onFirstPhoto?: (url: string) => void } = {}
): Promise<{posts: FeedPost[]; nextCursor:string|null; days: FeedDayTotal[]}> {
  const cursor = before === null ? null : parseFeedCursor(before);
  limit = Math.max(1, Math.min(FEED_PAGE_SIZE, Math.trunc(limit) || FEED_PAGE_SIZE));
  let query = supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)").is("deleted_at", null)
    .eq("user_id", userId).neq("status","needs_input")
    .order("eaten_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);
  query = cursor ? query.or(`and(or(${VISIBLE_MEAL_FILTER}),or(eaten_at.lt.${cursor.eaten_at},and(eaten_at.eq.${cursor.eaten_at},id.lt.${cursor.id})))`) : query.or(VISIBLE_MEAL_FILTER);
  const postStarted = Date.now();
  const {data,error,status} = await query.abortSignal(AbortSignal.timeout(8000));
  if (typeof window === 'undefined') console.info(`feed read posts ${Date.now() - postStarted} status ${status}`);
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as PostRow[];
  const page = rows.slice(0,limit);
  const posts = await toFeedPosts(supabase,page,zone,options.onFirstPhoto);
  const knownDays = new Set(options.knownDays ?? []);
  const missingDays = [...new Set(page.map(row => dateInZone(row.eaten_at, zone)))].filter(day => !knownDays.has(day));
  const [hydration, days] = options.summaries === false ? [{}, []] as [Record<string, import('@/lib/intake/hydration').PostHydrationData>, FeedDayTotal[]] : await Promise.all([
    optionalRead('hydration', () => getPostHydrationData(supabase, userId, posts.map(post => ({...post,items:post.items.map(item=>({...item,micronutrients:item.micronutrients??[]}))})), zone), {}),
    missingDays.length ? optionalRead('day-totals', () => getDayTotals(supabase,userId,zone,missingDays), []) : Promise.resolve([]),
  ]);
  return {posts:posts.map(post => ({ ...post, ...hydration[post.id], hydrationUnavailable: options.summaries !== false && !hydration[post.id], summariesDeferred: options.summaries === false })), days, nextCursor: rows.length>limit ? encodeFeedCursor(page.at(-1)!) : null};
}

type CardWaiter = {resolve: (card: FeedPost | null) => void; reject: (error: unknown) => void};
const browserCardBatches = new WeakMap<SupabaseClient, Map<string, Map<string, CardWaiter[]>>>();
function queueBrowserCard(db: SupabaseClient, postId: string, zone: string): Promise<FeedPost | null> {
  return new Promise((resolve, reject) => {
    let zones = browserCardBatches.get(db);
    if (!zones) { zones = new Map(); browserCardBatches.set(db, zones); }
    let waiting = zones.get(zone);
    if (!waiting) {
      waiting = new Map(); zones.set(zone, waiting);
      const group = waiting, ownerZones = zones;
      setTimeout(() => {
        ownerZones.delete(zone);
        const params = new URLSearchParams({ids: [...group.keys()].join(','), tz: zone});
        void fetch(`/api/feed?${params}`, {cache:'no-store',signal:AbortSignal.timeout(15000)}).then(async response=>{
          if(!response.ok)throw new Error('Meal details could not be loaded.');
          return (await response.json() as {posts:FeedPost[]}).posts;
        }).then(cards => {
          const byId = new Map(cards.map(card => [card.id, card]));
          for (const [id, waiters] of group) for (const waiter of waiters) waiter.resolve(byId.get(id) ?? null);
        }).catch(error => { for (const waiters of group.values()) for (const waiter of waiters) waiter.reject(error); });
      }, 0);
    }
    waiting.set(postId, [...(waiting.get(postId) ?? []), {resolve, reject}]);
  });
}

// One card's worth of data, used for realtime refreshes and polling.
export async function getPostCard(
  supabase: SupabaseClient,
  postId: string,
  // Realtime refreshes run in the browser and must retain its local-day record.
  // Server entry points pass the request's explicit/cookie zone.
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone
): Promise<FeedPost | null> {
  if (typeof window !== 'undefined') return queueBrowserCard(supabase, postId, zone);
  const { data, error } = await supabase
    .from("posts")
    .select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)").is("deleted_at", null)
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
  const { data, error } = await supabase.from("posts").select("id,user_id,caption,eaten_at,status,created_at,fail_reason,agent_token_id,agent_tokens(name)").is("deleted_at", null)
    .in("id", postIds).or(VISIBLE_MEAL_FILTER).abortSignal(AbortSignal.timeout(8000));
  if (error) throw new Error("Meals could not be loaded.");
  const rows = (data ?? []) as PostRow[];
  const cards = await toFeedPosts(supabase, rows, zone);
  const hydrated = new Map<string, FeedPost>();
  for (const userId of new Set(rows.map(row => row.user_id))) {
    const ids = new Set(rows.filter(row => row.user_id === userId).map(row => row.id));
    const owned = cards.filter(post => ids.has(post.id));
    const values = await optionalRead('hydration', () => getPostHydrationData(supabase, userId, owned.map(post => ({ ...post, items: post.items.map(item => ({ ...item, micronutrients: item.micronutrients ?? [] })) })), zone), {});
    for (const post of owned) hydrated.set(post.id, { ...post, ...values[post.id], hydrationUnavailable: !values[post.id] });
  }
  return postIds.flatMap(id => { const post = hydrated.get(id); return post ? [post] : []; });
}
