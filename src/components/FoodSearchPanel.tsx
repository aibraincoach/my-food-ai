"use client";
import {DisplayError} from '@/i18n/display-error';
import {useFailureMessages} from '@/i18n/failure-messages';
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatNumber} from '@/i18n/format';
import {CaptureFailureError,captureFailureText} from '@/lib/posts/capture-failure';

import { useEffect, useRef, useState } from "react";
import {uploadManager} from "@/lib/posts/upload-manager";
import { Field } from "@/components/ui/Field";

type Match = { id: number; description: string; serving_amount: number; serving_unit: "g" | "ml"; calories: number | null };

// "Search foods" in the + sheet: an FDC text search with calories per serving. Picking a result logs a ready post
// straight away (no model call); "Describe it instead" hands back to the caption and the model.
export default function FoodSearchPanel({ eatenAt, disabled, onQueued, onDescribe, onError }: {
  eatenAt: string | null; disabled: boolean; onQueued: (postId: string) => void; onDescribe: (text: string) => void; onError: (message: string | null) => void;
}) {
  const tf=useFailureMessages();
 const t=useTranslations('postMenu'),locale=useLocale() as Locale;
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
      const operationId=await uploadManager.postFood({fdc_id:food.id,query:results.query,eaten_at:eatenAt??new Date().toISOString()},food.description);
      onQueued(operationId);
    } catch (e) { onError(e instanceof CaptureFailureError ? captureFailureText(e.failure,tf)! : e instanceof DisplayError ? e.message : t('mealSaveFailed')); }
    finally { pickingRef.current = false; setPicking(false); }
  };

  const shown = results && results.query === query.trim() ? results : null;
  const busy = disabled || picking;
  return <div className="flex flex-col gap-2">
    <Field variant="camera" id="food-search" aria-label={t('searchFoods')} value={query} onChange={(event) => setQuery(event.target.value)} disabled={busy} placeholder={t('searchFoodPlaceholder')} autoComplete="off" />
    {shown?.failed ? <p className="px-grid text-detail text-camera-muted" role="status">{t('searchUnavailable')}</p> : null}
    {shown && !shown.failed && shown.foods.length === 0 ? <p className="px-grid text-detail text-camera-muted" role="status">{t('noFoods')}</p> : null}
    {shown?.foods.length ? <ul aria-label={t('foodResults')} className="divide-y divide-surface/15">
      {shown.foods.map((food) => <li key={food.id}><button type="button" disabled={busy} onClick={() => { void pick(food); }} className="flex min-h-tap w-full items-baseline justify-between gap-3 px-grid py-grid text-left text-detail disabled:opacity-50">
        <span data-i18n-stored="food" className="min-w-0 flex-1">{food.description}</span>
        <span className="shrink-0 tabular-nums text-camera-muted">{food.calories === null ? "–" : `${formatNumber(locale,food.calories,{useGrouping:false,maximumFractionDigits:20})} kcal`} · {formatNumber(locale,food.serving_amount,{useGrouping:false,maximumFractionDigits:20})} {food.serving_unit}</span>
      </button></li>)}
    </ul> : null}
    {picking ? <p className="px-grid text-detail text-camera-muted" role="status">{t('logging')}</p> : null}
    <button type="button" disabled={busy} onClick={() => onDescribe(query.trim())} className="min-h-tap self-start px-grid text-detail text-surface disabled:opacity-50">{t('describeInstead')}</button>
  </div>;
}
