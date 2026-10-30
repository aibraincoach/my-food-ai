import type { DrinkCardData } from '@/lib/intake/hydration';
import type { CSSProperties } from 'react';
import { formatNutrition } from '@/lib/nutrition/totals';
import { tokens } from '@/lib/theme/tokens';

export type ResultsCardProps = {
  drink?: DrinkCardData | null;
  time: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  items: { name: string; grams: number | null }[];
  /** Render at 390 in the feed or 1080 for the stored PNG. */
  size?: number;
  /** Set to Manrope when rendering with next/og; DOM inherits the local font. */
  fontFamily?: string;
};

/** Inline flex layout shared by React DOM and next/og (Satori). */
export function ResultsCard({ drink, time, calories, protein, carbs, fat, items, size = tokens.spacing.phone, fontFamily }: ResultsCardProps) {
  const scale = size / tokens.spacing.phone;
  const text = (name: keyof typeof tokens.typography): CSSProperties => {
    const type = tokens.typography[name];
    return { fontSize: type.size * scale, fontWeight: type.weight, letterSpacing: type.tracking * scale, lineHeight: type.leading };
  };
  const macro = (value: number | null, word: string) => <div key={word} style={{ display: 'flex', gap: tokens.spacing.grid * scale }}>
    <span style={{ fontWeight: tokens.card.emphasisWeight }}>{formatNutrition(value)} g</span><span style={{ color: tokens.colors.muted }}>{word}</span>
  </div>;
  return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: size, height: size, padding: tokens.spacing['card-padding'] * scale, boxSizing: 'border-box', background: tokens.colors.card, color: tokens.colors.text, fontFamily }}>
    <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted, letterSpacing: tokens.card.labelTracking * scale, textTransform: 'uppercase' }}>{drink ? "DRANK" : "CONSUMED"} · {time}</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', ...text('display-card') }}>{drink ? drink.totalMl.toLocaleString("en-US") : formatNutrition(calories)}</div>
      <div style={{ display: 'flex', ...text('body'), color: tokens.colors.muted }}>{drink ? "ml so far today" : "kcal"}</div>
    </div>
    <div style={{ display: 'flex', gap: tokens.spacing['macro-gap'] * scale, ...text('body') }}>
      {drink ? null : <>{macro(protein, 'protein')}{macro(carbs, 'carbs')}{macro(fat, 'fat')}</>}
    </div>
    <div style={{ display: 'flex', ...text('detail'), lineHeight: tokens.card.itemLeading, color: tokens.colors.muted }}>
      {drink ? `${drink.label} ${drink.ml} ml${drink.caffeineMg ? ` · ${drink.caffeineMg} mg caffeine` : ''}${drink.foodMl ? ` · ${drink.foodMl.toLocaleString('en-US')} ml from food` : ''}` : items.map(item => `${item.name}${item.grams === null ? '' : ` ${Math.round(item.grams)} g`}`).join(' · ')}
    </div>
  </div>;
}
