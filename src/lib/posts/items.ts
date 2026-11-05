import { getPostHydrationData } from "@/lib/intake/hydration";
import { cardDataFromRow } from "@/lib/pipeline/card-data";
import { getFoodById, searchFoods } from "@/lib/fdc/client";
import { isUnit, OZ_G, roundGrams, toGrams, type Unit } from "@/lib/nutrition/units";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentItems, type CurrentItem } from "@/lib/nutrition/totals";
import { latestRevision, toFeedPost, type PostRow as FeedRow, type FeedPost } from "@/lib/posts/feed";
import { smallFeedPhotoUrl } from "@/lib/posts/feed-photo-url";
import { createAdminClient } from "@/lib/supabase/admin";

export type ItemBox = { left: number; top: number; right: number; bottom: number };
export type DetailItem = Omit<CurrentItem, "box"> & { box: ItemBox | null; maskUrl: string | null };
export type DetailPhoto = { id?:string; url: string; previewUrl?: string; width: number; height: number; not_eaten?:boolean; expiresAt?: number };
export type DetailSlide = FeedPost["slides"][number] & {previewUrl?:string;width?:number;height?:number};
export type ItemEdit = { action: "rename" | "portion" | "remove" | "add"; item_id?: string; name?: string; portion_grams?: number; portion_amount?: number; portion_unit?: Unit; box?: ItemBox; fdc_selection?: { id: number; query: string } };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

export function itemBox(raw: unknown): ItemBox | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const b = raw as Record<string, unknown>;
  if (![b.left, b.top, b.right, b.bottom].every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  const box = b as ItemBox;
  return box.left >= 0 && box.top >= 0 && box.right > box.left && box.bottom > box.top ? box : null;
}

export function parseItemEdit(body: unknown): ItemEdit {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("An item edit is required.");
  let b = body as Record<string, unknown>;
  // An amount in another unit: oz converts exactly here; cup and piece need the food's stated weight, so the grams
  // stay a placeholder until editPostItem resolves them against the matched FDC food.
  let unit: Unit | undefined;
  if (b.portion_unit !== undefined) {
    if (!isUnit(b.portion_unit) || b.portion_grams !== undefined) throw new Error("Invalid portion unit.");
    const amount = b.portion_amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 100000) throw new Error("Enter an amount between 0 and 100000.");
    unit = b.portion_unit;
    b = { ...b, portion_grams: unit === "g" ? amount : unit === "oz" ? roundGrams(amount * OZ_G) : 1 };
  }
  if (!["rename", "portion", "remove", "add"].includes(String(b.action))) throw new Error("Invalid item action.");
  const action = b.action as ItemEdit["action"];
  if (action !== "add" && !isUuid(b.item_id)) throw new Error("An item ID is required.");
  if (action === "add" && b.item_id !== undefined) throw new Error("A new item cannot replace an existing ID.");
  if (b.name !== undefined && (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 160)) throw new Error("Enter a name up to 160 characters.");
  if ((action === "add" || action === "rename") && b.name === undefined) throw new Error("A name is required.");
  if (b.portion_grams !== undefined && (typeof b.portion_grams !== "number" || !Number.isFinite(b.portion_grams) || b.portion_grams <= 0 || b.portion_grams > 100000)) throw new Error("Enter a portion between 0 and 100000 grams.");
  if ((action === "add" || action === "portion") && b.portion_grams === undefined) throw new Error("A portion in grams is required.");
  let selection: ItemEdit["fdc_selection"];
  if (b.fdc_selection !== undefined) {
    const selected = b.fdc_selection as Record<string, unknown> | null;
    if (!selected || typeof selected !== "object" || !Number.isSafeInteger(selected.id) || Number(selected.id) <= 0
      || typeof selected.query !== "string" || selected.query.trim().length < 2 || selected.query.trim().length > 160
      || action === "remove" || b.name === undefined || b.portion_grams === undefined) throw new Error("Invalid food selection.");
    selection = { id: selected.id as number, query: selected.query.trim() };
  }
  const box = b.box === undefined ? undefined : itemBox(b.box);
  if (box === null || (b.box !== undefined && action !== "add")) throw new Error("A valid box can be supplied for a new item only.");
  return { action, item_id: b.item_id as string | undefined, name: typeof b.name === "string" ? b.name.trim() : undefined,
    portion_grams: b.portion_grams as number | undefined, box, fdc_selection: selection,
    ...(unit ? { portion_amount: b.portion_amount as number, portion_unit: unit } : {}) };
}

