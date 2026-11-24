import {FAILURE_MESSAGE_NAMESPACES} from './api-codes';
import type {CaptureMessageCode} from '@/lib/posts/capture-failure';
type Values=Record<string,string|number>;
type Translator=(code:CaptureMessageCode,values?:Values)=>string;

// Stable route codes select one dictionary. Strict translators reject missing keys.
export function failureNamespace(code:CaptureMessageCode):'api'|'capture' {
 const namespace=FAILURE_MESSAGE_NAMESPACES[code];
 if(!namespace)throw new Error('Unknown failure message code');
 return namespace;
}
export function renderFailureMessage(code:CaptureMessageCode,values:Values|undefined,translators:{api:Translator;capture:Translator}):string {
 return translators[failureNamespace(code)](code,values);
}
