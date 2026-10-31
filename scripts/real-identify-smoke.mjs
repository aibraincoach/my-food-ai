// Explicit paid release gate, excluded from the offline node:test suite.
// Uses a licensed fixture, real SAM regions and the actual identify and food-match services. No database writes.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';

const args=process.argv.slice(2);
const fullMeal=args.includes('--full-meal');
if(!args.includes('--real-meta')||args.some(arg=>!['--real-meta','--full-meal'].includes(arg)))throw Error('Opt in with --real-meta and optionally --full-meal; this gate calls paid Meta APIs.');
if(!process.env.MODEL_API_KEY)throw Error('MODEL_API_KEY must be configured.');
const require=createRequire(import.meta.url);
const sharp=createRequire(require.resolve('next/package.json'))('sharp');
const originalFetch=globalThis.fetch;
const metaOrigin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin;
const deadline=AbortSignal.timeout(fullMeal?270_000:240_000);
const calls=[];let usdaRequests=0,reservedOutputTokens=0;
// Trace persistence is replaced only inside this standalone process. Credentials are fixtures.
process.env.NEXT_PUBLIC_SUPABASE_URL='https://smoke-trace.invalid';
process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://smoke-trace.invalid'&&url.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
 if(fullMeal&&url.origin==='https://api.nal.usda.gov'&&url.pathname==='/fdc/v1/foods/search'&&(!init?.method||init.method==='GET')){
  if(++usdaRequests>40)throw Error('Full-meal USDA request quota reached.');
  return originalFetch(input,{...init,signal:init?.signal?AbortSignal.any([init.signal,deadline]):deadline});
 }
 if(url.origin!==metaOrigin||url.pathname!=='/v1/responses')throw Error('Real smoke blocked an unexpected network destination.');
 const body=JSON.parse(init?.body??'{}');
 if(!['sam-3.1','muse-spark-1.3'].includes(body.model))throw Error('Real smoke blocked an unexpected model.');
 if(calls.length>=(fullMeal?80:8))throw Error('Real smoke model-request limit reached.');
 reservedOutputTokens+=body.max_output_tokens??0;
 if(reservedOutputTokens>262144)throw Error('Real smoke maximum output-token reservation reached.');
 const entry={model:body.model,format:body.text?.format?.name??null,cap:body.max_output_tokens??null};calls.push(entry);
 const started=performance.now();
 const signal=init?.signal?AbortSignal.any([init.signal,deadline]):deadline;
 const response=await originalFetch(input,{...init,signal});entry.http=response.status;
 if(!body.stream&&response.headers.get('content-type')?.includes('application/json')){
  const payload=await response.clone().json();
  entry.status=payload.status??null;entry.incomplete_reason=payload.incomplete_details?.reason??null;
  entry.input_tokens=payload.usage?.input_tokens??null;entry.output_tokens=payload.usage?.output_tokens??null;
  entry.reasoning_tokens=payload.usage?.output_tokens_details?.reasoning_tokens??null;
  entry.output_chars=(payload.output??[]).flatMap(item=>item.content??[]).filter(block=>block.type==='output_text').reduce((n,block)=>n+block.text.length,0);
 }
 entry.ms=Math.round(performance.now()-started);return response;
};
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture:'eval/photos/03.jpg',fullMeal,calls};
const started=performance.now();
try{
 const {traceContext}=await import('../src/lib/trace/context.ts');
 await traceContext.run({postId:null,deadlineAt:Date.now()+270_000},async()=>{
 const {segmentFoodRegions}=await import('../src/lib/meta/sam.ts');
 const {identifyItems}=await import('../src/lib/meta/spark.ts');
 const {resolveFoodMatch}=await import('../src/lib/fdc/match.ts');
 const {data,info}=await sharp(await readFile(new URL('../eval/photos/03.jpg',import.meta.url))).rotate().resize(4096,4096,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer({resolveWithObject:true});
 const regions=await segmentFoodRegions(data,'image/jpeg',info.width,info.height);
 if(!regions.length)throw Error('Busy fixture returned no SAM regions.');
 receipt.regions=regions.length;
 const meal=await identifyItems(data,'image/jpeg','Load test busy meal',regions);
 if(!meal.items.length)throw Error('Busy fixture returned no identified foods.');
 receipt.items=meal.items.map(item=>({name:item.name,portion_estimate_g:item.portionGrams}));
 if(fullMeal){
  if(meal.items.length<16)throw Error('Busy fixture must exercise at least sixteen identified foods.');
  if(!process.env.FDC_API_KEY)throw Error('FDC_API_KEY must be configured for --full-meal.');
  const {resolveNutritionItems}=await import('../src/lib/fdc/resolve-items.ts');
  const {nutritionResolutionBudget}=await import('../src/lib/fdc/match.ts');
  const stored=new Map();
  const cache={from(table){if(table!=='fdc_cache')throw Error('Unexpected full-meal database table.');return{
   select(){return{eq(_column,key){const query={abortSignal(){return query;},async maybeSingle(){return{data:stored.has(key)?{response:stored.get(key)}:null,error:null};}};return query;}};},
   upsert(row){const query={abortSignal(){return query;},then(resolve){stored.set(row.query,row.response);return Promise.resolve({error:null}).then(resolve);}};return query;}
  };}};
  const resolutionStarted=performance.now();
  receipt.resolutions=await resolveNutritionItems(meal.items,nutritionResolutionBudget(),async(item,_index,signal)=>{
   const itemStarted=performance.now();const food=await resolveFoodMatch(cache,item.name,'Load test busy meal',signal);
   return{name:item.name,selected:food?{id:food.fdcId,description:food.description}:null,ms:Math.round(performance.now()-itemStarted)};
  });
  receipt.resolution_ms=Math.round(performance.now()-resolutionStarted);
 }else{
 // Frozen public USDA candidates reproduce the failed refined ham decision; no USDA or database calls.
 const fixture=JSON.parse(await readFile(new URL('./fixtures/ham-resolution.json',import.meta.url),'utf8'));
 const searches=[];
 const cache={from(table){if(table!=='fdc_cache')throw Error('Unexpected smoke database table.');return{select(){return{eq(_column,key){const request={abortSignal(){return request;},async maybeSingle(){
  const query=String(key).replace(/^fdc-search:/,'');searches.push(query);
  const foods=query===fixture.name?fixture.initialFoods:fixture.refinedFoods;
  return{data:{response:{kind:'fdc-search-v1',query,payload:{foods}}},error:null};
 }};return request;}};}};}};
 const matched=await resolveFoodMatch(cache,fixture.name,fixture.caption);
 const validIds=new Set([...fixture.initialFoods,...fixture.refinedFoods].map(food=>food.fdcId));
 if(matched&&!validIds.has(matched.fdcId))throw Error('Matcher selected an unknown candidate.');
 receipt.match={name:fixture.name,searches,selected:matched?{id:matched.fdcId,description:matched.description}:null};
 }
 receipt.pass=true;
 });
}catch(error){receipt.pass=false;receipt.failure=error instanceof Error?error.name:'SmokeFailure';receipt.failure_message=error instanceof Error?error.message.replace(/https?:\/\/[^\s]+/g,'[URL omitted]'):'unknown';process.exitCode=1;
}finally{receipt.elapsed_ms=Math.round(performance.now()-started);receipt.usda_requests=usdaRequests;receipt.reserved_output_tokens=reservedOutputTokens;globalThis.fetch=originalFetch;console.log(JSON.stringify(receipt,null,2));}
