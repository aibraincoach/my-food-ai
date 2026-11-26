import {englishIntl} from './fixtures/english-intl.mjs';
import test from'node:test';import assert from'node:assert/strict';import React from'react';import{renderToStaticMarkup}from'react-dom/server';import{readFileSync}from'node:fs';import{createRequire}from'node:module';import vm from'node:vm';import ts from'typescript';
const en=JSON.parse(readFileSync(new URL('../messages/en.json',import.meta.url),'utf8'));
const sourceRequire=createRequire(import.meta.url),sourceRoot=process.env.COPY_SOURCE_ROOT??new URL('..',import.meta.url).pathname;
const exports={};const code=ts.transpileModule(readFileSync(sourceRoot+'/src/components/NutritionTable.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
// Keep actual nutrition/provenance readers and React output; replace only the
// request-bound translation hook to avoid the Node ESM/CommonJS context seam.
vm.runInNewContext(code,{exports,require:id=>id==='next-intl'?englishIntl:sourceRequire(id.startsWith('@/')?sourceRoot+'/src/'+id.slice(2):id.startsWith('./')?sourceRoot+'/src/components/'+id.slice(2):id)});
const NutritionTable=exports.default,NextIntlClientProvider=sourceRequire('next-intl').NextIntlClientProvider;

const food=(name,source_ref,kind)=>({id:name,name,portion_grams:100,portion_text:null,calories:100,protein_g:5,carbs_g:10,fat_g:4,fibre_g:1,sugar_g:2,sodium_mg:10,source_ref,micronutrients:kind?[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:100,approximation:{kind,basis:'Local fixture',sourceRef:source_ref}}]:[]});
function html(items){return renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale:'en',timeZone:'UTC',messages:en},React.createElement(NutritionTable,{items})));}
for(const[name,items,estimate,suppliers]of[
 ['all reference foods',[food('Rice','1'),food('Beans','2')],null,['USDA FoodData Central']],
 ['one estimate in a mixed meal',[food('Rice','1'),food('Stew','estimate:fixture','estimate')],'Stew',['USDA FoodData Central','model estimates']],
 ['closest record',[food('Rice','1','closest')],null,['USDA FoodData Central']],
 ['Open Food Facts barcode',[food('Juice','off:123')],null,['Open Food Facts']],
 ['label and personal drink',[food('Soup','label'),food('Coffee','user:drink-correction:reading')],null,['the package label you photographed','values you entered']],
 ['old unknown source',[food('Legacy',null)],null,[]],
])test('source wording: '+name,()=>{const markup=html(items);const expected=suppliers.length?'Nutrition values from: '+suppliers.join(', '):'Source not recorded for: Legacy';assert.ok(markup.includes(expected));assert.match(markup,/<caption[^>]*class="sr-only"[^>]*>Meal nutrition<\/caption>/);assert.equal(markup.includes('USDA'),suppliers.includes('USDA FoodData Central'));assert.equal(markup.includes('Values come from nutrition labels, food reference data, or labelled estimates.'),false);const notes=[...markup.matchAll(/Nutrition for ([^<]+) is a model estimate because no matching database record or label was found\./g)];assert.equal(notes.length,estimate?1:0);if(estimate)assert.equal(notes[0][1],estimate);assert.equal(markup.includes('world.openfoodfacts.org'),items.some(x=>x.source_ref?.startsWith('off:')));});
