import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createTranslator} from 'next-intl';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
import * as formats from '../src/i18n/format.ts';
import * as totals from '../src/lib/nutrition/totals.ts';
import * as table from '../src/lib/nutrition/table.ts';
import * as approximation from '../src/lib/fdc/approximation-metadata.ts';
const require=createRequire(import.meta.url);
function render(locale,messages,fixtureItems=items){
 const exports={};
 const source=ts.transpileModule(fs.readFileSync(new URL('../src/components/NutritionTable.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require(name){
  if(name==='react/jsx-runtime')return require(name);
  if(name==='next-intl')return{useLocale:()=>locale,useTranslations:namespace=>createTranslator({locale,messages,namespace})};
  if(name==='@/i18n/format')return formats;
  if(name==='@/lib/nutrition/totals')return totals;
  if(name==='@/lib/nutrition/table')return table;
  if(name==='@/lib/fdc/approximation-metadata')return approximation;
  if(name==='./OpenFoodFactsAttribution'||name==='./MextAttribution')return{__esModule:true,default:()=>null};
  throw Error(name);
 }});
 return renderToStaticMarkup(React.createElement(exports.default,{items:fixtureItems}));
}
const items=[{id:'a',name:'ご飯',calories:null,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[]},{id:'b',name:'豆',calories:null,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[]},{id:'c',name:'豆腐',calories:10,protein_g:0,carbs_g:0,fat_g:0,micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1}]}];
for(const locale of ['en','ja'])test('rendered '+locale+' table gap and unavailable-food punctuation',()=>{
 const all=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 const html=render(locale,all);
 const gap=html.match(/<p class="text-meta text-muted">(.*?)<\/p>/)?.[1];
 assert.ok(gap);
 console.log(JSON.stringify({locale,gap,unavailable:html.match(/(?:・不明：| · unavailable: )[^<]+/)?.[0]}));
 if(locale==='ja'){
  assert.ok(gap.startsWith(all.nutrition.knownValues));
  assert.ok(html.includes('・不明：ご飯、豆'));
  assert.doesNotMatch(gap,/ |, /);
 }else{
  assert.ok(gap.startsWith(all.nutrition.knownValues+' '));
  assert.ok(html.includes(' · unavailable: ご飯, 豆'));
 }
});

for(const locale of ['en','ja'])test('only unmapped USDA name data has a wording marker in '+locale,()=>{
 const all=JSON.parse(fs.readFileSync(new URL('../messages/'+locale+'.json',import.meta.url)));
 const fixtureItems=[{...items[2],micronutrients:[{nutrientId:1089,nutrientName:'Iron',unitName:'MG',value:1},{nutrientId:999002,nutrientName:'Iron',unitName:'MG',value:2}]}];
 const html=render(locale,all,fixtureItems);
 assert.deepEqual([...html.matchAll(/data-i18n-server-wording="([^"]+)"[^>]*>(.*?)<\/span>/g)].map(match=>[match[1],match[2]]),[['nutrient-name','Iron']]);
 assert.ok(html.includes('<span>'+(locale==='ja'?'鉄':'Iron')+'</span>'));
});
