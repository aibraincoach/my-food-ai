import type { SupabaseClient } from "@supabase/supabase-js";
import type { NamedRegion } from "./analyze";
import { outlinePngFromRegion } from "./masks";

export const MASK_UPLOAD_CONCURRENCY = 4;

// Only selected regions are referenced by persisted items. Bound buffers and
// uploads, and settle every started upload before the caller can publish/retry.
export async function uploadSelectedMasks(
  admin: SupabaseClient,
  regions: NamedRegion[],
  width: number,
  height: number,
): Promise<void> {
  const selected = regions.filter(region => region.item);
  let cursor = 0;
  let failed = false;
  let failure: unknown;
  const lane = async () => {
    while (!failed) {
      const index = cursor++;
      if (index >= selected.length) return;
      const region = selected[index];
      try {
        const png = outlinePngFromRegion(region, width, height);
        const { error } = await admin.storage.from("media").upload(region.maskPath, png, {
          contentType: "image/png", upsert: true,
        });
        if (error) throw new Error(`analyze: mask upload failed: ${error.message}`, { cause: error });
      } catch (error) {
        if (!failed) { failed = true; failure = error; }
      }
    }
  };
  await Promise.allSettled(Array.from({ length: Math.min(selected.length, MASK_UPLOAD_CONCURRENCY) }, lane));
  if (failed) throw failure;
}
