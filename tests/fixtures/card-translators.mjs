import {cardTranslator} from '../../src/i18n/card.ts';
import {nutritionTranslator} from '../../src/i18n/nutrition.ts';
export const cardTranslators=locale=>({t:cardTranslator(locale),tn:nutritionTranslator(locale)});
