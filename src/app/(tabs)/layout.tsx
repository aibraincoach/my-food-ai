"use client";

import { Suspense, useState } from "react";
import BottomBar from "@/components/BottomBar";
import CaptureSheet from "@/components/CaptureSheet";
import QueueTicker from "@/components/QueueTicker";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[390px] flex-col bg-white pb-16">
      <QueueTicker />
      <Suspense fallback={<p className="p-4 text-sm text-neutral-500">Loading…</p>}>
        {children}
      </Suspense>
      <BottomBar onPlus={() => setSheetOpen(true)} />
      {sheetOpen ? <CaptureSheet onClose={() => setSheetOpen(false)} /> : null}
    </div>
  );
}
