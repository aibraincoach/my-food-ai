// Analyze pipeline entry (items 8-10 share this boundary).
// Item 8: load the first photo, segment it, store the mask PNGs.
// Item 9: name the regions with Muse Spark (identifyMeal below).
// Item 10: FDC lookup plus the one-RPC persist.
import type { SupabaseClient } from "@supabase/supabase-js";
import { segmentFoodRegions, type FoodRegion } from "@/lib/meta/sam";
import {
  identifyItems,
  type IdentifiedItem,
  type IdentifiedMeal,
} from "@/lib/meta/spark";
import { outlinePngFromRegion } from "./masks";

const BUCKET = "media";

export interface SegmentedRegion extends FoodRegion {
  maskPath: string;
}

export interface SegmentedPost {
  postId: string;
  userId: string;
  photoWidth: number;
  photoHeight: number;
  regions: SegmentedRegion[];
}

// First photo (position 0, original) as bytes plus its recorded size.
export async function loadFirstPhoto(
  supabase: SupabaseClient,
  postId: string
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const { data: media, error } = await supabase
    .from("post_media")
    .select("storage_path,width,height")
    .eq("post_id", postId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle<{
      storage_path: string;
      width: number | null;
      height: number | null;
    }>();
  if (error) throw new Error("analyze: photo metadata lookup failed.", { cause: error });
  if (!media) {
    throw new Error("analyze: post has no photo.");
  }
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(media.storage_path);
  if (downloadError || !blob) {
    throw new Error(
      `analyze: photo download failed: ${downloadError?.message ?? "empty object."}`,
      { cause: downloadError }
    );
  }
  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: media.width ?? 0,
    height: media.height ?? 0,
  };
}

export async function segmentPost(
  supabase: SupabaseClient,
  postId: string,
  userId: string
): Promise<SegmentedPost> {
  const photo = await loadFirstPhoto(supabase, postId);
  if (photo.width <= 0 || photo.height <= 0) {
    throw new Error("analyze: photo has no recorded size.");
  }
  const mime = "image/jpeg";
  const found = await segmentFoodRegions(
    photo.bytes,
    mime,
    photo.width,
    photo.height
  );
  const regions: SegmentedRegion[] = [];
  for (const region of found) {
    const maskPath = `${userId}/${postId}/masks/${region.index}.png`;
    const png = outlinePngFromRegion(region, photo.width, photo.height);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(maskPath, png, { contentType: "image/png", upsert: true });
    if (uploadError) {
      throw new Error(`analyze: mask upload failed: ${uploadError.message}`, { cause: uploadError });
    }
    regions.push({ ...region, maskPath });
  }
  return {
    postId,
    userId,
    photoWidth: photo.width,
    photoHeight: photo.height,
    regions,
  };
}

export interface NamedRegion extends SegmentedRegion {
  item: IdentifiedItem | null;
}

export interface NamedPost extends SegmentedPost {
  regions: NamedRegion[];
  // Items without a region (caption-only); item 10 persists them with
  // a null box and mask path.
  captionOnly: IdentifiedItem[];
  summary: string;
}

// Item 9: name the segmented regions with Muse Spark. Works with zero
// regions (whole-image naming). Unknown region indexes come back as
// null (caption-only). Item 10 persists the rows.
export async function identifyMeal(
  photo: Uint8Array | null,
  mime: string,
  caption: string | null,
  segmented: SegmentedPost
): Promise<NamedPost> {
  const meal: IdentifiedMeal = await identifyItems(
    photo,
    mime,
    caption,
    segmented.regions.map((r) => ({
      index: r.index,
      box: r.box,
      areaFraction: r.areaFraction,
    }))
  );
  const byRegion = new Map<number, IdentifiedItem>();
  const captionOnly: IdentifiedItem[] = [];
  for (const item of meal.items) {
    if (item.regionIndex === null) {
      captionOnly.push(item);
      continue;
    }
    if (!byRegion.has(item.regionIndex)) {
      byRegion.set(item.regionIndex, item);
    } else {
      // A second item for the same region is still food: keep it as a
      // caption-only row (null box) rather than dropping it silently.
      captionOnly.push(item);
    }
  }
  const regions: NamedRegion[] = segmented.regions.map((region) => ({
    ...region,
    item: byRegion.get(region.index) ?? null,
  }));
  return { ...segmented, regions, captionOnly, summary: meal.summary };
}

interface PostCaptionRow {
  user_id: string;
  caption: string | null;
}

// Item 10: full analyze pass for one post — caption, segment (mask PNGs),
// identify. The caller persists with persistAnalysis.
export async function analyzePost(
  supabase: SupabaseClient,
  postId: string
): Promise<NamedPost> {
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("user_id,caption")
    .eq("id", postId)
    .maybeSingle<PostCaptionRow>();
  if (postError) throw new Error("analyze: post lookup failed.", { cause: postError });
  if (!post) {
    throw new Error("analyze: post not found.");
  }
  // Caption-only posts are valid (item 6): with no post_media rows there
  // is nothing to segment, so Spark names from the caption alone and
  // every item persists with a null box and mask path (item 10).
  let segmented: SegmentedPost;
  let photo: Uint8Array | null;
  try {
    segmented = await segmentPost(supabase, postId, post.user_id);
    photo = (await loadFirstPhoto(supabase, postId)).bytes;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "analyze: post has no photo."
    ) {
      segmented = {
        postId,
        userId: post.user_id,
        photoWidth: 0,
        photoHeight: 0,
        regions: [],
      };
      photo = null;
    } else {
      throw error;
    }
  }
  return identifyMeal(photo, "image/jpeg", post.caption, segmented);
}
