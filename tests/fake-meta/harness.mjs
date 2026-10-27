// Real database fixtures, isolated claim adapter, and a network allowlist.
// The production claim RPC is covered separately by rollback SQL tests.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {listFixtureObjects} from './storage-cleanup.mjs';
import {startFakeMeta} from './server.mjs';
export async function pipelineHarness(){
 for(const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','TEST_USER_EMAIL','TEST_USER_PASSWORD'])assert.ok(process.env[key],`${key} is required`);
 // Validate client configuration before starting a server or changing globals.
 const supabaseOrigin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const user=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const originalFetch=globalThis.fetch;
 const previousEnv=Object.fromEntries(['MODEL_API_BASE_URL','MODEL_API_KEY','FDC_API_KEY'].map(key=>[key,process.env[key]]));
 const fake=await startFakeMeta();const allowed=new Set([new URL(fake.origin).origin,supabaseOrigin]);
 let ownerId;const created=[],paths=[],cacheInserted=[];const fixtureJobs=new Set();
 const cleanup=async()=>{
  const problems=[];
  try {
  if(ownerId)for(const id of created){
   try{for(const path of await listFixtureObjects(admin.storage.from('media'),`${ownerId}/${id}`))if(!paths.includes(path))paths.push(path);}
   catch{problems.push('fixture storage listing');}
  }
  assert.ok(paths.every(path=>created.some(id=>path.startsWith(`${ownerId}/${id}/`))),'Refusing storage cleanup outside fixture posts');

  for(let offset=0;offset<paths.length;offset+=1000){const {error}=await admin.storage.from('media').remove(paths.slice(offset,offset+1000));if(error)problems.push('fixture storage');}
  if(created.length){const {error}=await admin.from('posts').delete().in('id',created);if(error)problems.push('fixture posts');}
  if(cacheInserted.length){const {error}=await admin.from('fdc_cache').delete().in('query',cacheInserted);if(error)problems.push('fixture cache');}
  await user.auth.signOut().catch(()=>{});
  assert.deepEqual(problems,[],'Fixture cleanup failed');
  } finally {
   try { await fake.close(); } finally {
    globalThis.fetch=originalFetch;
    for(const [key,value]of Object.entries(previousEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
   }
  }
 };
 try{
  globalThis.fetch=(input,init)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);assert.ok(allowed.has(url.origin),`Unexpected network origin: ${url.origin}`);return originalFetch(input,init);};
  process.env.MODEL_API_BASE_URL=fake.baseURL;process.env.MODEL_API_KEY='offline-fixture-not-a-secret';delete process.env.FDC_API_KEY;
  const {data:auth,error:authError}=await user.auth.signInWithPassword({email:process.env.TEST_USER_EMAIL,password:process.env.TEST_USER_PASSWORD});assert.equal(authError,null,'Test account sign-in failed');ownerId=auth.user.id;
  const {error:viewError}=await admin.from('current_post_items').select('id').limit(0);assert.equal(viewError,null,'Pipeline requires item12 migration0007 visible through PostgREST');
  // These deliberately missing post IDs cannot write rows. Probe the RPCs
  // before seeding cache/post/media fixtures, with a precise migration failure.
  const missingPost=randomUUID();
  const {error:appendProbe}=await admin.rpc('append_post_comment',{p_post_id:missingPost,p_user_id:auth.user.id,p_text:''});
  assert.equal(appendProbe?.code,'42501','Pipeline requires item16 migration0007b append RPC visible through PostgREST');
  const {error:correctionProbe}=await admin.rpc('persist_correction',{p_post_id:missingPost,p_job_id:randomUUID(),p_expected:[],p_through:randomUUID(),p_items:[],p_reply:''});
  assert.equal(correctionProbe?.code,'42501','Pipeline requires item16 migration0007b persist RPC visible through PostgREST');
  const fdc=JSON.parse(await readFile(new URL('./fixtures/fdc.json',import.meta.url),'utf8'));
  for(const [query,response]of Object.entries(fdc)){
   const {data,error}=await admin.from('fdc_cache').select('query').eq('query',query).maybeSingle();assert.equal(error,null);
   if(!data){const {error:writeError}=await admin.from('fdc_cache').insert({query,response});if(writeError?.code!=='23505'){assert.equal(writeError,null);cacheInserted.push(query);}}
  }
  const scoped=new Proxy(admin,{get(target,property){
   if(property==='rpc')return async(name,args)=>{
    if(name!=='claim_job')return target.rpc(name,args);
    if(!fixtureJobs.size)return {data:null,error:null};
    const {data:rows,error}=await target.from('jobs').select('*').in('id',[...fixtureJobs]).eq('status','queued').order('priority').order('created_at').limit(1);
    if(error||!rows?.length)return {data:null,error};const row=rows[0];
    return target.from('jobs').update({status:'running',started_at:new Date().toISOString(),attempts:row.attempts+1}).eq('id',row.id).eq('status','queued').select('*').maybeSingle();
   };
   const value=Reflect.get(target,property);return typeof value==='function'?value.bind(target):value;
  }});
  const {drainOnce}=await import('../../src/lib/worker/drain.ts');
  const enqueue=async(postId,kind)=>{const id=randomUUID();const {error}=await admin.from('jobs').insert({id,post_id:postId,kind,status:'queued',run_after:'2099-01-01T00:00:00Z'});assert.equal(error,null);fixtureJobs.add(id);return id;};
  const post=async(photo=false)=>{
   const id=randomUUID();const {error}=await admin.from('posts').insert({id,user_id:auth.user.id,caption:'Offline pipeline fixture',status:'queued'});assert.equal(error,null);created.push(id);
   if(photo){const path=`${auth.user.id}/${id}/original.jpg`;const bytes=await readFile(new URL('../../scripts/fixtures/plate1.jpg',import.meta.url));const {error:uploadError}=await admin.storage.from('media').upload(path,bytes,{contentType:'image/jpeg'});assert.equal(uploadError,null);paths.push(path);
    const {error:mediaError}=await admin.from('post_media').insert({post_id:id,storage_path:path,position:0,width:1280,height:1327});assert.equal(mediaError,null);
   }
   return {id,jobId:await enqueue(id,'analyze')};
  };
  const drain=async()=>{const result=await drainOnce(scoped);
   // fail_job applies production backoff. Move only our fixture jobs into the
   // distant future before another production worker can claim a test retry.
   await admin.from('jobs').update({run_after:'2099-01-01T00:00:00Z'}).in('id',[...fixtureJobs]).eq('status','queued');
   for(const id of created){const {data:items}=await admin.from('post_items').select('mask_path').eq('post_id',id);for(const i of items??[])if(i.mask_path&&!paths.includes(i.mask_path))paths.push(i.mask_path);}
   return result;
  };
  return {admin,user,fake,post,enqueue,drain,cleanup,control:async(body)=>{const response=await fetch(`${fake.origin}/__control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,204);}};
 }catch(error){await cleanup();throw error;}
}
