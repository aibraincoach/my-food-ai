import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importRows} from '../scripts/lib/mext-import.mjs';
import {parseMextRecord} from '../src/lib/mext/record.ts';
import {matchMext} from '../src/lib/mext/match.ts';
import {scaleMextNutrition} from '../src/lib/mext/nutrients.ts';
const rows=importRows(JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8')),{}).map(parseMextRecord);
const ja={kind:'localized',locale:'ja',displayName:'精白米'};
const rice=rows.find(row=>row.foodNumber==='01088'),pork=rows.find(row=>row.foodNumber==='11129');
const choose=async(_name,_caption,foods)=>({foodNumber:foods[0].foodNumber,closest:false,reason:'scripted exact food'});
test('scripted Japanese lookup returns a gated opaque identity and scales edible grams only',async()=>{
  const result=await matchMext('cooked rice','',ja,{search:async(j,e)=>{assert.equal(j,'精白米');assert.equal(e,'cooked rice');return [rice];},choose});
  const n=scaleMextNutrition(result.food,150);
  assert.equal(n.sourceRef,'mext:01088');assert.equal(n.calories,234);assert.equal(n.proteinG,3.75);
  assert.equal(n.sugarG,null);assert.equal(n.micronutrients.find(n=>n.nutrientId===2000).marker,'not_measured');
  const trace=n.micronutrients.find(n=>n.nutrientId===1109);assert.equal(trace.value,null);assert.equal(trace.marker,'trace');
  assert.ok(n.micronutrients.every(n=>n.basis==='portion'));assert.equal('fdcId' in result.food,false);
  assert.equal(scaleMextNutrition(result.food,null).calories,null);
});
test('closest basis is the official English name rather than a fabricated identity',async()=>{
  const result=await matchMext('cooked rice','',ja,{search:async()=>[rice],choose:async()=>({foodNumber:'01088',closest:true,reason:'scripted closest'})});
  const n=scaleMextNutrition(result.food,100);
  assert.deepEqual(n.micronutrients[0].approximation,{kind:'closest',basis:rice.nameEn,sourceRef:'mext:01088'});
});
test('no-selection outcomes are fixed-key typed metadata, not fake reference IDs',async()=>{
  const fail=()=>{throw Error('must not run');};
  assert.deepEqual(await matchMext('rice','',{kind:'usda-only'},{search:fail,choose:fail}),{food:null,step:null});
  assert.deepEqual((await matchMext('白飯','',ja,{search:fail,choose:fail})).step,{code:'mext_unclassified',candidateNumbers:[]});
  assert.deepEqual((await matchMext('miso soup','',ja,{search:async()=>[],choose:fail})).step,{code:'mext_none',candidateNumbers:[]});
  assert.deepEqual((await matchMext('pork belly and rice','',ja,{search:async()=>[pork],choose:fail})).step,{code:'mext_incompatible',candidateNumbers:['11129']});
});
test('a read failure propagates; a choice cannot bypass the compatibility gate',async()=>{
  const error=Error('local read failed');
  await assert.rejects(matchMext('rice','',ja,{search:async()=>{throw error;},choose}),value=>value===error);
  await assert.rejects(matchMext('cooked rice','',ja,{search:async()=>[rice],choose:async()=>({foodNumber:'10346',closest:false,reason:'injected'})}),/ineligible/);
});
