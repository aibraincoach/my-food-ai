import test from 'node:test';import assert from 'node:assert/strict';
import {matchFood} from '../src/lib/fdc/match.ts';
import {chooseBestMatch,scaleNutrition} from '../src/lib/fdc/nutrients.ts';
import {sumNutrition,formatConsumed,unavailableFoods,sumMicronutrients} from '../src/lib/nutrition/totals.ts';
import {safeSummary} from '../src/lib/pipeline/wording.ts';
const food=(id,description,extra={})=>({fdcId:id,description,dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:100}],...extra});
const zero={calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0};
test('unrelated shared adjective and incompatible volume never become a gram match',()=>{
 assert.equal(chooseBestMatch([food(169942,'Persimmons, japanese, dried')],'Japanese toast'),null);
 assert.equal(chooseBestMatch([food(1,'Milk',{dataType:'Branded',servingSizeUnit:'ml'})],'milk'),null);
 assert.equal(chooseBestMatch([food(1904507,'BLACK COFFEE',{foodNutrients:[]})],'black coffee'),null);
 assert.equal(chooseBestMatch([food(2,'Carrots, raw')],'raw carrots')?.fdcId,2);
});
test('a rejected first search permits one refined search and no third attempt',async()=>{
 const searches=[];let choices=0;
 const result=await matchFood('Japanese toast','a slice of toast',{search:async q=>{searches.push(q);return [food(169942,'Persimmons, japanese, dried')]},choose:async()=>{choices++;return{id:null,query:'white bread toasted',reason:'different food'}}});
 assert.equal(result.food,null);assert.equal(result.searches,2);assert.equal(choices,2);assert.deepEqual(searches,['Japanese toast','white bread toasted']);
});
test('selection is restricted to eligible candidate ids, provider failures are not false unknowns',async()=>{
 await assert.rejects(matchFood('food','',{search:async()=>[food(1,'Food')],choose:async()=>({id:999,query:null,reason:'bad'})}),/ineligible/);
 await assert.rejects(matchFood('food','',{search:async()=>{throw Error('network')},choose:async()=>{throw Error('unexpected')}}),/network/);
 const r=await matchFood('carrot','',{search:async()=>[food(4,'Carrots, raw')],choose:async()=>({id:4,query:null,reason:'same food'})});assert.equal(r.food.fdcId,4);
});
test('partial nutrients retain known sums and names through day aggregation',()=>{
 const known={...zero,name:'toast',calories:257.6};const missing={...zero,name:'coffee',calories:null,protein_g:null};
 const totals=sumNutrition([known,missing]);assert.equal(totals.calories,257.6);assert.deepEqual(unavailableFoods(totals),['coffee']);assert.match(formatConsumed(totals),/258 kcal.*coffee/);
 assert.equal(sumNutrition([totals,{...zero,calories:100}]).calories,357.6);
 assert.equal(sumNutrition([{...zero,name:'unknown',calories:null}]).calories,null);
 assert.equal(sumNutrition([{...zero,name:'water'}]).calories,0);
});
test('summary cannot publish model numbers and uses identical display rounding',async()=>{
 const caption='two eggs';const totals={calories:600,protein_g:12.6,carbs_g:0,fat_g:null,missing:{fat_g:['coffee']}};
 const summary=await safeSummary('Consumed: 900 kcal',totals);assert.match(summary,/600 kcal/);assert.doesNotMatch(summary,/900/);assert.match(summary,/13 g protein/);assert.match(summary,/coffee/);assert.equal(caption,'two eggs');
});
test('micronutrients keep available contributions, flag unavailable foods, preserve genuine zero',()=>{
 const iron=value=>({nutrientId:1089,nutrientName:'Iron',unitName:'MG',value});
 const r=sumMicronutrients([{name:'beans',micronutrients:[iron(2)]},{name:'unknown',micronutrients:[]}]);assert.equal(r[0].value,2);assert.deepEqual(r[0].unavailable,['unknown']);
 assert.equal(sumMicronutrients([{micronutrients:[iron(0)]}])[0].value,0);
 assert.equal(scaleNutrition(food(3,'Known'),null).calories,null);
});

test('primary card omissions describe its displayed nutrients while detail retains optional omissions',()=>{
 const totals=sumNutrition([{...zero,name:'toast',calories:100,fibre_g:null},{...zero,name:'coffee',calories:null}]);
 assert.deepEqual(unavailableFoods(totals),['coffee']);
 assert.deepEqual(totals.missing.fibre_g,['toast']);
});

test('exhausted shared resolution budget rejects before another lookup, never publishes an unknown match',async()=>{
 let calls=0;const controller=new AbortController();controller.abort();
 await assert.rejects(matchFood('food','',{search:async()=>{calls++;return[]},choose:async()=>({id:null,query:null,reason:'none'})},controller.signal),error=>error.status===503);
 assert.equal(calls,0);
});
