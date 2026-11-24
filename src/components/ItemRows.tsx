"use client";
import {useLocale,useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/locales';
import {formatNutrient,formatPortion} from '@/i18n/format';

import type { DetailItem } from "@/lib/posts/items";
import { tokens } from "@/lib/theme/tokens";

export const outlineColor = (index: number) => tokens.colors[`outline-${index % 4 + 1}` as "outline-1" | "outline-2" | "outline-3" | "outline-4"];

export default function ItemRows({ items, onSelect, onAdd, disabled = false }: {
  disabled?: boolean; items: DetailItem[]; onSelect: (item: DetailItem) => void; onAdd: () => void;
}) {
  const t=useTranslations('post'),locale=useLocale() as Locale;
  return <div className="px-screen-x pt-tooltip-y">
    {items.map((item, index) => <button key={item.id} type="button" disabled={disabled} onClick={() => onSelect(item)}
      className="flex min-h-item-row w-full items-center gap-2 text-detail text-muted" aria-label={t('editItem',{name:item.name})}>
      <span className="size-2 shrink-0 rounded-circle" style={{ background: outlineColor(index) }} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{item.name}</span>
      <span className="shrink-0 tabular-nums">{item.portion_grams == null ? "—" : formatPortion(locale,item.portion_grams)} · {formatNutrient(locale,item.calories)} kcal</span>
    </button>)}
    <button type="button" disabled={disabled} onClick={onAdd} className="min-h-tap text-comment font-medium">{t('addItem')}</button>
  </div>;
}
