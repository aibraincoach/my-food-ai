import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createTranslator} from 'next-intl';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
import * as formats from '../../src/i18n/format.ts';
import * as totals from '../../src/lib/nutrition/totals.ts';
import * as table from '../../src/lib/nutrition/table.ts';
import * as sources from '../../src/lib/nutrition/meal-sources.ts';
import * as approximation from '../../src/lib/fdc/approximation-metadata.ts';
const require=createRequire(import.meta.url);
export function renderNutritionTable(locale,messages,fixtureItems,componentSource){
 const exports={};
 const source=ts.transpileModule(componentSource??fs.readFileSync(new URL('../../src/components/NutritionTable.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(source,{exports,require(name){
  if(name==='react/jsx-runtime')return require(name);
  if(name==='next-intl')return{useLocale:()=>locale,useTranslations:namespace=>createTranslator({locale,messages,namespace})};
  if(name==='@/i18n/format')return formats;
  if(name==='@/lib/nutrition/totals')return totals;
  if(name==='@/lib/nutrition/table')return table;
  if(name==='@/lib/nutrition/meal-sources')return sources;
  if(name==='@/lib/fdc/approximation-metadata')return approximation;
  if(name==='./OpenFoodFactsAttribution'){
   const child={};
   const code=ts.transpileModule(fs.readFileSync(new URL('../../src/components/OpenFoodFactsAttribution.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
   vm.runInNewContext(code,{exports:child,require(module){if(module==='react/jsx-runtime')return require(module);if(module==='next-intl')return{useTranslations:namespace=>createTranslator({locale,messages,namespace})};throw Error(module);}});
   return child;
  }
  throw Error(name);
 }});
 return renderToStaticMarkup(React.createElement(exports.default,{items:fixtureItems}));
}