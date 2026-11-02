"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { CaptureMode } from "@/components/CaptureSheet";

const modes: CaptureMode[] = ["photo", "barcode", "text"];
const labels = { photo: "Photo", barcode: "Barcode", text: "Text" };

export function useModeSwipe(mode: CaptureMode, onChange: (mode: CaptureMode) => void, disabled: boolean) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const swiped = useRef(false);
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      if (disabled || !event.isPrimary || event.button !== 0) return;
      swiped.current = false;
      start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };

    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      if (origin && origin.id === event.pointerId && Math.abs(event.clientX - origin.x) >= 40 && Math.abs(event.clientX - origin.x) > Math.abs(event.clientY - origin.y)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    },
    onClickCapture(event: React.MouseEvent<HTMLElement>) {
      if (swiped.current) { event.preventDefault(); event.stopPropagation(); swiped.current = false; }
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      start.current = null;
      if (disabled || !origin || origin.id !== event.pointerId) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
      event.preventDefault();
      swiped.current = true;
      const index = Math.max(0, Math.min(modes.length - 1, modes.indexOf(mode) + (dx < 0 ? 1 : -1)));
      onChange(modes[index]);
    },
    onPointerCancel() { start.current = null; },
  };
}

export default function ModeStrip({ mode, onChange, disabled = false }: {
  mode: CaptureMode; onChange: (mode: CaptureMode) => void; disabled?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const swipe = useModeSwipe(mode, onChange, disabled);
  useLayoutEffect(() => {
    const update = () => {
      const active = track.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) setOffset(active.offsetLeft + active.offsetWidth / 2);
    };
    update();
    const observer = new ResizeObserver(update);
    if (track.current) observer.observe(track.current);
    return () => observer.disconnect();
  }, [mode]);
  return <div role="tablist" aria-label="Capture mode" aria-orientation="horizontal"
    className="relative h-11 touch-pan-y overflow-hidden"
    {...swipe}
    onKeyDown={event => {
      if (disabled || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const index = event.key === "Home" ? 0 : event.key === "End" ? 2
        : Math.max(0, Math.min(2, modes.indexOf(mode) + (event.key === "ArrowRight" ? 1 : -1)));
      onChange(modes[index]);
      track.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
    }}>
    <div ref={track} className="absolute left-1/2 top-1 flex w-max items-center gap-6 transition-transform duration-[180ms] motion-reduce:transition-none"
      style={{ transform: `translateX(-${offset}px)` }}>
      {modes.map(tab => <button key={tab} type="button" role="tab" aria-selected={mode === tab}
        tabIndex={mode === tab ? 0 : -1} disabled={disabled} onClick={() => onChange(tab)}
        className={`h-9 shrink-0 rounded-pill px-[18px] text-[15px] font-semibold disabled:opacity-50 ${mode === tab ? "bg-surface text-text" : "text-camera-muted"}`}>
        {labels[tab]}
      </button>)}
    </div>
  </div>;
}
