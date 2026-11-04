import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {resolveFoodMatchDetailed}=await import('../src/lib/fdc/match.ts');
const {FDC_SEARCH_CACHE_KIND}=await import('../src/lib/fdc/client.ts');

// Use a real cached search response and real model-response parsers, with no network providers.
async function resolveFixture({foods=[],closest=null,estimate=null,approximate=true}){
 const original=globalThis.fetch,records=[],schemas=[];
 const name='ceramic plate';
 const db={from(table){assert.equal(table,'fdc_cache');return{select(){return this},eq(){return this},abortSignal(){return this},async maybeSingle(){return{data:{response:{kind:FDC_SEARCH_CACHE_KIND,query:name,payload:{foods}}},error:null}}}}};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(input),body=JSON.parse(init?.body||'{}');
  if(url.origin==='https://trace.invalid'){records.push(body);return new Response(null,{status:201});}
  assert.equal(url.port,'1','no USDA or live model calls');
  const schema=body.text.format.name;schemas.push(schema);
  const value=schema==='search_query'?{id:null,query:null,query_food:null,reason:'No exact match'}:schema==='closest_food'?{id:closest,reason:'Different kind of food'}:estimate;
  assert.ok(value,'unexpected estimation call');
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
 };
 try{return{result:await resolveFoodMatchDetailed(db,name,'',undefined,{approximate}),records,schemas};}
 finally{globalThis.fetch=original;}
}

test('one-search rejection enters closest matching and retains the selected generic food',async()=>{
 const food={fdcId:7,description:'Plain food',dataType:'Foundation',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:100}]};
 const {result,records,schemas}=await resolveFixture({foods:[food],closest:7});
 assert.equal(result.food.fdcId,7);assert.equal(result.food.approximation.kind,'closest');assert.equal(result.unavailable,null);
 assert.deepEqual(schemas,['search_query','closest_food']);
 const resolution=records.find(r=>JSON.parse(r.request_text).event==='food_resolution');
 assert.equal(JSON.parse(resolution.response_text).searches,1);
 assert.ok(records.some(r=>JSON.parse(r.request_text).event==='food_approximation'));
});

test('non-food and unusable estimate outcomes have distinct durable reasons',async()=>{
 const base={food:false,basis:'not food',calories:null,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null};
 for(const [estimate,code] of [[base,'not_food'],[{...base,food:true},'no_estimate']]){
  const {result}=await resolveFixture({estimate});
  assert.equal(result.food,null);assert.equal(result.unavailable.code,code);assert.ok(result.unavailable.detail);
 }
 const {result,schemas}=await resolveFixture({approximate:false});
 assert.deepEqual(result,{food:null,unavailable:{code:'no_match',detail:'No exact match'}});
 assert.deepEqual(schemas,['search_query']);
});
