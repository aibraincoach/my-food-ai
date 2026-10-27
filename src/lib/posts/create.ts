import type { CapturedLocation } from "@/lib/location/capture";
import { reencodeShot } from "@/lib/media/reencode";

export interface NewShot {
  file: File;
  previewUrl: string;
}

export interface CreatedPost {
  postId: string;
}

// Caption alone with no photo is a valid post. With shots, each file is
// re-encoded (EXIF stripped), the post row + analyze job are created, both
// JPEGs per shot are PUT to their signed URLs, and the complete step ticks
// the queue (item 7).
export async function createPost(caption: string, shots: File[], location: CapturedLocation | null = null): Promise<CreatedPost> {
  const reencoded = await Promise.all(shots.map((file) => reencodeShot(file)));
  const createRes = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caption,
      location,
      eaten_at: new Date().toISOString(),
      shots: reencoded.map((r, i) => ({ position: i, width: r.width, height: r.height })),
    }),
  });
  if (!createRes.ok) {
    throw new Error((await createRes.json())?.error ?? "Post creation failed.");
  }
  const { postId, uploads } = (await createRes.json()) as {
    postId: string;
    uploads: { position: number; originalSignedUrl: string; feedSignedUrl: string }[];
  };
  await Promise.all(
    uploads.flatMap((u) => {
      const r = reencoded[u.position];
      const put = (url: string, blob: Blob) =>
        fetch(url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob }).then(
          (res) => {
            if (!res.ok) throw new Error(`Upload failed for shot ${u.position}.`);
          }
        );
      return [put(u.originalSignedUrl, r.original), put(u.feedSignedUrl, r.feed)];
    })
  );
  await fetch("/api/posts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  }).catch(() => {});
  return { postId };
}
