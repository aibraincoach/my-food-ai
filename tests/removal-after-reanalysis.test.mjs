import {formatCommentMessage} from '../src/lib/posts/comment-message.ts';
import {nutritionTranslator} from '../src/i18n/nutrition.ts';
// Run: node --import tsx --test tests/removal-after-reanalysis.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const recompute=createRequire(import.meta.url)('../src/lib/worker/jobs/recompute.ts').default;
// One transaction writes one revision: its rows, and any reply, share a timestamp.
const at=minute=>`2026-11-02T00:0${minute}:00+00:00`;
const nutrition=(id,grams)=>({post_item_id:id,calories:grams,protein_g:grams/10,carbs_g:grams/5,fat_g:grams/20,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[],source_ref:'123',food_category:'baked products'});
const food=(id,grams,created_at,changes={})=>({id,name:'Toast',source:'model',portion_grams:grams,portion_text:`${grams} g`,created_at,superseded_at:null,not_eaten_grams:null,not_eaten_calories:null,box:null,mask_path:null,supersedes:null,...changes,item_nutrition:nutrition(id,grams)});
const comment=(id,body,author,created_at,reverted_at=null)=>({id,body,author,created_at,reverted_at});

// history: every model row of the meal, oldest first; the last one is the current row.
async function rebuilt({history,comments}){
 const calls={corrections:[],saved:null};
 const priorFetch=globalThis.fetch,priorKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';
 globalThis.fetch=async(_input,init)=>{
  let body={};try{body=JSON.parse(init?.body??'{}');}catch{}
  if(!body.model)return new Response(null,{status:201});
  const input=JSON.parse(body.input[0].content[0].text);calls.corrections.push(input);
  const grams=Number(input.items[0].portion_grams)/2;
  return Response.json({id:'fixture-model',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify({items:[{name:'Toast',portion_text:`${grams} g`,portion_grams:grams,region_index:0,keep:null}],reply:'Updated the meal.',needs_input:null})}]}]});
 };
 const current=history.at(-1);
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(input),path=url.pathname;
  if(path.endsWith('/current_post_items'))return Response.json([{...current,item_nutrition:undefined}]);
  if(path.endsWith('/item_nutrition'))return Response.json([current.item_nutrition]);
  if(path.endsWith('/post_items'))return Response.json(history);
  if(path.endsWith('/post_comments'))return Response.json(url.searchParams.has('or')?[]:comments);
  if(path.endsWith('/post_media'))return Response.json([]);
  if(path.endsWith('/posts'))return Response.json({user_id:'owner',caption:'Toast',analysis_initialized_at:at(0)});
  if(path.endsWith('/persist_removed_rebuild')){calls.saved=JSON.parse(init.body);return Response.json({message:'fixture captured atomic save',code:'40001'},{status:409});}
  throw Error(`Unexpected fixture request ${path}`);
 }}});
 try{await assert.rejects(recompute(db,{id:'job',post_id:'post',payload:{reason:'correction_reverted',comment_id:'removed'}}));return calls;}
 finally{globalThis.fetch=priorFetch;if(priorKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=priorKey;}
}

test('removing a correction after an operator re-analysis rebuilds from the re-analysed rows',async()=>{
 // 400 g first analysis (old numbers), superseded by the operator at minute 1; the worker's
 // re-analysis wrote 300 g at minute 2 and no new comment; a correction at minute 4 halved it.
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),food('reanalysed',300,at(2),{superseded_at:at(4)}),food('current',150,at(4),{supersedes:'reanalysed'})],
  comments:[comment('initial','Consumed: 300 kcal.','model',at(0)),comment('removed','Halve it.','user',at(3),at(5)),comment('reply','Consumed: 150 kcal.','model',at(4))],
 });
 assert.equal(calls.corrections.length,0);
 assert.equal(calls.saved.p_items[0].portion_grams,300,'the first analysis must not come back');
 assert.equal(calls.saved.p_items[0].nutrition.calories,300);
 assert.equal(formatCommentMessage(calls.saved.p_message,nutritionTranslator('en'),'en'),'Removed the correction "Halve it.". Consumed: 300 kcal.');
});

test('a correction kept after the re-analysis is replayed once on the re-analysed rows',async()=>{
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),food('reanalysed',300,at(2),{superseded_at:at(4)}),food('halved',150,at(4),{supersedes:'reanalysed',superseded_at:at(6)}),food('current',75,at(6),{supersedes:'halved'})],
  comments:[comment('initial','Consumed: 300 kcal.','model',at(0)),comment('kept','Halve it.','user',at(3)),comment('reply','Consumed: 150 kcal.','model',at(4)),comment('removed','Halve it again.','user',at(5),at(7)),comment('reply2','Consumed: 75 kcal.','model',at(6))],
 });
 assert.deepEqual(calls.corrections.map(input=>input.items[0].portion_grams),[300]);
 assert.equal(calls.saved.p_items[0].portion_grams,150);assert.equal(calls.saved.p_items[0].nutrition.calories,150);
});

test('removing a correction after an operator re-match of an uncorrected meal keeps the re-matched rows',async()=>{
 // The re-match superseded the 400 kcal row and wrote its copy in one transaction (minute 1).
 const rematched={...food('rematched',400,at(1),{superseded_at:at(3)}),item_nutrition:{...nutrition('rematched',400),calories:320,source_ref:'456'}};
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(1)}),rematched,food('current',200,at(3),{supersedes:'rematched'})],
  comments:[comment('initial','Consumed: 320 kcal.','model',at(0)),comment('removed','Halve it.','user',at(2),at(4)),comment('reply','Consumed: 160 kcal.','model',at(3))],
 });
 assert.equal(calls.saved.p_items[0].nutrition.calories,320);assert.equal(calls.saved.p_items[0].nutrition.source_ref,'456');
});

test('a re-match copy that already holds a correction is never the starting point',async()=>{
 // Halved at minute 2, then re-matched at minute 3: the 200 g copy holds the correction.
 // Replaying "Halve it." on it would halve the meal twice, so the rebuild keeps the first analysis.
 const calls=await rebuilt({
  history:[food('first',400,at(0),{superseded_at:at(2)}),food('halved',200,at(2),{supersedes:'first',superseded_at:at(3)}),food('copy',200,at(3),{superseded_at:at(5)}),food('current',100,at(5),{supersedes:'copy'})],
  comments:[comment('initial','Consumed: 400 kcal.','model',at(0)),comment('kept','Halve it.','user',at(1)),comment('reply','Consumed: 200 kcal.','model',at(2)),comment('removed','Halve it again.','user',at(4),at(6)),comment('reply2','Consumed: 100 kcal.','model',at(5))],
 });
 assert.deepEqual(calls.corrections.map(input=>input.items[0].portion_grams),[400]);
 assert.equal(calls.saved.p_items[0].portion_grams,200);
});
