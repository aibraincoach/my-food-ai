// node --import tsx --env-file=<disposable-local-env> --test tests/composer-drinks-route.test.mjs
// Built local app plus scripted Meta/storage fixture; no production endpoints.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};

test('composer identify enforces caps and ownership, caches one model call, and posts the chosen volume once',{timeout:90000},async()=>{
 for(const k of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL','MODEL_API_BASE_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[k]).hostname),`${k}: disposable local only`);
 const origin=process.env.APP_URL,model=process.env.MODEL_API_BASE_URL;
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {user}=await signInTestClient(1),cookie=await signInAsTestUser(1),other=await signInAsTestUser(2);
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString();
 const prior=checked(await db.from('user_call_hits').select('*').eq('user_id',user.id).eq('route','post').eq('hour',bucket));
 const stages=[];
 const request=(path,body,session=cookie)=>fetch(origin+path,{method:'POST',headers:{Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(body)});
 const cap=hits=>db.from('user_call_hits').upsert({user_id:user.id,route:'post',hour:bucket,hits},{onConflict:'user_id,route,hour'}).then(checked);
 const count=()=>fetch(model+'/__calls').then(r=>r.json()).then(rows=>rows.filter(row=>row.name==='identify').length);
 async function stage(){
  const id=randomUUID();stages.push(id);
  const response=await request('/api/posts',{operation_id:id,capture_intent:'photo',caption:'',eaten_at:new Date().toISOString(),shots:[{position:0,width:390,height:390}]});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));
  const bytes=await readFile(new URL('../eval/photos/01.jpg',import.meta.url));
  for(const upload of data.uploads)for(const url of [upload.originalSignedUrl,upload.feedSignedUrl]){const put=await fetch(url,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:bytes});assert.equal(put.status,200);}
  return id;
 }
 try{
  await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"mode":"water"}'});
  assert.equal((await request('/api/drinks/identify',{upload_id:randomUUID(),position:0},'')).status,401);
  await cap(0);const id=await stage();
  assert.equal((await request('/api/drinks/identify',{upload_id:id,position:0},other)).status,404);
  assert.equal(await count(),0);
  await cap(40);const denied=await request('/api/drinks/identify',{upload_id:id,position:0});assert.equal(denied.status,429);assert.ok(Number(denied.headers.get('Retry-After'))>=1);assert.equal(await count(),0);
  await cap(0);const response=await request('/api/drinks/identify',{upload_id:id,position:0});const reading=await response.json();assert.equal(response.status,200,JSON.stringify(reading));assert.equal(reading.allDrinks,true);assert.equal(reading.drinks[0].ml,300);assert.equal(await count(),1);
  const cached=await request('/api/drinks/identify',{upload_id:id,position:0});assert.equal(cached.status,200);assert.equal((await cached.json()).id,reading.id);assert.equal(await count(),1);
  const correction={reading_id:reading.id,index:0,correction:{name:'Water, glass',pack_amount:360,pack_unit:'ml',per_100:{calories:0,protein_g:0,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0}}};
  const patch=session=>fetch(origin+'/api/drinks/identify',{method:'PATCH',headers:{Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(correction)});
  assert.equal((await patch(other)).status,404);const corrected=await patch(cookie);assert.equal(corrected.status,200);assert.equal((await corrected.json()).drinks[0].ml,360);assert.equal(await count(),1);
  const body={upload_id:id,caption:'Water',save_as_meal:false,location:null,readings:[{reading_id:reading.id,selections:[{index:0,ml:150}]}]};
  assert.equal((await request('/api/drinks/post',body,other)).status,404);
  const post=await request('/api/drinks/post',body),posted=await post.json();assert.equal(post.status,201,JSON.stringify(posted));assert.equal(posted.post_id,id);
  assert.equal(checked(await db.from('posts').select('id,status').eq('id',id).single()).status,'ready');
  const items=checked(await db.from('current_post_items').select('id,portion_text').eq('post_id',id));assert.equal(items.length,1);assert.equal(items[0].portion_text,'150 ml');
  assert.equal(checked(await db.from('intake_logs').select('ml').eq('post_id',id).single()).ml,150);
  assert.equal(checked(await db.from('post_media').select('position').eq('post_id',id).eq('kind','photo').single()).position,0);
  const retry=await request('/api/drinks/post',body);assert.equal(retry.status,201);assert.equal((await retry.json()).post_id,id);assert.equal(checked(await db.from('current_post_items').select('id').eq('post_id',id)).length,1);
  assert.equal(await count(),1);
  await cap(0);const concurrentId=await stage();const before=await count();
  const changedManifestId=await stage();
  const simultaneous=await Promise.all([request('/api/drinks/identify',{upload_id:concurrentId,position:0}),request('/api/drinks/identify',{upload_id:changedManifestId,position:0})]);
  assert.ok(simultaneous.some(r=>r.status===200));assert.ok(simultaneous.every(r=>[200,409].includes(r.status)));assert.equal(await count(),before+1);
  const copied=await request('/api/drinks/identify',{upload_id:changedManifestId,position:0});assert.equal(copied.status,200);assert.equal(await count(),before+1);
 }finally{
  if(stages.length){checked(await db.from('posts').delete().in('id',stages));checked(await db.from('post_upload_drafts').delete().in('id',stages));
   const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:`delete from public.jobs where payload->>'deleted_post_id' in (${stages.map(id=>`'${id}'`).join(',')});delete from storage.objects where ${stages.map(id=>`name like '${user.id}/${id}/%'`).join(' or ')};`,encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
  checked(await db.from('user_call_hits').delete().eq('user_id',user.id).eq('route','post').eq('hour',bucket));if(prior.length)checked(await db.from('user_call_hits').insert(prior));
 }
});
