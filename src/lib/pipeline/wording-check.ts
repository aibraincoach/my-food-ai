import english from '@/lib/wording/rules/en.json';
import japanese from '@/lib/wording/rules/ja.json';
import {wordingRules, wordingHits} from '@/lib/wording/check';
import {isLocale, type Locale} from '@/i18n/locales';

const rules = {en: wordingRules(english), ja: wordingRules(japanese)};

export function checkWording(text: string, locale: Locale): {ok: boolean; hits: string[]} {
  if (!isLocale(locale)) throw new Error('Unknown wording locale.');
  const hits = [...new Set([
    ...wordingHits(text, rules[locale]),
    ...(locale === 'ja' ? wordingHits(text, rules.en) : []),
  ])];
  return {ok: hits.length === 0, hits};
}
