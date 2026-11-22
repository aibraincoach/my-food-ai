import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{cardDataFromRow,localizeCardData}from'../src/lib/pipeline/card-data.ts';
const fixture=JSON.parse(readFileSync(new URL('./fixtures/english-card-sentences.json',import.meta.url),'utf8'));
for(const row of fixture.cases)test('English card sentences unchanged: '+row.name,()=>{
 const current=cardDataFromRow(row.source,'en');const {wording,...presentation}=current;
 assert.deepEqual(JSON.parse(JSON.stringify(presentation)),row.expected);
 assert.deepEqual(localizeCardData(current,'en'),current,'re-localizing structured presentation is stable');
 assert.ok(wording);
});
