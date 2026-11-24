import test from'node:test';import assert from'node:assert/strict';
import{formatDate,formatEnergy}from'../src/i18n/format.ts';
import{formatCalories}from'../src/lib/nutrition/totals.ts';
test('English energy display retains base behavior including positive fractions, serialized values and missing values',()=>{
 for(const value of[null,undefined,'',' ',NaN,Infinity,'bad',-1,-0.1,0,0.1,0.49,0.5,1,1234.5,'1234.5'])assert.equal(formatEnergy('en',value),formatCalories(value),String(value));
});
test('Japanese energy display retains less-than-one and measured zero',()=>{
 assert.equal(formatEnergy('ja',0.1),'<1');assert.equal(formatEnergy('ja',0),'0');assert.equal(formatEnergy('ja',1234.5),'1,235');assert.equal(formatEnergy('ja',null),'—');
});
test('English day labels keep the original UTC anchor and formatting, while Japanese uses Japanese weekdays',()=>{
 const date=new Date('2026-11-24T12:00:00Z'),opts={weekday:'long',month:'short',day:'numeric'};
 assert.equal(formatDate('en',date,'UTC',opts),'Tuesday, Nov 24');
 assert.equal(formatDate('ja',date,'UTC',{weekday:'short'}),'火');
 assert.equal(formatDate('en',new Date('2026-11-24T01:00:00Z'),'America/Edmonton',{day:'numeric'}),'23');
});

test('LocalTime keeps the viewing zone and English clock while the active locale changes',async()=>{
 const {formatLocalTime,formatLocalDate}=await import('../src/lib/time/local.ts');
 const value='2026-11-24T01:00:00Z',zone='America/Edmonton';
 assert.equal(formatLocalTime('en',value,zone),'6:00 PM');
 assert.equal(formatLocalTime('ja',value,zone),'18:00');
 assert.equal(formatLocalDate('ja',value,zone),'11月23日(月)');
 assert.equal(formatLocalTime('ja','invalid',zone),'');
});

test('localized nutrients retain base whole and micronutrient precision',async()=>{
 const {formatNutrient,formatMicroNutrient}=await import('../src/i18n/format.ts');
 const {formatNutrition}=await import('../src/lib/nutrition/totals.ts');
 const {formatTableNutrient}=await import('../src/lib/nutrition/table.ts');
 for(const value of[null,undefined,'',' ',NaN,Infinity,'bad',-1,-0.1,0,0.1,0.49,0.5,1,1234.5,'1234.5'])assert.equal(formatNutrient('en',value),formatNutrition(value),String(value));
 for(const value of[-1,0,0.0001,0.009,0.01,0.126,1,1234.567])assert.equal(formatMicroNutrient('en',value),formatTableNutrient(value),String(value));
 assert.equal(formatMicroNutrient('ja',0.001),'<0.01');
});

test('localized portion labels retain the original coercion, precision and negative zero',async()=>{
 const {formatPortion}=await import('../src/i18n/format.ts');
 const {formatGrams}=await import('../src/lib/nutrition/totals.ts');
 for(const value of[null,undefined,'',NaN,Infinity,'bad',-1,-0.1,0,0.1,0.5,1234.5,'1234.5'])assert.equal(formatPortion('en',value),formatGrams(value),String(value));
 assert.equal(formatPortion('ja',1234.5),'1235 g');
});
