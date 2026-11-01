// Paid release gate and fixture recording for the real FDA sample panel.
import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
if(!process.argv.includes('--real-meta'))throw Error('Opt in with --real-meta; this calls the paid Meta API.');
const record=process.argv.includes('--record-fixture');
const original=globalThis.fetch,origin=new URL(process.env.MODEL_API_BASE_URL||'https://api.meta.ai/v1').origin;
const calls=[];let recorded;
process.env.NEXT_PUBLIC_SUPABASE_URL='https://smoke-trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace-sink';
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.origin==='https://smoke-trace.invalid'&&url.pathname==='/rest/v1/model_calls')return new Response(null,{status:201});
 if(url.origin!==origin||url.pathname!=='/v1/responses'||calls.length>=4)throw Error('Unexpected label gate request.');
 const body=JSON.parse(init.body);if(body.model!=='muse-spark-1.3'||body.text?.format?.name!=='label')throw Error('Unexpected model or format.');
 const r=await original(input,{...init,signal:AbortSignal.timeout(90000)});calls.push({status:r.status});if(r.ok)recorded=await r.clone().json();return r;
};
const receipt={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),fixture:'scripts/fixtures/label.png',calls};
try{
 const {readNutritionLabel}=await import('../src/lib/meta/label.ts');const reading=await readNutritionLabel(await readFile(new URL('./fixtures/label.png',import.meta.url)),'image/png');
 if(reading.is_label!==true||typeof reading.per_serving?.kcal!=='number')throw Error('FDA sample did not yield a readable numeric energy.');
 receipt.reading=reading;receipt.pass=true;
 if(record){await writeFile(new URL('../tests/fake-meta/fixtures/spark-label.json',import.meta.url),JSON.stringify(recorded,null,2)+'\n');receipt.recorded=true;}
}catch(error){receipt.pass=false;receipt.error=error.message.replace(/https?:\/\/\S+/g,'[URL omitted]');process.exitCode=1;}finally{globalThis.fetch=original;console.log(JSON.stringify(receipt,null,2));}
