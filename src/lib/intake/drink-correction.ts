import type {BarcodeCorrection, BarcodeNutrition} from '@/lib/fdc/barcode-product';
import type {PhotoDrink} from './photo-drinks';

export type DrinkCorrection = BarcodeCorrection & {caffeine_mg?: number | null};
export const CORRECTION_NUTRIENTS = ['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'] as const;

// The editor's initial caffeine input is empty: database caffeine is never prefilled.
export function drinkCorrectionChanged(previous: PhotoDrink, correction: DrinkCorrection): boolean {
 return correction.name?.trim() !== previous.name || correction.pack_amount !== previous.ml
  || (correction.caffeine_mg != null && correction.caffeine_mg !== previous.caffeineMg)
  || CORRECTION_NUTRIENTS.some(key => correction.per_100?.[key] !== (previous.nutrition[key] === null ? null : previous.nutrition[key]! * 100 / previous.ml));
}

// Construct every field explicitly. A rename must not retain the old drink's
// category, density, micronutrients, caffeine or approximation metadata.
export function correctedPhotoDrink(previous: PhotoDrink, correction: DrinkCorrection, readingId: string): PhotoDrink {
 const ml = correction.pack_amount;
 const caffeineMg = correction.caffeine_mg ?? null;
 if (typeof correction.name !== 'string' || !correction.name.trim() || correction.name.length > 80
  || correction.pack_unit !== 'ml' || typeof ml !== 'number' || !Number.isFinite(ml) || ml < 1 || ml > 5000
  || !correction.per_100 || (caffeineMg !== null && (!Number.isInteger(caffeineMg) || caffeineMg < 0 || caffeineMg > 1000))) throw Error('Invalid drink correction.');
 for (const key of CORRECTION_NUTRIENTS) {
  const value = correction.per_100[key];
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000)) throw Error('Invalid drink correction.');
 }
 if (!drinkCorrectionChanged(previous, correction)) throw Error('Drink correction is unchanged.');
 const macros = Object.fromEntries(CORRECTION_NUTRIENTS.map(key => [key, correction.per_100![key] === null ? null : correction.per_100![key]! * ml / 100])) as unknown as BarcodeNutrition;
 const micronutrients = [{nutrientId:1051,nutrientName:'Water',unitName:'G',value:ml,basis:'portion' as const},
  ...(caffeineMg === null ? [] : [{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',value:caffeineMg,basis:'portion' as const}])];
 return {name:correction.name.trim(),ml,caffeineMg,kcal:macros.calories,grams:null,source:previous.source,
  nutrition:{...macros,micronutrients,source_ref:`user:drink-correction:${readingId}`,food_category:null,record_description:null,record_data_type:null}};
}
