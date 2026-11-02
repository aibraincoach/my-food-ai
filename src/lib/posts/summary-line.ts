import { formatCalories, formatNutrition, sumNutrition, unavailableFoods } from '@/lib/nutrition/totals';
import type { FeedPost } from '@/lib/posts/feed';
import type { DrinkCardData } from '@/lib/intake/hydration';

/** Optional fields allow the independent record services to land in dependency order. */
export type PostPresentation = FeedPost & {
  handle?: string;
  kind?: 'meal' | 'drink';
  foodWaterMl?: number;
  dayHydration?: { totalMl: number; drinksMl: number; foodMl: number; caffeineMg?: number };
  saved_meal_id?: string | null;
  count_text?: string | null;
  gtin?: string | null;
};
const number = (value: number) => Math.round(value).toLocaleString('en-US');
export function summaryLine(post: PostPresentation, drink?: DrinkCardData | null): string {
  if (post.kind === 'drink' || drink) {
    const hydration = post.dayHydration;
    const amount = drink?.ml;
    return `Drank: ${amount == null ? 'unavailable' : number(amount)} ml${drink?.caffeineMg ? ` · ${number(drink.caffeineMg)} mg caffeine` : ''}${hydration || drink ? ` · Consumed today: ${number(hydration?.totalMl ?? drink!.totalMl)} ml` : ''}${(hydration?.caffeineMg ?? drink?.dayCaffeineMg ?? 0) > 0 ? ` · ${number(hydration?.caffeineMg ?? drink!.dayCaffeineMg!)} mg caffeine` : ''}`;
  }
  const drinks = post.itemDrinks ?? [];
  const drankMl = drinks.reduce((sum, row) => sum + row.ml, 0);
  const caffeineMg = drinks.reduce((sum, row) => sum + row.caffeineMg, 0);
  const drinkLine = drankMl > 0 ? ` · ${number(drankMl)} ml drank${caffeineMg > 0 ? ` · ${number(caffeineMg)} mg caffeine` : ''}` : '';
  const totals = sumNutrition(post.items);
  const leftovers=post.items.filter(item=>item.not_eaten_grams!=null);
  const leftoverLine=leftovers.length?` · leftovers (not eaten): ${number(leftovers.reduce((total,item)=>total+(item.not_eaten_grams??0),0))} g`:'';
  const prefix = post.count_text ? `${post.count_text} · ` : '';
  const missing = unavailableFoods(totals);
  return `Consumed: ${prefix}${formatCalories(totals.calories)} kcal · ${formatNutrition(totals.protein_g)} g protein · ${formatNutrition(totals.carbs_g)} g carbs · ${formatNutrition(totals.fat_g)} g fat${(post.foodWaterMl ?? 0) >= 50 ? ` · ${number(post.foodWaterMl!)} ml water` : ''}${missing.length ? ` · Nutrition unavailable: ${missing.join(', ')}` : ''}${leftoverLine}${drinkLine}`;
}
