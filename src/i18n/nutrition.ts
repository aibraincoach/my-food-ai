import {createTranslator,type useTranslations} from 'next-intl';
import english from '../../messages/en.json';
import japanese from '../../messages/ja.json';
import type {Locale} from './locales';
import {onError,getMessageFallback} from './strict';

// Pure dictionary access also serves ImageResponse and explicit English writers.
export function nutritionTranslator(locale:Locale) {
 const dictionaries:Record<Locale,typeof english.nutrition>={en:english.nutrition,ja:japanese.nutrition};
 return createTranslator({locale,messages:dictionaries[locale],onError,getMessageFallback});
}
export type NutritionTranslator=ReturnType<typeof useTranslations<'nutrition'>>;
