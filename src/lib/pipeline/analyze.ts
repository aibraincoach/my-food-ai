import { readNutritionLabel, labelNutrition } from "@/lib/meta/label";
import { ApiError, ioError } from "@/lib/worker/errors";
import { isOwnedPhotoPath } from "@/lib/media/paths";
import { UPLOAD_GRACE_MS } from "@/lib/media/upload-window";
// Analyze pipeline entry (items 8-10 share this boundary).
// Load/segment once; identify before uploading only the referenced mask PNGs.
// Item 9: name the regions with Muse Spark (identifyMeal below).
// Item 10: FDC lookup plus the one-RPC persist.
import type { NeedsInput } from "./needs-input";
import type { SupabaseClient } from "@supabase/supabase-js";
import { segmentFoodRegions, type FoodRegion } from "@/lib/meta/sam";
import {
  identifyItems,
  type IdentifiedItem,
  type IdentifiedMeal,
} from "@/lib/meta/spark";
import { uploadSelectedMasks } from "./selected-masks";

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
export { UPLOAD_GRACE_MS };

// "Object not found" from storage (any status the SDK reports it under), within the grace period after creation.
export function photoStillUploading(error: unknown, createdAt: string | undefined, now = Date.now()): boolean {
  const fields = typeof error === "object" && error !== null ? error as { message?: unknown; statusCode?: unknown; error?: unknown } : {};
  // The SDK reports a missing object by message, by "404" in statusCode, or as error "not_found", depending on version.
  const missing = /not found/i.test(String(fields.message ?? "")) || String(fields.statusCode ?? "") === "404" || String(fields.error ?? "") === "not_found";
  const created = createdAt ? Date.parse(createdAt) : NaN;
  return missing && Number.isFinite(created) && now - created >= 0 && now - created < UPLOAD_GRACE_MS;
}

