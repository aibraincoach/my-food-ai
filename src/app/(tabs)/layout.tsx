"use client";

import { Suspense, useState } from "react";
import BottomBar from "@/components/BottomBar";
import CaptureSheet from "@/components/CaptureSheet";
import PostCreatedListeners from "@/components/PostCreatedListeners";
import QueueTicker from "@/components/QueueTicker";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-phone flex-1 flex-col bg-surface pb-bar-h">
      <QueueTicker />
      <PostCreatedListeners />
      <Suspense fallback={<p className="p-screen-x text-detail text-muted">Loading…</p>}>
        {children}
      </Suspense>
      <BottomBar onPlus={() => setSheetOpen(true)} />
      {sheetOpen ? <CaptureSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}
