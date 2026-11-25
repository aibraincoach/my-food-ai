// node --import ./scripts/lib/server-only.mjs --import tsx --test tests/comment-label.test.mjs
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import React from 'react';import * as jsx from 'react/jsx-runtime';import {renderToStaticMarkup} from 'react-dom/server';
function render(body,author){
 const row={id:'fixture',author,body,created_at:'2026-11-25T00:00:00Z',reverted_at:null};let firstArray=true;
 const react={...React,useState(initial){const injected=Array.isArray(initial)&&firstArray;if(injected)firstArray=false;return React.useState(injected?[row]:initial);}};
 const t=Object.assign(key=>key,{rich:(_key,{count})=>String(count)}),exports={};
 const source=ts.transpileModule(fs.readFileSync(new URL('../src/components/Thread.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(source,{exports,require(name){
  if(name==='react')return react;if(name==='react/jsx-runtime')return jsx;
  if(name==='next-intl')return{useLocale:()=> 'en',useTranslations:()=>t};
  if(name==='next/navigation')return{useRouter:()=>({refresh(){}})};
  if(name==='@/i18n/format')return{formatNumber:(_locale,n)=>String(n)};
  if(name==='@/components/PostHandle')return{usePostHandle:()=> 'Fixture'};
  if(name==='@/components/useRemovalMenus')return{useRemovalMenus(){}};
  if(name==='@/components/LocalTime')return{LocalTime:()=>null};
  if(name==='@/lib/posts/comment-label'){
   const old={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/lib/posts/comment-label.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:old});return old;
  }
  if(name.startsWith('@/components/'))return{default:()=>null};
  return{};
 }});
 return renderToStaticMarkup(React.createElement(exports.default,{postId:'fixture',readOnly:true}));
}
for(const body of ['Not eaten: 100 g · 157 kcal. Consumed: 0 g · 0 kcal.','Leftovers · not eaten: 100 g','Correction\n  not eaten: 50 g','Leftovers: 100 g','The food was not eaten: it was shared.','Text <not eaten:> & quantity'])for(const author of ['model','user'])test(author+' prose renders verbatim: '+body,()=>{
 const html=render(body,author),expected=renderToStaticMarkup(React.createElement('span',{'data-i18n-stored':'comment'},body));assert.ok(html.includes(expected));
});
