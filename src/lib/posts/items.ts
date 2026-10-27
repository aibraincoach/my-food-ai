import type { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentItems, type CurrentItem } from "@/lib/nutrition/totals";

export type ItemBox = { left: number; top: number; right: number; bottom: number };
export type DetailItem = Omit<CurrentItem, "box"> & { box: ItemBox | null; maskUrl: string | null };
export type DetailPhoto = { url: string; width: number; height: number };
export type ItemEdit = { action: "rename" | "portion" | "remove" | "add"; item_id?: string; name?: string; portion_grams?: number; box?: ItemBox };
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
  const b = body as Record<string, unknown>;
  if (!["rename", "portion", "remove", "add"].includes(String(b.action))) throw new Error("Invalid item action.");
  const action = b.action as ItemEdit["action"];
  if (action !== "add" && !isUuid(b.item_id)) throw new Error("An item ID is required.");
  if (action === "add" && b.item_id !== undefined) throw new Error("A new item cannot replace an existing ID.");
  if (b.name !== undefined && (typeof b.name !== "string" || !b.name.trim() || b.name.trim().length > 160)) throw new Error("Enter a name up to 160 characters.");
  if ((action === "add" || action === "rename") && b.name === undefined) throw new Error("A name is required.");
  if (b.portion_grams !== undefined && (typeof b.portion_grams !== "number" || !Number.isFinite(b.portion_grams) || b.portion_grams <= 0 || b.portion_grams > 100000)) throw new Error("Enter a portion between 0 and 100000 grams.");
  if ((action === "add" || action === "portion") && b.portion_grams === undefined) throw new Error("A portion in grams is required.");
  const box = b.box === undefined ? undefined : itemBox(b.box);
  if (box === null || (b.box !== undefined && action !== "add")) throw new Error("A valid box can be supplied for a new item only.");
  return { action, item_id: b.item_id as string | undefined, name: typeof b.name === "string" ? b.name.trim() : undefined,
    portion_grams: b.portion_grams as number | undefined, box };
}

export async function editPostItem(admin: SupabaseClient, postId: string, userId: string, edit: ItemEdit) {
  const { data, error } = await admin.rpc("edit_post_item", { p_post_id: postId, p_user_id: userId,
    p_action: edit.action, p_item_id: edit.item_id ?? null, p_name: edit.name ?? null,
    p_portion_grams: edit.portion_grams ?? null, p_box: edit.box ?? null });
  if (error) return { error, itemId: null };
  return { error: null, itemId: data as string | null };
}

export async function getPostDetail(supabase: SupabaseClient, postId: string) {
  const { data: post, error } = await supabase.from("posts").select("id,caption,eaten_at,status")
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
  return { post, photo, items };
}
