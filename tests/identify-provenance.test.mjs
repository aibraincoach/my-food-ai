// node --import tsx --test tests/identify-provenance.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
process.env.MODEL_API_BASE_URL='https://meta.invalid/v1';process.env.MODEL_API_KEY='offline-meta';
process.env.IDENTIFY_OPEN_BASE_URL='https://open.invalid/v1';process.env.IDENTIFY_OPEN_API_KEY='offline-open';process.env.IDENTIFY_OPEN_MODEL='meta-models/muse-spark-open-1026';
process.env.NEXT_PUBLIC_SUPABASE_URL='https://trace.invalid';process.env.SUPABASE_SECRET_KEY='offline-trace';
const {recordCall}=await import('../src/lib/trace/record.ts');
const {identifyItems}=await import('../src/lib/meta/spark.ts');
const {getPostDetail}=await import('../src/lib/posts/items.ts');
const valid={items:[{name:'rice',region_index:null,portion_text:'half bowl',portion_grams:100,confidence:0.8}],summary:'Rice',needs_input:null};
const meta=text=>Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}],usage:{input_tokens:10,output_tokens:20}});
test('pre-0032 trace rejection retries only legacy identity fields within the same deadline',async()=>{
 const original=fetch,writes=[];globalThis.fetch=async(_url,init)=>{writes.push({row:JSON.parse(init.body),signal:init.signal});return writes.length===1?Response.json({code:'PGRST204',message:"Could not find the 'model' column of 'model_calls' in the schema cache"},{status:400}):new Response(null,{status:201});};
 try{assert.equal(await recordCall('spark_identify',{model:'muse-spark-1.3'},async()=>7),7);assert.equal(writes.length,2);assert.equal(writes[0].row.model,'muse-spark-1.3');assert.equal(writes[1].row.model,undefined);assert.equal(writes[1].row.host,undefined);assert.equal(writes[1].row.kind,'spark_identify');assert.equal(writes[1].row.error,null);assert.equal(writes[0].signal,writes[1].signal);}finally{globalThis.fetch=original;}
});
test('unrelated trace schema errors do not silently downgrade payloads',async()=>{
 const original=fetch,previous=console.error;let writes=0;globalThis.fetch=async()=>{writes++;return Response.json({code:'PGRST204',message:"Could not find the 'response_text' column of 'model_calls' in the schema cache"},{status:400});};console.error=()=>{};
 try{await recordCall('sam',{model:'sam-3.1'},async()=>true);assert.equal(writes,1);}finally{globalThis.fetch=original;console.error=previous;}
});
function detailDb(committed){const tables=[];return{tables,rpc(name){assert.equal(name,'feedback_revision');return{abortSignal:async()=>({data:null,error:null,status:200})};},from(table){tables.push(table);let chain;chain=new Proxy({}, {get(_target,key){if(key==='then')return resolve=>Promise.resolve({data:[],error:null,status:200}).then(resolve);if(key==='maybeSingle'||key==='single')return async()=>({data:table==='posts'?committed:null,error:null,status:200});return()=>chain;}});return chain;}};}
test('failed and uncommitted reanalysis cannot relabel a committed open-model meal',async()=>{
 const original=fetch,traces=[];let openFails=false,metaInvalid=false;
 globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid'){traces.push(JSON.parse(init.body));return new Response(null,{status:201});}if(url.origin==='https://open.invalid')return openFails?Response.json({error:{message:'unavailable'}},{status:500}):Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(valid)}}],usage:{prompt_tokens:1,completion_tokens:2}});if(url.origin==='https://meta.invalid')return meta(metaInvalid?'{}':JSON.stringify(valid));throw Error('Unexpected test destination');};
 try{
  const first=await identifyItems(null,'image/jpeg','rice',[],'',[],'','open');assert.deepEqual(first.identification,{model:'meta-models/muse-spark-open-1026',host:'baseten'});
  const committed={id:'10000000-0000-4000-8000-000000000001',user_id:'owner',caption:'Rice',eaten_at:'2026-11-03T00:00:00Z',status:'ready',analysis_initialized_at:'2026-11-03T00:00:01Z',servings:1,source_post_id:null,identify_model:first.identification.model,identify_host:first.identification.host};
  const db=detailDb(committed);assert.deepEqual((await getPostDetail(db,committed.id)).identification,{model:first.identification.model,host:'baseten'});
  openFails=true;metaInvalid=true;await assert.rejects(()=>identifyItems(null,'image/jpeg','rice',[],'',[],'','open'));
  const failedMeta=traces.filter(t=>t.host==='meta').at(-1);assert.ok(failedMeta?.error,'HTTP-200 invalid Meta output is a failed trace');assert.deepEqual((await getPostDetail(db,committed.id)).identification,{model:first.identification.model,host:'baseten'});
  // A later valid identify is still just an attempt if USDA/persistence fails.
  metaInvalid=false;const attempt=await identifyItems(null,'image/jpeg','rice',[]);assert.equal(attempt.identification.host,'meta');assert.equal(traces.at(-1).error,null);
  assert.deepEqual((await getPostDetail(db,committed.id)).identification,{model:first.identification.model,host:'baseten'});assert.ok(!db.tables.includes('model_calls'),'detail never uses latest attempt traces as committed provenance');
 }finally{globalThis.fetch=original;}
});
test('incomplete and refused HTTP-200 Meta identification are failed traces',async()=>{
 const original=fetch,traces=[];let mode='incomplete';globalThis.fetch=async(input,init)=>{const url=new URL(input);if(url.origin==='https://trace.invalid'){traces.push(JSON.parse(init.body));return new Response(null,{status:201});}return mode==='incomplete'?Response.json({status:'incomplete',output:[],usage:{input_tokens:1,output_tokens:1}}):Response.json({status:'completed',output:[{type:'refusal'}],usage:{input_tokens:1,output_tokens:1}});};
 try{for(mode of ['incomplete','refusal']){await assert.rejects(()=>identifyItems(null,'image/jpeg','rice',[]));assert.ok(traces.at(-1).error);assert.equal(traces.at(-1).host,'meta');}}finally{globalThis.fetch=original;}
});
test('missing new persistence RPC alone allows a legacy rollout fallback; ownership failures never do',async()=>{
 const {persistAnalysis}=await import('../src/lib/pipeline/persist.ts');
 const named={postId:'post',userId:'owner',photoWidth:0,photoHeight:0,regions:[],captionOnly:[],summary:'Rice',needsInput:{question:'What did you eat?',short:'Clarification needed',options:[]},identification:{model:'muse-spark-1.3',host:'meta'}};
 const wrapperMissing={code:'PGRST202',message:'Could not find public.persist_approximated_analysis in the schema cache'};
 const make=(error,wrapperError=wrapperMissing,body=null)=>{const calls=[];return{calls,from(table){return{select(){return{eq(){return this;},order(){return this;},limit(){return this;},abortSignal(){return this;},maybeSingle:async()=>({data:body?{body}:null,error:null}),single:async()=>({data:{caption:'Rice'},error:null})};}};},rpc:async(name,body)=>{calls.push({name,body});const failure=name==='persist_approximated_analysis'?wrapperError:name==='persist_identified_analysis'?error:null;return{name,error:failure,status:failure?400:200};}};};
 const missing=make({code:'PGRST202',message:'Could not find public.persist_identified_analysis in the schema cache'});await persistAnalysis(missing,named,undefined,'job');assert.deepEqual(missing.calls.filter(c=>c.name.startsWith('persist_')).map(c=>c.name),['persist_approximated_analysis','persist_identified_analysis','persist_owned_analysis']);assert.equal(missing.calls.at(-1).body.p_identify_model,undefined);
 const ownershipError={code:'40001',message:'Analysis job no longer owns this meal'};
 const ownership=make(ownershipError,ownershipError);await assert.rejects(()=>persistAnalysis(ownership,named,undefined,'job'),/no longer owns/);assert.deepEqual(ownership.calls.filter(c=>c.name.startsWith('persist_')).map(c=>c.name),['persist_approximated_analysis']);
 const transition=make(null,wrapperMissing,'Nutrition for rice is taken from the closest USDA record, Rice, cooked.');await assert.rejects(()=>persistAnalysis(transition,named,undefined,'job'),/persist_approximated_analysis/);assert.deepEqual(transition.calls.filter(c=>c.name.startsWith('persist_')).map(c=>c.name),['persist_approximated_analysis']);
});
