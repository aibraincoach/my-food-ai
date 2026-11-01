import { formatNutrition, sumNutrition, unavailableFoods } from '@/lib/nutrition/totals';
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
    return `Drank: ${amount == null ? 'unavailable' : number(amount)} ml${drink?.caffeineMg ? ` · ${number(drink.caffeineMg)} mg caffeine` : ''}${hydration || drink ? ` · Consumed today: ${number(hydration?.totalMl ?? drink!.totalMl)} ml` : ''}${drink?.caffeineMg && hydration?.caffeineMg ? ` · ${number(hydration.caffeineMg)} mg caffeine` : ''}`;
  }
  const totals = sumNutrition(post.items);
  const prefix = post.count_text ? `${post.count_text} · ` : '';
  const missing = unavailableFoods(totals);
  return `Consumed: ${prefix}${formatNutrition(totals.calories)} kcal · ${formatNutrition(totals.protein_g)} g protein · ${formatNutrition(totals.carbs_g)} g carbs · ${formatNutrition(totals.fat_g)} g fat${(post.foodWaterMl ?? 0) >= 50 ? ` · ${number(post.foodWaterMl!)} ml water` : ''}${missing.length ? ` · Nutrition unavailable: ${missing.join(', ')}` : ''}`;
}
