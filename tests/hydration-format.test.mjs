import test from 'node:test';import assert from 'node:assert/strict';
import {getPostHydrationData} from '../src/lib/intake/hydration.ts';
const at='2026-11-25T12:00:00Z';
function db(row){return{from(table){let values=table==='intake_logs'?[{user_id:'owner',logged_at:at,label:'Fixture',post_item_id:null,...row}]:table==='posts'?[{id:'fixture',user_id:'owner',eaten_at:at,status:'ready',deleted_at:null}]:[];const q={select(){return q;},eq(k,v){values=values.filter(x=>x[k]===v);return q;},is(k,v){values=values.filter(x=>x[k]===v);return q;},in(k,v){values=values.filter(x=>v.includes(x[k]));return q;},or(){return q;},order(){return q;},range(){return q;},abortSignal(){return q;},then(resolve,reject){return Promise.resolve({data:values,error:null}).then(resolve,reject);}};return q;}};}
const read=row=>getPostHydrationData(db(row),'owner',[{id:'fixture',eaten_at:at,items:[]}],'UTC');
test('current unlinked sheet water retains its recorded amount without requiring ml',async()=>{
 const data=await read({kind:'water',source:'sheet',post_id:null,amount:250,ml:null});assert.equal(data.fixture.dayHydration.drinksMl,250);
});
test('caffeine without a recorded volume contributes caffeine, not invented water',async()=>{
 const data=await read({kind:'caffeine',source:'sheet',post_id:'fixture',amount:95,ml:null});assert.equal(data.fixture.dayHydration.drinksMl,0);assert.equal(data.fixture.dayHydration.caffeineMg,95);
});
test('linked water without ml fails instead of silently using amount',async()=>{
 await assert.rejects(read({kind:'water',source:'sheet',post_id:'fixture',amount:250,ml:null}),/Linked water volume/);
});

test('a missing intake source fails instead of being treated as sheet intake',async()=>{
 await assert.rejects(read({kind:'water',source:null,post_id:'fixture',amount:250,ml:250}),/Stored intake source/);
});
