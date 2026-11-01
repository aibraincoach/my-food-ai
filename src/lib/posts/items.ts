import { getPostHydrationData } from "@/lib/intake/hydration";
import { cardDataFromRow } from "@/lib/pipeline/card-data";
import { getFoodById, searchFoods } from "@/lib/fdc/client";
import { isUnit, OZ_G, roundGrams, toGrams, type Unit } from "@/lib/nutrition/units";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentItems, type CurrentItem } from "@/lib/nutrition/totals";

export type ItemBox = { left: number; top: number; right: number; bottom: number };
export type DetailItem = Omit<CurrentItem, "box"> & { box: ItemBox | null; maskUrl: string | null };
export type DetailPhoto = { url: string; width: number; height: number };
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
      fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef };
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
  const { data: post, error } = await supabase.from("posts").select("id,user_id,caption,eaten_at,status,analysis_initialized_at,servings")
    .eq("id", postId).maybeSingle();
  if (error) throw new Error("Meal could not be loaded.");
  if (!post) return null;
  const current = await getCurrentItems(supabase, postId);
  const { data: media, error: mediaError } = await supabase.from("post_media").select("storage_path,width,height")
    .eq("kind", "photo").eq("post_id", postId).order("position").limit(1).maybeSingle();
  if (mediaError) throw new Error("Meal photo could not be loaded.");
  let photo: DetailPhoto | null = null;
  if (media) {
    const signed = await supabase.storage.from("media").createSignedUrl(media.storage_path, 3600);
    if (signed.error || !signed.data) throw new Error("Meal photo could not be opened.");
    photo = { url: signed.data.signedUrl, width: media.width || 1, height: media.height || 1 };
  }
  const items: DetailItem[] = await Promise.all(current.map(async (item) => {
    let maskUrl: string | null = null;
    if (item.mask_path) {
      const signed = await supabase.storage.from("media").createSignedUrl(item.mask_path, 3600);
      maskUrl = signed.data?.signedUrl ?? null;
    }
    return { ...item, box: itemBox(item.box), maskUrl };
  }));
  const hydrated = (await getPostHydrationData(supabase, post.user_id, [{ id: postId, eaten_at: post.eaten_at, items }], zone))[postId];
  return { post, photo, items, isDrink: hydrated.kind === "drink", ...hydrated,
    cardData: cardDataFromRow({ ...post, items, ...hydrated }) };
}
