"use client";

import { Suspense, useCallback, useEffect, useState, type ComponentType } from "react";
import PlusMenu, { type PostEntry } from "@/components/PlusMenu";
import IntakeBar from "@/components/IntakeBar";
import { Sheet } from "@/components/ui/Sheet";
import BottomBar from "@/components/BottomBar";
import CaptureSheet from "@/components/CaptureSheet";
import PostCreatedListeners from "@/components/PostCreatedListeners";
import PostReadinessListener from "@/components/PostReadinessListener";
import QueueTicker from "@/components/QueueTicker";

// The existing controls accept these entry hints when their independent PRs land.
// Before then the legacy controls simply ignore the extra props.
const CaptureControl = CaptureSheet as ComponentType<{ onClose: () => void; initialMode?: "photo" | "text" }>;
const IntakeControl = IntakeBar as ComponentType<{ initialKind?: "water" | "caffeine"; embedded?: boolean; onClose?: () => void }>;

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [entry, setEntry] = useState<PostEntry | null>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const closeEntry = useCallback(() => setEntry(null), []);
  useEffect(() => {
    const openEntry = (event: Event) => {
      const value = (event as CustomEvent<{ entry?: PostEntry }>).detail?.entry;
      if (value && ["camera", "text", "drink", "coffee", "saved"].includes(value)) { setMenuOpen(false); setEntry(value); }
    };
    window.addEventListener("open-entry", openEntry);
    return () => window.removeEventListener("open-entry", openEntry);
  }, []);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-1 flex-col bg-surface pb-bar-safe">
      <QueueTicker />
      <PostCreatedListeners />
      <PostReadinessListener />
      <Suspense fallback={<p className="p-screen-x text-detail text-muted">Loading…</p>}>
        {children}
      </Suspense>
      <BottomBar onPlus={() => setMenuOpen(value => !value)} menuOpen={menuOpen} />
      <PlusMenu open={menuOpen} onClose={closeMenu} />
      {entry === "camera" || entry === "text" || entry === "saved" ? <CaptureControl key={entry} initialMode={entry === "camera" ? "photo" : "text"} onClose={closeEntry} /> : null}
      {entry === "drink" || entry === "coffee" ? <Sheet open onClose={closeEntry} label="Drink"><IntakeControl key={entry} initialKind={entry === "coffee" ? "caffeine" : "water"} embedded onClose={closeEntry} /></Sheet> : null}
    </div>
  );
}
