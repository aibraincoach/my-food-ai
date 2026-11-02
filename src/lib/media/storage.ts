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
// The caller supplies the authenticated owner and verified post/reservation scope.
// Storage RLS also enforces the first path folder when the capability is minted.
export async function signShotUploads(
  supabase: SupabaseClient,
  userId: string,
  postId: string,
  positions: number[],
  options: { upsert?: boolean } = {}
): Promise<SignedUpload[]> {
  // Capability replacement is opt-in: legacy and staged callers remain write-once.
  const signingOptions = options.upsert === true ? { upsert: true } : undefined;
  const out: SignedUpload[] = [];
  for (const position of positions) {
    const originalPath = `${userId}/${postId}/${position}.jpg`;
    const feedPath = `${userId}/${postId}/${position}.feed.jpg`;
    const [original, feed] = await Promise.all([
      supabase.storage.from(BUCKET).createSignedUploadUrl(originalPath, signingOptions),
      supabase.storage.from(BUCKET).createSignedUploadUrl(feedPath, signingOptions),
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
