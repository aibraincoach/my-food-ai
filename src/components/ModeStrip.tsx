"use client";

import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { CaptureMode } from "@/components/CaptureSheet";

const modes: CaptureMode[] = ["text", "photo", "barcode"];
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
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
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
    onPointerCancel(event: PointerEvent<HTMLElement>) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      start.current = null; swiped.current = false;
    },
  };
}

export function BarcodeGlyph({ className = "" }: { className?: string }) {
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className={className}><path d="M1 1h1v12H1zm2 0h2v12H3zm3 0h1v12H6zm3 0h1v12H9zm2 0h2v12h-2z" /></svg>;
}

export default function ModeStrip({ mode, onChange, disabled = false, highlightBarcode = false }: {
  mode: CaptureMode; onChange: (mode: CaptureMode) => void; disabled?: boolean; highlightBarcode?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [animate,setAnimate]=useState(false);
  const swipe = useModeSwipe(mode, onChange, disabled);
  useLayoutEffect(() => {
    const update = () => {
      const active = track.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (active) setOffset(active.offsetLeft + active.offsetWidth / 2);
    };
    update();
    const frame=requestAnimationFrame(()=>setAnimate(true));
    const observer = new ResizeObserver(update);
    if (track.current) observer.observe(track.current);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [mode]);
  return <div role="tablist" aria-label="Capture mode" aria-orientation="horizontal"
    className="relative h-11 touch-pan-y overflow-hidden"
    {...swipe}
    onKeyDown={event => {
      if (disabled || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const last=modes.length-1;
      const index = event.key === "Home" ? 0 : event.key === "End" ? last
        : Math.max(0, Math.min(last, modes.indexOf(mode) + (event.key === "ArrowRight" ? 1 : -1)));
      onChange(modes[index]);
      track.current?.querySelectorAll<HTMLButtonElement>("button")[index]?.focus();
    }}>
    <div ref={track} className="absolute left-1/2 top-1 flex w-max items-center gap-6 transition-transform duration-[180ms] motion-reduce:transition-none"
      style={{ transform: `translateX(-${offset}px)`, transitionDuration:animate?undefined:"0ms" }}>
      {modes.map(tab => <button key={tab} type="button" role="tab" aria-selected={mode === tab}
        tabIndex={mode === tab ? 0 : -1} disabled={disabled} onClick={() => onChange(tab)}
        className={`relative flex h-9 shrink-0 items-center gap-1.5 rounded-pill px-[18px] text-[15px] disabled:opacity-50 ${mode === tab ? "font-semibold text-white" : "font-normal text-white/60"} ${tab === "barcode" && highlightBarcode ? "barcode-hint-ring ring-[1.5px] ring-white" : ""}`}>
        {tab === "barcode" && <BarcodeGlyph />}{labels[tab]}
        {mode === tab && <span aria-hidden="true" className="absolute bottom-0 left-1/2 size-1 -translate-x-1/2 rounded-full bg-accent" />}
      </button>)}
    </div>
    <style jsx>{`
      @keyframes barcode-hint-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
      .barcode-hint-ring { animation: barcode-hint-nudge 700ms ease-in-out 2; }
      @media (prefers-reduced-motion: reduce) { .barcode-hint-ring { animation: none; } }
    `}</style>
  </div>;
}
