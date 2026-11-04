import test from 'node:test';
import assert from 'node:assert/strict';
import {scaleNutrition} from '../src/lib/fdc/nutrients.ts';
import {parseUnavailable,unavailableRef} from '../src/lib/fdc/unavailable.ts';
test('unavailable reasons survive nutrition storage and reject unrelated source identities',()=>{
 const reason={code:'not_food',detail:'A ceramic plate.'};
 const ref=scaleNutrition(null,50,reason).sourceRef;
 assert.equal(ref,'unavailable:not_food:A ceramic plate.');assert.deepEqual(parseUnavailable(ref),reason);
 for(const other of ['2708357','estimate:x','unavailable:bogus:x'])assert.equal(parseUnavailable(other),null);
 const compact=unavailableRef({code:'no_match',detail:'  a   b  '+'x'.repeat(300)});
 assert.equal(parseUnavailable(compact).detail,'a b '+'x'.repeat(196));
});
