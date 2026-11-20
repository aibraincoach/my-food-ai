import test from 'node:test';
import assert from 'node:assert/strict';
import {searchFoods,FDC_SEARCH_CACHE_KIND} from '../src/lib/fdc/client.ts';
import {ApiError} from '../src/lib/worker/errors.ts';

const food={fdcId:77,description:'Rice, cooked',dataType:'Foundation',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:130}]};

function fixture(t,respond){
 const cache=new Map(),writes=[],requests=[];
 const admin={from(table){assert.equal(table,'fdc_cache');let key;return{
  select(){return this;},eq(_column,value){key=value;return this;},
  async maybeSingle(){return{data:cache.has(key)?{response:cache.get(key)}:null,error:null};},
  async upsert(row){writes.push(row);cache.set(row.query,row.response);return{error:null};},
 };}};
 const originalFetch=globalThis.fetch;
 const names=['FDC_API_KEY','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY'];
 const originalEnv=names.map(name=>process.env[name]);
 process.env.FDC_API_KEY='fixture';
 process.env.NEXT_PUBLIC_SUPABASE_URL='http://127.0.0.1:9';
 process.env.SUPABASE_SECRET_KEY='fixture';
 globalThis.fetch=async(url,init)=>{
  const parsed=new URL(url);
  if(parsed.origin==='http://127.0.0.1:9'&&parsed.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
  assert.equal(parsed.origin,'https://api.nal.usda.gov');
  assert.equal(parsed.pathname,'/fdc/v1/foods/search');
  requests.push(JSON.parse(init.body));
  return respond(requests.length);
 };
 t.after(()=>{globalThis.fetch=originalFetch;names.forEach((name,index)=>{if(originalEnv[index]===undefined)delete process.env[name];else process.env[name]=originalEnv[index];});});
 return{admin,cache,writes,requests};
}

const malformed=[
 ['error envelope',()=>Response.json({error:'upstream unavailable'})],
 ['empty object',()=>Response.json({})],
 ['non-array foods',()=>Response.json({foods:'x'})],
 ['non-JSON body',()=>new Response('upstream unavailable',{status:200})],
];
for(const [name,response] of malformed)for(const badWindow of [1,2]){
 test(`${name} in search window ${badWindow} fails without caching; a later valid search succeeds`,async t=>{
  let malformedPending=true;
  const {admin,cache,writes,requests}=fixture(t,count=>malformedPending&&count===badWindow?response():Response.json({foods:[food]}));
  await assert.rejects(searchFoods(admin,'rice'),error=>error instanceof ApiError&&error.status===502&&error.message.startsWith('fdc:'));
  assert.equal(requests.length,badWindow,'malformed data must not start another search window');
  assert.equal(writes.length,0);
  assert.equal(cache.size,0);
  malformedPending=false;
  const result=await searchFoods(admin,'rice');
  assert.equal(result.length,1);
  assert.equal(result[0].fdcId,food.fdcId);
  assert.equal(writes.length,1);
  const before=requests.length;
  assert.deepEqual(await searchFoods(admin,'rice'),result);
  assert.equal(requests.length,before,'the later valid result is cached');
 });
}

test('valid empty foods remain a cached no-match',async t=>{
 const {admin,cache,writes,requests}=fixture(t,()=>Response.json({foods:[]}));
 assert.deepEqual(await searchFoods(admin,'rice'),[]);
 assert.equal(requests.length,2);
 assert.equal(writes.length,1);
 assert.deepEqual(cache.get(`${FDC_SEARCH_CACHE_KIND}:rice`).payload,{foods:[]});
 assert.deepEqual(await searchFoods(admin,'rice'),[]);
 assert.equal(requests.length,2);
});
