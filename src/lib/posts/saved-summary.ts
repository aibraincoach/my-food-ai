import type {NutritionTranslator} from '@/i18n/nutrition';
import type {Locale} from '@/i18n/locales';
import {formatTotalEnergy, sumNutrition, hasMixedTrace} from '@/lib/nutrition/totals';
import type {SavedDrink, SavedItem} from './saved';
// Volume and caffeine come from the saved intake snapshot, never inferred
// from a food name, mass, or a nutrient that may describe a different basis.
export function savedItemsLine(items: SavedItem[], t: NutritionTranslator, locale: Locale, drinks: SavedDrink[] = []): string {
  const number=(value:number)=>Math.round(value).toLocaleString(locale);
  const descriptions = items.map(item => {
    const drink = drinks.find(row => row.item_name === item.name || row.label === item.name || row.source === 'sheet' && items.length === 1);
    const ml = drink?.ml ?? (drink?.kind === 'water' ? drink.amount : null);
    return drink ? t('savedDrink',{name:item.name,known:ml===null?'no':'yes',ml:number(ml??0),caffeine:drink.kind==='caffeine'?'yes':'no',amount:number(drink.amount)})
      : `${item.name}${item.portion_text ? ` ${item.portion_text}` : ''}`;
  });
  const totals=sumNutrition(items.map(item=>({...item.nutrition,name:item.name,fibre_g:null,sugar_g:null,sodium_mg:null})));
  const calories=t('savedCalories',{known:items.length&&!totals.missing?.calories?.length?'yes':'no',calories:formatTotalEnergy(totals,t,locale)})+(hasMixedTrace(totals)?(locale==='ja'?'':' ')+t('includesTraceAmounts'):'');
  return [...descriptions, ...(items.length ? [calories] : [])].join(' · ');
}
