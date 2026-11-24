import {readFileSync} from 'node:fs';
import {createTranslator} from 'next-intl';
import {captureFailureText} from '../../src/lib/posts/capture-failure.ts';
const messages=JSON.parse(readFileSync(new URL('../../messages/en.json',import.meta.url),'utf8'));
export const captureEnglish=createTranslator({locale:'en',messages,namespace:'capture',onError(error){throw error;}});
export const showFailure=failure=>captureFailureText(failure,captureEnglish);
