import type { CSSProperties } from 'react';
import { tokens } from '@/lib/theme/tokens';

export type ResultsCardProps = {
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: { name: string; grams: number | null }[];
  /** Render at 390 in the feed or 1080 for the stored PNG. */
  size?: number;
  /** Set to Manrope when rendering with next/og; DOM inherits the local font. */
  fontFamily?: string;
};

/** Inline flex layout shared by React DOM and next/og (Satori). */
export function ResultsCard({ time, calories, protein, carbs, fat, items, size = tokens.spacing.phone, fontFamily }: ResultsCardProps) {
  const scale = size / tokens.spacing.phone;
  const text = (name: keyof typeof tokens.typography): CSSProperties => {
    const type = tokens.typography[name];
    return { fontSize: type.size * scale, fontWeight: type.weight, letterSpacing: type.tracking * scale, lineHeight: type.leading };
  };
  const macro = (value: number, word: string) => <div key={word} style={{ display: 'flex', gap: tokens.spacing.grid * scale }}>
    <span style={{ fontWeight: tokens.card.emphasisWeight }}>{Math.round(value)} g</span><span style={{ color: tokens.colors.muted }}>{word}</span>
  </div>;
  return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: size, height: size, padding: tokens.spacing['card-padding'] * scale, boxSizing: 'border-box', background: tokens.colors.card, color: tokens.colors.text, fontFamily }}>
    <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted, letterSpacing: tokens.card.labelTracking * scale, textTransform: 'uppercase' }}>CONSUMED · {time}</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', ...text('display-card') }}>{Math.round(calories)}</div>
      <div style={{ display: 'flex', ...text('body'), color: tokens.colors.muted }}>kcal</div>
    </div>
    <div style={{ display: 'flex', gap: tokens.spacing['macro-gap'] * scale, ...text('body') }}>
      {macro(protein, 'protein')}{macro(carbs, 'carbs')}{macro(fat, 'fat')}
    </div>
    <div style={{ display: 'flex', ...text('detail'), lineHeight: tokens.card.itemLeading, color: tokens.colors.muted }}>
      {items.map(item => `${item.name}${item.grams === null ? '' : ` ${Math.round(item.grams)} g`}`).join(' · ')}
    </div>
  </div>;
}
