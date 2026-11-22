import {createTranslator} from 'next-intl';
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

export function cardGapWording(locale:Locale) {
 const t=cardTranslator(locale);
 return {
  nutritionUnavailable:(food:string)=>t('nutritionUnavailable',{food}),
  caloriesUnavailable:(food:string)=>t('caloriesUnavailable',{food}),
  missing:(nutrients:string[],food:string)=>t('missing',{nutrients:new Intl.ListFormat(locale,{style:'long',type:'conjunction'}).format(nutrients.map(key=>t(key as 'protein'|'carbs'|'fat'|'fibre'|'sugar'|'sodium'))),food}),
 };
}
