// node --import tsx --test tests/health-probe.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {createHealthProbe} from '../src/lib/health/probe.ts';

test('concurrent health calls share probes and completed values expire in a minute',async()=>{
 let time=0,db=0,model=0,release;
 const gate=new Promise(resolve=>{release=resolve;});
 const probe=createHealthProbe(async()=>{db++;await gate;return true;},async()=>{model++;return true;},()=>time);
 const reads=Array.from({length:20},()=>probe());
 assert.equal(db,1);assert.equal(model,1);release();
 const results=await Promise.all(reads);
 assert.ok(results.every(result=>result.database.ok&&result.model.ok));
 time=59999;await probe();assert.equal(db,1);
 time=60000;await probe();assert.equal(db,2);assert.equal(model,2);
});

test('failed probes return only booleans and timings, without diagnostics',async()=>{
 const probe=createHealthProbe(async()=>{throw Error('private endpoint and key');},async()=>false);
 const result=await probe();
 assert.equal(result.database.ok,false);assert.equal(result.model.ok,false);
 assert.equal(typeof result.database.ms,'number');
 assert.doesNotMatch(JSON.stringify(result),/private|endpoint|key/);
});
