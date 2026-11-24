"use client";
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatNutrient,formatNumber,formatPortion} from '@/i18n/format';

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { DetailItem, ItemBox, ItemEdit } from "@/lib/posts/items";
import { OZ_G, UNITS, type Unit } from "@/lib/nutrition/units";

type Match = { id: number; description: string };
export default function ItemEditSheet({ postId, item, color, box, open = true, onClose, onSaved, onAdd, onDraw }: {
  postId: string; item: DetailItem | null; color: string; box?: ItemBox; open?: boolean;
  onClose: () => void; onSaved: () => void; onAdd: () => void; onDraw?: () => void;
}) {
  const t=useTranslations('postMenu'),tp=useTranslations('post'),locale=useLocale() as Locale;
  const unitLabel=(value:Unit)=>t(({g:'unitG',oz:'unitOz',piece:'unitPiece',cup:'unitCup'}as const)[value]);
  const [name, setName] = useState(item?.name ?? "");
  const [grams, setGrams] = useState(item?.portion_grams == null ? "" : String(item.portion_grams));
  const [unit, setUnit] = useState<Unit>("g");
  const [chosen, setChosen] = useState(name);
  const [fdcSelection, setFdcSelection] = useState<ItemEdit["fdc_selection"]>();
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
        if (!response.ok) throw new Error(t('searchUnavailableEntry'));
        const result = await response.json() as { foods: Match[] };
        if (!controller.signal.aborted) setMatches({ query, values: result.foods });
      } catch (cause) {
        if (!controller.signal.aborted) setMatches({ query, values: [], error: cause instanceof Error ? cause.message : t('searchUnavailable') });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [name, chosen, t]);

  // Keep the number meaningful across a unit change: g and oz convert, cup and piece start empty.
  const changeUnit = (next: Unit) => {
    const value = Number(grams);
    if (grams !== "" && Number.isFinite(value) && value > 0 && (unit === "g" || unit === "oz") && (next === "g" || next === "oz") && next !== unit) {
      setGrams(String(Math.round((next === "oz" ? value / OZ_G : value * OZ_G) * 100) / 100));
    } else if (next !== unit) setGrams("");
    setUnit(next);
  };
  const submit = async (remove = false) => {
    if (savingRef.current) return;
    const amount = Number(grams);
    if (!remove && (!name.trim() || name.trim().length > 160 || !Number.isFinite(amount) || amount <= 0 || amount > 100000)) {
      setError(t('foodPortionRequired')); return;
    }
    savingRef.current = true; setSaving(true); setError(null);
    const edit: ItemEdit = remove ? { action: "remove", item_id: item?.id } : {
      action: !item ? "add" : name.trim() !== item.name ? "rename" : "portion",
      item_id: item?.id, name: name.trim(), ...(unit === "g" ? { portion_grams: amount } : { portion_amount: amount, portion_unit: unit }), fdc_selection: fdcSelection, ...(!item && box ? { box } : {}),
    };
    try {
      const response = await fetch(`/api/posts/${postId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? t('itemSaveFailed'));
      onSaved();
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('itemSaveFailed')); }
    finally { savingRef.current = false; setSaving(false); }
  };
  const visibleMatches = name !== chosen && matches?.query === name.trim() ? matches : null;
  return <Sheet open={open} onClose={onClose} label={item ? t('editMealItem') : t('addMealItem')}>
    <div className="flex items-center gap-2 text-sheet-title"><span className="size-shimmer-h shrink-0 rounded-circle" style={{ background: color }} aria-hidden="true" />
      <h2>{item ? t('itemHeading',{name:item.name,portion:item.portion_grams == null ? '—' : formatPortion(locale,item.portion_grams),calories:formatNutrient(locale,item.calories)}) : tp('addItem')}</h2>
    </div>
    <div className="flex flex-col gap-grid">
      <Field label={t('nameField')} value={name} onChange={(event) => { setName(event.target.value); setFdcSelection(undefined); }} maxLength={160} disabled={saving} autoComplete="off" />
      {visibleMatches?.values.length ? <ul aria-label={t('foodMatches')} className="divide-y divide-hairline">
        {visibleMatches.values.map((food) => <li key={food.id}><button type="button" disabled={saving}
          className="min-h-tap w-full py-grid text-left text-detail" onClick={() => { setName(food.description); setChosen(food.description); setFdcSelection({ id: food.id, query: visibleMatches.query }); }}>{food.description}</button></li>)}
      </ul> : null}
      {visibleMatches?.error ? <p className="text-meta text-muted">{visibleMatches.error}</p> : null}
    </div>
    <div className="flex flex-col gap-2">
      <Field label={t('portionField')} type="number" inputMode="decimal" min="0.01" max="100000" step="any" value={grams} suffix={unitLabel(unit)} disabled={saving} onChange={(event) => setGrams(event.target.value)} />
      <div className="flex gap-2" role="group" aria-label={t('unitLabel')}>{UNITS.map((option) => <button type="button" key={option} disabled={saving} aria-pressed={unit === option}
        className={`min-h-tap flex-1 rounded-field border text-body ${unit === option ? "border-text bg-text text-surface" : "border-line bg-white text-text"}`}
        onClick={() => changeUnit(option)}>{unitLabel(option)}</button>)}</div>
      {unit === "g" ? <div className="flex gap-2">{[80, 120, 160, 200].map((amount) => <button type="button" key={amount} disabled={saving} aria-pressed={Number(grams) === amount}
        className={`min-h-tap flex-1 rounded-field border text-body ${Number(grams) === amount ? "border-text bg-text text-surface" : "border-line bg-white text-text"}`}
        onClick={() => setGrams(String(amount))}>{formatNumber(locale,amount,{useGrouping:false})} g</button>)}</div> : null}
    </div>
    {!item && onDraw ? <button type="button" onClick={onDraw} disabled={saving} className="min-h-tap text-left text-comment text-muted">{box ? t('drawDifferent') : t('drawOptional')}</button> : null}
    {error ? <p role="alert" className="text-detail text-text">{error}</p> : null}
    <Button disabled={saving} onClick={() => { void submit(); }}>{saving ? t('saving') : t('save')}</Button>
    <div className="flex items-center justify-between gap-2 text-comment">
      {item ? <button type="button" disabled={saving} onClick={() => { void submit(true); }} className="min-h-tap text-muted">{t('removeThisItem')}</button> : <span />}
      <button type="button" disabled={saving} onClick={onAdd} className="min-h-tap font-medium">{tp('addItem')}</button>
    </div>
  </Sheet>;
}
