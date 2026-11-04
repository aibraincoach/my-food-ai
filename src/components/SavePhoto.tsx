"use client";
import {createPortal} from "react-dom";
import {useSyncExternalStore} from "react";

/** iOS 16.2+ share sheets from web apps omit Save Image; press-and-hold on the photo does. */
export function iosNeedsSaveHint(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/(iPhone|iPad|iPod)/.test(ua)) return false;
  const match = ua.match(/OS (\d+)[_.](\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > 16 || (major === 16 && minor >= 2);
}

export async function shareOrDownloadPhoto(file: File, previewUrl: string): Promise<void> {
  try {
    if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      return;
    }
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = file.name || "meal.jpg";
    link.click();
  } catch {
    /* The user can dismiss the share sheet. */
  }
}

const subscribeMounted = () => () => {};
const mounted = () => typeof document !== "undefined";

export function SavePhotoPrompt({ open, previewUrl, onClose }: { open: boolean; previewUrl: string; onClose: () => void }) {
  const ready = useSyncExternalStore(subscribeMounted, mounted, () => false);
  if (!open || !ready) return null;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Save photo" className="fixed inset-0 z-[200] flex items-end justify-center bg-scrim-32 p-4 desktop:items-center" onClick={onClose}>
      <div className="flex max-h-[92dvh] w-full max-w-phone flex-col gap-4 rounded-t-sheet bg-white p-4 desktop:rounded-sheet" onClick={(event) => event.stopPropagation()}>
        <p className="text-center text-body">Press and hold the photo, then tap Save to Photos</p>
        <img src={previewUrl} alt="" draggable={false} className="max-h-[70dvh] w-full object-contain [-webkit-touch-callout:default]" />
        <button type="button" onClick={onClose} className="min-h-tap rounded-field bg-field text-body">
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}
