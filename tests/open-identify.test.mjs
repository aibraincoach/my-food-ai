// node --import tsx --env-file=.env.local --test tests/open-identify.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
// No connection to any live model, database or storage in this test process.
process.env.IDENTIFY_OPEN_MODEL='meta-models/muse-spark-open-1026';
process.env.MODEL_API_BASE_URL='http://127.0.0.1:1/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
process.env.IDENTIFY_OPEN_TIMEOUT_MS='600';
const {openRequest,readOpenResponse,openIdentifyModel}=await import('../src/lib/meta/open-weights.ts');
const body={model:'muse-spark-1.3',instructions:'Name foods',input:[{role:'user',content:[{type:'input_text',text:'toast'},{type:'input_image',image_url:'data:image/jpeg;base64,AA=='}]}],text:{format:{name:'identify',schema:{type:'object'}}},reasoning:{effort:'low'}};
test('maps identify messages and structured output to the open provider',()=>{
 const mapped=openRequest(body);assert.equal(mapped.model,'meta-models/muse-spark-open-1026');assert.equal(mapped.max_tokens,16384);assert.equal(mapped.reasoning,undefined);assert.deepEqual(mapped.messages[1].content[1],{type:'image_url',image_url:{url:'data:image/jpeg;base64,AA=='}});assert.equal(mapped.response_format.json_schema.name,'identify');assert.equal(mapped.messages[0].role,'system');process.env.IDENTIFY_OPEN_MODEL='openai/not-allowed';assert.throws(()=>openIdentifyModel(),/Muse Spark Open/);process.env.IDENTIFY_OPEN_MODEL='meta-models/muse-spark-open-1026';assert.equal(openRequest(body,true).response_format.type,'json_object');
});
test('strips reasoning and fences; maps incomplete, refusal and usage',()=>{
 const result=readOpenResponse({choices:[{finish_reason:'length',message:{content:'<think>{private reasoning}</think>```json\n{"food":"toast"}\n```'}}],usage:{prompt_tokens:12,completion_tokens:34}});assert.equal(result.outputText,'{"food":"toast"}');assert.equal(result.status,'incomplete');assert.deepEqual(result.usage,{input_tokens:12,output_tokens:34});assert.equal(readOpenResponse({choices:[{finish_reason:'stop',message:{refusal:'refused'}}]}).refusal,true);
});
test('a local provider 500 falls back to Meta and records actual identities',async()=>{
 let status=500,payload={};const server=createServer((_req,res)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(payload));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 process.env.IDENTIFY_OPEN_API_KEY='offline-open';process.env.IDENTIFY_OPEN_BASE_URL=`http://127.0.0.1:${server.address().port}/v1`;
 const original=globalThis.fetch,traces=[];
 globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid'){traces.push(JSON.parse(init.body));return new Response(null,{status:201});}if(url.port==='1')return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({items:[{name:'toast',region_index:null,portion_text:'one slice',portion_grams:30,confidence:0.8}],summary:'Toast',needs_input:null})}]}],usage:{input_tokens:10,output_tokens:20}});return original(input,init);};
 try{const{identifyItems}=await import('../src/lib/meta/spark.ts');const result=await identifyItems(null,'image/jpeg','toast',[],'',[],'','open');assert.equal(result.items[0].name,'toast');assert.equal(traces.length,2);assert.equal(traces[0].host,'baseten');assert.match(traces[0].error,/500/);assert.equal(traces[1].host,'meta');assert.equal(traces[1].model,'muse-spark-1.3');
 status=200;payload={choices:[{finish_reason:'stop',message:{content:'{"wrong":true}'}}],usage:{prompt_tokens:1,completion_tokens:2}};
 const invalid=await identifyItems(null,'image/jpeg','toast',[],'',[],'','open');assert.equal(invalid.items[0].name,'toast');assert.equal(traces[2].host,'baseten');assert.ok(traces[2].error,'invalid structured result is not a successful open identification');assert.equal(traces[3].host,'meta');
 payload.choices[0].message.content=JSON.stringify({items:[{name:'rice',region_index:null,portion_text:'half bowl',portion_grams:100,confidence:0.8}],summary:'Rice',needs_input:null});
 const valid=await identifyItems(null,'image/jpeg','half rice',[],'',[],'','open');assert.equal(valid.items[0].name,'rice');assert.equal(traces.length,5);assert.equal(traces[4].host,'baseten');assert.equal(traces[4].error,null);
 }finally{globalThis.fetch=original;server.close();}
});
test('migration defaults to Meta and the setting RPC changes only the authenticated owner',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/0032_identify_provider.sql',import.meta.url),'utf8');assert.match(sql,/default 'meta'/);assert.match(sql,/where id=auth\.uid\(\)/);assert.match(sql,/revoke all.*from public,anon/);assert.match(sql,/add column model text, add column host text/);
});

test('a late format rejection shares the total deadline and falls back to Meta',async()=>{
 let requests=0;
 const server=createServer((_req,res)=>{requests++;if(requests===1)setTimeout(()=>{res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:'response_format is not supported'}}));},300);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 process.env.IDENTIFY_OPEN_BASE_URL=`http://127.0.0.1:${server.address().port}/v1`;process.env.IDENTIFY_OPEN_API_KEY='offline-open';
 const original=globalThis.fetch;
 globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid')return new Response(null,{status:201});if(url.port==='1')return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({items:[{name:'toast',region_index:null,portion_text:'one slice',portion_grams:30,confidence:0.8}],summary:'Toast',needs_input:null})}]}],usage:{input_tokens:1,output_tokens:1}});return original(input,init);};
 try{const {identifyItems}=await import('../src/lib/meta/spark.ts');const start=performance.now();const result=await identifyItems(null,'image/jpeg','toast',[],'',[],'','open');const elapsed=performance.now()-start;assert.equal(result.items[0].name,'toast');assert.equal(requests,2);assert.ok(elapsed>=550&&elapsed<900,`shared deadline elapsed ${elapsed}ms`);}finally{globalThis.fetch=original;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));delete process.env.IDENTIFY_OPEN_TIMEOUT_MS;}
});
