import { reencodeShot } from "./reencode";
import type { SignedUpload } from "./storage";

type Photo = { path: string; width: number; height: number };
// Retain completed PUTs when a save fails, so retry uses the same tracked stage.
export class PackPhotoUpload {
  private pending: { file: File; image: Awaited<ReturnType<typeof reencodeShot>>; upload: SignedUpload; completed: Set<string>; expiresAt: number } | null = null;
  constructor(private encode = reencodeShot, private request: typeof fetch = (...args) => fetch(...args), private now = Date.now) {}
  async prepare(file: File): Promise<Photo> {
    // Renew before the two-hour upload capability ends, also before three-hour cleanup.
    if (this.pending?.file !== file || this.pending.expiresAt <= this.now()) {
      const image = await this.encode(file);
      const response = await this.request("/api/media/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staged: true }) });
      if (!response.ok) throw new Error("The pack photo could not be uploaded.");
      const { uploads } = await response.json() as { uploads: SignedUpload[] };
      this.pending = { file, image, upload: uploads[0], completed: new Set(), expiresAt: this.now() + 110 * 60 * 1000 };
    }
    const { image, upload, completed } = this.pending;
    for (const [url, blob] of [[upload.originalSignedUrl, image.original], [upload.feedSignedUrl, image.feed]] as const) {
      if (completed.has(url)) continue;
      const response = await this.request(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob });
      if (!response.ok) throw new Error("The pack photo could not be uploaded.");
      completed.add(url);
    }
    return { path: upload.originalPath, width: image.width, height: image.height };
  }
}
