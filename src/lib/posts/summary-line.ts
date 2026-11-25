import type {NutritionTranslator} from '@/i18n/nutrition';
import type {Locale} from '@/i18n/locales';
import {alcoholGrams} from '@/lib/intake/alcohol';
import { formatCalories, formatNutrition, sumNutrition, nutritionGaps, gapSentence } from '@/lib/nutrition/totals';
import type { FeedPost } from '@/lib/posts/feed';
import type { DrinkCardData } from '@/lib/intake/hydration';

/** Optional fields allow the independent record services to land in dependency order. */
export type PostPresentation = FeedPost & {
  handle?: string;
  avatar_media_id?: string | null;
  kind?: 'meal' | 'drink';
  foodWaterMl?: number;
  dayHydration?: { totalMl: number; drinksMl: number; foodMl: number; caffeineMg?: number };
  saved_meal_id?: string | null;
  count_text?: string | null;
  gtin?: string | null;
};
export function summaryLine(post: PostPresentation, t: NutritionTranslator, locale: Locale, drink: DrinkCardData | null | undefined = post.drink): string {
  const number=(value:number)=>Math.round(value).toLocaleString(locale);
  const drinks = post.itemDrinks ?? [];
  const drankMl = drinks.reduce((sum, row) => sum + (row.kind==='alcohol'?0:row.ml), 0);
  const caffeineMg = drinks.reduce((sum, row) => sum + row.caffeineMg, 0);
  const totals = sumNutrition(post.items);
  if (drinks.length && post.items.length && post.items.every(item => drinks.some(row => row.post_item_id === item.id))) {
    if(drinks.some(row=>row.kind==='alcohol')){
      // Feed items retain water only; hydration owns the consumed alcohol amount.
      const g=drink?.kind==='alcohol'&&drink.alcoholG!=null ? drink.alcoholG : drinks.filter(row=>row.kind==='alcohol')
        .reduce((sum,row)=>sum+(row.alcoholG??alcoholGrams(post.items.find(item=>item.id===row.post_item_id)?.micronutrients)),0);
      return t('summaryAlcohol',{known:g>0?'yes':'no',grams:number(g),drinks:new Intl.NumberFormat(locale,{minimumFractionDigits:1,maximumFractionDigits:1,useGrouping:false}).format(g/14),calories:formatCalories(totals.calories,t,locale)});
    }
    return t('summaryItemDrinks',{multiple:drinks.length>1?'yes':'no',count:number(drinks.length),ml:number(drankMl),hasCaffeine:caffeineMg>0?'yes':'no',caffeine:number(caffeineMg),calories:formatCalories(totals.calories,t,locale)});
  }
  if ((post.kind === 'drink' || drink) && (post.drinkSource ?? drink?.source ?? 'sheet') === 'sheet') {
    const hydration = post.dayHydration;
    const amount = drink?.ml;
    return t('summarySheetDrink',{known:amount==null?'no':'yes',amount:number(amount??0),hasCaffeine:drink?.caffeineMg?'yes':'no',caffeine:number(drink?.caffeineMg??0),hasToday:hydration||drink?'yes':'no',today:number(hydration?.totalMl??drink?.totalMl??0),hasTodayCaffeine:drink?.caffeineMg&&(hydration?.caffeineMg??drink?.dayCaffeineMg??0)>0?'yes':'no',todayCaffeine:number(hydration?.caffeineMg??drink?.dayCaffeineMg??0)});
  }
  const leftovers=post.items.filter(item=>item.not_eaten_grams!=null);
  const gap=gapSentence(nutritionGaps(totals),t,locale);
  return t('summaryMeal',{hasCount:post.count_text?'yes':'no',count:post.count_text??'',calories:formatCalories(totals.calories,t,locale),hasDrink:drankMl>0?'yes':'no',ml:number(drankMl),hasCaffeine:caffeineMg>0?'yes':'no',caffeine:number(caffeineMg),protein:formatNutrition(totals.protein_g,t,locale),carbs:formatNutrition(totals.carbs_g,t,locale),fat:formatNutrition(totals.fat_g,t,locale),hasWater:(post.foodWaterMl??0)>=50?'yes':'no',water:number(post.foodWaterMl??0),hasGap:gap?'yes':'no',gap,hasLeftovers:leftovers.length?'yes':'no',leftovers:number(leftovers.reduce((sum,item)=>sum+(item.not_eaten_grams??0),0))});
}
