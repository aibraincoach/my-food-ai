import type { SupabaseClient } from "@supabase/supabase-js";

export const MAX_CAPTION_LENGTH = 2000;
export function validCaption(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_CAPTION_LENGTH && !value.includes("\u0000");
}

// Caption editing deliberately has no queue, nutrition or item dependencies.
export async function saveCaption(db: SupabaseClient, userId: string, postId: string, caption: string) {
  if (!validCaption(caption)) return { status: 400, error: "Caption must contain at most 2000 characters." } as const;
  const { data, error } = await db.from("posts").update({ caption }).eq("id", postId).eq("user_id", userId).select("id").maybeSingle();
  if (error) return { status: 500, error: "The caption could not be saved." } as const;
  if (!data) return { status: 404, error: "Meal not found." } as const;
  return { status: 200, caption } as const;
}
