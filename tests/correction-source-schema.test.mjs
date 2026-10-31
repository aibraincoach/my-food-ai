import test from 'node:test';
import assert from 'node:assert/strict';
import {correctionSchema} from '../src/lib/prompts/spark/correct-schema.ts';
const indices=count=>correctionSchema(count).properties.items.items.properties.region_index.enum;
test('a first clarification with no existing items cannot refer to a photo region as an item',()=>{
 const allowed=indices(0);
 assert.ok(allowed.includes(null));
 assert.ok(!allowed.includes(0));
});
test('correction source indices refer only to the current item snapshot',()=>{
 const allowed=indices(2);
 assert.ok(allowed.includes(0));assert.ok(allowed.includes(1));assert.ok(allowed.includes(null));
 for(const invalid of [-1,2,100,'0'])assert.ok(!allowed.includes(invalid));
 assert.ok(!indices(0).includes(0),'schema construction cannot mutate another snapshot');
});
test('invalid or oversized correction snapshots fail before requesting a model',()=>{
 for(const invalid of [-1,1.5,101,NaN,Infinity])assert.throws(()=>correctionSchema(invalid));
 assert.equal(indices(100).length,101);
});
