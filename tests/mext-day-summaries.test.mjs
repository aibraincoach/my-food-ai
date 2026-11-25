import test from 'node:test';import assert from 'node:assert/strict';
import {dayTotalFromMeals,dayPostReceipt} from '../src/lib/posts/days.ts';
import {dayTotalRefreshDates} from '../src/lib/posts/day-total-changes.ts';
import {summaryLine} from '../src/lib/posts/summary-line.ts';
import {savedItemsLine} from '../src/lib/posts/saved-summary.ts';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
const zero={calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0};
const item={...zero,name:'Fixture',calories:null,micronutrients:[{nutrientId:1008,value:null,basis:'portion',marker:'trace'}]};
const meal={id:'meal',eatenAt:'2026-11-25T00:00:00Z',items:[item]};
test('compact day totals and receipts preserve trace-only versus measured zero',()=>{
 const day=dayTotalFromMeals('2026-11-25',[meal]);assert.equal(day.kcal,0);assert.equal(day.known,1);assert.deepEqual(day.missing,[]);assert.deepEqual(day.trace,['Fixture']);assert.equal(day.traceOnly,true);assert.equal(day.posts[0].traceOnly,true);
 const mixed=dayTotalFromMeals('2026-11-25',[meal,{...meal,id:'zero',items:[{...zero,name:'Measured'}]}]);assert.equal(mixed.kcal,0);assert.equal(mixed.traceOnly,undefined);assert.deepEqual(mixed.trace,['Fixture']);
});
test('a measured-zero receipt cannot hide a later trace marker change',()=>{
 const old=dayPostReceipt('meal',meal.eatenAt,[{...zero,name:'Fixture'}]);
 const fresh={id:'meal',eaten_at:meal.eatenAt,status:'ready',items:[item]};
 assert.deepEqual(dayTotalRefreshDates(undefined,fresh,'UTC',new Set(['2026-11-25']),false,new Map([['meal',old]])),['2026-11-25']);
});
test('post and Saved summaries use trace in both languages, and mixed values retain zero plus the note',()=>{
 for(const locale of ['en','ja']){
  const t=nutritionTranslator(locale),word=t('trace');
  assert.ok(summaryLine({items:[item]},t,locale).includes(word));
  assert.ok(savedItemsLine([{name:item.name,portion_grams:100,nutrition:item}],t,locale).includes(word));
  assert.ok(summaryLine({items:[item,{...zero,name:'Measured'}]},t,locale).includes(t('includesTraceAmounts')));
 }
});

test('the database day and month projection carries trace-only and mixed-day receipts',async()=>{
 const{createClient}=await import('@supabase/supabase-js');const{getDayTotals,getMonthSummary}=await import('../src/lib/posts/days.ts');
 const entries=[{id:'trace',eaten_at:'2026-11-25T00:00:00Z',status:'ready',current_post_items:[{id:'a',name:'Trace',item_nutrition:{...item,post_item_id:'a'}}]},{id:'measured',eaten_at:'2026-11-25T01:00:00Z',status:'ready',current_post_items:[{id:'b',name:'Zero',item_nutrition:{...zero,post_item_id:'b',micronutrients:[]}}]},{id:'only',eaten_at:'2026-11-26T00:00:00Z',status:'ready',current_post_items:[{id:'c',name:'Trace',item_nutrition:{...item,post_item_id:'c'}}]}];
 const db=createClient('https://local-fixture.invalid','fixture',{global:{fetch:async input=>{const path=new URL(input instanceof Request?input.url:String(input)).pathname;if(path.endsWith('/posts'))return Response.json(entries);if(path.endsWith('/intake_logs'))return Response.json([]);throw Error('Unexpected fixture path '+path);}}});
 const days=await getDayTotals(db,'owner','UTC',['2026-11-25','2026-11-26']);assert.equal(days[0].kcal,0);assert.equal(days[0].traceOnly,undefined);assert.equal(days[1].traceOnly,true);assert.deepEqual(days[1].trace,['Trace']);
 const month=await getMonthSummary(db,'owner','UTC','2026-11');assert.equal(month.days[0].kcal,0);assert.equal(month.days[0].traceOnly,undefined);assert.equal(month.days[1].traceOnly,true);assert.deepEqual(month.days[1].trace,['Trace']);
});
