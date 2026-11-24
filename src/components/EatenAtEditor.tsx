"use client";
import {DisplayError} from '@/i18n/display-error';
import {useApiFailureText} from '@/i18n/api-error-text';
import {useTranslations} from 'next-intl';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fromLocalInput, toLocalInput } from "@/lib/posts/eaten-at";

// "Time eaten" on post detail: change when the meal was eaten (feed, Days and Search follow it).
export default function EatenAtEditor({ postId, eatenAt }: { postId: string; eatenAt: string }) {
  const apiError=useApiFailureText();
 const t=useTranslations('postMenu');
  const router = useRouter();
  const [value, setValue] = useState(() => toLocalInput(new Date(eatenAt)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const original = toLocalInput(new Date(eatenAt));
  const save = async () => {
    const iso = fromLocalInput(value);
    if (!iso) { setError(t('chooseTime')); return; }
    setSaving(true); setError("");
    try {
      const response = await fetch(`/api/posts/${postId}/eaten-at`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eaten_at: iso }) });
      if (!response.ok) throw new DisplayError(apiError((await response.json().catch(() => null)),"route_6f4458352e2c"));
      router.refresh();
    } catch (e) { setError(e instanceof DisplayError ? e.message : t('timeSaveFailed')); }
    finally { setSaving(false); }
  };
  return <section aria-label={t('timeEaten')} className="flex flex-wrap items-center gap-2 px-screen-x pt-sheet-top text-detail">
    <label htmlFor="eaten-at" className="text-muted">{t('timeEaten')}</label>
    <input id="eaten-at" type="datetime-local" value={value} max={toLocalInput(new Date())} disabled={saving} onChange={(event) => setValue(event.target.value)} className="min-h-tap rounded-field bg-field px-tooltip-x" />
    <button type="button" disabled={saving || value === original} onClick={() => { void save(); }} className="min-h-tap text-text disabled:opacity-50">{saving ? t('saving') : t('save')}</button>
    {error ? <p role="alert" className="w-full text-meta text-muted">{error}</p> : null}
  </section>;
}
