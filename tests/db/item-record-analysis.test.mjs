// Direct real persistAnalysis + PostgREST/RPC, on the disposable local provider stack only.
import test from'node:test';import assert from'node:assert/strict';import{createClient}from'@supabase/supabase-js';
import{productFromFood,mergeProduct,barcodeNutrition}from'../../src/lib/fdc/barcode-product.ts';
import{persistAnalysis}from'../../src/lib/pipeline/persist.ts';import{getCurrentItems}from'../../src/lib/nutrition/totals.ts';
import {editPostItem} from '../../src/lib/posts/items.ts';
import recomputeModule from '../../src/lib/worker/jobs/recompute.ts';
import correctModule from '../../src/lib/worker/jobs/correct.ts';
const recompute=recomputeModule.default??recomputeModule,correct=correctModule.default??correctModule;
const checked=r=>{assert.ifError(r.error);return r.data;};
test('fresh analysis stores its match identity; repeat copy retains it without another USDA/cache lookup',async()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');
 for(const name of['NEXT_PUBLIC_SUPABASE_URL','TEST_FDC_FIXTURE_URL'])assert.equal(new URL(process.env[name]).hostname,'127.0.0.1');
 let db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const owner=checked(await db.from('profiles').select('id').limit(1).single()).id;
 const detailPaths=[],blockedHosts=new Set(),cacheKeys=new Set(),posts=[],fetcher=globalThis.fetch;let searches=0,details=0,cacheReads=0,modelCalls=0,lastNutritionSelect='';
 globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.protocol==='data:'||url.protocol==='blob:')return fetcher(input,init);
  if(url.hostname==='api.nal.usda.gov'){
   if(url.pathname.includes('/foods/search')){searches++;return Response.json({foods:[{fdcId:9901421,description:'Record retention croissant',dataType:'SR Legacy',foodCategory:'Baked Products',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:400},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:5},{nutrientId:1004,nutrientName:'Fat',unitName:'G',value:20},{nutrientId:1005,nutrientName:'Carbohydrate',unitName:'G',value:50}]}]});}
   details++;detailPaths.push(url.pathname);throw Error('Unexpected detail lookup');
  }
  else if(!['127.0.0.1','localhost'].includes(url.hostname)){blockedHosts.add(url.hostname);modelCalls++;throw Error('External model or provider forbidden in this proof');}
  if(url.pathname.endsWith('/item_nutrition'))lastNutritionSelect=url.searchParams.get('select')??'';
  if(url.pathname.endsWith('/fdc_cache')){
   if(!init?.method||init.method==='GET')cacheReads++;
   else if(init.method==='POST'&&typeof init.body==='string'){const body=JSON.parse(init.body);for(const row of Array.isArray(body)?body:[body])if(typeof row.query==='string')cacheKeys.add(row.query);}
  }
  return fetcher(input,init);
 };
 db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 try{
  const add=async()=>{const p=checked(await db.from('posts').insert({user_id:owner,status:'processing',caption:'Record retention croissant',render_time_zone:'UTC'}).select('id').single());posts.push(p.id);const j=checked(await db.from('jobs').insert({post_id:p.id,kind:'analyze',status:'running',payload:{post_ownership:true}}).select('id').single());checked(await db.from('posts').update({active_job_id:j.id}).eq('id',p.id));return[p,j];};
  const named=p=>({postId:p.id,regions:[],captionOnly:[{name:'Record retention croissant',portionText:'100 g',portionGrams:100,confidence:0.9}],summary:'',needsInput:null,hasNotEaten:true});
  const[p,j]=await add();await persistAnalysis(db,named(p),undefined,j.id);
  const fresh=await getCurrentItems(db,p.id,{requireNutrition:true});assert.equal(fresh.length,1);assert.equal(fresh[0].source_ref,'9901421');assert.equal(fresh[0].record_description,'Record retention croissant');assert.equal(fresh[0].record_data_type,'SR Legacy');assert.equal(fresh[0].calories,400);
  const display=await getCurrentItems(db,p.id);assert.equal('record_description' in display[0],false);assert.ok(!lastNutritionSelect.includes('record_description'),'display read must not download unused metadata');
  const before={searches,details,cacheReads};assert.ok(cacheReads>0,'cache-read instrument must observe the real search');const[copy,copyJob]=await add();
  await persistAnalysis(db,named(copy),[{...fresh[0],post_item_id:fresh[0].id}],copyJob.id);
  const copied=await getCurrentItems(db,copy.id,{requireNutrition:true});assert.equal(copied[0].record_description,fresh[0].record_description);assert.equal(copied[0].record_data_type,fresh[0].record_data_type);assert.equal(copied[0].calories,fresh[0].calories);
  assert.deepEqual({searches,details,cacheReads},before,'copy must not fetch identity from USDA or the cache');
  assert.equal(details,0,JSON.stringify(detailPaths));assert.equal(modelCalls,0,[...blockedHosts].join(','));
  const[old,oldJob]=await add();const{record_description:_description,record_data_type:_type,...oldRow}=fresh[0];
  await persistAnalysis(db,named(old),[oldRow],oldJob.id);const oldItems=await getCurrentItems(db,old.id,{requireNutrition:true});assert.equal(oldItems[0].record_description,null);assert.equal(oldItems[0].record_data_type,null);
  assert.deepEqual({searches,details,cacheReads},before);
  const base=productFromFood({fdcId:9901422,description:'Branded fixture food',dataType:'Branded',foodNutrients:[{nutrientId:1008,value:100}]},'12345678');
  for(const [product,description,dataType]of[[mergeProduct('12345678',base,{name:'My display name'},null),'Branded fixture food','Branded'],[mergeProduct('12345678',base,{per_100:{calories:50,protein_g:0,carbs_g:5,fat_g:0}},null),null,null],[{...base,attribution:'off'},null,null]]){
   const id=checked(await db.rpc('create_food_post',{p_user_id:owner,p_eaten_at:new Date().toISOString(),p_name:product.name,p_grams:100,p_nutrition:barcodeNutrition(product,100)}));posts.push(id);
   const stored=await getCurrentItems(db,id,{requireNutrition:true});assert.equal(stored[0].record_description,description);assert.equal(stored[0].record_data_type,dataType);
  }
  assert.deepEqual({searches,details,cacheReads},before);
  console.log(JSON.stringify({fresh:before,copy_added_searches:0,copy_added_details:0,copy_added_cache_reads:0,actual_external_model_calls:modelCalls,fixtures_removed_on_exit:true}));
 }finally{globalThis.fetch=fetcher;for(const id of posts)checked(await db.from('posts').delete().eq('id',id));for(const key of cacheKeys)checked(await db.from('fdc_cache').delete().eq('query',key));}
});

