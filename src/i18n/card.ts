import 'server-only';
import {createTranslator,type useTranslations} from 'next-intl';
import english from '../../messages/en.json';
import japanese from '../../messages/ja.json';
import type {Locale} from './locales';
import {onError,getMessageFallback} from './strict';

export function cardTranslator(locale:Locale) {
 const japaneseMessages:Partial<typeof english>=japanese;
 const dictionaries:Partial<Record<Locale,typeof english.card>>={en:english.card,ja:japaneseMessages.card};
 const messages=dictionaries[locale];
 if(!messages)throw new Error('Card translations are unavailable for this language.');
 return createTranslator({locale,messages,onError,getMessageFallback});
}

export type CardTranslator=ReturnType<typeof useTranslations<'card'>>;
