import type { SupabaseClient } from '@supabase/supabase-js';
import { getCurrentItems, toNumber, type Numeric, type StoredNutrient } from '@/lib/nutrition/totals';
import { ioError } from '@/lib/worker/errors';

// WWEIA names: https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/2123/Food_Category_List_2021-2023.pdf
const BEVERAGE_CATEGORIES = new Set(['beverages', 'water', 'soft drinks', 'coffee', 'tea', 'milk', 'milk substitutes', 'fruit juice', 'vegetable juice', 'alcoholic beverages', 'sports and energy drinks', 'nutritional beverages',
  'tap water', 'bottled water', 'flavored or carbonated water', 'enhanced water', 'enhanced or fortified water',
  'diet soft drinks', 'diet sport and energy drinks', 'other diet drinks', 'fruit drinks', 'sport and energy drinks', 'smoothies and grain drinks',
  'citrus juice', 'apple juice', 'other fruit juice', 'beer', 'wine', 'liquor and cocktails',
  'milk, whole', 'milk, reduced fat', 'milk, lowfat', 'milk, nonfat', 'flavored milk, whole', 'flavored milk, reduced fat', 'flavored milk, lowfat', 'flavored milk, nonfat',
  'milk shakes and other dairy drinks', 'plant-based milk', 'soy milk', 'baby juice', 'baby water']);
const PLAIN_DRINKS = new Set(['water', 'sparkling water', 'coffee', 'black coffee', 'espresso', 'americano', 'tea', 'green tea', 'black tea']);
export type DrinkItem = { id: string; name: string; portion_text?: string | null; portion_grams: Numeric; food_category?: string | null; micronutrients?: StoredNutrient[] };
export type ItemDrink = { post_item_id: string; kind: 'water' | 'caffeine'; amount: number; ml: number; label: string; caffeineMg: number };
// SR Legacy puts liquid milk and solid cheese in the same category. This
// owner-approved fallback is limited to that proven ambiguous category and
// complete beverage nouns. It never treats "milk chocolate" as "chocolate milk",
// and reference-style comma qualifiers cannot admit dry/condensed products.
const DAIRY_DRINK_PREFIX = '(?:plain|whole|skim|skimmed|nonfat|fat[- ]free|low[- ]fat|reduced[- ]fat|[0-4](?:\\.\\d+)?%|chocolate|vanilla|strawberry|banana)';
const PLAIN_DAIRY_DRINK = new RegExp(`^(?:${DAIRY_DRINK_PREFIX}\\s+){0,2}(?:milk|buttermilk|eggnog|milkshake|milk shake)(?:\\s+\\(?(?:whole|skim|skimmed|nonfat|fat[- ]free|low[- ]fat|reduced[- ]fat|[0-4](?:\\.\\d+)?%(?: fat)?)\\)?)?$`);
const DAIRY_QUALIFIERS = new Set(['whole', 'fluid', 'chocolate', 'commercial', 'nonfat', 'lowfat', 'low fat', 'reduced fat', 'fat free', 'cultured', 'plain', 'sweetened', 'unsweetened', 'skim', 'vanilla', 'strawberry', 'buttermilk']);
function ambiguousDairyDrink(name: string): boolean {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (PLAIN_DAIRY_DRINK.test(normalized)) return true;
  const parts = normalized.split(',').map(part => part.trim());
  return parts.length > 1 && ['milk', 'buttermilk', 'eggnog', 'milkshake', 'milk shake'].includes(parts[0])
    && parts.slice(1).every(part => DAIRY_QUALIFIERS.has(part) || /^[0-4](?:\.\d+)?% milkfat$/.test(part)
      || /^(?:with|without) added vitamin (?:a|d|a and vitamin d)$/.test(part));
}
export function isDrinkItem(item: Pick<DrinkItem, 'name' | 'food_category'>): boolean {
  const category = item.food_category?.trim().toLowerCase();
  return category ? (category === 'dairy and egg products' && ambiguousDairyDrink(item.name)) || BEVERAGE_CATEGORIES.has(category) || /\b(?:beverage|beverages|drink|drinks|juice|soda|coffee|tea|water)\b/.test(category)
    : PLAIN_DRINKS.has(item.name.trim().toLowerCase());
}
/** A volume alone never makes food a beverage. Nutrients are already scaled to
 * the consumed portion; a missing caffeine entry is never guessed. */
export function drinksFromItems(items: readonly DrinkItem[]): ItemDrink[] {
  return items.flatMap(item => {
    if (!isDrinkItem(item)) return [];
    const volume = item.portion_text?.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*ml\b/i);
    const ml = Math.min(5000, Math.round(volume ? Number(volume[1]) : toNumber(item.portion_grams)));
    // A fully uneaten drink contributes no intake, rather than one phantom ml.
    if (!Number.isFinite(ml) || ml < 1) return [];
    const nutrient = item.micronutrients?.find(n => n.nutrientId === 1057 && n.basis === 'portion');
    const caffeineMg = Math.min(1000, Math.max(0, Math.round(toNumber(nutrient?.value))));
    return [{ post_item_id: item.id, kind: caffeineMg >= 1 ? 'caffeine' as const : 'water' as const,
      amount: caffeineMg >= 1 ? caffeineMg : ml, ml, label: item.name.trim().slice(0, 40) || 'Drink', caffeineMg }];
  });
}
export async function syncItemDrinks(db: SupabaseClient, postId: string): Promise<void> {
  const items = await getCurrentItems(db, postId, { requireNutrition: true });
  const { error, status } = await db.rpc('sync_item_drinks', { p_post_id: postId, p_rows: drinksFromItems(items).map(row => ({ post_item_id: row.post_item_id, kind: row.kind, amount: row.amount, ml: row.ml, label: row.label })) });
  if (error) throw ioError('Drink records could not be saved.', error, status);
}
