import 'server-only';
import {createTranslator,type useTranslations} from 'next-intl';
import english from '../../messages/en.json';
import japanese from '../../messages/ja.json';
import type {Locale} from './locales';
import {onError,getMessageFallback} from './strict';

// Table-only labels; routes that render the table provide this namespace.
export function nutrientsTranslator(locale:Locale) {
 const dictionaries:Record<Locale,typeof english.nutrients>={en:english.nutrients,ja:japanese.nutrients};
 return createTranslator({locale,messages:dictionaries[locale],onError,getMessageFallback});
}
export type NutrientsTranslator=ReturnType<typeof useTranslations<'nutrients'>>;
