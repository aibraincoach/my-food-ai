import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {scaleNutrition} from '../src/lib/fdc/nutrients.ts';
import {storedEstimateFood} from '../src/lib/fdc/approximation-metadata.ts';

// Freeze the real pre-rollout reader from the reviewed base, not a re-created
// approximation of it. Updating this SHA would weaken the compatibility proof.
const legacySource=execFileSync('git',['show','376e3306:src/lib/fdc/approximation-metadata.ts'],{encoding:'utf8'});
const legacy={};
vm.runInNewContext(ts.transpileModule(legacySource,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:legacy});
const food={fdcId:0,description:'Model estimate: fixture',dataType:'Estimate',approximation:{kind:'estimate',basis:'fixture'},foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:10}]};
const row=n=>({source_ref:n.sourceRef,micronutrients:n.micronutrients});
const values=reader=>reader?.foodNutrients.map(n=>n.value);

test('default-off writer stays readable by the actual old and dual readers during reader rollout',()=>{
 const previous=process.env.NUTRITION_COMPACT_WRITE;
 try{
  delete process.env.NUTRITION_COMPACT_WRITE;
  for(const grams of [null,0,50]){
   const n=scaleNutrition(food,grams);assert.equal(n.micronutrients.filter(e=>e.approximation).length,2);
   assert.deepEqual(Array.from(values(legacy.storedEstimateFood(row(n)))),[200,10]);
   assert.deepEqual(values(storedEstimateFood(row(n))),[200,10]);
  }
 }finally{if(previous===undefined)delete process.env.NUTRITION_COMPACT_WRITE;else process.env.NUTRITION_COMPACT_WRITE=previous;}
});

test('explicit compact writer stores one label and requires the reader-compatible rollback floor',()=>{
 const previous=process.env.NUTRITION_COMPACT_WRITE;
 try{
  process.env.NUTRITION_COMPACT_WRITE='1';
  const n=scaleNutrition(food,null);assert.equal(n.micronutrients.filter(e=>e.approximation).length,1);
  assert.deepEqual(values(storedEstimateFood(row(n))),[200,10]);
  assert.equal(legacy.storedEstimateFood(row(n)),null,'The pre-rollout reader really is incompatible; activation must fence it');
 }finally{if(previous===undefined)delete process.env.NUTRITION_COMPACT_WRITE;else process.env.NUTRITION_COMPACT_WRITE=previous;}
});


test('worker claims advertise the reader version without relying on a deployment URL',async()=>{
 const {claimJob}=await import('../src/lib/queue/claim.ts');
 const result=await claimJob({rpc:async(name,args)=>{assert.equal(name,'claim_owned_job');assert.deepEqual(args,{p_reader_format:2});return{data:null,error:null};}});
 assert.equal(result,null);
});
