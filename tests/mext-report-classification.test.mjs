import test from 'node:test';import assert from 'node:assert/strict';import{rank}from'../scripts/numbers/mismatch.mjs';
test('the unchanged USDA detector excludes MEXT rows without changing any USDA result',()=>{
 const rows=[{how:'match',name:'Papaya',description:'Papayas, raw',category:'fruits and fruit juices',kcal_per_100g:43},{how:'match',name:'Lamb curry with rice',description:'Lamb, ground, raw',category:'lamb',kcal_per_100g:282}];
 const before=rank(rows),mixed=rank([...rows,{how:'mext',name:'Pork belly',description:'Pork, belly, raw',mext_group:'11'}]);
 assert.deepEqual(mixed.checked,before.checked);assert.deepEqual(mixed.flagged,before.flagged);assert.deepEqual(mixed.skipped,{...before.skipped,mext:1});
});
