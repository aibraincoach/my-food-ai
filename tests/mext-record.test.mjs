import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {importRows} from '../scripts/lib/mext-import.mjs';
import {parseMextRecord,mextFoodNumber,mextSourceRef} from '../src/lib/mext/record.ts';

const fixture=JSON.parse(readFileSync(new URL('./fixtures/mext-source-sample.json',import.meta.url),'utf8'));
const source=importRows(fixture,{});

test('MEXT food numbers retain leading zeroes and never accept another source',()=>{
  assert.equal(mextFoodNumber('mext:01088'),'01088');
  assert.equal(mextSourceRef('01088'),'mext:01088');
  for(const ref of ['01088',1088,'mext:1088','mext:01088junk','fdc:01088','off:01088',null])assert.equal(mextFoodNumber(ref),null);
  for(const id of ['1088','01088junk','-1088',''])assert.throws(()=>mextSourceRef(id));
});

test('reference boundary reads every real fixture including excluded identities',()=>{
  assert.equal(source.length,22);
  for(const row of source)assert.equal(parseMextRecord(row).foodNumber,row.food_number);
  assert.equal(parseMextRecord(source.find(row=>row.food_number==='10346')).identityStatus,'english_name_ambiguous');
});

test('trace and unavailable markers stay null and distinct from numeric zero',()=>{
  const food=parseMextRecord(source.find(row=>row.food_number==='01001'));
  assert.equal(food.nutrients['1106'].marker,'Tr');
  assert.equal(food.nutrients['1106'].value,null);
  assert.equal(food.nutrients['2000'].marker,'-');
  assert.equal(food.nutrients['2000'].reason,'no_equivalent');
  assert.equal(food.nutrients['2000'].value,null);
  assert.equal(food.nutrients['1008'].value,343);
});

test('malformed cached reference values fail visibly rather than becoming unknown or zero',()=>{
  const row=source.find(row=>row.food_number==='01001');
  for(const mutation of [x=>x.food_number=1088,x=>x.identity_status='other',x=>x.nutrients['1106'].value=0,
    x=>x.nutrients['1008'].value='343',x=>x.nutrients['1008'].value=Infinity,x=>x.nutrients['1008'].marker='unknown',
    x=>x.nutrients['1008'].source_tag=null,x=>x.nutrients={}]) {
    const changed=structuredClone(row);mutation(changed);assert.throws(()=>parseMextRecord(changed),/MEXT reference record is invalid/);
  }
});
