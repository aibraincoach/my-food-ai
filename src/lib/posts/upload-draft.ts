import type { SupabaseClient } from "@supabase/supabase-js";

export interface UploadShot { position: number; width: number; height: number; phash?: string }
export function validUploadShots(value: unknown): value is UploadShot[] {
  return Array.isArray(value) && value.length <= 8 && value.every((shot, index) => {
    if (!shot || typeof shot !== "object" || shot.position !== index || !Number.isInteger(shot.width) || shot.width < 1 || shot.width > 4096 || !Number.isInteger(shot.height) || shot.height < 1 || shot.height > 4096) return false;
    if (shot.phash === undefined) return true;
    if (typeof shot.phash !== "string" || !/^-?\d{1,20}$/.test(shot.phash)) return false;
    const hash = BigInt(shot.phash);
    return hash >= -(BigInt(1) << BigInt(63)) && hash < (BigInt(1) << BigInt(63));
  });
}
export async function publishUpload(db: SupabaseClient, userId: string, operationId: string) {
  const { data, error } = await db.rpc("publish_uploaded_post", { p_operation_id: operationId, p_user_id: userId });
  if (error || typeof data !== "string") throw new Error("The photo upload could not be completed. Your draft was kept; try again.");
  return data;
}
