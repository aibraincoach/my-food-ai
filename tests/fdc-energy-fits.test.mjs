import test from 'node:test';
import assert from 'node:assert/strict';
import {energyFits} from '../src/lib/fdc/nutrients.ts';
import {matchFood} from '../src/lib/fdc/match.ts';

const food=(fdcId,description,nutrients)=>({fdcId,description,dataType:'Branded',foodNutrients:nutrients.map(([nutrientId,value,unitName='G'])=>({nutrientId,nutrientName:String(nutrientId),unitName,value}))});
const butterWithoutEnergy=food(789828,'UNSALTED BUTTER',[[1004,81.5],[1087,24,'MG']]);
const sambalAtZero=food(2016176,'SAMBAL',[[1008,0,'KCAL'],[1003,0],[1005,0],[1004,0]]);
const sambal=food(2016177,'SAMBAL OELEK',[[1008,120,'KCAL'],[1003,1.5],[1005,15],[1004,5]]);
const pepsiZero=food(173656,'Pepsi Zero',[[1008,0,'KCAL'],[1003,0],[1005,0],[1004,0]]);

// #989: the records that gave the butter packet no calories and the sambal 0 kcal are not eligible matches.
test('a record with no energy, or zero energy for a food that has energy, does not fit',()=>{
 assert.equal(energyFits('unsalted butter packet',butterWithoutEnergy),false);
 assert.equal(energyFits('Sambal',sambalAtZero),false);
 assert.equal(energyFits('Sambal',sambal),true);
 assert.equal(energyFits('Pepsi Zero',pepsiZero),true);
 assert.equal(energyFits('water',food(1,'Water',[[1008,0,'KCAL']])),true);
 assert.equal(energyFits('iced tea with sugar',food(2,'Tea',[[1008,0,'KCAL']])),false);
 assert.equal(energyFits('kJ only',food(3,'X',[[1008,500,'KJ']])),true);
 assert.equal(energyFits('negative',food(4,'X',[[1008,-1,'KCAL']])),false);
});

test('the matcher offers the model only records whose energy fits',async()=>{
 let offered=[];
 const result=await matchFood('Sambal','',{
  search:async()=>[sambalAtZero,sambal],
  choose:async(_name,_caption,foods)=>{offered=foods.map(f=>f.fdcId);return {id:foods[0]?.fdcId??null,query:null,query_food:null,reason:'same food'};},
 });
 assert.deepEqual(offered,[2016177]);
 assert.equal(result.food?.fdcId,2016177);
});
