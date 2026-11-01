// Paid final-head gate; --record-fixture preserves the real response, never inputs.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
if(!process.argv.includes('--real-meta'))throw Error('Opt in with --real-meta.');
if(!process.env.MODEL_API_KEY)throw Error('MODEL_API_KEY must be configured.');
const original=globalThis.fetch,origin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://smoke-trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
const calls=[];let recorded;
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://smoke-trace.invalid'&&url.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
 if(url.origin!==origin||url.pathname!=='/v1/responses'||calls.length>=8)throw Error('Unexpected remainder gate request.');
 const body=JSON.parse(init.body);if(body.model!=='muse-spark-1.3'||!['identify','remainder'].includes(body.text?.format?.name)||body.reasoning?.effort!=='low')throw Error('Unexpected remainder configuration.');
 const response=await original(input,{...init,signal:AbortSignal.timeout(90000)});calls.push({status:response.status});if(response.ok&&body.text?.format?.name==='remainder')recorded=await response.clone().json();return response;
};
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture:'scripts/fixtures/plate2.jpg',calls};
try{
 const {readRemainder}=await import('../src/lib/meta/remainder.ts');
 // The original plate1 fixture is the serving reference; plate2 is the comparison.
 const {identifyItems}=await import('../src/lib/meta/spark.ts');
 const originalMeal=await identifyItems(await readFile(new URL('./fixtures/plate1.jpg',import.meta.url)),'image/jpeg',null,[]);
 const reference=originalMeal.items.map((item,index)=>({index,name:item.name,grams:item.portionGrams??0}));
 if(!reference.length)throw Error('No original fixture items.');
 const output=await readRemainder(await readFile(new URL('./fixtures/plate2.jpg',import.meta.url)),reference);
 if(output.length!==reference.length||output.some(item=>item.remaining_grams<0||item.remaining_grams>reference[item.index].grams))throw Error('Remainder outside given portions.');
 receipt.reference=reference;receipt.output=output;receipt.pass=true;
 if(process.argv.includes('--record-fixture')){await writeFile(new URL('../tests/fake-meta/fixtures/spark-remainder.json',import.meta.url),JSON.stringify(recorded,null,2)+'\n');receipt.recorded=true;}
}catch(error){receipt.pass=false;receipt.error=error.message.replace(/https?:\/\/\S+/g,'[URL omitted]');process.exitCode=1;}finally{globalThis.fetch=original;console.log(JSON.stringify(receipt,null,2));}
