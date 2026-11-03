"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { dismissHint, getHintState } from "@/lib/profile/hints";

type HintKey = "capture" | "thread" | "thumbs" | "modes";
const claimed = new Set<string>();
const copy: Record<HintKey, string> = {
  modes: "Swipe to scan a barcode",
  capture: "A caption alone works too",
  thread: "Reply here to fix the estimate",
  thumbs: "Was this estimate right?",
};

export default function FirstRunHint({ hint, onTryBarcode, onVisibilityChange }: { hint: HintKey; onTryBarcode?: () => void; onVisibilityChange?: (visible: boolean) => void }) {
  const dismiss = useRef<() => void>(() => {});
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let live = true;
    let identity: string | null = null;
    let dismissed = false;
    const hide = () => {
      if (!identity || dismissed) return;
      dismissed = true;
      setVisible(false);
      // Keep the session claim while retrying a transient action failure.
      void dismissHint(hint).catch(() => dismissHint(hint)).catch(() => {});
    };
    dismiss.current = hide;
    void getHintState(hint).then((state) => {
      if (!live || !state || state.seen) return;
      const key = `${state.userId}:${hint}`;
      if (claimed.has(key)) return;
      claimed.add(key); identity = key; setVisible(true);
      if (hint === "modes") window.addEventListener("capture-shot", hide);
      else {
        document.addEventListener("pointerdown", hide, true);
        document.addEventListener("keydown", hide, true);
      }
    }).catch(() => {});
    return () => {
      live = false;
      window.removeEventListener("capture-shot", hide);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      // A disappearing host before dismissal may present the hint next time.
      if (identity && !dismissed) claimed.delete(identity);
    };
  }, [hint]);
  useEffect(() => {
    onVisibilityChange?.(visible);
    return () => onVisibilityChange?.(false);
  }, [visible, onVisibilityChange]);
  if (!visible) return null;
  if (hint === "modes") return <section aria-label="Barcode tip" className="relative z-10 mx-5 mb-3 max-w-[350px] rounded-card bg-surface p-4 text-text shadow-lg">
    <h2 className="text-[15px] font-semibold">{copy.modes}</h2>
    <p className="mt-2 text-[14px] leading-5">Packaged food? Barcode mode reads the code and fills in the product. A photo of a barcode or a nutrition label in Photo mode is read too.</p>
    <div className="mt-3 flex items-center gap-4">
      <button type="button" onClick={() => { dismiss.current(); onTryBarcode?.(); }} className="min-h-tap rounded-pill bg-accent px-4 text-[14px] font-semibold text-white">Try Barcode</button>
      <button type="button" onClick={() => dismiss.current()} className="min-h-tap px-2 text-[14px]">Got it</button>
    </div>
  </section>;
  return <span className="pointer-events-none relative z-10 inline-flex pb-3">
    <Tooltip className={hint === "thumbs" ? "" : "[&>span:first-child]:!left-4"} light={hint === "capture"} caret={hint === "thumbs" ? "left" : "bottom"}>{copy[hint]}</Tooltip>
  </span>;
}
