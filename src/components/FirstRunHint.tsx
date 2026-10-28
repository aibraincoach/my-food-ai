"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { dismissHint, getHintState } from "@/lib/profile/hints";

type HintKey = "capture" | "thread" | "thumbs";
const claimed = new Set<string>();
const copy: Record<HintKey, string> = {
  capture: "A caption alone works too",
  thread: "Reply here to fix the estimate",
  thumbs: "Was this estimate right?",
};

export default function FirstRunHint({ hint }: { hint: HintKey }) {
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
    void getHintState(hint).then((state) => {
      if (!live || !state || state.seen) return;
      const key = `${state.userId}:${hint}`;
      if (claimed.has(key)) return;
      claimed.add(key); identity = key; setVisible(true);
      document.addEventListener("pointerdown", hide, true);
      document.addEventListener("keydown", hide, true);
    }).catch(() => {});
    return () => {
      live = false;
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      // A disappearing host before dismissal may present the hint next time.
      if (identity && !dismissed) claimed.delete(identity);
    };
  }, [hint]);
  if (!visible) return null;
  return <span className="pointer-events-none relative z-10 inline-flex pb-3">
    <Tooltip className={hint === "thumbs" ? "" : "[&>span:first-child]:!left-4"} light={hint === "capture"} caret={hint === "thumbs" ? "left" : "bottom"}>{copy[hint]}</Tooltip>
  </span>;
}
