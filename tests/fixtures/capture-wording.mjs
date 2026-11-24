import {readFileSync} from 'node:fs';
import {createTranslator} from 'next-intl';
import {renderFailureMessage} from '../../src/i18n/failure-code.ts';
import {captureFailureText} from '../../src/lib/posts/capture-failure.ts';
const messages=JSON.parse(readFileSync(new URL('../../messages/en.json',import.meta.url),'utf8'));
const translators=Object.fromEntries(['api','capture'].map(namespace=>[namespace,createTranslator({locale:'en',messages,namespace,onError(error){throw error;}})]));
export const captureEnglish=(code,values)=>renderFailureMessage(code,values,translators);
export const showFailure=failure=>captureFailureText(failure,captureEnglish);
