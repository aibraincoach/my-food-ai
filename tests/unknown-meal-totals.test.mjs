import test from 'node:test';import assert from 'node:assert/strict';
import {sumNutrition,formatConsumed,formatCalories} from '../src/lib/nutrition/totals.ts';
import {getDays} from '../src/lib/posts/days.ts';import {cardDataFromRow} from '../src/lib/pipeline/card-data.ts';import {summaryLine} from '../src/lib/posts/summary-line.ts';
const unknown={name:'Unmatched meal',calories:null,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null};
test('empty or unavailable meal cannot publish an invented zero in shared card or summary data',()=>{
 for(const items of [[],[unknown]]){assert.equal(sumNutrition(items).calories,null);assert.equal(cardDataFromRow({items}).kcal,null);assert.doesNotMatch(summaryLine({items}),/Consumed: 0 kcal/);}
 const water={...unknown,name:'Water',calories:0,protein_g:0,carbs_g:0,fat_g:0};assert.equal(sumNutrition([water]).calories,0);assert.equal(formatConsumed(sumNutrition([water])),'Consumed: 0 kcal');
});
function db(calories){const posts=calories.map((_,i)=>({id:`post${i}`,caption:'Meal',eaten_at:'2026-11-01T12:00:00Z'}));return{from(table){let id,ids;const q={select(){return q},eq(k,v){if(k==='post_id')id=v;return q},gte(){return q},lt(){return q},order(){return q},limit(){return q},in(k,v){ids=v;return q},async range(){return{data:table==='posts'?posts:[],error:null}},async maybeSingle(){return{data:null,error:null}},then(resolve){let data=[];if(table==='current_post_items')data=[{id:`item${id.slice(4)}`,post_id:id,name:`Food ${id.slice(4)}`,portion_grams:100,source:'model'}];if(table==='item_nutrition')data=ids.map(key=>({...unknown,name:undefined,post_item_id:key,calories:calories[Number(key.slice(4))],micronutrients:[],source_ref:null}));return Promise.resolve({data,error:null}).then(resolve)}};return q}};}
test('a day of entirely unavailable foods stays unknown instead of adding to a zero seed',async()=>{
 const [day]=await getDays(db([null,null]),'owner','UTC','2026-11-01','2026-11-01');assert.equal(day.totals.calories,null);assert.deepEqual(day.totals.missing.calories,['Food 0','Food 1']);assert.ok(day.posts.every(p=>p.totals.calories===null));
});
test('mixed days retain known calories and name the unavailable food without a phantom item',async()=>{
 const [day]=await getDays(db([null,123]),'owner','UTC','2026-11-01','2026-11-01');assert.equal(day.totals.calories,123);assert.deepEqual(day.totals.missing.calories,['Food 0']);
});

test('positive sub-kcal energy is never displayed as a measured zero',()=>{
 for(const n of [.01,.3,.49,'0.3'])assert.equal(formatCalories(n),'<1');
 assert.equal(formatCalories(0),'0');assert.equal(formatCalories(null),'—');assert.equal(formatCalories(.5),'1');
 const items=[{...unknown,name:'Espresso',calories:.3}];assert.match(summaryLine({items}),/Consumed: <1 kcal/);assert.equal(formatConsumed(sumNutrition(items)),'Consumed: <1 kcal · Nutrition unavailable: Espresso');
});
