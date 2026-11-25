// Disposable native HTTP proof: named zones are checked before any publication.
import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';import {createClient}from'@supabase/supabase-js';import{signInAsTestUser,signInTestClient}from'../scripts/lib/session.mjs';
test('all six capture routes refuse offsets and non-names without writes; accepted tile posts have a stored canonical zone',{skip:!process.env.APP_URL},async()=>{
 for(const key of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL'])assert.equal(new URL(process.env[key]).hostname,'127.0.0.1');
 const origin=process.env.APP_URL,admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),cookie=await signInAsTestUser(),{user,client}=await signInTestClient(1),posts=[],ops=[];
 const checked=r=>{assert.ifError(r.error);return r.data;},tables=['posts','post_upload_drafts','food_post_operations','drink_post_operations','copy_post_operations','intake_logs','post_media','user_call_hits'];
 const counts=async()=>{const result=Object.fromEntries(await Promise.all(tables.map(async table=>{const r=await admin.from(table).select('*',{count:'exact',head:true});assert.ifError(r.error);return[table,r.count];})));result.capHits=checked(await admin.from('user_call_hits').select('hits')).reduce((sum,row)=>sum+row.hits,0);return result;};
 const send=(path,body)=>fetch(origin+path,{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(body)}),id=randomUUID(),when=new Date().toISOString();
 const cases=[['/api/intake/post',{tile:0}],['/api/posts',{caption:'Zone test',capture_intent:'photo',shots:[{position:0,width:10,height:10}]}],['/api/posts/food',{fdc_id:123,query:'croissant'}],['/api/drinks/post',{upload_id:id,caption:'Zone test',save_as_meal:false,readings:[{reading_id:id,selections:[{index:0,ml:150}]}]}],[`/api/posts/${id}/log-again`,{}],[`/api/saved/${id}/log`,{}]];
 try{
  for(const[path,fields]of cases)for(const zone of ['+01:00','-0530','GMT+1','EST','CET','',null,123,'Not/AZone']){
   const before=await counts(),r=await send(path,{operation_id:randomUUID(),owner_id:user.id,eaten_at:when,...fields,time_zone:zone});assert.equal(r.status,400,path+' zone '+JSON.stringify(zone));assert.equal((await r.json()).message_code,'captureZoneRequired');assert.deepEqual(await counts(),before,'invalid zone cannot publish, reserve or spend credit');
  }
  for(const zone of ['UTC','utc','Asia/Tokyo','asia/tokyo','Asia/Kolkata']){
   const operation_id=randomUUID();ops.push(operation_id);const r=await send('/api/intake/post',{operation_id,owner_id:user.id,eaten_at:when,tile:0,time_zone:zone}),body=await r.json();if(body.post_id)posts.push(body.post_id);assert.equal(r.status,201,JSON.stringify(body));
   const row=checked(await admin.from('posts').select('render_time_zone').eq('id',body.post_id).single());assert.equal(row.render_time_zone,new Intl.DateTimeFormat('en',{timeZone:zone}).resolvedOptions().timeZone);assert.notEqual(row.render_time_zone,null,'successful publication must store its capture zone');
   const replay=await send('/api/intake/post',{operation_id,owner_id:user.id,eaten_at:when,tile:0,time_zone:'America/Edmonton'});assert.equal(replay.status,409,'a different zone cannot overwrite the first zone');assert.equal(checked(await admin.from('posts').select('render_time_zone').eq('id',body.post_id).single()).render_time_zone,row.render_time_zone);
  }
 }finally{if(ops.length)checked(await admin.from('drink_post_operations').delete().in('operation_id',ops));if(posts.length)checked(await admin.from('jobs').delete().in('post_id',posts));if(posts.length)checked(await admin.from('posts').delete().in('id',posts));await client.auth.signOut({scope:'local'});}
});