export async function loadFirstPhoto(
  supabase: SupabaseClient,
  postId: string
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const { data: media, error, status: mediaStatus } = await supabase
    .from("post_media")
    .select("storage_path,width,height")
    .eq("kind", "photo")
    .eq("not_eaten", false)
    .eq("post_id", postId)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle<{
      storage_path: string;
      width: number | null;
      height: number | null;
    }>();
  if (error) throw ioError("analyze: photo metadata lookup failed.", error, mediaStatus);
  if (!media) {
    throw new Error("analyze: post has no photo.");
  }
  const { data: post, error: ownerError, status: ownerStatus } = await supabase
    .from("posts").select("user_id,created_at").eq("id", postId).maybeSingle<{ user_id: string; created_at?: string }>();
  if (ownerError) throw ioError("analyze: photo owner lookup failed.", ownerError, ownerStatus);
  if (!post || !isOwnedPhotoPath(media.storage_path, post.user_id, postId)) {
    throw new Error("analyze: photo path does not belong to this meal.");
  }
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(media.storage_path);
  if (downloadError || !blob) {
    // The client uploads after the post exists. A missing object in the first minute is the upload still in
    // flight, so the job is retried with the usual backoff; a genuinely missing photo still fails after that.
    if (photoStillUploading(downloadError, post.created_at)) {
      throw new ApiError(503, "", "analyze: photo is not readable yet; retrying.");
    }
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
  userId: string,
  loadedPhoto?: Awaited<ReturnType<typeof loadFirstPhoto>>,
): Promise<SegmentedPost> {
  const photo = loadedPhoto ?? await loadFirstPhoto(supabase, postId);
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
  nutritionLabel?: boolean;
  labelNutrition?: Record<string,unknown>;
  regions: NamedRegion[];
  // Items without a region (caption-only); item 10 persists them with
  // a null box and mask path.
  captionOnly: IdentifiedItem[];
  summary: string;
  needsInput?: NeedsInput | null;
}

// Item 9: name the segmented regions with Muse Spark. Works with zero
// regions (whole-image naming). Unknown region indexes come back as
// null (caption-only). Item 10 persists the rows.
export async function identifyMeal(
  photo: Uint8Array | null,
  mime: string,
  caption: string | null,
  segmented: SegmentedPost,
  prior = "",
  additionalPhotos:Uint8Array[]=[],
  additionalRegionHints=""
): Promise<NamedPost> {
  const meal: IdentifiedMeal = await identifyItems(
    photo,
    mime,
    caption,
    segmented.regions.map((r) => ({
      index: r.index,
      box: r.box,
      areaFraction: r.areaFraction,
    })),
    prior,
    additionalPhotos,
    additionalRegionHints
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
  return { ...segmented, nutritionLabel: meal.nutritionLabel, regions, captionOnly, summary: meal.summary, needsInput: meal.needsInput };
}

interface PostCaptionRow {
  user_id: string;
  caption: string | null;
}

// Item 10: full analyze pass for one post — caption, segment (mask PNGs),
// identify. The caller persists with persistAnalysis.
export async function analyzePost(
  supabase: SupabaseClient,
  postId: string,
  prior = ""
): Promise<NamedPost> {
  const { data: post, error: postError, status: postStatus } = await supabase
    .from("posts")
    .select("user_id,caption")
    .eq("id", postId)
    .maybeSingle<PostCaptionRow>();
  if (postError) throw ioError("analyze: post lookup failed.", postError, postStatus);
  if (!post) {
    throw new Error("analyze: post not found.");
  }
  // Caption-only posts are valid (item 6): with no post_media rows there
  // is nothing to segment, so Spark names from the caption alone and
  // every item persists with a null box and mask path (item 10).
  let segmented: SegmentedPost;
  let photo: Uint8Array | null;
  try {
    const loaded = await loadFirstPhoto(supabase, postId);
    segmented = await segmentPost(supabase, postId, post.user_id, loaded);
    photo = loaded.bytes;
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
  const additionalPhotos:Uint8Array[]=[];
  const additionalRegionHints:string[]=[];
  const {data:extraMedia,error:extraError,status:extraStatus}=await supabase.from('post_media').select('storage_path,width,height').eq('post_id',postId).eq('kind','photo').eq('not_eaten',false).order('position').range(1,7);
  if(extraError)throw ioError('Additional meal photos could not be read.',extraError,extraStatus);
  for(const [index,entry] of (extraMedia??[]).entries()){
    if(!isOwnedPhotoPath(entry.storage_path,post.user_id,postId))throw Error('Additional photo does not belong to this meal.');
    const {data:blob,error}=await supabase.storage.from(BUCKET).download(entry.storage_path);
    if(error||!blob)throw ioError('Additional meal photo could not be opened.',error);
    const bytes=new Uint8Array(await blob.arrayBuffer());
    const regions=await segmentFoodRegions(bytes,'image/jpeg',entry.width??0,entry.height??0);
    additionalPhotos.push(bytes);
    additionalRegionHints.push(`Photo ${index+2}: ${regions.map(region=>`box [${region.box.left},${region.box.top},${region.box.right},${region.box.bottom}]`).join('; ')}`);
  }
  const named = await identifyMeal(photo, "image/jpeg", post.caption, segmented, prior,additionalPhotos,additionalRegionHints.join('\n'));
  if(named.nutritionLabel && !named.captionOnly.length && !named.regions.some(r=>r.item) && photo){
    const reading=await readNutritionLabel(photo);
    if(reading.is_label&&reading.serving&&reading.per_serving){
      named.captionOnly=[{regionIndex:null,name:"Packaged food",portionText:`${reading.serving.amount} ${reading.serving.unit}`,portionGrams:reading.serving.unit==="g"?reading.serving.amount:null,confidence:null}];
      named.labelNutrition=labelNutrition(reading,1);
      named.needsInput=null;
    }
  }
  await uploadSelectedMasks(supabase, named.regions, named.photoWidth, named.photoHeight);
  return named;
}
