import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createTranslator} from 'next-intl';
import * as format from '../src/i18n/format.ts';
import {dayReview} from '../src/lib/nutrition/day-review.ts';
const code=ts.transpileModule(readFileSync(new URL('../src/components/DayTotalReview.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
function component(locale){
 const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8')),exports={};
 const jsx=(type,props)=>({type,props});
 vm.runInNewContext(code,{exports,Date,require(name){
  if(name==='react/jsx-runtime')return{jsx,jsxs:jsx};
  if(name==='next/link')return{default:'a'};
  if(name==='next-intl')return{useLocale:()=>locale,useTranslations:namespace=>createTranslator({locale,namespace,messages,onError:error=>{throw error;}})};
  if(name==='@/i18n/format')return format;
  if(name==='@/lib/nutrition/day-review')return{dayReview};
  throw Error(name);
 }});return{render:exports.default,note:messages.days.highTotalNote};
}
for(const locale of ['en','ja']){
 test(locale+': the high-day note retains the total and links the three largest known meals',()=>{
  const c=component(locale),posts=[{id:'a',totals:{calories:100}},{id:'b',totals:{calories:300}},{id:'c',totals:{calories:200}},{id:'d',totals:{calories:null}},{id:'e',totals:{calories:50}}],before=JSON.stringify(posts);
  const tree=c.render({kcal:4001,posts}),text=JSON.stringify(tree);
  assert.ok(text.includes(c.note));assert.ok(text.includes('/?post=b'));assert.ok(text.includes('/?post=c'));assert.ok(text.includes('/?post=a'));
  assert.ok(!text.includes('/?post=d'));assert.ok(!text.includes('/?post=e'));assert.equal(JSON.stringify(posts),before);
  const links=tree.props.children[2].props.children;assert.deepEqual(Array.from(links,n=>n.props.children.props.href),['/?post=b','/?post=c','/?post=a']);
 });
 test(locale+': the threshold is strict and missing totals do not imply a high day',()=>{
  const c=component(locale);for(const kcal of [3999,4000,null,undefined])assert.equal(c.render({kcal}),null);
  assert.ok(JSON.stringify(c.render({kcal:4001})).includes(c.note));
 });
}
