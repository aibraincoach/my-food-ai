import test from 'node:test';import assert from 'node:assert/strict';import{randomUUID}from'node:crypto';import{createClient}from'@supabase/supabase-js';import{signInAsTestUser,signInTestClient}from'../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
test('actual food HTTP publishing keeps Auth/caps, resolves nutrition and retries one committed operation',{timeout:90000},async()=>{
 for(const key of['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[key]).hostname),'Disposable local only');
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),{user}=await signInTestClient(1),{user:other}=await signInTestClient(2),cookie=await signInAsTestUser(1),otherCookie=await signInAsTestUser(2),origin=process.env.APP_URL;
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString(),owners=[user.id,other.id],operations=[],posts=[];
 const capPrior=checked(await admin.from('user_call_hits').select('*').in('user_id',owners).eq('route','post').eq('hour',bucket));
 const query='croissant',cacheKey='fdc-search-v3:'+query,cachePrior=checked(await admin.from('fdc_cache').select('*').eq('query',cacheKey));
 const food={fdcId:990043,description:'Croissant fixture',foodCategory:'Baked Products',dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:406},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:8}]};
 const request=(body,auth=cookie)=>fetch(origin+'/api/posts/food',{method:'POST',headers:{Cookie:auth,'Content-Type':'application/json'},body:JSON.stringify(body)});
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
 }finally{
  if(posts.length)checked(await admin.from('posts').delete().eq('user_id',user.id).in('id',posts));
  if(operations.length)checked(await admin.from('food_post_operations').delete().in('user_id',owners).in('operation_id',operations));
  checked(await admin.from('fdc_cache').delete().eq('query',cacheKey));if(cachePrior.length)checked(await admin.from('fdc_cache').upsert(cachePrior,{onConflict:'query'}));
  checked(await admin.from('user_call_hits').delete().in('user_id',owners).eq('route','post').eq('hour',bucket));if(capPrior.length)checked(await admin.from('user_call_hits').upsert(capPrior,{onConflict:'user_id,route,hour'}));
 }
});
