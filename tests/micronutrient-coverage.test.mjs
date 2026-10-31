import assert from 'node:assert/strict';
import test from 'node:test';
import {sumMicronutrients} from '../src/lib/nutrition/totals.ts';
test('micronutrient totals preserve order/units and label partial totals',()=>{
 const iron=value=>({nutrientId:1089,nutrientName:'Iron',unitName:'MG',value});
 const vitamin=value=>({nutrientId:1106,nutrientName:'Vitamin A',unitName:'UG',value});
 assert.deepEqual(sumMicronutrients([{micronutrients:[iron(1),vitamin(20)]},{micronutrients:[iron(2)]}]),[
  {name:'Iron',unit:'MG',value:3},{name:'Vitamin A',unit:'UG',value:20,unavailable:['an item']},
 ]);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1)]},{micronutrients:[]}])[0].value,1);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1)]},{micronutrients:[iron(null)]}])[0].value,1);
 assert.equal(sumMicronutrients([{micronutrients:[iron(0)]},{micronutrients:[iron(0)]}])[0].value,0);
 assert.deepEqual(sumMicronutrients([]),[]);
});

test('duplicate micronutrients count once and conflicting measurements stay unknown',()=>{
 const iron=value=>({nutrientId:1089,nutrientName:'Iron',unitName:'MG',value});
 assert.equal(sumMicronutrients([{micronutrients:[iron(1),iron(1)]},{micronutrients:[iron(2)]}])[0].value,3);
 assert.equal(sumMicronutrients([{micronutrients:[iron(1),iron(2)]},{micronutrients:[iron(2)]}])[0].value,2);
 assert.equal(sumMicronutrients([{micronutrients:[iron(null),iron(1)]}])[0].value,null);
});
