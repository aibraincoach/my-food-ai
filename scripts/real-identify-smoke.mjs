// Explicit paid release gate, excluded from the offline node:test suite.
// Uses a licensed fixture, real SAM regions and the actual identify service. No database writes.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';

if(process.argv.slice(2).join(' ')!=='--real-meta')throw Error('Opt in with --real-meta; this gate calls the paid Meta API.');
if(!process.env.MODEL_API_KEY)throw Error('MODEL_API_KEY must be configured.');
const require=createRequire(import.meta.url);
const sharp=createRequire(require.resolve('next/package.json'))('sharp');
const originalFetch=globalThis.fetch;
const metaOrigin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin;
const deadline=AbortSignal.timeout(240_000);
const calls=[];
// Trace persistence is replaced only inside this standalone process. Credentials are fixtures.
process.env.NEXT_PUBLIC_SUPABASE_URL='https://smoke-trace.invalid';
process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://smoke-trace.invalid'&&url.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
 if(url.origin!==metaOrigin||url.pathname!=='/v1/responses')throw Error('Real smoke blocked an unexpected network destination.');
 const body=JSON.parse(init?.body??'{}');
 if(!['sam-3.1','muse-spark-1.3'].includes(body.model))throw Error('Real smoke blocked an unexpected model.');
 if(calls.length>=6)throw Error('Real smoke model-request limit reached.');
 const entry={model:body.model,cap:body.max_output_tokens??null};calls.push(entry);
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
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture:'eval/photos/03.jpg',calls};
const started=performance.now();
try{
 const {segmentFoodRegions}=await import('../src/lib/meta/sam.ts');
 const {identifyItems}=await import('../src/lib/meta/spark.ts');
 const {data,info}=await sharp(await readFile(new URL('../eval/photos/03.jpg',import.meta.url))).rotate().resize(4096,4096,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer({resolveWithObject:true});
 const regions=await segmentFoodRegions(data,'image/jpeg',info.width,info.height);
 if(!regions.length)throw Error('Busy fixture returned no SAM regions.');
 receipt.regions=regions.length;
 const meal=await identifyItems(data,'image/jpeg','Load test busy meal',regions);
 if(!meal.items.length)throw Error('Busy fixture returned no identified foods.');
 receipt.items=meal.items.map(item=>({name:item.name,portion_estimate_g:item.portionGrams}));
 receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=error instanceof Error?error.name:'SmokeFailure';process.exitCode=1;
}finally{receipt.elapsed_ms=Math.round(performance.now()-started);globalThis.fetch=originalFetch;console.log(JSON.stringify(receipt,null,2));}
