import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "media";
const FEED_URL_TTL_SECONDS = 3600;

// One-hour signed read URL for a feed copy, rendered in a plain <img>.
export async function feedCopyUrl(
  supabase: SupabaseClient,
  feedPath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(feedPath, FEED_URL_TTL_SECONDS);
  if (error || !data) {
    throw new Error(error?.message ?? "media-url: signed read URL failed.");
  }
  return data.signedUrl;
}
