"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/posts/create";

export default function CaptureSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shots, setShots] = useState<{ file: File; previewUrl: string }[]>([]);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setShots((prev) =>
      [...prev, ...Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))].slice(0, 8)
    );
  };

  const removeShot = (index: number) => {
    setShots((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, j) => j !== index);
    });
  };

  const post = async () => {
    setPosting(true);
    setError(null);
    try {
      await createPost(
        caption,
        shots.map((s) => s.file)
      );
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Post a meal" className="fixed inset-0 z-50 bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-[390px] flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Post a meal</h1>
          <button type="button" onClick={onClose} aria-label="Close" className="px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="border border-neutral-300 py-3 text-sm"
        >
          Take photo
        </button>
        {shots.length > 0 ? (
          <ul className="flex gap-2 overflow-x-auto">
            {shots.map((shot, i) => (
              <li key={`${shot.file.name}-${i}`} className="relative shrink-0">
                <img
                  src={shot.previewUrl}
                  alt={`Shot ${i + 1}`}
                  className="h-20 w-20 object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove shot ${i + 1}`}
                  onClick={() => removeShot(i)}
                  className="absolute right-0 top-0 bg-white px-1 text-xs"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          Caption
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What did you eat?"
            className="border border-neutral-300 px-3 py-2"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={post}
          disabled={posting}
          className="bg-black py-2 text-sm text-white disabled:opacity-50"
        >
          {posting ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}