test('real item edits, recompute and unchanged correction retain the pair, while a changed food gets its own pair or null',async()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'127.0.0.1');
 let db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const owner=checked(await db.from('profiles').select('id').limit(1).single()).id;
 const fetcher=globalThis.fetch,posts=[],cacheKeys=new Set(),storageKeys=new Set();let searches=0,details=0,correctionPayload=null;
 let candidate={fdcId:9901431,description:'New record retention croissant',dataType:'Foundation'};
 const amounts={calories:400,protein_g:5,carbs_g:50,fat_g:20,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[]};
 globalThis.fetch=async(input,init)=>{
  const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
  if(url.protocol==='data:'||url.protocol==='blob:')return fetcher(input,init);
  if(url.hostname==='api.nal.usda.gov'){
   if(!url.pathname.includes('/foods/search')){details++;throw Error('No detail lookup expected');}
   searches++;return Response.json({foods:[{...candidate,foodCategory:'Baked Products',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:400},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:5},{nutrientId:1004,nutrientName:'Fat',unitName:'G',value:20},{nutrientId:1005,nutrientName:'Carbohydrate',unitName:'G',value:50}]}]});
  }
  assert.ok(['127.0.0.1','localhost'].includes(url.hostname),'No external provider call');
  if(url.pathname.endsWith('/responses')&&typeof init?.body==='string'){
   const body=JSON.parse(init.body);
   if(body.text?.format?.name==='correct'){
    const current=JSON.parse(body.input[0].content[0].text).items;
    return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({items:current.map((row,index)=>({name:row.name,portion_text:row.portion_text,portion_grams:row.portion_grams,region_index:index,keep:row.id})),reply:'Kept the unchanged food.',needs_input:null})}]}]});
   }
  }
  if(url.pathname.startsWith('/storage/v1/object/media/')&&['POST','PUT'].includes(init?.method))storageKeys.add(decodeURIComponent(url.pathname.slice('/storage/v1/object/media/'.length)));
  if(url.pathname.endsWith('/rpc/persist_correction'))correctionPayload=JSON.parse(init.body);
  if(url.pathname.endsWith('/fdc_cache')&&init?.method==='POST'&&typeof init.body==='string')for(const row of [JSON.parse(init.body)].flat())cacheKeys.add(row.query);
  return fetcher(input,init);
 };
 db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 try{
  const post=checked(await db.rpc('create_food_post',{p_user_id:owner,p_eaten_at:new Date().toISOString(),p_name:'Original record retention croissant',p_grams:100,p_nutrition:{...amounts,source_ref:'9901430',record_description:'Original supplier croissant',record_data_type:'SR Legacy'}}));posts.push(post);
  const current=async()=>{const rows=await getCurrentItems(db,post,{requireNutrition:true});assert.equal(rows.length,1);return rows[0];};
  const runJob=async(kind)=>{
   checked(await db.from('jobs').update({status:'finished'}).eq('post_id',post).in('status',['queued','running']));
   const job=checked(await db.from('jobs').insert({post_id:post,kind,status:'running',payload:{post_ownership:true}}).select('*').single());
   checked(await db.from('posts').update({active_job_id:job.id,status:'processing'}).eq('id',post));
   return job;
  };
  const initial=await current();
  const portion=await editPostItem(db,post,owner,{action:'portion',item_id:initial.id,portion_grams:200});assert.ifError(portion.error);
  await recompute(db,await runJob('recompute'));
  let item=await current();assert.equal(item.record_description,'Original supplier croissant');assert.equal(item.record_data_type,'SR Legacy');assert.equal(Number(item.calories),800);assert.equal(searches,0);assert.equal(details,0);
  checked(await db.from('post_comments').insert({post_id:post,author:'user',body:'Keep this item unchanged.'}));
  await correct(db,await runJob('correct'));
  item=await current();assert.equal(item.record_description,'Original supplier croissant');assert.equal(item.record_data_type,'SR Legacy');
  // 0087 also protects a same-ref SQL copy. Pin the app payload so that DB protection
  // cannot conceal a dropped pair in correct.ts's unchanged branch.
  assert.equal(correctionPayload.p_items[0].nutrition.record_description,'Original supplier croissant');assert.equal(correctionPayload.p_items[0].nutrition.record_data_type,'SR Legacy');assert.equal(searches,0);
  const selected=await editPostItem(db,post,owner,{action:'rename',item_id:item.id,name:candidate.description,portion_grams:100,fdc_selection:{id:candidate.fdcId,query:'unique fresh record edit croissant'}});assert.ifError(selected.error);
  item=await current();assert.equal(item.source_ref,String(candidate.fdcId));assert.equal(item.record_description,candidate.description);assert.equal(item.record_data_type,candidate.dataType);
  // Free-text rename changes the food and queues a fresh match; it is not a label edit.
  candidate={fdcId:9901432,description:'Changed record retention croissant',dataType:'SR Legacy'};
  assert.ifError((await editPostItem(db,post,owner,{action:'rename',item_id:item.id,name:candidate.description,portion_grams:100})).error);
  await recompute(db,await runJob('recompute'));
  item=await current();assert.equal(item.source_ref,String(candidate.fdcId));assert.equal(item.record_description,candidate.description);assert.equal(item.record_data_type,candidate.dataType);
  candidate={fdcId:9901433,description:'Blank type record retention croissant',dataType:''};
  assert.ifError((await editPostItem(db,post,owner,{action:'rename',item_id:item.id,name:candidate.description,portion_grams:100,fdc_selection:{id:candidate.fdcId,query:'unique blank type record edit croissant'}})).error);
  item=await current();assert.equal(item.source_ref,String(candidate.fdcId));assert.equal(item.record_description,null);assert.equal(item.record_data_type,null);assert.equal(details,0);
 }finally{globalThis.fetch=fetcher;if(storageKeys.size)checked(await db.storage.from('media').remove([...storageKeys]));for(const post of posts){checked(await db.from('saved_meals').delete().eq('source_post_id',post));checked(await db.from('posts').delete().eq('id',post));}for(const key of cacheKeys)checked(await db.from('fdc_cache').delete().eq('query',key));}
});
