// node --import tsx --test tests/closest-food-bare-name.test.mjs
// #572: when the first decision names no base food, the closest step searches the item's own bare name.
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {resolveFoodMatchDetailed,foodSearchQuery}=await import('../src/lib/fdc/match.ts');
const {FDC_SEARCH_CACHE_KIND}=await import('../src/lib/fdc/client.ts');

const kcal=value=>[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value}];
const branded={fdcId:11,description:'Snack chips, pasta flavour',dataType:'Branded',foodNutrients:kcal(500)};
const generic={fdcId:22,description:'Pasta, cooked, enriched',dataType:'SR Legacy',foodNutrients:kcal(158)};

test('a first decision with no base food sends the bare item name to the closest-record search',async()=>{
 const name='Fried pasta-snack!',bare=foodSearchQuery(name);
 assert.equal(bare,'Fried pasta snack');
 const original=globalThis.fetch,cacheKeys=[],records=[],schemas=[];
 // Cached search fixture answers any query; every looked-up key is recorded. A cache miss would hit USDA and fail.
 const db={from(table){assert.equal(table,'fdc_cache');let key;return{select(){return this},eq(_c,value){key=value;cacheKeys.push(value);return this},abortSignal(){return this},
  async maybeSingle(){return{data:{response:{kind:FDC_SEARCH_CACHE_KIND,query:key.slice(FDC_SEARCH_CACHE_KIND.length+1),payload:{foods:[branded,generic]}}},error:null}}}}};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(input),body=JSON.parse(init?.body||'{}');
  if(url.origin==='https://trace.invalid'){records.push(body);return new Response(null,{status:201});}
  assert.equal(url.port,'1','no USDA or live model calls');
  const schema=body.text.format.name;schemas.push(schema);
  const value=schema==='search_query'?{id:null,query:null,query_food:null,reason:'No compatible record; no base food named'}
   :schema==='closest_food'?{id:22,reason:'Boiled rather than fried'}:null;
  assert.ok(value,`unexpected ${schema} call: the closest step did not supply a record`);
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
 };
 let result;
 try{result=await resolveFoodMatchDetailed(db,name,'',undefined,{approximate:true});}
 finally{globalThis.fetch=original;}
 assert.deepEqual(schemas,['search_query','closest_food']);
 const approx=records.map(r=>JSON.parse(r.request_text)).find(r=>r.event==='food_approximation');
 assert.ok(approx,'closest-record step ran');
 assert.equal(approx.query,bare,'closest step searched the item\'s own bare name');
 const key=`${FDC_SEARCH_CACHE_KIND}:${bare.toLowerCase()}`;
 assert.deepEqual(cacheKeys,[key,key],'first search and closest search both use the bare name');
 assert.equal(result.unavailable,null);
 assert.equal(result.food.fdcId,22);
 assert.deepEqual(result.food.approximation,{kind:'closest',basis:'Pasta, cooked, enriched'});
});