const UNIT_UNAVAILABLE = { code: "UNIT", message: "No weight is known for that unit." };
const amountText = (edit: ItemEdit) => edit.portion_unit && edit.portion_unit !== "g"
  ? `${edit.portion_amount} ${edit.portion_unit}${edit.portion_amount === 1 || edit.portion_unit === "oz" ? "" : "s"} (${edit.portion_grams} g)` : `${edit.portion_grams} g`;

export async function editPostItem(admin: SupabaseClient, postId: string, userId: string, edit: ItemEdit) {
  let before: string | null = null;
  if (edit.item_id) {
    const { data } = await admin.from("current_post_items").select("name").eq("id", edit.item_id).eq("post_id", postId).maybeSingle();
    before = (data as { name?: string } | null)?.name ?? null;
  }
  if (edit.portion_unit === "cup" || edit.portion_unit === "piece") {
    let foodId = edit.fdc_selection?.id ?? null;
    if (foodId === null && edit.item_id) {
      const { data } = await admin.from("item_nutrition").select("source_ref").eq("post_item_id", edit.item_id).maybeSingle();
      const ref = Number((data as { source_ref?: string | null } | null)?.source_ref);
      foodId = Number.isSafeInteger(ref) && ref > 0 ? ref : null;
    }
    const grams = foodId === null ? null : toGrams(edit.portion_amount!, edit.portion_unit, (await getFoodById(admin, foodId)).portions ?? []);
    if (grams === null) return { error: UNIT_UNAVAILABLE, itemId: null };
    edit = { ...edit, portion_grams: roundGrams(grams) };
  }
  let nutrition;
  if (edit.fdc_selection) {
    const food = (await searchFoods(admin, edit.fdc_selection.query)).find((row) => row.fdcId === edit.fdc_selection!.id);
    if (!food || food.description !== edit.name) return { error: { code: "22023", message: "Food selection changed; search again." }, itemId: null };
    const n = scaleNutrition(food, edit.portion_grams ?? null);
    nutrition = { calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG,
      fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef, food_category: n.foodCategory ?? null };
  }
  const { data, error } = await admin.rpc(nutrition ? "edit_post_item_with_nutrition" : "edit_post_item", { p_post_id: postId, p_user_id: userId,
    p_action: edit.action, p_item_id: edit.item_id ?? null, p_name: edit.name ?? null,
    p_portion_grams: edit.portion_grams ?? null, p_box: edit.box ?? null, ...(nutrition ? { p_nutrition: nutrition } : {}) });
  if (error) return { error, itemId: null };
  // The thread records what changed; a failed note never undoes the edit.
  const name = edit.name ?? before ?? "An item";
  const note = edit.action === "remove" ? `Removed ${before ?? "an item"}.`
    : edit.action === "add" ? `Added ${name}, ${amountText(edit)}.`
    : edit.action === "rename" ? `Renamed ${before ?? "an item"} to ${name}, ${amountText(edit)}.`
    : `${name} set to ${amountText(edit)}.`;
  await admin.from("post_comments").insert({ post_id: postId, author: "model", body: note });
  return { error: null, itemId: data as string | null };
}

