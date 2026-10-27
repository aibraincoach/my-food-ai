"use client";

export default function CaptureSheet({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Post a meal" className="fixed inset-0 z-50 bg-white">
      <div className="mx-auto flex min-h-full w-full max-w-[390px] flex-col p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Post a meal</h1>
          <button type="button" onClick={onClose} aria-label="Close" className="px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <p className="mt-4 text-sm text-neutral-500">
          Camera capture lands here in item 6. Caption-only posts are valid.
        </p>
      </div>
    </div>
  );
}
