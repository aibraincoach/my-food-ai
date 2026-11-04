import type { StoredNutrient } from '@/lib/nutrition/totals';
export const ALCOHOL_CATEGORIES = new Set(['alcoholic beverages', 'beer', 'wine', 'liquor and cocktails']);
const CAFFEINE_SOURCE = /\b(cola|coke|pepsi|coffee|espresso|tea|energy|red bull|kahl[uú]a|mocha)\b/i;
export function alcoholGrams(micronutrients: readonly StoredNutrient[] | undefined): number {
  const n = micronutrients?.find(m => m.nutrientId === 1018 && m.basis === 'portion');
  return n ? Math.max(0, Number(n.value) || 0) : 0;
}
export function isAlcoholic(item: { food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  return ALCOHOL_CATEGORIES.has((item.food_category ?? '').trim().toLowerCase()) || alcoholGrams(item.micronutrients) >= 0.5;
}
// An alcoholic drink keeps USDA caffeine only when its own name names a caffeine source (rum and coke, espresso martini).
export function keepsCaffeine(item: { name: string; food_category?: string | null; micronutrients?: readonly StoredNutrient[] }): boolean {
  return !isAlcoholic(item) || CAFFEINE_SOURCE.test(item.name);
}
