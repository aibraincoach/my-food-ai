"use client";

import { useEffect, useRef, useState } from "react";
import { Field } from "@/components/ui/Field";

type Match = { id: number; description: string; serving_g: number; calories: number | null };

// "Search foods" in the + sheet: an FDC text search with calories per serving. Picking a result logs a ready post
// straight away (no model call); "Describe it instead" hands back to the caption and the model.
export default function FoodSearchPanel({ eatenAt, disabled, onLogged, onDescribe, onError }: {
  eatenAt: string | null; disabled: boolean; onLogged: (postId: string) => void; onDescribe: (text: string) => void; onError: (message: string | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ query: string; foods: Match[]; failed?: boolean } | null>(null);
  const [picking, setPicking] = useState(false);
  const pickingRef = useRef(false);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) return;   // results for an older, longer query are hidden by the query match below
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/fdc/search?q=${encodeURIComponent(text)}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("search");
        const body = await response.json() as { foods: Match[] };
        if (!controller.signal.aborted) setResults({ query: text, foods: body.foods });
      } catch { if (!controller.signal.aborted) setResults({ query: text, foods: [], failed: true }); }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const pick = async (food: Match) => {
    if (pickingRef.current || !results) return;
    pickingRef.current = true; setPicking(true); onError(null);
    try {
      const response = await fetch("/api/posts/food", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fdc_id: food.id, query: results.query, ...(eatenAt ? { eaten_at: eatenAt } : {}) }) });
      const body = await response.json().catch(() => ({})) as { post_id?: string; error?: string };
      if (!response.ok || !body.post_id) throw new Error(body.error ?? "The meal could not be saved.");
      onLogged(body.post_id);
    } catch (e) { onError(e instanceof Error ? e.message : "The meal could not be saved."); }
    finally { pickingRef.current = false; setPicking(false); }
  };

  const shown = results && results.query === query.trim() ? results : null;
  const busy = disabled || picking;
  return <div className="flex flex-col gap-2">
    <Field variant="camera" id="food-search" aria-label="Search foods" value={query} onChange={(event) => setQuery(event.target.value)} disabled={busy} placeholder="Search foods, for example croissant" autoComplete="off" />
    {shown?.failed ? <p className="px-grid text-detail text-camera-muted" role="status">Food search is temporarily unavailable.</p> : null}
    {shown && !shown.failed && shown.foods.length === 0 ? <p className="px-grid text-detail text-camera-muted" role="status">No foods found.</p> : null}
    {shown?.foods.length ? <ul aria-label="Food results" className="divide-y divide-surface/15">
      {shown.foods.map((food) => <li key={food.id}><button type="button" disabled={busy} onClick={() => { void pick(food); }} className="flex min-h-tap w-full items-baseline justify-between gap-3 px-grid py-grid text-left text-detail disabled:opacity-50">
        <span className="min-w-0 flex-1">{food.description}</span>
        <span className="shrink-0 tabular-nums text-camera-muted">{food.calories === null ? "–" : `${food.calories} kcal`} · {food.serving_g} g</span>
      </button></li>)}
    </ul> : null}
    {picking ? <p className="px-grid text-detail text-camera-muted" role="status">Logging…</p> : null}
    <button type="button" disabled={busy} onClick={() => onDescribe(query.trim())} className="min-h-tap self-start px-grid text-detail text-surface disabled:opacity-50">Describe it instead</button>
  </div>;
}
