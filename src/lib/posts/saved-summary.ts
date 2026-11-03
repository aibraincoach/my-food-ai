import {formatCalories, toNumber} from '@/lib/nutrition/totals';
import type {SavedDrink, SavedItem} from './saved';
const number = (value: number) => Math.round(value).toLocaleString('en-US');
// Volume and caffeine come from the saved intake snapshot, never inferred
// from a food name, mass, or a nutrient that may describe a different basis.
export function savedItemsLine(items: SavedItem[], drinks: SavedDrink[] = []): string {
  const descriptions = items.map(item => {
    const drink = drinks.find(row => row.item_name === item.name || row.label === item.name || row.source === 'sheet' && items.length === 1);
    const ml = drink?.ml ?? (drink?.kind === 'water' ? drink.amount : null);
    return drink ? `${item.name} · ${ml === null ? 'volume unavailable' : `${number(ml)} ml`}${drink.kind === 'caffeine' ? ` · ${number(drink.amount)} mg caffeine` : ''}`
      : `${item.name}${item.portion_text ? ` ${item.portion_text}` : ''}`;
  });
  const calories = items.length && items.every(item => item.nutrition?.calories != null)
    ? `${formatCalories(items.reduce((sum, item) => sum + toNumber(item.nutrition.calories), 0))} kcal` : 'calories unavailable';
  return [...descriptions, ...(items.length ? [calories] : [])].join(' · ');
}
