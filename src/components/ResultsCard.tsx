import {DrinkPicture} from './DrinkPicture';
import {drinkGlyph,waterCups} from '@/lib/intake/drink-glyph';
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
    drinkLine: drink ? `${drink.label}${drink.caffeineMg ? ` · ${formatNutrition(drink.caffeineMg)} mg caffeine · ${formatCalories(calories)} kcal` : ''}` : undefined,
    hydration: drink ? { totalMl: drink.totalMl, drinksMl: drink.drinksMl, foodMl: drink.foodMl, caffeineMg: drink.dayCaffeineMg ?? drink.caffeineMg } : undefined,
    kcal: calories, macros: { protein, carbs, fat }, items, unavailable,
  };
  const isDrink = card.kind === 'drink';
  const glyph=card.glyph??drinkGlyph(drink?.label??'',(card.caffeineMg??0)>0?'caffeine':'water');
  const cups=glyph==='water'?waterCups(card.amountMl??0):1;
  const dayPictures=(card.dayDrinks??[]).flatMap(row=>Array.from({length:row.glyph==='water'?waterCups(row.ml):1},()=>row.glyph));
  const scale = size / tokens.spacing.phone;
  const text = (name: keyof typeof tokens.typography): CSSProperties => {
    const type = tokens.typography[name];
    return { fontSize: type.size * scale, fontWeight: type.weight, letterSpacing: type.tracking * scale, lineHeight: type.leading };
  };
  const macro = (value: number | null | undefined, word: string) => <div key={word} style={{ display: 'flex', gap: tokens.spacing.grid * scale }}>
    <span style={{ fontWeight: tokens.card.emphasisWeight }}>{formatNutrition(value)} g</span><span style={{ color: tokens.colors.muted }}>{word}</span>
  </div>;
  const split = (value: number, word: string) => <span key={word}>
    <span style={{ color: tokens.colors.text, fontWeight: tokens.card.emphasisWeight }}>{Math.round(value).toLocaleString('en-US')}{word === 'caffeine' ? ' mg' : ' ml'}</span>{` ${word}`}
  </span>;
  return <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: size, height: size, padding: tokens.spacing['card-padding'] * scale, boxSizing: 'border-box', background: tokens.colors.card, color: tokens.colors.text, fontFamily }}>
    <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted, letterSpacing: tokens.card.labelTracking * scale, textTransform: 'uppercase' }}>{isDrink ? 'DRANK' : 'CONSUMED'}{time ? ` · ${time}` : ''}</div>
    {isDrink?<div style={{display:'flex',alignItems:'center',gap:12*scale}}>
      <div style={{display:'flex',flexWrap:'wrap',maxWidth:150*scale}}>{Array.from({length:cups},(_,index)=><DrinkPicture key={index} glyph={glyph} size={tokens.typography['display-card'].size*scale}/>)}</div>
      <div style={{display:'flex',flex:1,flexDirection:'column',gap:6*scale}}>
        <div style={{display:'flex',...text('body')}}>{card.drinkLabel??drink?.label??card.drinkLine??'Drink'}</div>
        <div style={{display:'flex',...text('detail'),color:tokens.colors.muted}}>{card.drinkDetail??`${formatNutrition(card.amountMl??0)} ml`}</div>
      </div>
    </div>:<div style={{display:'flex',flexDirection:'column',gap:4*scale}}>
      <div style={{display:'flex',...text('display-card')}}>{card.kcal===null?'unavailable':formatCalories(card.kcal)}</div>
      <div style={{display:'flex',...text('body'),fontWeight:400,color:tokens.colors.muted}}>kcal</div>
    </div>}
    {isDrink ? <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${tokens.colors.line}`, paddingTop: 16 * scale, gap: 10 * scale }}>
      <div style={{display:'flex',...text('detail')}}>Today</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:3*scale}}>{dayPictures.map((picture,index)=><DrinkPicture key={index} glyph={picture} size={Math.min(22,280/Math.max(1,dayPictures.length))*scale}/>)}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 * scale }}>
        <span style={text('day-macro')}>{Math.round(card.hydration?.totalMl ?? 0).toLocaleString('en-US')} ml</span>
        <span style={{ ...text('detail'), color: tokens.colors.muted }}>consumed today</span>
      </div>
      <div style={{ display: 'flex', gap: 24 * scale, ...text('detail'), color: tokens.colors.muted }}>
        {split(card.hydration?.drinksMl ?? 0, 'from drinks')}
        {split(card.hydration?.foodMl ?? 0, 'from food')}
        {(card.caffeineMg ?? 0) > 0 ? split(card.hydration?.caffeineMg ?? 0, 'caffeine') : null}
      </div>
    </div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 16 * scale }}>
      <div style={{ display: 'flex', gap: tokens.spacing['macro-gap'] * scale, ...text('body') }}>
        {macro(card.macros?.protein, 'protein')}{macro(card.macros?.carbs, 'carbs')}{macro(card.macros?.fat, 'fat')}
      </div>
      {(card.unavailable?.length ?? 0) > 0 ? <div style={{ display: 'flex', ...text('meta'), color: tokens.colors.muted }}>Nutrition unavailable: {card.unavailable!.join(', ')}</div> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 * scale, ...text('detail'), lineHeight: tokens.card.itemLeading, color: tokens.colors.muted }}>
        <div style={{ display: 'flex' }}>{(card.items ?? []).map(item => `${item.name}${item.grams === null ? '' : ` ${Math.round(item.grams)} g`}`).join(' · ')}</div>
        {card.mealDrinkLine ? <div style={{ display: 'flex' }}>{card.mealDrinkLine}</div> : null}
        {card.waterLine ? <div style={{ display: 'flex' }}>{card.waterLine}</div> : null}
        {card.footer ? <div style={{ display: 'flex' }}>{card.footer}</div> : null}
      </div>
    </div>}
  </div>;
}
