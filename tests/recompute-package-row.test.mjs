import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

// #989: an operator re-match copied a label row that had no protein or carbs. Recompute then searched USDA for
// "Packaged food" and stored a row with no calories, so the meal lost its label's 140 kcal. A barcode, label or
// typed row is now kept as it is, and no model is asked.
for(const sourceRef of ['label','barcode:0123','barcode-own:0123'])test('recompute keeps incomplete package nutrition without a lookup: '+sourceRef,async(t)=>{
 const savedFetch=globalThis.fetch;
 // Trace storage may also use fetch when a stack is configured; only a model or USDA request counts.
 let modelCalls=0;
 globalThis.fetch=async input=>{
  const url=String(typeof input==='string'?input:input instanceof URL?input.href:input.url);
  if(/\/v1\/responses|fdc|usda/i.test(url)){modelCalls++;throw Error('No model or USDA request is expected');}
  return new Response(null,{status:204});
 };
 t.after(()=>{globalThis.fetch=savedFetch;});
 const {default:recompute,PACKAGE_SOURCE}=await import('../src/lib/worker/jobs/recompute.ts');
 for(const ref of ['label','barcode-own:0123','barcode:0123','off:08997035563414','user:typed'])assert.ok(PACKAGE_SOURCE.test(ref),ref);
 for(const ref of ['174195','estimate:Salami','unavailable:no_match',''])assert.ok(!PACKAGE_SOURCE.test(ref),ref);
 const label={calories:140,protein_g:null,carbs_g:null,fat_g:3.5,fibre_g:null,sugar_g:11,sodium_mg:115,micronutrients:[],source_ref:sourceRef,food_category:null};
 const current={id:'copy',name:'Packaged food',portion_grams:null,portion_text:'220 ml',supersedes:'original',source:'user'};
 const stored=new Map([['original',{post_item_id:'original',...label}]]);
 let batch=null,summary=null;
 const reply=(init,rows)=>(new Headers(init?.headers).get('Accept')??'').includes('vnd.pgrst.object')?Response.json(rows[0]??null):Response.json(rows);
 const db=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(input,init)=>{
  const url=new URL(input);const path=url.pathname;
  if(path.endsWith('/current_post_items'))return reply(init,[current]);
  if(path.endsWith('/post_items'))return reply(init,[{id:'original',name:'Packaged food',portion_grams:null,portion_text:'220 ml',supersedes:null}]);
  if(path.endsWith('/item_nutrition')){
   if(init?.method==='POST'){batch=JSON.parse(init.body);for(const row of batch)stored.set(row.post_item_id,row);return new Response(null,{status:201});}
   const filter=url.searchParams.get('post_item_id')??'';
   const ids=filter.startsWith('in.(')?filter.slice(4,-1).split(','):[filter.replace(/^eq\./,'')];
   return reply(init,ids.map(id=>stored.get(id)).filter(Boolean));
  }
  if(path.endsWith('/posts'))return reply(init,[{caption:'',status:'processing'}]);
  if(path.endsWith('/rpc/sync_item_drinks'))return new Response(null,{status:204});
  if(path.endsWith('/rpc/refresh_owned_approximation_summary')){summary=JSON.parse(init.body);return new Response(null,{status:204});}
  if(path.endsWith('/rpc/results_card_snapshot'))return Response.json(null);
  if(path.endsWith('/rpc/mark_post_ready'))return Response.json(false);
  if(path.endsWith('/rpc/refresh_operator_saved_meal'))return Response.json(0);
  throw new Error(`Unexpected request: ${path}`);
 }}});
 await recompute(db,{id:'operator-job',post_id:'post',kind:'recompute',status:'running',payload:{operator:'rematch'}});
 assert.equal(modelCalls,0);
 assert.ok(batch,'recompute writes the copy its nutrition');
 assert.equal(batch.length,1);
 assert.equal(batch[0].post_item_id,'copy');
 assert.equal(batch[0].calories,140);
 assert.equal(batch[0].fat_g,3.5);
 assert.equal(batch[0].source_ref,sourceRef);
 assert.deepEqual(summary.p_expected,[{id:'copy',source_ref:sourceRef}]);
});