export async function getPostDetail(supabase: SupabaseClient, postId: string, zone = "UTC") {
  const baseFields = "id,user_id,caption,eaten_at,status,analysis_initialized_at,servings,source_post_id,created_at,fail_reason,agent_token_id,agent_tokens(name),needs_input";
  type PostRow = FeedRow & {analysis_initialized_at:string|null;servings:number;source_post_id:string|null;needs_input:unknown;identify_model?:string|null;identify_host?:string|null};
  const read = (identity:boolean) => supabase.from("posts").select(identity?`${baseFields},identify_model,identify_host`:baseFields).is("deleted_at", null).eq("id",postId).maybeSingle<PostRow>();
  const loadPost = async () => {
    let result = await read(true);
    if (result.error && ["PGRST204", "42703"].includes(result.error.code) && /identify_(?:model|host)/.test(result.error.message)) result = await read(false);
    return result;
  };
  const postResult = await loadPost();
  const { data: post, error } = postResult;
  if (error) throw new Error("Meal could not be loaded.");
  if (!post) return null;
  const revisionBefore = post.status === "ready" ? await latestRevision(supabase, postId) : null;
  const [mediaResult, current] = await Promise.all([
    supabase.from("post_media").select("id,storage_path,kind,not_eaten,width,height").eq("post_id", postId).order("position"),
    getCurrentItems(supabase, postId),
  ]);
  const { data: mediaRows, error: mediaError } = mediaResult;
  if (mediaError) throw new Error("Meal photo could not be loaded.");
  const photoRows = (mediaRows ?? []).filter(entry => entry.kind === "photo");
  const media = photoRows[0];
  const maskPaths = current.map(item => item.mask_path).filter((path): path is string => Boolean(path));
  const signPaths = [...photoRows.map(row => row.storage_path), ...maskPaths];
  const identification = post.identify_model && post.identify_host ? { model: post.identify_model, host: post.identify_host } : null;
  const openFailurePromise = identification?.host === "meta"
    ? createAdminClient().from("model_calls").select("id").eq("post_id", postId).eq("host", "baseten").eq("kind", "spark_identify").not("error", "is", null).limit(1).abortSignal(AbortSignal.timeout(8000)).maybeSingle()
    : Promise.resolve({ data: null, error: null });
  const [signed, openFailureResult] = await Promise.all([
    signPaths.length ? supabase.storage.from("media").createSignedUrls(signPaths, 3600) : Promise.resolve(null),
    openFailurePromise,
  ]);
  const { data: openFailure, error: openFailureError } = openFailureResult;
  if (openFailureError) throw new Error("Meal identification could not be loaded.");
  const originalUrls = new Map((signed?.data ?? []).filter(entry => entry.signedUrl).map(entry => [entry.path, entry.signedUrl]));
  const items: DetailItem[] = current.map(item => ({
    ...item,
    box: itemBox(item.box),
    maskUrl: item.mask_path ? originalUrls.get(item.mask_path) ?? null : null,
  }));
  const photos: DetailPhoto[] = photoRows.map(entry=>{
    const previewUrl=smallFeedPhotoUrl(post.user_id,postId,entry.id)??undefined;
    const url=originalUrls.get(entry.storage_path);
    if(!url&&entry===media)throw new Error("Meal photo could not be opened.");
    const expiresAt=Date.now()+3600*1000;
    return{id:entry.id,url:url??previewUrl??'',previewUrl,width:entry.width||1,height:entry.height||1,not_eaten:Boolean(entry.not_eaten),expiresAt};
  });
  const photo=photos[0]??null;
  const hydrated = (await getPostHydrationData(supabase, post.user_id, [{ id: postId, eaten_at: post.eaten_at, items }], zone))[postId];
  const card = post.needs_input == null || post.status === "failed"
    ? { ...(await toFeedPost(supabase, post, zone, { items: current, revisionBefore, media: mediaRows ?? [] })), ...hydrated } : null;
  const byId=new Map(photos.map(entry=>[entry.id,entry]));
  const slides:DetailSlide[]=(card?.slides??[]).map(slide=>{
    const original=slide.kind==='photo'?byId.get(slide.id):null;
    return original?{...slide,url:original.url,previewUrl:original.previewUrl,width:original.width,height:original.height}:slide;
  });
  return { post, photo, photos, slides, items, identification: identification ?? null, openFallback: Boolean(openFailure), card, isDrink: hydrated.kind === "drink" && hydrated.drinkSource !== "item", ...hydrated,
    cardData: cardDataFromRow({ ...post, items, ...hydrated }) };
}
