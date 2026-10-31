import type { CapturedLocation } from "@/lib/location/capture";
import { reencodeShot } from "@/lib/media/reencode";
import { uploadedMatches } from "@/lib/media/pack-photo-upload";
import type { SignedUpload } from "@/lib/media/storage";

export interface NewShot { file: File; previewUrl: string }
export interface CreatedPost { postId: string }

// A capture sheet owns this operation until publication succeeds. Repeated attempts
// keep its identifier, encoded bytes and acknowledged uploads, including lost responses.
export class PostUploadDraft {
  private pending: { id: string; files: File[]; images: Promise<Awaited<ReturnType<typeof reencodeShot>>[]>; completed: Set<string> } | null = null;
  constructor(private encode = reencodeShot, private request: typeof fetch = (...args) => fetch(...args), private verify = uploadedMatches, private uuid = () => crypto.randomUUID()) {}

  async submit(caption: string, files: File[], location: CapturedLocation | null, eatenAt: string | null, intent: "photo" | "text"): Promise<CreatedPost> {
    if (intent === "photo" && files.length === 0) throw new Error("The selected photo is not ready. Your draft was kept.");
    if (!this.pending || files.length !== this.pending.files.length || files.some((file, i) => file !== this.pending!.files[i])) {
      this.pending = { id: this.uuid(), files: [...files], images: Promise.all(files.map(file => this.encode(file))), completed: new Set() };
    }
    const pending = this.pending;
    let images: Awaited<ReturnType<typeof reencodeShot>>[];
    try { images = await pending.images; }
    catch { this.pending = null; throw new Error("The photo could not be prepared. Your selected files were kept."); }
    const create = await this.request("/api/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation_id: pending.id, capture_intent: intent, caption, location, eaten_at: eatenAt ?? new Date().toISOString(), shots: images.map((image, position) => ({ position, width: image.width, height: image.height, phash: image.phash })) }) });
    if (!create.ok) {
      const detail = await create.json().catch(() => null);
      if (create.status === 410) this.pending = null;
      throw new Error(typeof detail?.error === "string" ? detail.error : "The post could not be prepared. Your draft was kept; try again.");
    }
    const result = await create.json() as { postId: string; uploads: SignedUpload[]; completed?: boolean };
    if (result.postId !== pending.id || !Array.isArray(result.uploads)) throw new Error("The post draft could not be confirmed. Try again.");
    if (result.completed) return { postId: result.postId };
    if (result.uploads.length !== images.length) throw new Error("The selected photos could not be confirmed. Your draft was kept.");
    for (const upload of result.uploads) {
      const image = images[upload.position];
      if (!image) throw new Error("The selected photos could not be confirmed.");
      for (const [url, path, blob] of [[upload.originalSignedUrl, upload.originalPath, image.original], [upload.feedSignedUrl, upload.feedPath, image.feed]] as const) {
        if (pending.completed.has(path)) continue;
        let confirmed = false;
        try { confirmed = (await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob })).ok; }
        catch { /* Reconcile an ambiguous upload through the owner's read policy. */ }
        if (!confirmed) confirmed = await this.verify(path, blob);
        if (!confirmed) throw new Error("The photo upload failed. Your draft was kept; try again.");
        pending.completed.add(path);
      }
    }
    const complete = await this.request("/api/posts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: pending.id }) });
    if (!complete.ok) {
      if (complete.status === 410) this.pending = null;
      throw new Error(complete.status === 410 ? "The upload draft expired. Your photos were kept; try again." : "The post could not be completed. Your uploaded photos were kept; try again.");
    }
    return { postId: pending.id };
  }
}

export async function createPost(caption: string, shots: File[], location: CapturedLocation | null = null, eatenAt: string | null = null, draft = new PostUploadDraft(), intent: "photo" | "text" = shots.length ? "photo" : "text"): Promise<CreatedPost> {
  return draft.submit(caption, shots, location, eatenAt, intent);
}
