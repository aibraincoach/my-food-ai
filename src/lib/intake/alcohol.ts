import type { StoredNutrient } from '@/lib/nutrition/totals';
export const ALCOHOL_CATEGORIES = new Set(['alcoholic beverages', 'beer', 'wine', 'liquor and cocktails']);
const CAFFEINE_SOURCE = /\b(coffee|espresso|tea|matcha|cola|coke|pepsi|coca[- ]?cola|energy|red bull|mate|guarana|kopi|teh|mocha|kahl[uú]a|chocolate|cocoa)\b/i;
const CAFFEINE_DRINK_CATEGORIES = new Set(['coffee', 'tea', 'soft drinks', 'carbonated soft drinks', 'energy drinks']);
const NO_CAFFEINE = /\b(herbal|rooibos|chamomile|camomile|peppermint|hibiscus|decaf(?:feinated)?|caffeine[- ]free)\b/i;
const ALCOHOLIC_NAME = /(?<!fruit |shrimp |prawn )\b(cocktail|tiki|mojito|margarita|daiquiri|sangria|(?<!fruit )punch)\b(?! sauce)/i;
const DRINK_NAME = /\b(beer|wine|juice|lemonade|soda|drink|cocktail|martini|cola|tea|coffee)\b/i;
export function alcoholGrams(micronutrients: readonly StoredNutrient[] | undefined): number {
  const n = micronutrients?.find(m => m.nutrientId === 1018 && m.basis === 'portion');
  return n ? Math.max(0, Number(n.value) || 0) : 0;
}
export function isAlcoholic(item: { name?: string; food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  const category = (item.food_category ?? '').trim().toLowerCase();
  return ALCOHOL_CATEGORIES.has(category) || alcoholGrams(item.micronutrients) >= 0.5 || ALCOHOLIC_NAME.test(item.name ?? '');
}
function isDrink(item: { name: string; food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  const category = (item.food_category ?? '').trim().toLowerCase();
  return isAlcoholic(item) || CAFFEINE_DRINK_CATEGORIES.has(category) || ALCOHOL_CATEGORIES.has(category) || /\bbeverage/.test(category) || DRINK_NAME.test(item.name);
}
function namesCaffeineSource(item: { name: string; food_category?: string | null }): boolean {
  const category = (item.food_category ?? '').trim().toLowerCase();
  return (CAFFEINE_SOURCE.test(item.name) && !NO_CAFFEINE.test(item.name)) || CAFFEINE_DRINK_CATEGORIES.has(category);
}
// Drinks keep USDA caffeine only when the name or category names a caffeine source.
export function keepsCaffeine(item: { name: string; food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  if (!isDrink(item)) return true;
  return namesCaffeineSource(item);
}
