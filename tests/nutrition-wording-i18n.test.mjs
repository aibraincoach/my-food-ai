import test from'node:test';import assert from'node:assert/strict';import fs from'node:fs';
import{summaryLine}from'../src/lib/posts/summary-line.ts';import{plainConsumed}from'../src/lib/pipeline/wording.ts';import{unavailableSentence}from'../src/lib/fdc/unavailable.ts';import{gapSentence,formatConsumed,formatCalories,formatNutrition}from'../src/lib/nutrition/totals.ts';import{savedItemsLine}from'../src/lib/posts/saved-summary.ts';import{nutritionTranslator}from'../src/i18n/nutrition.ts';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/nutrition-wording-goldens.json',import.meta.url)));
// English values were captured from main before conversion. Japanese values
// instantiate the PM/reviewer's accepted full messages, including stored data.
for(const locale of['en','ja'])test('shared nutrition wording: fixed '+locale+' goldens',()=>{
 const t=nutritionTranslator(locale);for(const row of fixtures.cases){const{kind,input}=row;let actual;
  if(kind==='summary')actual=summaryLine(input,t,locale);if(kind==='plain')actual=plainConsumed(input.totals,input.approximations,input.unavailable);if(kind==='brief')actual=formatConsumed(input,t,locale);if(kind==='gap')actual=gapSentence(input,t,locale);if(kind==='unavailable')actual=unavailableSentence(input.name,input.sourceRef,t,locale);if(kind==='saved')actual=savedItemsLine(input.items,t,locale,input.drinks);
  assert.equal(actual,locale==='en'?row.output:row.ja,kind+JSON.stringify(input));
 }
});
test('numeric nutrition formatting requires an explicit locale and preserves precision',()=>{
 const t=nutritionTranslator('en');assert.throws(()=>formatCalories(12,t,undefined),/locale is required/);assert.throws(()=>formatNutrition(12,t,undefined),/locale is required/);
 for(const locale of['en','ja']){const tn=nutritionTranslator(locale);assert.equal(formatCalories(0.2,tn,locale),'<1');assert.equal(formatCalories(null,tn,locale),'—');assert.equal(formatNutrition(-3,tn,locale),'0');assert.equal(formatCalories(1234,tn,locale),'1,234');}
});
