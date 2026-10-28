"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_SERVINGS, MIN_SERVINGS, servingsLabel, stepServings } from "@/lib/posts/servings";

// Servings on post detail: scales every item and the totals (the server rescales the stored nutrition, no model call).
export default function ServingsControl({ postId, servings }: { postId: string; servings: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const change = async (direction: 1 | -1) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/servings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servings: stepServings(servings, direction) }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Servings could not be changed.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Servings could not be changed."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  return <section aria-label="Servings" className="flex flex-wrap items-center gap-2 px-screen-x pt-sheet-top text-detail">
    <span className="text-muted">Servings</span>
    <button type="button" aria-label="Fewer servings" disabled={busy || servings <= MIN_SERVINGS} onClick={() => { void change(-1); }} className="min-h-tap min-w-tap disabled:opacity-50">−</button>
    <span className="min-w-8 text-center tabular-nums" role="status">{servingsLabel(servings)}</span>
    <button type="button" aria-label="More servings" disabled={busy || servings >= MAX_SERVINGS} onClick={() => { void change(1); }} className="min-h-tap min-w-tap disabled:opacity-50">+</button>
    {error ? <p role="alert" className="w-full text-meta text-muted">{error}</p> : null}
  </section>;
}
