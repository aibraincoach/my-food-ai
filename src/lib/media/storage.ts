import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "media";

export interface SignedUpload {
  position: number;
  originalPath: string;
  feedPath: string;
  originalSignedUrl: string;
  feedSignedUrl: string;
  originalToken: string;
  feedToken: string;
}

// Signed upload URLs under media/{uid}/{post}/ for both JPEGs of each shot.
// The caller must have verified post ownership (RLS on posts enforces it).
export async function signShotUploads(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  positions: number[]
): Promise<SignedUpload[]> {
  const out: SignedUpload[] = [];
  for (const position of positions) {
    const originalPath = `${userId}/${postId}/${position}.jpg`;
    const feedPath = `${userId}/${postId}/${position}.feed.jpg`;
    const [original, feed] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUploadUrl(originalPath),
      supabase.storage.from(BUCKET).createSignedUploadUrl(feedPath),
    ]);
    if (original.error || !original.data) {
      throw new Error(original.error?.message ?? "sign-upload: original URL failed.");
    }
    if (feed.error || !feed.data) {
      throw new Error(feed.error?.message ?? "sign-upload: feed URL failed.");
    }
    out.push({
      position,
      originalPath,
      feedPath,
      originalSignedUrl: original.data.signedUrl,
      feedSignedUrl: feed.data.signedUrl,
      originalToken: original.data.token,
      feedToken: feed.data.token,
    });
  }
  return out;
}
