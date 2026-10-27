"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { TopBar } from "@/components/ui/TopBar";
import { createPost } from "@/lib/posts/create";
import { tokens } from "@/lib/theme/tokens";

type Shot = { file: File; previewUrl: string };
const MAX_SHOTS = 8;

export default function CaptureSheet({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const shotsRef = useRef<Shot[]>([]);
  const postingRef = useRef(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !postingRef.current) onClose();
      if (event.key !== "Tab") return;
      const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([type="file"]):not([disabled])'
      );
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (!first || !last) {
        event.preventDefault();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose]);

  useEffect(() => () => {
    for (const shot of shotsRef.current) URL.revokeObjectURL(shot.previewUrl);
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files || postingRef.current) return;
    const added = Array.from(files)
      .slice(0, MAX_SHOTS - shotsRef.current.length)
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    shotsRef.current = [...shotsRef.current, ...added];
    setShots(shotsRef.current);
  };

  const removeShot = (index: number) => {
    if (postingRef.current) return;
    const shot = shotsRef.current[index];
    if (!shot) return;
    URL.revokeObjectURL(shot.previewUrl);
    shotsRef.current = shotsRef.current.filter((_, i) => i !== index);
    setShots(shotsRef.current);
  };

  const post = async () => {
    if (postingRef.current || (!caption.trim() && shotsRef.current.length === 0)) return;
    postingRef.current = true;
    setPosting(true);
    setError(null);
    try {
      const { postId } = await createPost(caption, shotsRef.current.map((shot) => shot.file));
      // Uploads are complete. Home can fetch the complete card even if its
      // Realtime INSERT event arrived before the files or was never delivered.
      window.dispatchEvent(new CustomEvent("post-created", { detail: { id: postId } }));
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Posting failed.");
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const latest = shots[shots.length - 1];
  const full = shots.length >= MAX_SHOTS;

  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="capture-title" className="fixed inset-0 z-50 overflow-y-auto bg-camera text-surface">
      <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-col">
        <TopBar
          title={<span id="capture-title">New post</span>}
          left={<button ref={closeRef} type="button" onClick={onClose} disabled={posting} aria-label="Close capture" className="flex size-tap items-center justify-start disabled:opacity-50"><Icon name="close" /></button>}
          right={<span className="w-tap" aria-hidden="true" />}
        />
        <div className="relative flex shrink-0 items-center justify-center overflow-hidden bg-camera text-camera-muted" style={{ height: tokens.capture.previewHeight, marginTop: tokens.capture.previewTop }}>
          {latest ? (
            // Local blob previews require no remote image transformation.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={latest.previewUrl} alt="Latest meal photo" className="h-full w-full object-cover" />
          ) : <Icon name="camera" />}
        </div>
        <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" disabled={posting || full} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" disabled={posting || full} onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }} />
        <div className="flex shrink-0 items-center justify-center" style={{ height: tokens.capture.controlsHeight, gap: tokens.capture.controlsGap }}>
          <button type="button" aria-label="Choose photos from gallery" disabled={posting || full} onClick={() => galleryRef.current?.click()} className="flex size-tap items-center justify-center rounded-circle bg-camera-button disabled:opacity-50"><Icon name="camera" size={tokens.capture.galleryIcon} /></button>
          <button type="button" aria-label="Take a photo" disabled={posting || full} onClick={() => cameraRef.current?.click()} className="flex items-center justify-center rounded-circle border-surface disabled:opacity-50" style={{ width: tokens.capture.shutterSize, height: tokens.capture.shutterSize, borderWidth: tokens.capture.shutterBorder }}>
            <span className="block rounded-circle bg-surface" style={{ width: tokens.capture.shutterDisc, height: tokens.capture.shutterDisc }} />
          </button>
          <span className="size-tap" aria-hidden="true" />
        </div>
        <div className="flex shrink-0 overflow-x-auto px-screen-x" style={{ gap: tokens.capture.thumbGap }} aria-label="Meal photos">
          {shots.map((shot, i) => (
            <button key={shot.previewUrl} type="button" aria-label={`Remove photo ${i + 1}`} disabled={posting} onClick={() => removeShot(i)} className="relative shrink-0 overflow-hidden rounded-thumb disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.previewUrl} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute right-0 top-0 rounded-bl-chip bg-overlay p-grid"><Icon name="close" size={tokens.spacing['icon-small']} /></span>
            </button>
          ))}
          {!full && <button type="button" aria-label="Add another photo" disabled={posting} onClick={() => galleryRef.current?.click()} className="flex shrink-0 items-center justify-center rounded-thumb border border-dashed border-camera-muted text-camera-muted disabled:opacity-50" style={{ width: tokens.capture.thumbSize, height: tokens.capture.thumbSize }}><Icon name="plus" size={tokens.capture.addIcon} /></button>}
        </div>
        <div className="min-h-card-gap flex-1" />
        <div className="flex flex-col px-screen-x pb-card-gap" style={{ gap: tokens.capture.bottomGap }}>
          <Field variant="camera" id="capture-caption" aria-label="Caption" value={caption} onChange={(event) => setCaption(event.target.value)} disabled={posting} placeholder="What did you eat?" />
          <p className="px-grid text-meta text-camera-muted">Location is saved with the post and helps recognise meals you eat in the same place. Only you see it.</p>
          {error && <p role="alert" className="text-detail text-surface">{error}</p>}
          <Button variant="camera" onClick={post} disabled={posting || (!caption.trim() && shots.length === 0)}>{posting ? "Posting…" : "Post"}</Button>
        </div>
      </div>
    </div>
  );
}
