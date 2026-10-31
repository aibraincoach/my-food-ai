// Explicit paid gate for the reuse decision; no database, storage or account access.
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
if(process.argv.slice(2).join(' ')!=='--real-meta')throw Error('Opt in with --real-meta; this gate calls the paid Meta API.');
if(!process.env.MODEL_API_KEY)throw Error('MODEL_API_KEY must be configured.');
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('next/package.json'))('sharp');
const origin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin;
const originalFetch=globalThis.fetch,deadline=AbortSignal.timeout(120000),calls=[];
process.env.NEXT_PUBLIC_SUPABASE_URL='https://same-meal-trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://same-meal-trace.invalid'&&url.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
 if(url.origin!==origin||url.pathname!=='/v1/responses')throw Error('Same-meal gate blocked an unexpected destination.');
 const body=JSON.parse(init?.body??'{}');
 if(body.model!=='muse-spark-1.3'||body.text?.format?.name!=='same_meal'||calls.length>=6)throw Error('Same-meal gate request quota or model restriction reached.');
 const started=performance.now(),entry={cap:body.max_output_tokens};calls.push(entry);
 const response=await originalFetch(input,{...init,signal:init?.signal?AbortSignal.any([deadline,init.signal]):deadline});
 const value=await response.clone().json();Object.assign(entry,{http:response.status,status:value.status??null,incomplete_reason:value.incomplete_details?.reason??null,output_tokens:value.usage?.output_tokens??null,reasoning_tokens:value.usage?.output_tokens_details?.reasoning_tokens??null,ms:Math.round(performance.now()-started)});
 return response;
};
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),calls,cases:[]},started=performance.now();
try{
 const {confirmSameMeal}=await import('../src/lib/meta/same-meal.ts');
 const photo=async number=>sharp(await readFile(new URL(`../eval/photos/${number}.jpg`,import.meta.url))).rotate().resize(4096,4096,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer();
 const [breakfast,sushi]=await Promise.all([photo('01'),photo('03')]);
 const comparisons=[
  {name:'identical photo and caption',photos:[breakfast,breakfast],currentCaption:'Toast with scrambled eggs.',pastCaption:'Toast with scrambled eggs.',expected:true},
  {name:'different food photograph',photos:[sushi,breakfast],currentCaption:'Sushi platter.',pastCaption:'Toast with scrambled eggs.',expected:false},
  {name:'changed caption amount',photos:[breakfast,breakfast],currentCaption:'Two plates of toast with scrambled eggs.',pastCaption:'One plate of toast with scrambled eggs.',expected:false},
 ];
 for(const comparison of comparisons){
  const actual=await confirmSameMeal(comparison.photos,{prior:'Historical reference only: toast and scrambled eggs, one plate.',currentCaption:comparison.currentCaption,pastCaption:comparison.pastCaption});
  receipt.cases.push({name:comparison.name,expected:comparison.expected,actual});
  if(actual!==comparison.expected)throw Error('Same-meal real decision disagreed with the fixture.');
 }
 receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=error instanceof Error?error.name:'GateFailure';process.exitCode=1;}
finally{globalThis.fetch=originalFetch;receipt.elapsed_ms=Math.round(performance.now()-started);console.log(JSON.stringify(receipt,null,2));}
