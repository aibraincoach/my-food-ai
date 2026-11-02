import type { SupabaseClient } from "@supabase/supabase-js";
import { signShotUploads, type SignedUpload } from "@/lib/media/storage";

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
  if (error || typeof data !== "string") {
    const failure = new Error("The photo upload could not be completed. Your draft was kept; try again.");
    if (/expired/i.test(error?.message ?? "")) failure.name = "UploadExpiredError";
    throw failure;
  }
  return data;
}

export interface ReservationInput {
  operationId: string;
  caption: string;
  eatenAt: string;
  shots: UploadShot[];
  location: unknown;
  notEatenPositions: number[];
  saveAsMeal: boolean;
  renderZone: string | null;
}

export class UploadReservationError extends Error {
  constructor(public readonly status: 409 | 410 | 503, message: string) {
    super(message);
    this.name = "UploadReservationError";
  }
}

/** Only the authenticated reservation path may request overwrite capabilities.
 * The owner comes from auth.getUser(), never from a JSON body or operation ID.
 * No URL is signed when the RPC refuses an arbitrary/other-owner operation or
 * reports an already published tombstone. Existing URLs still expire normally.
 */
export async function reserveUpload(admin: SupabaseClient, ownerDb: SupabaseClient, userId: string, input: ReservationInput): Promise<{ postId: string; published: boolean; uploads: SignedUpload[] }> {
  const options = {
    p_operation_id: input.operationId, p_user_id: userId,
    p_caption: input.caption, p_eaten_at: input.eatenAt,
    p_shots: input.shots, p_location: input.location,
    p_save_as_meal: input.saveAsMeal, p_render_zone: input.renderZone,
  };
  let reserved = await admin.rpc("reserve_post_upload_with_leftovers", { ...options, p_not_eaten_positions: input.notEatenPositions });
  // Preserve the existing single-leftovers rollout fallback without downgrading
  // a multi-leftovers manifest into ordinary food photos.
  if (reserved.error?.code === "PGRST202" && reserved.error.message.includes("reserve_post_upload_with_leftovers") && input.notEatenPositions.length <= 1) {
    reserved = await admin.rpc("reserve_post_upload_with_options", { ...options, p_not_eaten_position: input.notEatenPositions[0] ?? null });
  }
  const { data, error } = reserved;
  if (error || !data || data.id !== input.operationId || typeof data.published !== "boolean") {
    const expired = /expired/i.test(error?.message ?? "");
    throw new UploadReservationError(expired ? 410 : 409, expired ? "The upload draft expired. Your photos were kept; try again." : "The post draft could not be reserved. Your photos were kept; try again.");
  }
  if (data.published || !input.shots.length) return { postId: input.operationId, published: data.published, uploads: [] };
  try {
    const uploads = await signShotUploads(ownerDb, userId, input.operationId, input.shots.map(shot => shot.position), { upsert: true });
    return { postId: input.operationId, published: false, uploads };
  } catch {
    throw new UploadReservationError(503, "Upload could not be prepared. Your draft was kept; try again.");
  }
}
