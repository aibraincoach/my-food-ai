// node --import tsx --env-file=<disposable-local-env> --test tests/composer-drinks-route.test.mjs
// Built local app plus scripted Meta/storage fixture; no production endpoints.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {spawn,spawnSync} from 'node:child_process';
import {signInAsTestUser,signInTestClient} from '../scripts/lib/session.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(check){const end=Date.now()+8000;while(Date.now()<end){if(await check())return;await pause(25);}throw Error('Local RPC never reached the held draft lock');}
// Hold the same draft lock used by both RPCs, wait until the real HTTP route
// has read its expected revision and blocked in the RPC, then change the row.
// A deterministic 40001 would loop in PostgREST14; PT409 must return promptly.
async function staleReadingConflict(upload,reading,rpc,request){
 assert.ok(['publish_composer_drinks','correct_composer_drinks'].includes(rpc));
 const lock=spawn('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1']);
 let stdout='',stderr='';lock.stdout.on('data',b=>stdout+=b);lock.stderr.on('data',b=>stderr+=b);
 const closed=new Promise(resolve=>lock.once('exit',code=>resolve(code)));
 try{
  lock.stdin.write(`begin;
select pg_advisory_xact_lock(hashtextextended('${upload}',0));
select 'LOCKED';
`);
  await until(()=>stdout.includes('LOCKED'));
  const started=Date.now(),response=request();response.catch(()=>{});
  await until(()=>{const r=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:`select exists(select 1 from pg_stat_activity where pid<>pg_backend_pid() and wait_event='advisory' and query like '%${rpc}%');`,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim()==='t';});
  lock.stdin.end(`update public.composer_drink_readings set drinks=jsonb_set(drinks,'{0,name}',to_jsonb('Water, concurrent revision'::text)) where id='${reading}';commit;`);
  const result=await response;assert.equal(result.status,409,await result.text());
  assert.ok(Date.now()-started<5000,'stale business conflict must return promptly, not retry forever');
 }finally{
  if(!lock.stdin.writableEnded)lock.stdin.end('rollback;');
  const code=await closed;assert.equal(code,0,stderr);
 }
}


