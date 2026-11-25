import {nutritionTranslator} from '@/i18n/nutrition';
import { formatCalories, formatNutrition, nutritionGaps, gapSentence, type MissingNutrition } from "@/lib/nutrition/totals";
export { checkWording } from "./wording-check";
export type ConsumedTotals = { missing?: MissingNutrition; calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null };
export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string;kind?:'closest'|'estimate'}[] = [], unavailable: {name:string;sourceRef:unknown}[] = []): string {
  // English reference formatter for the retained nutrition wording tests; app writers store message facts.
  const locale='en',t=nutritionTranslator(locale);
  const value=(n:number|null)=>n!==null&&Number.isFinite(n)?formatNutrition(n,t,locale):t('unavailable');
  const gap=gapSentence(nutritionGaps(totals),t,locale,unavailable);
  const notes=approximations.map(a=>' '+t(a.kind==='estimate'?'approxModel':'approxUSDA',{name:a.name,basis:a.basis})).join('');
  return t('consumedStored',{calories:totals.calories===null?t('unavailable'):formatCalories(totals.calories,t,locale),protein:value(totals.protein_g),carbs:value(totals.carbs_g),fat:value(totals.fat_g),hasGap:gap?'yes':'no',gap,approximations:notes});
}
