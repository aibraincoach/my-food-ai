import test from 'node:test';import assert from 'node:assert/strict';import{randomUUID}from'node:crypto';import{readFile}from'node:fs/promises';import{createClient}from'@supabase/supabase-js';import{signInAsTestUser,signInTestClient}from'../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
test('actual food HTTP publishing keeps Auth/caps, resolves nutrition and retries one committed operation',{timeout:90000},async()=>{
 for(const key of['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[key]).hostname),'Disposable local only');
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(1),{user:other}=await signInTestClient(2),cookie=await signInAsTestUser(1),otherCookie=await signInAsTestUser(2),origin=process.env.APP_URL;
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString(),owners=[user.id,other.id],operations=[],posts=[],readings=[],paths=[];
 const capPrior=checked(await admin.from('user_call_hits').select('*').in('user_id',owners).eq('route','post').eq('hour',bucket));
 const query='croissant',cacheKey='fdc-search-v3:'+query,cachePrior=checked(await admin.from('fdc_cache').select('*').eq('query',cacheKey));
 const food={fdcId:990043,description:'Croissant fixture',foodCategory:'Baked Products',dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:406},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:8}]};
 const labelGtin='00016000275683',correctionPrior=checked(await admin.from('barcode_corrections').select('*').eq('gtin',labelGtin).eq('user_id',user.id));
 const request=(body,auth=cookie)=>fetch(origin+'/api/posts/food',{method:'POST',headers:{Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const cancel=(body,auth=cookie)=>fetch(origin+'/api/posts/food',{method:'DELETE',headers:{Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const base=()=>({operation_id:randomUUID(),owner_id:user.id,fdc_id:food.fdcId,query,eaten_at:new Date().toISOString()});
 try{
  checked(await admin.from('fdc_cache').upsert({query:cacheKey,response:{kind:'fdc-search-v3',query,payload:{foods:[food]}}},{onConflict:'query'}));
  for(const id of owners)checked(await admin.from('user_call_hits').upsert({user_id:id,route:'post',hour:bucket,hits:0},{onConflict:'user_id,route,hour'}));
  assert.equal((await request(base(),'')).status,401);
  const capped=base();operations.push(capped.operation_id);checked(await admin.from('user_call_hits').upsert({user_id:user.id,route:'post',hour:bucket,hits:40},{onConflict:'user_id,route,hour'}));assert.equal((await request(capped)).status,429);assert.equal(checked(await admin.from('food_post_operations').select('operation_id').eq('operation_id',capped.operation_id)).length,0);
  checked(await admin.from('user_call_hits').update({hits:0}).eq('user_id',user.id).eq('route','post').eq('hour',bucket));
  const body=base();operations.push(body.operation_id);
  assert.equal((await request({...body,nutrition:{calories:999999}})).status,400);
  assert.equal((await request(body,otherCookie)).status,404,'queued original owner cannot post under a new sign-in');
  const responses=await Promise.all(Array.from({length:3},()=>request(body))),results=await Promise.all(responses.map(r=>r.json()));assert.ok(responses.every(r=>r.status===201),JSON.stringify(results));assert.equal(new Set(results.map(r=>r.post_id)).size,1);const id=results[0].post_id;posts.push(id);
  assert.equal(checked(await admin.from('posts').select('status,user_id').eq('id',id).single()).status,'ready');
  const items=checked(await admin.from('current_post_items').select('id').eq('post_id',id));assert.equal(items.length,1);assert.equal(Number(checked(await admin.from('item_nutrition').select('calories').eq('post_item_id',items[0].id).single()).calories),406);
  // Ignore the successful first response as a dropped-response client would;
  // retry must replay its receipt rather than re-resolving changed FDC data.
  checked(await admin.from('fdc_cache').delete().eq('query',cacheKey));
  const replay=await request(body);assert.equal(replay.status,201);assert.equal((await replay.json()).post_id,id);assert.equal(checked(await admin.from('current_post_items').select('id').eq('post_id',id)).length,1);
  const foreign={...body};delete foreign.owner_id;assert.equal((await request(foreign,otherCookie)).status,404);
  assert.equal((await request({...body,fdc_id:990044})).status,409);
  checked(await admin.from('posts').delete().eq('id',id).eq('user_id',user.id));assert.equal((await request(body)).status,410);
  checked(await admin.from('fdc_cache').upsert({query:cacheKey,response:{kind:'fdc-search-v3',query,payload:{foods:[food]}}},{onConflict:'query'}));
  const cancelled=base();operations.push(cancelled.operation_id);
  assert.equal((await cancel(cancelled,otherCookie)).status,404);
  assert.equal((await cancel(cancelled)).status,200);
  assert.equal((await request(cancelled)).status,410);
  const racing=base();operations.push(racing.operation_id);
  const [publishRace,cancelRace]=await Promise.all([request(racing),cancel(racing)]);
  assert.ok([201,410].includes(publishRace.status));assert.equal(cancelRace.status,200);
  const receipt=checked(await admin.from('food_post_operations').select('post_id,cancelled').eq('operation_id',racing.operation_id).single());assert.equal(receipt.cancelled,true);
  if(receipt.post_id){posts.push(receipt.post_id);assert.ok(checked(await admin.from('posts').select('deleted_at').eq('id',receipt.post_id).single()).deleted_at);}
  assert.equal((await request(racing)).status,410);

  const source=randomUUID(),path=user.id+'/'+source+'/0.jpg',feed=path.replace('.jpg','.feed.jpg');paths.push(path,feed);
  const bytes=await readFile(new URL('../eval/photos/01.jpg',import.meta.url));for(const object of paths)checked(await admin.storage.from('media').upload(object,bytes,{contentType:'image/jpeg'}));
  const reading=checked(await admin.from('label_readings').insert({user_id:user.id,photo_path:path,reading:{is_label:true,serving:{amount:30,unit:'g'},per_serving:{kcal:120,protein_g:3,carbs_g:20,fat_g:3,fibre_g:1,sugar_g:5,sodium_mg:100},product_name:'Scripted stored label',box:null}}).select('id').single());readings.push(reading.id);
  const label={operation_id:randomUUID(),owner_id:user.id,label_reading_id:reading.id,servings:0.5,name:'Verified cereal',gtin:labelGtin,eaten_at:new Date().toISOString(),photo:{path,width:390,height:390}};operations.push(label.operation_id);
  assert.equal((await request({...label,owner_id:other.id},otherCookie)).status,404,'stored label remains owner-scoped');
  assert.equal((await request({...label,nutrition:{calories:999999}})).status,400);
  const labelResponse=await request(label),labelPost=await labelResponse.json();assert.equal(labelResponse.status,201,JSON.stringify(labelPost));posts.push(labelPost.post_id);
  const labelItem=checked(await admin.from('current_post_items').select('id,portion_grams').eq('post_id',labelPost.post_id).single());assert.equal(Number(labelItem.portion_grams),15);
  const labelNutrition=checked(await admin.from('item_nutrition').select('calories,source_ref').eq('post_item_id',labelItem.id).single());assert.equal(Number(labelNutrition.calories),60);assert.equal(labelNutrition.source_ref,'label:'+reading.id);
  const savedCorrection=checked(await admin.from('barcode_corrections').select('per_100,source,serving_amount').eq('user_id',user.id).eq('gtin',labelGtin).single());assert.equal(Number(savedCorrection.per_100.calories),400);assert.equal(savedCorrection.source,'label');assert.equal(Number(savedCorrection.serving_amount),30);
  checked(await admin.from('barcode_corrections').update({name:'Newer explicit correction'}).eq('user_id',user.id).eq('gtin',labelGtin));const labelRetry=await request(label);assert.equal(labelRetry.status,201);assert.equal((await labelRetry.json()).post_id,labelPost.post_id);assert.equal(checked(await admin.from('barcode_corrections').select('name').eq('user_id',user.id).eq('gtin',labelGtin).single()).name,'Newer explicit correction','replay cannot overwrite a subsequent correction');
 }finally{
  if(readings.length)checked(await admin.from('label_readings').delete().eq('user_id',user.id).in('id',readings));
  if(paths.length)checked(await admin.storage.from('media').remove(paths));
  checked(await admin.from('barcode_corrections').delete().eq('user_id',user.id).eq('gtin',labelGtin));if(correctionPrior.length)checked(await admin.from('barcode_corrections').upsert(correctionPrior,{onConflict:'gtin,user_id'}));
  if(posts.length)checked(await admin.from('posts').delete().eq('user_id',user.id).in('id',posts));
  if(operations.length)checked(await admin.from('food_post_operations').delete().in('user_id',owners).in('operation_id',operations));
  checked(await admin.from('fdc_cache').delete().eq('query',cacheKey));if(cachePrior.length)checked(await admin.from('fdc_cache').upsert(cachePrior,{onConflict:'query'}));
  checked(await admin.from('user_call_hits').delete().in('user_id',owners).eq('route','post').eq('hour',bucket));if(capPrior.length)checked(await admin.from('user_call_hits').upsert(capPrior,{onConflict:'user_id,route,hour'}));
 }
});
