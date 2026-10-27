"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { DetailItem, ItemBox, ItemEdit } from "@/lib/posts/items";
import { formatGrams, toNumber } from "@/lib/nutrition/totals";

type Match = { id: number; description: string };
export default function ItemEditSheet({ postId, item, color, box, onClose, onSaved, onAdd, onDraw }: {
  postId: string; item: DetailItem | null; color: string; box?: ItemBox;
  onClose: () => void; onSaved: () => void; onAdd: () => void; onDraw?: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [grams, setGrams] = useState(item?.portion_grams == null ? "" : String(item.portion_grams));
  const [chosen, setChosen] = useState(name);
  const [matches, setMatches] = useState<{ query: string; values: Match[]; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = name.trim();
    if (query.length < 2 || name === chosen) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/fdc/search?q=${encodeURIComponent(query)}`, { signal: controller.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Food search is temporarily unavailable. You can still enter a name.");
        const result = await response.json() as { foods: Match[] };
        if (!controller.signal.aborted) setMatches({ query, values: result.foods });
      } catch (cause) {
        if (!controller.signal.aborted) setMatches({ query, values: [], error: cause instanceof Error ? cause.message : "Food search is temporarily unavailable." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [name, chosen]);

  const submit = async (remove = false) => {
    if (savingRef.current) return;
    const amount = Number(grams);
    if (!remove && (!name.trim() || name.trim().length > 160 || !Number.isFinite(amount) || amount <= 0 || amount > 100000)) {
      setError("Enter a food name and a portion between 0 and 100000 grams."); return;
    }
    savingRef.current = true; setSaving(true); setError(null);
    const edit: ItemEdit = remove ? { action: "remove", item_id: item?.id } : {
      action: !item ? "add" : name.trim() !== item.name ? "rename" : "portion",
      item_id: item?.id, name: name.trim(), portion_grams: amount, ...(!item && box ? { box } : {}),
    };
    try {
      const response = await fetch(`/api/posts/${postId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The item could not be saved.");
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The item could not be saved."); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const visibleMatches = name !== chosen && matches?.query === name.trim() ? matches : null;
  return <Sheet open onClose={onClose} label={item ? "Edit meal item" : "Add meal item"}>
    <div className="flex items-center gap-2 text-sheet-title"><span className="size-shimmer-h shrink-0 rounded-circle" style={{ background: color }} aria-hidden="true" />
      <h2>{item ? `${item.name} · ${item.portion_grams == null ? "—" : formatGrams(item.portion_grams)} · ${item.calories == null ? "—" : Math.round(toNumber(item.calories))} kcal` : "Add another item"}</h2>
    </div>
    <div className="flex flex-col gap-grid">
      <Field label="Name" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} disabled={saving} autoComplete="off" />
      {visibleMatches?.values.length ? <ul aria-label="Food matches" className="divide-y divide-hairline">
        {visibleMatches.values.map((food) => <li key={food.id}><button type="button" disabled={saving}
          className="min-h-tap w-full py-grid text-left text-detail" onClick={() => { setName(food.description); setChosen(food.description); }}>{food.description}</button></li>)}
      </ul> : null}
      {visibleMatches?.error ? <p className="text-meta text-muted">{visibleMatches.error}</p> : null}
    </div>
    <div className="flex flex-col gap-2">
      <Field label="Portion" type="number" inputMode="decimal" min="0.01" max="100000" step="any" value={grams} suffix="g" disabled={saving} onChange={(event) => setGrams(event.target.value)} />
      <div className="flex gap-2">{[80, 120, 160, 200].map((amount) => <button type="button" key={amount} disabled={saving} aria-pressed={Number(grams) === amount}
        className={`min-h-tap flex-1 rounded-field border text-body ${Number(grams) === amount ? "border-text bg-text text-surface" : "border-line bg-white text-text"}`}
        onClick={() => setGrams(String(amount))}>{amount} g</button>)}</div>
    </div>
    {!item && onDraw ? <button type="button" onClick={onDraw} disabled={saving} className="min-h-tap text-left text-comment text-muted">{box ? "Draw a different box" : "Draw a box on the photo (optional)"}</button> : null}
    {error ? <p role="alert" className="text-detail text-text">{error}</p> : null}
    <Button disabled={saving} onClick={() => { void submit(); }}>{saving ? "Saving…" : "Save"}</Button>
    <div className="flex items-center justify-between gap-2 text-comment">
      {item ? <button type="button" disabled={saving} onClick={() => { void submit(true); }} className="min-h-tap text-muted">Remove this item</button> : <span />}
      <button type="button" disabled={saving} onClick={onAdd} className="min-h-tap font-medium">Add another item</button>
    </div>
  </Sheet>;
}
