import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkErrorDisplays,checkAllErrorDisplays} from '../scripts/check-error-displays.mjs';
import {DisplayError,displayErrorText} from '../src/i18n/display-error.ts';
import {CaptureFailureError,captureFailureText,failureFromResponse} from '../src/lib/posts/capture-failure.ts';
import {createTranslator} from 'next-intl';
import {renderFailureMessage} from '../src/i18n/failure-code.ts';

test('every UI source rejects raw exception/response error text at error, toast and alert sinks',()=>{
 const current=checkAllErrorDisplays();assert.ok(current.files>=149);assert.deepEqual(current.failures,[]);
 for(const source of[
  'setError(e.message)','toast(body.error)','alert(response["error"])',
  'const message=e.message; setError(message)',
  'setError({message: e instanceof Error ? e.message : t("failed")})',
  'onError(cause.message)','setCopyError({message:e.message})',
  'setError(e instanceof DisplayError ? e.message : other.message)',
  'throw new DisplayError(body.error)',
 ] )assert.ok(checkErrorDisplays(source).length,source);
 for(const source of[
  'setError(e instanceof DisplayError ? e.message : t("failed"))',
  'setError(displayErrorText(e,t("failed")))',
  'throw new DisplayError(apiError(body,"code"))',
 ])assert.deepEqual(checkErrorDisplays(source),[],source);
});
test('the prior SavedMealListeners opening catch is red under the guard',()=>{
 const source=fs.readFileSync('src/components/SavedMealListeners.tsx','utf8');
 const before=source.replace(/void refresh\(\)\.catch\(e=>setError\(e instanceof CaptureFailureError[^;]+;/,'void refresh().catch(e=>setError(e.message));');
 assert.notEqual(before,source);assert.ok(checkErrorDisplays(before).length);
});
for(const locale of['en','ja'])test(locale+': unknown codes and ordinary exceptions cannot display code/SDK text',()=>{
 const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json'));
 const translators=Object.fromEntries(['api','capture'].map(namespace=>[namespace,createTranslator({locale,messages,namespace,onError(e){throw e;}})]));
 const t=(code,values)=>renderFailureMessage(code,values,translators);
 const generic=t('unknownFailure');
 for(const body of[{message_code:'route_unknown'},{message_code:17}]){
  const failure=failureFromResponse(body);assert.equal(captureFailureText(failure,t),generic);
 }
 assert.equal(captureFailureText({code:'route_unknown'},t),generic);
 assert.equal(displayErrorText(new Error('route_bad'),generic),generic);
 assert.equal(displayErrorText(new DisplayError(t('route_ac6a88b19530')),generic),messages.api.route_ac6a88b19530);
 assert.equal(captureFailureText(new CaptureFailureError(failureFromResponse({message_code:'route_ac6a88b19530'})).failure,t),messages.api.route_ac6a88b19530);
});

// Mount the actual component with hook/transport stand-ins, dispatch its real
// open-saved listener, then inspect the actual SavedMealsSheet error prop.
import ts from 'typescript';
import vm from 'node:vm';
import * as failures from '../src/lib/posts/capture-failure.ts';
import * as displayErrors from '../src/i18n/display-error.ts';
for(const locale of['en','ja'])for(const code of['route_ac6a88b19530','route_unknown',undefined])test(locale+': opening saved meals with failed GET '+code+' renders a sentence',async()=>{
 const messages=JSON.parse(fs.readFileSync('messages/'+locale+'.json'));
 const tr=namespace=>createTranslator({locale,messages,namespace,onError(e){throw e;}});
 const translators={api:tr('api'),capture:tr('capture')},tf=(key,values)=>renderFailureMessage(key,values,translators);
 const states=[],effects=[],listeners=new Map();let index=0,mounted=false,requested;
 const hooks={useState(initial){const i=index++;if(!(i in states))states[i]=initial;return[states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},useCallback:fn=>fn,useRef:value=>({current:value}),useEffect:fn=>{if(!mounted)effects.push(fn);}};
 const sheet=()=>null;
 const module={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('src/components/SavedMealListeners.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const require=name=>{
  if(name==='react')return hooks;
  if(name==='react/jsx-runtime')return{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props}),Fragment:'fragment'};
  if(name==='next-intl')return{useTranslations:tr};
  if(name==='next/navigation')return{useRouter:()=>({}),usePathname:()=> '/'};
  if(name==='@/i18n/failure-messages')return{useFailureMessages:()=>tf};
  if(name==='@/lib/posts/capture-failure')return failures;
  if(name==='@/i18n/display-error')return displayErrors;
  if(name==='@/lib/posts/upload-manager')return{uploadManager:{}};
  if(name==='./SavedMealsSheet')return{default:sheet};
  return new Proxy({}, {get:()=>()=>null});
 };
 vm.runInNewContext(source,{module,exports:module.exports,require,fetch:async url=>{requested=url;return{ok:false,json:async()=>code===undefined?{}:{message_code:code}};},window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener(){}}});
 const component=module.exports.default;
 component();for(const effect of effects)effect();mounted=true;
 assert.ok(listeners.has('open-saved'));listeners.get('open-saved')();
 await new Promise(resolve=>setImmediate(resolve));index=0;
 const tree=component(),saved=tree.props.children[0];
 assert.equal(requested,'/api/saved');assert.equal(saved.props.open,true);
 const expected=code==='route_ac6a88b19530'?messages.api[code]:code===undefined?messages.api.error_0795a0b4a0a6:messages.api.unknownFailure;
 assert.equal(saved.props.error,expected);assert.ok(!/route_|error_/.test(saved.props.error));
});
