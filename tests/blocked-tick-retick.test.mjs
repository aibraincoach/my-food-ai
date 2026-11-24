import {machineMessage} from '../src/i18n/machine-messages.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as tick from '../src/lib/queue/tick.ts';

test('a tick blocked behind a lease schedules no further tick in ten simulated minutes',async()=>{
 const afters=[],timers=[];let now=1000,requests=0,reads=0;
 const admin={from(table){reads++;if(table==='worker_lease')return{select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{expires_at:new Date(41000).toISOString()},error:null})};assert.equal(table,'jobs');return{select(){return this;},lte(){return this;},eq(_column,value){return Promise.resolve({count:value==='queued'?1:0,error:null});}};},rpc:async name=>{assert.equal(name,'try_acquire_worker_lease');return{data:false,error:null};}};
 const exports={};const code=ts.transpileModule(readFileSync(new URL('../src/app/api/jobs/tick/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const original=globalThis.setTimeout;globalThis.setTimeout=(fn,delay)=>{timers.push({fn,at:now+delay});return 0;};
 try{
 vm.runInNewContext(code,{exports,URL,AbortSignal,console:{info(){}},Date:class extends Date{static now(){return now;}},fetch:async()=>{requests++;return Response.json({});},require(name){if(name==='@/i18n/machine-messages')return{machineMessage};if(name==='node:crypto')return{randomUUID:()=> 'holder'};if(name==='next/server')return{NextResponse:{json:Response.json},after:fn=>afters.push(fn)};if(name==='@/lib/supabase/admin')return{createAdminClient:()=>admin};if(name==='@/lib/queue/tick')return tick;if(name==='@/lib/queue/lease')return{LEASE_TTL_SECONDS:60};throw Error(name);}});
 const response=await exports.GET(new Request('http://127.0.0.1/api/jobs/tick'));assert.equal(response.status,200);assert.equal((await response.json()).queued,1);
 const before=reads,work=afters.map(fn=>fn());await new Promise(resolve=>setImmediate(resolve));now+=600000;for(const timer of timers)if(timer.at<=now)timer.fn();await Promise.all(work);
 assert.equal(requests,0,'blocked work waits for the minute wake, never a timer self-request');assert.equal(timers.length,0);assert.equal(reads,before,'no lease-expiry recovery read');
 }finally{globalThis.setTimeout=original;}
});
test('the removed blocked-tick path is absent from the function and route',()=>{
 assert.equal(tick.retickWhenBlocked,undefined);
 assert.doesNotMatch(readFileSync(new URL('../src/app/api/jobs/tick/route.ts',import.meta.url),'utf8'),/retickWhenBlocked/);
});
