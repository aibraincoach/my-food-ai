import { reencodeShot } from "./reencode";
import type { SignedUpload } from "./storage";

type Photo = { path: string; width: number; height: number };
// Retain completed PUTs when a save fails, so retry uses the same tracked stage.
export class PackPhotoUpload {
  private pending: { file: File; image: Awaited<ReturnType<typeof reencodeShot>>; upload: SignedUpload; completed: Set<string> } | null = null;
  constructor(private encode = reencodeShot, private request: typeof fetch = (...args) => fetch(...args)) {}
  async prepare(file: File): Promise<Photo> {
    if (this.pending?.file !== file) {
      const image = await this.encode(file);
      const response = await this.request("/api/media/sign-upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ staged: true }) });
      if (!response.ok) throw new Error("The pack photo could not be uploaded.");
      const { uploads } = await response.json() as { uploads: SignedUpload[] };
      this.pending = { file, image, upload: uploads[0], completed: new Set() };
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
