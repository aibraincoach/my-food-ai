import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {isLocale} from '../src/i18n/locales.ts';
function action(fail=false, protocol='https') {
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/i18n/actions.ts',import.meta.url),'utf8'),{reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS}});
 assert.equal(code.diagnostics?.length??0,0);
 const exports={},calls=[];
 vm.runInNewContext(code.outputText,{exports,URL,process:{env:{APP_URL:protocol+'://app.example',NODE_ENV:'production'}},require:name=>{
  if(name==='next/headers')return {cookies:async()=>({set:(...args)=>{calls.push(args);if(fail)throw Error('denied write');}})};
  if(name==='./locales')return {isLocale};throw Error(name);
 }});
 return {save:exports.saveLocale,calls};
}
test('language choice is one device cookie with no account write or returned credentials',async()=>{
 const a=action();assert.equal(await a.save('ja'),true);assert.equal(a.calls.length,1);
 const [key,value,options]=a.calls[0];assert.equal(key,'lang');assert.equal(value,'ja');
 assert.equal(options.httpOnly,true);assert.equal(options.sameSite,'lax');assert.equal(options.path,'/');assert.equal(options.secure,true);
 assert.equal(await a.save('unsupported'),false);assert.equal(a.calls.length,1);
});
test('a failed locale write is returned visibly to the setting, with one attempt and no retry',async()=>{
 const a=action(true);assert.equal(await a.save('ja'),false);assert.equal(a.calls.length,1);
});

test('the non-secret preference cookie also works on a local HTTP test origin',async()=>{
 const a=action(false,'http');assert.equal(await a.save('en'),true);assert.equal(a.calls[0][2].secure,false);
});
