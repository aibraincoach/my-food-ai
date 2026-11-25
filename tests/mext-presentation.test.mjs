import test from'node:test';import assert from'node:assert/strict';import React from'react';import{renderToStaticMarkup}from'react-dom/server';import{readFileSync}from'node:fs';import{createRequire}from'node:module';
import{cardDataFromRow}from'../src/lib/pipeline/card-data.ts';import{ResultsCard}from'../src/components/ResultsCard.tsx';import{cardTranslator}from'../src/i18n/card.ts';import{nutritionTranslator}from'../src/i18n/nutrition.ts';
const require=createRequire(import.meta.url),{NextIntlClientProvider}=require('next-intl'),Attribution=require('../src/components/MextAttribution.tsx').default,ItemRows=require('../src/components/ItemRows.tsx').default;
const item={id:'fixture',name:'Fixture food',source_ref:'mext:01088',portion_grams:100,calories:null,protein_g:2,carbs_g:10,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[{nutrientId:1008,value:null,basis:'portion',marker:'trace'}]};
for(const locale of['en','ja']){
 const messages=JSON.parse(readFileSync(new URL('../messages/'+locale+'.json',import.meta.url),'utf8'));
 const render=element=>renderToStaticMarkup(React.createElement(NextIntlClientProvider,{locale,messages,timeZone:'UTC'},element));
 test(locale+' table attribution keeps the source link and exact credit boundary',()=>{
  const html=render(React.createElement(Attribution));assert.ok(html.includes('href="https://www.mext.go.jp/a_menu/syokuhinseibun/mext_00001.html"'));
  const text=html.replace(/<[^>]*>/g,'');assert.ok(text.includes('My Food AI'));if(locale==='ja')assert.ok(text.includes('日本食品標準成分表（八訂）増補2023年から引用（又は出典）'));
 });
 test(locale+' per-food rows show trace instead of unavailable',()=>{const html=render(React.createElement(ItemRows,{items:[item],onSelect:()=>{},onAdd:()=>{}}));assert.ok(html.includes(messages.nutrition.trace));});
 test(locale+' drink cards retain MEXT credit outside the meal-only body',()=>{
  const props={t:cardTranslator(locale),tn:nutritionTranslator(locale),locale};
  const drink={kind:'water',label:'Water',source:'item',ml:100,totalMl:100,drinksMl:100,foodMl:0,caffeineMg:0};
  const data=cardDataFromRow({items:[item],drink},locale,props);assert.equal(data.kind,'drink');
  const html=renderToStaticMarkup(React.createElement(ResultsCard,{...props,data}));assert.ok(html.includes('My Food AI'));assert.ok(html.includes('MEXT')||html.includes('日本食品標準成分表'));
 });
}
