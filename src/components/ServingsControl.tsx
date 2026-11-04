"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_SERVINGS, MIN_SERVINGS, parseServings, servingsLabel, stepServings } from "@/lib/posts/servings";

// Servings on post detail: scales every item and the totals (the server rescales the stored nutrition, no model call).
export default function ServingsControl({ postId, servings }: { postId: string; servings: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(servingsLabel(servings));
  const submit = async (next: number) => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/servings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ servings: next }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Servings could not be changed.");
      setDraft(servingsLabel(next));
      router.refresh();
    } catch (e) { setDraft(servingsLabel(servings)); setError(e instanceof Error ? e.message : "Servings could not be changed."); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const change = (direction: 1 | -1) => submit(stepServings(servings, direction));
  return <section aria-label="Servings" className="flex flex-wrap items-center gap-2 px-screen-x pt-sheet-top text-detail">
    <span className="text-muted">Servings</span>
    <button type="button" aria-label="Fewer servings" disabled={busy || servings <= MIN_SERVINGS} onClick={() => { void change(-1); }} className="min-h-tap min-w-tap disabled:opacity-50">−</button>
    <input type="text" inputMode="decimal" aria-label="Servings count" value={draft} onChange={event => setDraft(event.currentTarget.value)} disabled={busy} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} onBlur={() => {
      const next = parseServings(draft);
      if (next === null) { setDraft(servingsLabel(servings)); setError("Enter a count from 0.25 to 50, in quarters."); return; }
      setDraft(servingsLabel(next)); setError("");
      if (next !== servings) void submit(next);
    }} className="h-tap w-16 rounded-field border border-line bg-white text-center text-detail tabular-nums disabled:opacity-50" />
    <button type="button" aria-label="More servings" disabled={busy || servings >= MAX_SERVINGS} onClick={() => { void change(1); }} className="min-h-tap min-w-tap disabled:opacity-50">+</button>
    {error ? <p role="alert" className="w-full text-meta text-muted">{error}</p> : null}
  </section>;
}
