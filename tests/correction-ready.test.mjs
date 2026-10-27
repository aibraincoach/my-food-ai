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
