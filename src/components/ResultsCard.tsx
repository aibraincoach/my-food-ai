import type { DrinkCardData } from '@/lib/intake/hydration';
import type { CardData } from '@/lib/pipeline/card-data';
import type { CSSProperties } from 'react';
import { formatCalories, formatNutrition } from '@/lib/nutrition/totals';
import { tokens } from '@/lib/theme/tokens';

export type ResultsCardProps = {
  data?: CardData;
  // Kept for story totals and existing callers while they adopt CardData.
  drink?: DrinkCardData | null;
  unavailable?: string[];
  time?: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  items?: { name: string; grams: number | null }[];
  size?: number;
  fontFamily?: string;
};

/** The exact same flex layout renders in the browser and next/og (Satori). */
export function ResultsCard({ data, drink, unavailable = [], time, calories = null, protein = null, carbs = null, fat = null, items = [], size = tokens.spacing.phone, fontFamily }: ResultsCardProps) {
  const card: CardData = data ?? {
    kind: drink ? 'drink' : 'meal', amountMl: drink?.ml, caffeineMg: drink?.caffeineMg,
    drinkLine: drink ? `${drink.label}${drink.caffeineMg ? ` · ${drink.caffeineMg} mg caffeine · ${formatCalories(calories)} kcal` : ''}` : undefined,
    hydration: drink ? { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } : undefined,
    kcal: calories, macros: { protein, carbs, fat }, items, unavailable,
  };
  const isDrink = card.kind === 'drink';
  const scale = size / tokens.spacing.phone;
  const text = (name: keyof typeof tokens.typography): CSSProperties => {
    const type = tokens.typography[name];
    return { fontSize: type.size * scale, fontWeight: type.weight, letterSpacing: type.tracking * scale, lineHeight: type.leading };
  };
  const macro = (value: number | null | undefined, word: string) => <div key={word} style={{ display: 'flex', gap: tokens.spacing.grid * scale }}>
    <span style={{ fontWeight: tokens.card.emphasisWeight }}>{formatNutrition(value)} g</span><span style={{ color: tokens.colors.muted }}>{word}</span>
  </div>;
  const split = (value: number, word: string) => <div key={word} style={{ display: 'flex', gap: 4 * scale }}>
    <span style={{ color: tokens.colors.text, fontWeight: tokens.card.emphasisWeight }}>{Math.round(value).toLocaleString('en-US')}{word === 'caffeine' ? ' mg' : ' ml'}</span><span>{word}</span>
  </div>;
  return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: size, height: size, padding: tokens.spacing['card-padding'] * scale, boxSizing: 'border-box', background: tokens.colors.card, color: tokens.colors.text, fontFamily }}>
    <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted, letterSpacing: tokens.card.labelTracking * scale, textTransform: 'uppercase' }}>{isDrink ? 'DRANK' : 'CONSUMED'}{time ? ` · ${time}` : ''}</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 * scale }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 * scale }}>
        <div style={{ display: 'flex', ...text('display-card') }}>{isDrink ? Math.round(card.amountMl ?? 0).toLocaleString('en-US') : card.kcal === null ? 'unavailable' : formatCalories(card.kcal)}</div>
        {isDrink ? <div style={{ display: 'flex', ...text('month'), fontWeight: 400, color: tokens.colors.muted }}>ml</div> : null}
      </div>
      <div style={{ display: 'flex', ...text('body'), fontWeight: 400, color: tokens.colors.muted }}>{isDrink ? card.drinkLine ?? '' : 'kcal'}</div>
    </div>
    {isDrink ? <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${tokens.colors.line}`, paddingTop: 16 * scale, gap: 10 * scale }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 * scale }}>
        <span style={text('day-macro')}>{Math.round(card.hydration?.totalMl ?? 0).toLocaleString('en-US')} ml</span>
        <span style={{ ...text('detail'), color: tokens.colors.muted }}>consumed today</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 * scale, ...text('detail'), color: tokens.colors.muted }}>
        {split(card.hydration?.drinksMl ?? 0, 'from drinks')}
        {split(card.hydration?.foodMl ?? 0, 'from food')}
        {(card.caffeineMg ?? 0) > 0 ? split(card.hydration?.caffeineMg ?? 0, 'caffeine') : null}
      </div>
    </div> : <>
      <div style={{ display: 'flex', gap: tokens.spacing['macro-gap'] * scale, ...text('body') }}>
        {macro(card.macros?.protein, 'protein')}{macro(card.macros?.carbs, 'carbs')}{macro(card.macros?.fat, 'fat')}
      </div>
      {(card.unavailable?.length ?? 0) > 0 ? <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted }}>Nutrition unavailable: {card.unavailable!.join(', ')}</div> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * scale, ...text('detail'), lineHeight: tokens.card.itemLeading, color: tokens.colors.muted }}>
        <div style={{ display: 'flex' }}>{(card.items ?? []).map(item => `${item.name}${item.grams === null ? '' : ` ${Math.round(item.grams)} g`}`).join(' · ')}</div>
        {card.waterLine ? <div style={{ display: 'flex' }}>{card.waterLine}</div> : null}
        {card.footer ? <div style={{ display: 'flex' }}>{card.footer}</div> : null}
      </div>
    </>}
  </div>;
}
