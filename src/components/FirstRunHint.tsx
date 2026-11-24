"use client";
import {useTranslations} from 'next-intl';


import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { dismissHint } from "@/lib/profile/hints";
import { createClient } from "@/lib/supabase/client";

type HintKey = "capture" | "thread" | "thumbs" | "modes";
const claimed = new Set<string>();
// One profile read per page load, shared by every card. A server action here
// re-rendered Home and remounted the feed.
let hintState: Promise<{ userId: string; seen: string[] } | null> | null = null;
let hintStateUserId: string | null = null;
async function loadHintState() {
  const db = createClient();
  const { data: { session } } = await db.auth.getSession();
  const userId = session?.user.id ?? null;
  // Server-action sign-in can change the account without reloading this module.
  // Session lookup is local; the profile read remains shared for the current user.
  if (hintStateUserId !== userId) { hintStateUserId = userId; hintState = null; }
  if (!userId) return null;
  const read = hintState ??= (async () => {
    const { data, error } = await db.from("profiles").select("hints_seen").eq("id", userId).single();
    if (error || !data) return null;
    return { userId, seen: [...(data.hints_seen as string[])] };
  })().catch(() => null).then(state => { if (!state && hintState === read) hintState = null; return state; });
  return read;
}


export default function FirstRunHint({ hint, onTryBarcode, onVisibilityChange }: { hint: HintKey; onTryBarcode?: () => void; onVisibilityChange?: (visible: boolean) => void }) {
  const t=useTranslations('hints');
  const copy:Record<HintKey,string>={modes:t('hintModes'),capture:t('hintCapture'),thread:t('hintThread'),thumbs:t('hintThumbs')};
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
      void hintState?.then(state => { if (state && identity === `${state.userId}:${hint}` && !state.seen.includes(hint)) state.seen.push(hint); });
      // Keep the session claim while retrying a transient action failure.
      void dismissHint(hint).catch(() => dismissHint(hint)).catch(() => {});
    };
    dismiss.current = hide;
    void loadHintState().then((state) => {
      if (!live || !state || state.seen.includes(hint)) return;
      const key = `${state.userId}:${hint}`;
      if (claimed.has(key)) return;
      claimed.add(key); identity = key; setVisible(true);
      if (hint === "modes") window.addEventListener("capture-shot", hide);
      else {
        document.addEventListener("click", hide, true);
        document.addEventListener("keydown", hide, true);
      }
    }).catch(() => {});
    return () => {
      live = false;
      window.removeEventListener("capture-shot", hide);
      document.removeEventListener("click", hide, true);
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
  if (hint === "modes") return <section aria-label={t('barcodeTip')} className="relative z-10 mx-5 mb-3 max-w-[350px] rounded-card bg-surface p-4 text-text shadow-lg">
    <h2 className="text-[15px] font-semibold">{copy.modes}</h2>
    <p className="mt-2 text-[14px] leading-5">{t('barcodeTipDescription')}</p>
    <div className="mt-3 flex items-center gap-4">
      <button type="button" onClick={() => { dismiss.current(); onTryBarcode?.(); }} className="min-h-tap rounded-pill bg-accent px-4 text-[14px] font-semibold text-white">{t('tryBarcode')}</button>
      <button type="button" onClick={() => dismiss.current()} className="min-h-tap px-2 text-[14px]">{t('gotIt')}</button>
    </div>
  </section>;
  return <span className="pointer-events-none relative z-10 inline-flex pb-3">
    <Tooltip className={hint === "thumbs" ? "" : "[&>span:first-child]:!left-4"} light={hint === "capture"} caret={hint === "thumbs" ? "left" : "bottom"}>{copy[hint]}</Tooltip>
  </span>;
}
