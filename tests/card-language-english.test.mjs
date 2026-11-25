import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{cardDataFromRow,localizeCardData}from'../src/lib/pipeline/card-data.ts';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/english-card-sentences.json',import.meta.url),'utf8'));
for(const row of fixture.cases)test('English card sentences unchanged: '+row.name,()=>{
 const current=cardDataFromRow(row.source,'en');const {wording,...presentation}=current;
 assert.deepEqual(JSON.parse(JSON.stringify(presentation)),row.expected);
 assert.deepEqual(localizeCardData(current,'en'),current,'re-localizing structured presentation is stable');
 assert.ok(wording);
});

for(const locale of ['en','ja'])test(locale+' water and meal-drink numbers keep their precision and grouping',()=>{
 const source=structuredClone(fixture.cases[0].source);source.foodWaterMl=1234.5;source.dayHydration.totalMl=2345.67;source.itemDrinks[0].ml=1234.5;
 const result=cardDataFromRow(source,locale);
 assert.ok(result.waterLine.includes('1,235'));assert.ok(result.waterLine.includes('2,345.67'));assert.ok(result.mealDrinkLine.includes('1,235 ml'));
});
