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
}

export interface FeedPost {
  modelCommentId?: string | null;
  analysisFingerprint?: string | null;
  id: string;
  caption: string;
  eaten_at: string;
  status: PostStatus;
  photoUrl: string | null;
  slides: {url:string;kind?:"photo"|"card"}[];
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
  row: PostRow
): Promise<FeedPost> {
  const revisionBefore=row.status==="ready"?await latestRevision(supabase,row.id):null;
  const { data: media, error: mediaError } = await supabase.from("post_media")
    .select("storage_path,kind").eq("post_id",row.id).order("position");
  if(mediaError) throw new Error(mediaError.message);
  const slides = (await Promise.all((media ?? []).map(async (entry) => {
    try { return {url: await feedCopyUrl(supabase, entry.kind === "card" ? entry.storage_path : feedPathFor(entry.storage_path)),kind:entry.kind as "photo"|"card"}; }
    catch { return null; }
  }))).filter((entry): entry is {url:string;kind:"photo"|"card"} => entry !== null);
  const photoUrl = slides[0]?.url ?? null;

  const items: FeedItem[] = row.status === "ready" ? await getCurrentItems(supabase, row.id) : [];

  const revisionAfter=row.status==="ready"?await latestRevision(supabase,row.id):null;
  return {
    modelCommentId: row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.modelCommentId??null:null,
    analysisFingerprint:row.status==="ready"&&JSON.stringify(revisionBefore)===JSON.stringify(revisionAfter)?revisionAfter?.fingerprint??null:null,
    id: row.id,
    caption: row.caption,
    eaten_at: row.eaten_at,
    status: row.status,
    photoUrl,
    slides,
    created_at: row.created_at,
    items,
  };
}

// Stable keyset pagination: the ID breaks ties between equal timestamps.
export async function getFeed(
  supabase: SupabaseClient,
  userId: string,
  before: string | null = null
): Promise<{posts: FeedPost[]; nextCursor:string|null}> {
  const cursor = before === null ? null : parseFeedCursor(before);
  let query = supabase
    .from("posts")
    .select("id,caption,eaten_at,status,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE + 1);
  if (cursor) query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  const {data,error} = await query;
  if (error) {
    throw new Error(error.message);
  }
  const rows = (data ?? []) as PostRow[];
  const page = rows.slice(0,FEED_PAGE_SIZE);
  return {posts:await Promise.all(page.map((row)=>toFeedPost(supabase,row))), nextCursor: rows.length>FEED_PAGE_SIZE ? encodeFeedCursor(page.at(-1)!) : null};
}

// One card's worth of data, used for realtime refreshes and polling.
export async function getPostCard(
  supabase: SupabaseClient,
  postId: string
): Promise<FeedPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id,caption,eaten_at,status,created_at")
    .eq("id", postId)
    .maybeSingle<PostRow>();
  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return toFeedPost(supabase, data);
}
