import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
import * as dates from '../src/lib/search/dates.ts';
import * as operators from '../src/lib/search/operators.ts';
function load(file,modules){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>{assert.ok(name in modules,name);return modules[name];},Date,JSON,URL,Response});return exports;}
function harness(answer,rows=[]){let models=0,reads=0;const db={auth:{getUser:async()=>({data:{user:{id:'owner'}}})},rpc:async()=>{reads++;return{data:rows,error:null};}};
 const query=load('src/lib/search/query.ts',{'server-only':{},'./dates':dates,'./operators':operators,'@/lib/meta/client':{createResponse:async()=>{models++;return answer;}},'@/lib/prompts/spark/search-query':{searchQueryPrompt:'fixture',searchQuerySchema:{}},'@/lib/posts/feed':{getPostCards:async(_db,ids)=>ids.map(id=>({id}))}});
 const route=load('src/app/api/search/route.ts',{'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}},'@/lib/supabase/server':{createClient:async()=>db},'@/lib/search/query':query});
 return{query,route,db,counts:()=>({models,reads})};}
for(const [name,answer]of[['unfinished',{status:'incomplete',outputText:'{}'}],['empty',{status:'completed',outputText:''}]]){
 test(`${name} search interpretation returns a visible failure, never an empty success`,async()=>{
  const h=harness(answer);const response=await h.route.GET(new Request('http://local/api/search?q=my%20biggest%20dinner&tz=UTC'));
  assert.equal(response.status,503);assert.equal((await response.json()).error,'Search could not be completed.');assert.equal(h.counts().models,1);assert.equal(h.counts().reads,0);
 });
}
test('a completed interpretation with no matches remains a genuine empty success',async()=>{
 const outputText=JSON.stringify({terms:['rice'],date_from:null,date_to:null,meal:'dinner',big:true,rank:'largest',latest_only:false});const h=harness({status:'completed',outputText});const response=await h.route.GET(new Request('http://local/api/search?q=my%20biggest%20dinner&tz=UTC'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{posts:[],truncated:false});assert.deepEqual(h.counts(),{models:1,reads:1});
});
test('literal matching meals bypass interpretation',async()=>{const h=harness(null,[{id:'meal'}]);const result=await h.query.searchPosts(h.db,'rice','UTC');assert.equal(result.posts[0].id,'meal');assert.deepEqual(h.counts(),{models:0,reads:1});});
