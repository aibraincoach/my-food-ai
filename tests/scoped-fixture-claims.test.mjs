import test from 'node:test';
import assert from 'node:assert/strict';
import {scopedFixtureClaims} from './fake-meta/scoped-claims.mjs';
test('both legacy and owned claim names stay fixture-scoped and assign execution ownership',async()=>{
 let forwarded=0;const updates=[];const row={id:'fixture-job',post_id:'fixture-post',kind:'analyze',attempts:0,payload:{}};
 const admin={rpc(){forwarded++;return {data:false,error:null};},from(table){let write;
  const q={select(){return q;},in(key,ids){assert.equal(table,'jobs');assert.deepEqual(ids,['fixture-job']);return q;},eq(){return q;},order(){return q;},limit(){return Promise.resolve({data:[row],error:null});},update(value){write=value;updates.push({table,value});return q;},maybeSingle(){return Promise.resolve({data:{...row,...write},error:null});},then(resolve){return Promise.resolve({error:null}).then(resolve);}};return q;
 }};
 const jobs=new Set();const scoped=scopedFixtureClaims(admin,jobs,['fixture-post']);
 for(const name of ['claim_job','claim_owned_job'])assert.equal((await scoped.rpc(name)).data,null);
 await assert.rejects(scoped.rpc('claim_unscoped_job'),/Unrecognized/);
 assert.equal(forwarded,0);jobs.add('fixture-job');
 for(const name of ['claim_job','claim_owned_job'])assert.equal((await scoped.rpc(name)).data.payload.post_ownership,true);
 assert.equal(forwarded,0);assert.equal(updates.filter(u=>u.table==='posts'&&u.value.active_job_id==='fixture-job').length,2);
 await scoped.rpc('post_work_matches',{});assert.equal(forwarded,1);
 await assert.rejects(scopedFixtureClaims(admin,jobs,[]).rpc('claim_owned_job'),/escaped/);
});
