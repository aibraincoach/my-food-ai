import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {waitForInitialAnalysis} from '../src/lib/pipeline/correction-ready.ts';
import {isRetriable} from '../src/lib/worker/errors.ts';
import {correctionFeedback} from '../src/lib/posts/correction-feedback.ts';
function client({initialized=false,active=false}={}){return createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(url)=>{
 const parsed=new URL(url);if(parsed.pathname.endsWith('/posts'))return Response.json({analysis_initialized_at:initialized?'2026-10-27T00:00:00Z':null});
 const query=parsed.searchParams;assert.equal(query.get('kind'),'eq.analyze');assert.equal(query.get('status'),'in.(queued,running)');assert.equal(query.has('run_after'),false);
 return Response.json(active?{id:'delayed-analysis'}:null);
}}});}
test('delayed initial analysis defers correction; terminal uninitialized failure cannot consume comments',async()=>{
 await assert.rejects(waitForInitialAnalysis(client({active:true}),'post'),isRetriable);
 await assert.rejects(waitForInitialAnalysis(client(),'post'),error=>error.status===409&&!isRetriable(error));
 await waitForInitialAnalysis(client({initialized:true}),'post'); // includes valid zero-food analysis
});
test('terminal failure replaces progress even if latest comment remains user-authored',()=>{
 assert.equal(correctionFeedback('queued'),'waiting');assert.equal(correctionFeedback('queued'),'waiting');assert.equal(correctionFeedback('processing'),'waiting');assert.equal(correctionFeedback('processing'),'waiting');
 assert.equal(correctionFeedback('failed'),'failed');assert.equal(correctionFeedback('ready'),'idle');assert.equal(correctionFeedback('needs_input'),'idle');
});
test('terminal recompute failure can be repaired in the correction attempt; explicit unknown rows are complete',async()=>{
 const {loadCorrectionItems}=await import('../src/lib/pipeline/correction-ready.ts');
 let rows=[],repairs=0,reads=0;
 const db=createClient('http://127.0.0.1:1','fixture',{global:{fetch:async(input)=>{
  const url=new URL(input);if(url.pathname.endsWith('/current_post_items')){reads++;return Response.json([{id:'edited',name:'rice',portion_grams:50,source:'user'}]);}
  return Response.json(rows);
 }}});
 const repair=async()=>{repairs++;rows=[{post_item_id:'edited',calories:100,micronutrients:[],source_ref:'77'}];};
 const result=await loadCorrectionItems(db,'post',repair);
 assert.equal(repairs,1);assert.equal(reads,2);assert.equal(result[0].calories,100);
 rows=[{post_item_id:'edited',calories:null,micronutrients:[],source_ref:null}];
 assert.equal((await loadCorrectionItems(db,'post',repair))[0].calories,null);assert.equal(repairs,1);
 rows=[];const io=Object.assign(new Error('upstream outage'),{status:503});
 await assert.rejects(loadCorrectionItems(db,'post',async()=>{throw io;}),error=>error===io&&isRetriable(error));
});
test('the real recompute handler repairs an exhausted predecessor without creating another job',async(t)=>{
 const savedFetch=globalThis.fetch,savedKey=process.env.MODEL_API_KEY;
 process.env.MODEL_API_KEY='fixture-only';
 globalThis.fetch=async input=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(!url.startsWith('https://api.meta.ai/v1/responses'))throw Error('Unexpected model-test request');
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({id:77,query:null,reason:'same food'})}]}]});
 };
 t.after(()=>{globalThis.fetch=savedFetch;if(savedKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=savedKey;});
 const {default:recompute}=await import('../src/lib/worker/jobs/recompute.ts');
 const {loadCorrectionItems}=await import('../src/lib/pipeline/correction-ready.ts');
 const item={id:'edited',name:'rice',portion_grams:50,source:'user',supersedes:null};let nutrition=[],publications=0,writes=0;
 const db=createClient('http://127.0.0.1:1','fixture',{global:{fetch:async(input,init)=>{
  const url=new URL(input);const path=url.pathname;
  if(path.endsWith('/current_post_items'))return Response.json([item]);
  if(path.endsWith('/item_nutrition')){
   if(init?.method==='POST'){writes++;nutrition=[JSON.parse(init.body)];return new Response(null,{status:201});}
   return Response.json(nutrition);
  }
  if(path.endsWith('/fdc_cache'))return Response.json({response:{foods:[{fdcId:77,description:'rice',dataType:'Foundation',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:200}]}]}});
  if(path.endsWith('/posts'))return Response.json({status:'processing'});
  if(path.endsWith('/rpc/results_card_snapshot')){publications++;return Response.json(null);}
  if(path.endsWith('/rpc/mark_post_ready')){publications++;return Response.json(false);}

  throw new Error(`Unexpected request: ${path}`);
 }}});
 const job={id:'current-correction',post_id:'post',kind:'correct',status:'running',payload:{}};
 const items=await loadCorrectionItems(db,'post',()=>recompute(db,job));
 assert.equal(items[0].calories,100);assert.equal(writes,1);assert.equal(publications,1);
 await loadCorrectionItems(db,'post',()=>recompute(db,job));assert.equal(writes,1);
});
