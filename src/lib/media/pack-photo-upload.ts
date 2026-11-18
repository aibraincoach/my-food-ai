import { createClient } from "@/lib/supabase/client";
import { reencodeShot } from "./reencode";
import type { SignedUpload } from "./storage";

// A request that never answers must fail, so the three-attempt rule can end as the failed chip.
// The photo limit equals the 120 s the new-meal upload already allows (put-with-progress.ts).
export const JSON_REQUEST_LIMIT_MS = 20_000;
export const PHOTO_PUT_LIMIT_MS = 120_000;

// A PUT may commit while its response is lost. Reconcile by reading the exact bytes
// through the signed-in owner's storage policy; do not overwrite an attached photo.
export async function uploadedMatches(path: string, expected: Blob): Promise<boolean> {
  try {
    const { data, error } = await createClient().storage.from("media").download(path, {}, { signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) });
    if (error || !data || data.size !== expected.size) return false;
    const [actual, original] = await Promise.all([data.arrayBuffer(), expected.arrayBuffer()]);
    const bytes = new Uint8Array(original);
    return new Uint8Array(actual).every((value, index) => value === bytes[index]);
  } catch { return false; }
}

type Photo = { path: string; width: number; height: number };
// Retain completed PUTs when a save fails, so retry uses the same tracked stage.
export class PackPhotoUpload {
  private pending: { file: File; image: Awaited<ReturnType<typeof reencodeShot>>; upload: SignedUpload; completed: Set<string>; expiresAt: number } | null = null;
  constructor(private encode = reencodeShot, private request: typeof fetch = (...args) => fetch(...args), private now = Date.now, private verify = uploadedMatches) {}
  async prepare(file: File): Promise<Photo> {
    // Renew before the two-hour upload capability ends, also before three-hour cleanup.
    if (this.pending?.file !== file || this.pending.expiresAt <= this.now()) {
      // #684: each failure names its step, so the chip and the failure log can say which one failed.
      let image: Awaited<ReturnType<typeof reencodeShot>>;
      try { image = await this.encode(file); }
      catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { stage: "encode" }); }
      let response: Response;
      try { response = await this.request("/api/media/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staged: true }), signal: AbortSignal.timeout(JSON_REQUEST_LIMIT_MS) }); }
      catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { stage: "sign", status: (error as Error)?.name === "TimeoutError" ? "timeout" : "network" }); }
      if (!response.ok) throw Object.assign(new Error("The pack photo could not be uploaded."), { stage: "sign", status: String(response.status) });
      let uploads: SignedUpload[];
      try { ({ uploads } = await response.json() as { uploads: SignedUpload[] }); }
      catch (error) { throw Object.assign(error instanceof Error ? error : new Error(String(error)), { stage: "sign", status: String(response.status) }); }
      this.pending = { file, image, upload: uploads[0], completed: new Set(), expiresAt: this.now() + 110 * 60 * 1000 };
    }
    const { image, upload, completed } = this.pending;
    for (const [url, path, blob] of [[upload.originalSignedUrl, upload.originalPath, image.original], [upload.feedSignedUrl, upload.feedPath, image.feed]] as const) {
      if (completed.has(url)) continue;
      let confirmed = false, status = "network";
      try { const put = await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob, signal: AbortSignal.timeout(PHOTO_PUT_LIMIT_MS) }); status = String(put.status); confirmed = put.ok; }
      catch (error) { status = (error as Error)?.name === "TimeoutError" ? "timeout" : "network"; /* Read below reconciles a committed upload whose response was lost. */ }
      if (!confirmed) confirmed = await this.verify(path, blob);
      if (!confirmed) throw Object.assign(new Error("The pack photo could not be uploaded."), { stage: path === upload.originalPath ? "put-original" : "put-feed", status });
      completed.add(url);
    }
    return { path: upload.originalPath, width: image.width, height: image.height };
  }
}
