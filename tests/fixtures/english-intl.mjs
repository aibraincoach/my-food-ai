// Unit seams use the real English dictionary and ICU formatter. Browser tests
// exercise the request-bound provider and the Japanese dictionary separately.
import {readFileSync} from 'node:fs';
import {createTranslator,createFormatter} from 'next-intl';
const messages=JSON.parse(readFileSync(new URL('../../messages/en.json',import.meta.url),'utf8'));
export const englishIntl={useLocale:()=> 'en',useFormatter:()=>createFormatter({locale:'en',timeZone:'UTC',onError:error=>{throw error;}}),useTranslations:namespace=>createTranslator({locale:'en',namespace,messages,onError:error=>{throw error;},getMessageFallback:({error})=>{throw error;}})};
export const englishIntlServer={getTranslations:async namespace=>englishIntl.useTranslations(namespace)};
