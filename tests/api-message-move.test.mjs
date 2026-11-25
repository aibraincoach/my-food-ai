import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createTranslator} from 'next-intl';
import {onError,getMessageFallback} from '../src/i18n/strict.ts';
import {renderFailureMessage} from '../src/i18n/failure-code.ts';
import {failureFromResponse,captureFailureText} from '../src/lib/posts/capture-failure.ts';
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/api-message-move.json',import.meta.url))),load=locale=>JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
function translators(locale,calls=[]){const messages=load(locale);return Object.fromEntries(['api','capture'].map(namespace=>{const t=createTranslator({locale,messages,namespace,onError,getMessageFallback});return[namespace,(code,values)=>{calls.push(namespace);return t(code,values);}];}));}
// #1368 C1: the PM approved condition-specific copy after staged-only uploads
// retired the postId request. Keep the original move snapshot historical.
const approvedCopy={en:{route_8752bd7a7233:'This photo upload could not be prepared. Try again.'},ja:{route_8752bd7a7233:'この写真のアップロードを準備できませんでした。もう一度お試しください。'}};
for(const locale of['en','ja'])test(locale+': moved codes retain their approved copy and an old v3 draft renders in its one namespace',()=>{
 const messages=load(locale),ts=translators(locale);
 for(const[code,original]of Object.entries(before.messages[locale])){const value=Object.hasOwn(approvedCopy[locale],code)?approvedCopy[locale][code]:original;assert.equal(messages.api[code],value);assert.equal(Object.hasOwn(messages.capture,code),false);assert.equal(renderFailureMessage(code,undefined,ts),value);}
 const storedV3=JSON.parse('{"version":3,"failure":{"code":"route_fc3f44ef874c"}}');assert.equal(captureFailureText(storedV3.failure,(code,values)=>renderFailureMessage(code,values,ts)),before.messages[locale].route_fc3f44ef874c);
});
test('unknown response codes use the explicit generic UI message, never the code',()=>{assert.deepEqual(failureFromResponse({message_code:'route_missing'}),{code:'unknownFailure'});assert.deepEqual(failureFromResponse({message_code:'route_fc3f44ef874c'}),{code:'route_fc3f44ef874c'});});
test('namespace selection never tries the other dictionary on a missing key',()=>{
 const calls=[],ts=translators('en',calls);assert.throws(()=>renderFailureMessage('route_missing',undefined,ts));assert.deepEqual(calls,[]);calls.length=0;assert.throws(()=>renderFailureMessage('missing_local_code',undefined,ts));assert.deepEqual(calls,[]);
});
