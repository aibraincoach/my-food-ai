// Run: node --import tsx --env-file=.env.local --test tests/removal-replay.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createRequire} from 'node:module';
const recompute=createRequire(import.meta.url)('../src/lib/worker/jobs/recompute.ts').default;
const t='2026-11-02T00:00:00Z';
const nutrition=(id,grams)=>({post_item_id:id,calories:grams,protein_g:grams/10,carbs_g:grams/5,fat_g:grams/20,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[],source_ref:'123',food_category:'baked products'});
const food=(id,grams,created_at=t)=>({id,name:'Toast',source:'model',portion_grams:grams,portion_text:`${grams} g`,created_at,not_eaten_grams:null,not_eaten_calories:null,box:null,mask_path:null,supersedes:null});
const comment=(id,body,author='user',reverted_at=null)=>({id,body,author,created_at:t,reverted_at});

async function fixture({comments=[],photos=[],reason='media_removed',commentId}={}){
 const calls={corrections:[],remainders:[],downloads:[],saved:null};let remainderIndex=0;
 const priorFetch=globalThis.fetch,priorKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='fixture';
 globalThis.fetch=async(_input,init)=>{
  let body={};try{body=JSON.parse(init?.body??'{}');}catch{}
  if(!body.model)return new Response(null,{status:201});
  let result;
  if(body.text?.format?.name==='correct'){
   const input=JSON.parse(body.input[0].content[0].text);calls.corrections.push(input);
   const grams=Number(input.items[0].portion_grams)/2;
   result={items:[{name:'Toast',portion_text:`${grams} g`,portion_grams:grams,region_index:0,keep:null}],reply:'Updated the meal.',needs_input:null};
  }else{
   calls.remainders.push(body.input[0].content[0].text);
   result={items:[{index:0,remaining_grams:[20,10][remainderIndex++],total_count:null,remaining_count:null,unit:null}]};
  }
  return Response.json({id:'fixture-model',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:JSON.stringify(result)}]}]});
 };
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(input),path=url.pathname;
  if(path.endsWith('/current_post_items'))return Response.json([food('current',50,'2026-11-02T00:01:00Z')]);
  if(path.endsWith('/item_nutrition'))return Response.json([nutrition('current',50)]);
  if(path.endsWith('/post_items'))return Response.json([{...food('identify',400),item_nutrition:nutrition('identify',400)},{...food('current',50,'2026-11-02T00:01:00Z'),item_nutrition:nutrition('current',50)}]);
  if(path.endsWith('/post_comments'))return Response.json(url.searchParams.has('or')?[]:[comment('initial','Consumed: 400 kcal.','model'),...comments]);
  if(path.endsWith('/post_media'))return Response.json(url.searchParams.get('not_eaten')==='eq.true'?photos:[]);
  if(path.endsWith('/posts'))return Response.json({user_id:'owner',caption:'Toast',analysis_initialized_at:t});
  if(path.includes('/storage/')){calls.downloads.push(path);return new Response(new Uint8Array([1]),{headers:{'Content-Type':'image/jpeg'}});}
  if(path.endsWith('/persist_removed_rebuild')){calls.saved=JSON.parse(init.body);return Response.json({message:'fixture captured atomic save',code:'40001'},{status:409});}
  throw Error(`Unexpected fixture request ${path}`);
 }}});
 try{await assert.rejects(recompute(db,{id:'job',post_id:'post',payload:{reason,...(commentId?{comment_id:commentId}:{})}}));return calls;}
 finally{globalThis.fetch=priorFetch;if(priorKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=priorKey;}
}

test('removal replays each retained correction once from identify, then retained leftovers in position order',async()=>{
 const calls=await fixture({comments:[comment('first','Halve it.'),comment('removed','Double it.','user',t),comment('third','Halve it again.')],photos:[{id:'photo1',storage_path:'owner/post/1.jpg'},{id:'photo3',storage_path:'owner/post/3.jpg'}]});
 assert.equal(calls.corrections.length,2);assert.deepEqual(calls.corrections.map(input=>input.pending_messages.map(row=>row.id)),[['first'],['third']]);
 assert.deepEqual(calls.corrections.map(input=>input.items[0].portion_grams),[400,200],'current 50g snapshot must not become the rebuild base');
 assert.equal(calls.remainders.length,2);assert.match(calls.remainders[0],/100 grams/);assert.match(calls.remainders[1],/80 grams/);
 assert.ok(calls.downloads[0].endsWith('/owner/post/1.jpg'));assert.ok(calls.downloads[1].endsWith('/owner/post/3.jpg'));
 assert.ok(calls.saved,'one atomic final revision was prepared');assert.deepEqual(calls.saved.p_expected,['current']);assert.deepEqual(calls.saved.p_comments,['first','third']);assert.deepEqual(calls.saved.p_photos,['photo1','photo3']);
 assert.equal(calls.saved.p_items[0].portion_grams,70);assert.equal(calls.saved.p_items[0].not_eaten_grams,30);assert.equal(calls.saved.p_items[0].nutrition.calories,70);assert.equal(calls.saved.p_items[0].nutrition.food_category,'baked products');
});

test('removing the only correction restores identify without reusing the corrected current revision',async()=>{
 const calls=await fixture({comments:[comment('removed','Halve it.','user',t)]});
 assert.equal(calls.corrections.length,0);assert.equal(calls.remainders.length,0);assert.equal(calls.saved.p_items[0].portion_grams,400);assert.equal(calls.saved.p_items[0].nutrition.calories,400);assert.deepEqual(calls.saved.p_comments,[]);
});

test('foreign or traversal leftovers paths are refused before downloading or calling the remainder model',async()=>{
 for(const path of ['victim/post/1.jpg','owner/other/1.jpg','owner/post/../other/1.jpg']){
  const calls=await fixture({photos:[{id:'foreign',storage_path:path}]});assert.deepEqual(calls.downloads,[]);assert.deepEqual(calls.remainders,[]);assert.equal(calls.saved,null);
 }
});


test('removal preserves quoted user words without treating them as generated claims',async()=>{
 const text='Use the remaining half, not what was left.';
 const calls=await fixture({reason:'correction_reverted',commentId:'removed',comments:[comment('removed',text,'user',t)]});
 assert.ok(calls.saved,'quoted user language must not block the atomic rebuild');
 assert.equal(calls.saved.p_reply,`Removed the correction "${text}". Consumed: 400 kcal.`);
 assert.equal(calls.saved.p_items[0].portion_grams,400);
});
