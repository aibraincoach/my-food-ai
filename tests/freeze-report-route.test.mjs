import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import ts from 'typescript';
import {validReport} from '../src/lib/diagnostics/schema.ts';
function route({user={id:'owned'},error=null,throws=false}={}){
 const inserted=[];const client={auth:{getUser:async()=>({data:{user}})},from:name=>{assert.equal(name,'freeze_reports');return {insert:async value=>{inserted.push(value);if(throws)throw Error('Local transport failed');return {error};}}}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/app/api/freeze-report/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,Response,Uint8Array,TextDecoder,JSON,require:name=>name.endsWith('/server')?{createClient:async()=>client}:{validReport}});
 return {post:exports.POST,inserted};
}
const payload={events:[{t:100,name:'page-load'}],user_agent:'test',build:'test',camera_permission:'unknown'};
const request=value=>new Request('http://localhost/api/freeze-report',{method:'POST',body:JSON.stringify(value)});
test('explicit POST is authenticated and inserts once with verified owner only',async()=>{
 const r=route();assert.equal((await r.post(request(payload))).status,200);assert.equal(r.inserted.length,1);assert.deepEqual(JSON.parse(JSON.stringify(r.inserted[0])),{...payload,user_id:'owned'});
 const anon=route({user:null});assert.equal((await anon.post(request(payload))).status,401);assert.equal(anon.inserted.length,0);
});
test('invalid and oversized reports never reach storage',async()=>{
 for(const value of [{...payload,events:[{t:0,name:{toString:null,valueOf:null}}]},{...payload,extra:'no'},{...payload,events:[{t:0,name:'error',value:'private'}]},{...payload,user_agent:'x'.repeat(9000)}]){const r=route();assert.equal((await r.post(request(value))).status,400);assert.equal(r.inserted.length,0);}
});
test('rate and ordinary insert failures stay visible as distinct response statuses',async()=>{
 for(const [code,status] of [['P4290',429],['42501',500]]){const r=route({error:{code}});assert.equal((await r.post(request(payload))).status,status);assert.equal(r.inserted.length,1);}
});

test('unexpected storage failures report a server failure, not invalid person input',async()=>{const r=route({throws:true});assert.equal((await r.post(request(payload))).status,500);assert.equal(r.inserted.length,1);});
