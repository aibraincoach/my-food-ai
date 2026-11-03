// Explicit paid eleven-case comparison; model/USDA reads only, no live database/storage writes.
// node --import tsx --env-file=.env.local scripts/open-weights-trial.mjs
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url),sharp=createRequire(require.resolve('next/package.json'))('sharp');
for(const name of ['MODEL_API_KEY','IDENTIFY_OPEN_API_KEY','FDC_API_KEY'])if(!process.env[name])throw Error(`${name} is required.`);
const originalFetch=globalThis.fetch,metaOrigin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin,openOrigin=new URL(process.env.IDENTIFY_OPEN_BASE_URL||'https://inference.baseten.co/v1').origin;
let spent=0,reserved=0,usdaReads=0,currentCalls=[];const traces=[];
const probes=JSON.parse(await readFile('/tmp/run7-b-probes.json','utf8').catch(()=>'[]'));
// Probes are part of the same $5 cap. Full input pricing ignores cache discounts conservatively.
for(const p of probes)if(p.usage)spent+=((p.usage.prompt_tokens??p.usage.input_tokens??0)*1.25+(p.usage.completion_tokens??p.usage.output_tokens??0)*4.25)/1e6;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://open-trial-trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://open-trial-trace.invalid'&&url.pathname==='/rest/v1/model_calls'){traces.push(JSON.parse(init.body));return new Response(null,{status:201});}
 if(url.origin==='https://api.nal.usda.gov'&&url.pathname==='/fdc/v1/foods/search'){if(++usdaReads>500)throw Error('Trial USDA read bound reached.');return originalFetch(input,init);}
 if(![metaOrigin,openOrigin].includes(url.origin))throw Error('Trial blocked unexpected network destination.');
 const body=JSON.parse(init?.body??'{}'),isOpen=url.origin===openOrigin;
 if(!['sam-3.1','muse-spark-1.3',process.env.IDENTIFY_OPEN_MODEL||'meta-models/muse-spark-open-1026'].includes(body.model))throw Error('Trial blocked unexpected model.');
 // A byte per text token plus 20K/image is reserved conservatively. Data-URL
 // bytes are included too, so image payloads reserve much more than probe usage.
 const requestBytes=Buffer.byteLength(init?.body??'');
 const images=(JSON.stringify(body).match(/data:image\//g)??[]).length;
 const reservation=isOpen?((requestBytes+images*20000)*1.25+(body.max_tokens??body.max_output_tokens??16384)*4.25)/1e6:0;
 if(isOpen&&spent+reserved+reservation>5)throw Error('Open trial $5 reservation cap reached before request.');
 if(isOpen)reserved+=reservation;
 const call={model:body.model,host:isOpen?'baseten':'meta',input_tokens:null,output_tokens:null,ms:0};currentCalls.push(call);const start=performance.now();
 try{
  const response=await originalFetch(input,init);call.http=response.status;
  const data=await response.clone().json().catch(()=>null);const usage=data?.usage;
  call.input_tokens=usage?.prompt_tokens??usage?.input_tokens??null;call.output_tokens=usage?.completion_tokens??usage?.output_tokens??null;
  if(isOpen){const actual=usage?(call.input_tokens*1.25+call.output_tokens*4.25)/1e6:reservation;spent+=actual;call.cost_usd=actual;}
  return response;
 }catch(error){if(isOpen)spent+=reservation;throw error;}finally{if(isOpen)reserved-=reservation;call.ms=Math.round(performance.now()-start);}
};
const {traceContext}=await import('../src/lib/trace/context.ts');
const {segmentFoodRegions}=await import('../src/lib/meta/sam.ts');const {identifyItems}=await import('../src/lib/meta/spark.ts');
const {resolveFoodMatch,nutritionResolutionBudget}=await import('../src/lib/fdc/match.ts');const {resolveNutritionItems}=await import('../src/lib/fdc/resolve-items.ts');const {scaleNutrition}=await import('../src/lib/fdc/nutrients.ts');
const stored=new Map();const cache={from(table){if(table!=='fdc_cache')throw Error('Unexpected trial database table.');return{select(){return{eq(_column,key){const query={abortSignal(){return query;},async maybeSingle(){return{data:stored.has(key)?{response:stored.get(key)}:null,error:null};}};return query;}};},upsert(row){const query={abortSignal(){return query;},then(resolve){stored.set(row.query,row.response);return Promise.resolve({error:null}).then(resolve);}};return query;}};}};
function trigrams(text){const result=new Set();for(const word of String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)??[]){const padded=`  ${word} `;for(let i=0;i+3<=padded.length;i++)result.add(padded.slice(i,i+3));}return result;}
function score(expected,actual){const pairs=[];expected.forEach((e,i)=>actual.forEach((a,j)=>{const l=trigrams(e.name),r=trigrams(a.name),n=[...l].filter(v=>r.has(v)).length,s=n/(l.size+r.size-n);if(s>=.5)pairs.push({i,j,s});}));pairs.sort((a,b)=>b.s-a.s||a.i-b.i||a.j-b.j);const e=new Set(),a=new Set();for(const p of pairs)if(!e.has(p.i)&&!a.has(p.j)){e.add(p.i);a.add(p.j);}return{found:e.size,missed:expected.length-e.size,invented:actual.length-a.size};}
const {photos}=JSON.parse(await readFile(new URL('../eval/expected.json',import.meta.url),'utf8'));const cases=[...photos,{file:null,caption:'I ate half the rice',items:null}];
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),started_at:new Date().toISOString(),prices_usd_per_million:{input:1.25,output:4.25},cases:[],probes,usda_reads:0,open_cost_usd:spent};
async function save(){receipt.usda_reads=usdaReads;receipt.open_cost_usd=spent;await writeFile('/tmp/run7-open-weights-trial.json',JSON.stringify(receipt,null,2),{mode:0o600});}
try{
 for(const fixture of cases){
  const row={case:fixture.file??'half-rice-caption',caption:fixture.caption,regions:0,meta:null,open:null};receipt.cases.push(row);let bytes=null,regions=[];
  currentCalls=[];
  if(fixture.file){const image=await sharp(await readFile(new URL(`../eval/photos/${fixture.file}`,import.meta.url))).rotate().resize(1080,1080,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer({resolveWithObject:true});bytes=image.data;regions=await traceContext.run({postId:null,deadlineAt:Date.now()+270000},()=>segmentFoodRegions(bytes,'image/jpeg',image.info.width,image.info.height));row.regions=regions.length;row.sam_calls=currentCalls;}
  for(const provider of ['meta','open']){
   const start=performance.now();currentCalls=[];const traceStart=traces.length;
   try{
    const outcome=await traceContext.run({postId:null,deadlineAt:Date.now()+270000},async()=>{
     const meal=await identifyItems(bytes,'image/jpeg',fixture.caption,regions,'',[],'',provider);
     const identity=traces.slice(traceStart).filter(t=>t.kind==='spark_identify'&&!t.error).at(-1);
     const items=await resolveNutritionItems(meal.items,nutritionResolutionBudget(),async(item,_i,signal)=>{const food=await resolveFoodMatch(cache,item.name,fixture.caption,signal);const n=scaleNutrition(food,item.portionGrams);return{name:item.name,grams:item.portionGrams,kcal:n.calories,fdc_id:food?.fdcId??null};});
     return{items,model:identity?.model??null,host:identity?.host??null,unavailable:items.filter(i=>i.kcal===null).map(i=>i.name),kcal:items.length&&items.every(i=>i.kcal!==null)?items.reduce((n,i)=>n+i.kcal,0):null,score:fixture.items?score(fixture.items,items):null};
    });
    row[provider]={...outcome,ms:Math.round(performance.now()-start),tokens:currentCalls.reduce((a,c)=>({input:a.input+(c.input_tokens??0),output:a.output+(c.output_tokens??0)}),{input:0,output:0}),calls:currentCalls};
   }catch(error){row[provider]={error:error instanceof Error?error.message:'Trial failed',ms:Math.round(performance.now()-start),calls:currentCalls};}
   await save();console.log(JSON.stringify({case:row.case,provider,ms:row[provider].ms,model:row[provider].model??null,error:row[provider].error??null,open_cost_usd:spent}));
  }
 }
}finally{await save();globalThis.fetch=originalFetch;}
if(receipt.cases.length!==11||receipt.cases.some(r=>!r.meta||!r.open||r.meta.error||r.open.error||r.open.host!=='baseten'))process.exitCode=1;
