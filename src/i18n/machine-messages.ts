import {createTranslator} from 'next-intl';
import messages from '../../messages/en.json';
import {onError,getMessageFallback} from './strict';
import type {ApiMessageCode} from './api-codes';

// Machine APIs deliberately keep their existing English contract (slice 5 D1).
const english=createTranslator({locale:'en',messages,namespace:'api',onError,getMessageFallback});
export function machineMessage(code:ApiMessageCode,values?:Record<string,string|number>):string {
 return english(code,values);
}