test('composer identify enforces caps and ownership, caches one model call, and posts the chosen volume once',{timeout:90000},async()=>{
 for(const k of ['APP_URL','NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL','MODEL_API_BASE_URL'])assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env[k]).hostname),`${k}: disposable local only`);
 const origin=process.env.APP_URL,model=process.env.MODEL_API_BASE_URL;
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}});
 const {user}=await signInTestClient(1),cookie=await signInAsTestUser(1),other=await signInAsTestUser(2);
 const hour=new Date();hour.setUTCMinutes(0,0,0);const bucket=hour.toISOString();
 const prior=checked(await db.from('user_call_hits').select('*').eq('user_id',user.id).in('route',['post','drink_identify']).eq('hour',bucket));
 const cacheQuery='fdc-search-v3:coca cola';
 const priorCache=checked(await db.from('fdc_cache').select('*').eq('query',cacheQuery));
 const stages=[];
 const request=(path,body,session=cookie)=>fetch(origin+path,{method:'POST',headers:{Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const cap=(hits,route='drink_identify')=>db.from('user_call_hits').upsert({user_id:user.id,route,hour:bucket,hits},{onConflict:'user_id,route,hour'}).then(checked);
 const count=()=>fetch(model+'/__calls').then(r=>r.json()).then(rows=>rows.filter(row=>row.name==='identify').length);
 const hits=async()=>checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route','drink_identify').eq('hour',bucket).single()).hits;
 async function stage(photo='01'){
  const id=randomUUID();stages.push(id);
  const response=await request('/api/posts',{operation_id:id,capture_intent:'photo',caption:'',eaten_at:new Date().toISOString(),shots:[{position:0,width:390,height:390}]});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));
  const bytes=await readFile(new URL(`../eval/photos/${photo}.jpg`,import.meta.url));
  for(const upload of data.uploads)for(const url of [upload.originalSignedUrl,upload.feedSignedUrl]){const put=await fetch(url,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:bytes});assert.equal(put.status,200);}
  return id;
 }
 try{
  await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"mode":"water"}'});
  assert.equal((await request('/api/drinks/identify',{upload_id:randomUUID(),position:0},'')).status,401);
  await cap(0);await cap(0,'post');const id=await stage();
  assert.equal((await request('/api/drinks/identify',{upload_id:id,position:0},other)).status,404);
  assert.equal(await count(),0);
  await cap(120);const denied=await request('/api/drinks/identify',{upload_id:id,position:0});assert.equal(denied.status,429);assert.ok(Number(denied.headers.get('Retry-After'))>=1);assert.equal(await count(),0);assert.deepEqual(checked(await db.from('composer_drink_readings').select('id').eq('upload_id',id)),[],'cap refusal releases the photo claim for a later retry');
  await cap(0);await cap(40,'post');const response=await request('/api/drinks/identify',{upload_id:id,position:0});const reading=await response.json();assert.equal(response.status,200,JSON.stringify(reading));assert.equal(reading.allDrinks,true);assert.equal(reading.drinks[0].ml,300);assert.equal(await count(),1);assert.equal(checked(await db.from('user_call_hits').select('hits').eq('user_id',user.id).eq('route','post').eq('hour',bucket).single()).hits,40,'identify does not spend the full post bucket');await cap(0,'post');
  assert.equal(await hits(),1,'one model call spends exactly one identify hit');
  await cap(120);
  const cached=await request('/api/drinks/identify',{upload_id:id,position:0});assert.equal(cached.status,200);assert.equal((await cached.json()).id,reading.id);assert.equal(await count(),1);assert.equal(await hits(),120,'a ready reading remains reusable at the cap without spending');
  for(const [state,status] of [['pending',409],['failed',502]]){
   checked(await db.from('composer_drink_readings').update({state}).eq('id',reading.id));
   const duplicate=await request('/api/drinks/identify',{upload_id:id,position:0});
   assert.equal(duplicate.status,status);assert.equal(await hits(),120,`${state} duplicate does not spend cap`);assert.equal(await count(),1);
  }
  checked(await db.from('composer_drink_readings').update({state:'ready'}).eq('id',reading.id));
  const reusedId=await stage();
  const reused=await request('/api/drinks/identify',{upload_id:reusedId,position:0});assert.equal(reused.status,200);assert.notEqual((await reused.json()).id,reading.id);assert.equal(await hits(),120,'same photo in a changed manifest reuses the reading without spending');assert.equal(await count(),1);
  checked(await db.from('post_upload_drafts').delete().eq('id',reusedId));
  await cap(1);
  const correction={reading_id:reading.id,index:0,correction:{name:'Water, glass',pack_amount:360,pack_unit:'ml',per_100:{calories:0.1,protein_g:null,carbs_g:0,fat_g:0,fibre_g:0,sugar_g:0,sodium_mg:0}}};
  const patch=session=>fetch(origin+'/api/drinks/identify',{method:'PATCH',headers:{Cookie:session,'Content-Type':'application/json'},body:JSON.stringify(correction),signal:AbortSignal.timeout(15000)});
  assert.equal((await patch(other)).status,404);const corrected=await patch(cookie);assert.equal(corrected.status,200);assert.equal((await corrected.json()).drinks[0].ml,360);assert.equal(await count(),1);
  const body={items:[{nutrition:{calories:999999}}],upload_id:id,caption:'Water',save_as_meal:false,location:null,readings:[{reading_id:reading.id,selections:[{index:0,ml:150}]}]};
  assert.equal((await request('/api/drinks/post',body,other)).status,404);
  await staleReadingConflict(id,reading.id,'correct_composer_drinks',()=>patch(cookie));
  assert.equal(checked(await db.from('composer_drink_readings').select('drinks').eq('id',reading.id).single()).drinks[0].name,'Water, concurrent revision');
  assert.equal((await patch(cookie)).status,200,'fresh correction can retry after conflict');
  await staleReadingConflict(id,reading.id,'publish_composer_drinks',()=>request('/api/drinks/post',body));
  assert.equal(checked(await db.from('post_upload_drafts').select('published').eq('id',id).single()).published,false);
  assert.deepEqual(checked(await db.from('posts').select('id').eq('id',id)),[],'conflict leaves no partial meal');
  assert.equal((await patch(cookie)).status,200,'reload/current reading remains correctable before publication');

  const post=await request('/api/drinks/post',body),posted=await post.json();assert.equal(post.status,201,JSON.stringify(posted));assert.equal(posted.post_id,id);
  assert.equal(checked(await db.from('posts').select('id,status').eq('id',id).single()).status,'ready');
  const items=checked(await db.from('current_post_items').select('id,portion_text').eq('post_id',id));assert.equal(items.length,1);assert.equal(items[0].portion_text,'150 ml');
  assert.equal(checked(await db.from('intake_logs').select('ml').eq('post_id',id).single()).ml,150);
  const nutrition=checked(await db.from('item_nutrition').select('calories').eq('post_item_id',items[0].id).single());assert.ok(Math.abs(Number(nutrition.calories)-0.15)<1e-9);const summary=checked(await db.from('post_comments').select('body').eq('post_id',id).eq('author','model').single()).body;assert.match(summary,/Consumed: <1 kcal/);assert.match(summary,/Nutrition unavailable: Water, glass/);
  assert.equal(checked(await db.from('post_media').select('position').eq('post_id',id).eq('kind','photo').single()).position,0);
  const retry=await request('/api/drinks/post',body);assert.equal(retry.status,201);assert.equal((await retry.json()).post_id,id);assert.equal(checked(await db.from('current_post_items').select('id').eq('post_id',id)).length,1);
  assert.equal(await count(),1);
  await cap(0);const concurrentId=await stage();const before=await count();
  const changedManifestId=await stage();
  const simultaneous=await Promise.all([request('/api/drinks/identify',{upload_id:concurrentId,position:0}),request('/api/drinks/identify',{upload_id:changedManifestId,position:0})]);
  assert.ok(simultaneous.some(r=>r.status===200));assert.ok(simultaneous.every(r=>[200,409].includes(r.status)));assert.equal(await count(),before+1);assert.equal(await hits(),1,'competing claims for one photo spend only for the model call');
  const copied=await request('/api/drinks/identify',{upload_id:changedManifestId,position:0});assert.equal(copied.status,200);assert.equal(await count(),before+1);assert.equal(await hits(),1,'retrying a competing claim reuses the result without spending');
  // A reference with caffeine but no convertible portion stays unknown; it
  // must never turn into the 32mg cola fallback or a guessed calorie number.
  checked(await db.from('fdc_cache').upsert({query:cacheQuery,response:{kind:'fdc-search-v3',query:'coca cola',payload:{foods:[{fdcId:990040,description:'Beverages, carbonated, cola, regular',foodCategory:'Soft drinks',dataType:'SR Legacy',foodNutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:42},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:0},{nutrientId:1004,nutrientName:'Fat',unitName:'G',value:0},{nutrientId:1005,nutrientName:'Carbohydrate',unitName:'G',value:10},{nutrientId:1057,nutrientName:'Caffeine',unitName:'MG',value:9}]}]}}},{onConflict:'query'}));
  await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"mode":"cola"}'});
  const colaStage=await stage('03'),colaResponse=await request('/api/drinks/identify',{upload_id:colaStage,position:0}),cola=await colaResponse.json();assert.equal(colaResponse.status,200,JSON.stringify(cola));assert.ok(Math.abs(cola.drinks[0].caffeineMg-29.7)<1e-9);
  const half=await request('/api/drinks/post',{upload_id:colaStage,caption:'Half a cola',save_as_meal:false,location:null,readings:[{reading_id:cola.id,selections:[{index:0,ml:165}]}]});assert.equal(half.status,201,JSON.stringify(await half.json()));
  const halfItem=checked(await db.from('current_post_items').select('id,portion_text').eq('post_id',colaStage).single());assert.equal(halfItem.portion_text,'165 ml');const halfNutrition=checked(await db.from('item_nutrition').select('calories,micronutrients').eq('post_item_id',halfItem.id).single());assert.ok(Math.abs(Number(halfNutrition.calories)-69.3)<1e-9);assert.ok(Math.abs(halfNutrition.micronutrients.find(n=>n.nutrientId===1057).value-14.85)<1e-9);assert.equal(checked(await db.from('intake_logs').select('amount').eq('post_id',colaStage).single()).amount,15);
  await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"mode":"cola-unknown"}'});
  const unknownStage=await stage('02'),unknown=await request('/api/drinks/identify',{upload_id:unknownStage,position:0}),unknownReading=await unknown.json();assert.equal(unknown.status,200,JSON.stringify(unknownReading));assert.equal(unknownReading.drinks[0].caffeineMg,null);assert.equal(unknownReading.drinks[0].kcal,null);assert.equal(unknownReading.drinks[0].nutrition.micronutrients.find(n=>n.nutrientId===1057).value,null);assert.equal(await count(),1);

 }finally{
  if(stages.length){checked(await db.from('posts').delete().in('id',stages));checked(await db.from('post_upload_drafts').delete().in('id',stages));
   const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL,'-v','ON_ERROR_STOP=1'],{input:`delete from public.jobs where payload->>'deleted_post_id' in (${stages.map(id=>`'${id}'`).join(',')});delete from storage.objects where ${stages.map(id=>`name like '${user.id}/${id}/%'`).join(' or ')};`,encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
  checked(await db.from('fdc_cache').delete().eq('query',cacheQuery));if(priorCache.length)checked(await db.from('fdc_cache').insert(priorCache));
  checked(await db.from('user_call_hits').delete().eq('user_id',user.id).in('route',['post','drink_identify']).eq('hour',bucket));if(prior.length)checked(await db.from('user_call_hits').insert(prior));
 }
});
