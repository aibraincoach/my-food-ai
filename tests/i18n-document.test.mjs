import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {resolveLocale,isLocale} from '../src/i18n/locales.ts';

function load(path,imports,append='') {
 const source=readFileSync(new URL(path,import.meta.url),'utf8')+append;
 const exports={};
 const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(output,{exports,process:{env:{}},require:name=>{
  if(name in imports)return imports[name];
  if(name.endsWith('.json'))return JSON.parse(readFileSync(new URL(name,new URL(path,import.meta.url)),'utf8'));
  throw Error('Unexpected import: '+name);
 }});
 return exports;
}
test('translated front screens enable phone default and keep explicit device choice and public document selection',async()=>{
 for(const [cookie,header,shell,expected] of [[undefined,'ja-JP',null,'ja'],['ja','en',null,'ja'],['en','ja-JP',null,'en'],[undefined,'en','ja','ja']]) {
  const request=load('../src/i18n/request.ts',{
   '@/lib/posts/days':{validZone:value=>value??'UTC'},
   'next/headers':{cookies:async()=>({get:key=>key==='lang'&&cookie?{value:cookie}:undefined}),headers:async()=>({get:key=>key==='accept-language'?header:key==='x-mfa-shell-locale'?shell:null})},
   'next-intl/server':{getRequestConfig:fn=>fn},
   './locales':{resolveLocale,isLocale},'./strict':{onError:()=>{},getMessageFallback:()=>{}},
  });
  assert.equal((await request.default()).locale,expected);
 }
});
test('translated front screens serve the resolved document language',async()=>{
 const jsx=(type,props)=>({type,props});
 const root=load('../src/app/layout.tsx',{
  'next-intl/server':{getLocale:async()=> 'ja',getMessages:async()=>({navigation:{},errors:{},card:{}}),getTimeZone:async()=> 'UTC'},
  '@/components/i18n/StrictIntlProvider':{default:'StrictIntlProvider'},
  'react':{Suspense:'Suspense'},'react/jsx-runtime':{jsx,jsxs:jsx},
  '@/lib/theme/font':{font:{className:'font',variable:'font-variable'}},
  '@/lib/theme/tokens':{tokens:{colors:{surface:'white'}}},
  '@/components/i18n/LocaleReporter':{default:'LocaleReporter'},
  '@/components/DiagnosticsRecorder':{default:'DiagnosticsRecorder'},
  '@/components/DeferredEffects':{default:'DeferredEffects'},
  '@/components/ServiceWorkerRegistration':{default:'ServiceWorkerRegistration'},
  '@/components/PostOpenTransition':{default:'PostOpenTransition'},
  '@/components/FeedCacheMutations':{default:'FeedCacheMutations'},
  '@/components/DeletePostSheet':{default:'DeletePostSheet'},'./globals.css':{},
 },'\nexport {LocaleDocument};');
 const document=await root.LocaleDocument({children:'English front screens'});
 assert.equal(document.type,'html');assert.equal(document.props.lang,'ja');
 const setting=readFileSync(new URL('../src/components/i18n/LanguageSetting.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(setting,/<section lang=/,'the row inherits the resolved document language');
});
