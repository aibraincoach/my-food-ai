"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromLocalInput, toLocalInput } from "@/lib/posts/eaten-at";

// "Time eaten" on post detail: change when the meal was eaten (feed, Days and Search follow it).
export default function EatenAtEditor({ postId, eatenAt }: { postId: string; eatenAt: string }) {
  const router = useRouter();
  const [value, setValue] = useState(() => toLocalInput(new Date(eatenAt)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const original = toLocalInput(new Date(eatenAt));
  const save = async () => {
    const iso = fromLocalInput(value);
    if (!iso) { setError("Choose a time that is not in the future."); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/eaten-at`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eaten_at: iso }) });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "The time could not be saved.");
      router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "The time could not be saved."); }
    finally { setSaving(false); }
  };
  return <section aria-label="Time eaten" className="flex flex-wrap items-center gap-2 px-screen-x pt-sheet-top text-detail">
    <label htmlFor="eaten-at" className="text-muted">Time eaten</label>
    <input id="eaten-at" type="datetime-local" value={value} max={toLocalInput(new Date())} disabled={saving} onChange={(event) => setValue(event.target.value)} className="min-h-tap rounded-field bg-field px-tooltip-x" />
    <button type="button" disabled={saving || value === original} onClick={() => { void save(); }} className="min-h-tap text-text disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
    {error ? <p role="alert" className="w-full text-meta text-muted">{error}</p> : null}
  </section>;
}
