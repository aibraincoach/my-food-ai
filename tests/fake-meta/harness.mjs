import {scopedFixtureClaims} from './scoped-claims.mjs';
// Real database fixtures, isolated claim adapter, and a network allowlist.
// The production claim RPC is covered separately by rollback SQL tests.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {listFixtureObjects} from './storage-cleanup.mjs';
import {startFakeMeta} from './server.mjs';
export async function pipelineHarness(){
 // This harness takes the global worker lease of the shared database for the whole run, which stops every
 // deployed worker. It refuses to start unless that is explicitly accepted, and releases the lease in finally.
 if(process.env.ALLOW_SHARED_DB_TESTS!=='1')throw new Error('Refusing to run: this harness holds the global worker lease of the shared database and pauses live workers. Set ALLOW_SHARED_DB_TESTS=1 to run it (never during a demo).');
 for(const key of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','TEST_USER_EMAIL','TEST_USER_PASSWORD'])assert.ok(process.env[key],`${key} is required`);
 // Validate client configuration before starting a server or changing globals.
 const supabaseOrigin=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
 const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const user=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const originalFetch=globalThis.fetch;
 const previousEnv=Object.fromEntries(['MODEL_API_BASE_URL','MODEL_API_KEY','FDC_API_KEY'].map(key=>[key,process.env[key]]));
 const fake=await startFakeMeta();const allowed=new Set([new URL(fake.origin).origin,supabaseOrigin]);
 let ownerId,leaseHolder=null;const created=[],paths=[],cacheInserted=[];const fixtureJobs=new Set();
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
  if(leaseHolder){const {error}=await admin.rpc('release_worker_lease',{p_holder:leaseHolder});if(error)problems.push('worker lease');}
  await user.auth.signOut({scope:'local'}).catch(()=>{});
  assert.deepEqual(problems,[],'Fixture cleanup failed');
  } finally {
   try { await fake.close(); } finally {
    globalThis.fetch=originalFetch;
    for(const [key,value]of Object.entries(previousEnv)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
   }
  }
 };
 try{
  globalThis.fetch=(input,init)=>{const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(url.protocol==='data:')return originalFetch(input,init); // inline data (the card renderer's fonts and images) never leaves the process
  assert.ok(allowed.has(url.origin),`Unexpected network origin: ${url.origin}`);return originalFetch(input,init);};
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
  const {error:ownershipProbe}=await admin.rpc('post_work_matches',{p_post_id:missingPost,p_job_id:null});
  assert.equal(ownershipProbe,null,'Pipeline requires execution-ownership migration0007b visible through PostgREST');
  // Hold the global worker lease for the whole run. Production workers only claim jobs while they
  // hold it, so a requeued fixture job is never claimable by them, whatever its run_after says.
  const holder=`fixture-${randomUUID()}`;
  for(let waited=0;;waited+=2000){
   const {data:got,error:leaseError}=await admin.rpc('try_acquire_worker_lease',{p_holder:holder,ttl_seconds:900});
   assert.equal(leaseError,null);
   if(got){leaseHolder=holder;break;}
   assert.ok(waited<60000,'The worker lease stayed held by another worker; refusing to run fixtures beside a live worker');
   await new Promise(resolve=>setTimeout(resolve,2000));
  }
  const fdc=JSON.parse(await readFile(new URL('./fixtures/fdc.json',import.meta.url),'utf8'));
  for(const [query,response]of Object.entries(fdc)){
   const {data,error}=await admin.from('fdc_cache').select('query').eq('query',query).maybeSingle();assert.equal(error,null);
   if(!data){const {error:writeError}=await admin.from('fdc_cache').insert({query,response});if(writeError?.code!=='23505'){assert.equal(writeError,null);cacheInserted.push(query);}}
  }
  const scoped=scopedFixtureClaims(admin,fixtureJobs,created);
  const {drainOnce}=await import('../../src/lib/worker/drain.ts');
  const enqueue=async(postId,kind)=>{assert.ok(created.includes(postId),'Only fixture posts can be enqueued');const id=randomUUID();const {error}=await admin.from('jobs').insert({id,post_id:postId,kind,status:'queued',run_after:'2099-01-01T00:00:00Z'});assert.equal(error,null);fixtureJobs.add(id);return id;};
  const post=async(photo=false)=>{
   const id=randomUUID();const {error}=await admin.from('posts').insert({id,user_id:auth.user.id,caption:'Offline pipeline fixture',status:'queued'});assert.equal(error,null);created.push(id);
   if(photo){const path=`${auth.user.id}/${id}/0.jpg`;const bytes=await readFile(new URL('../../scripts/fixtures/plate1.jpg',import.meta.url));const {error:uploadError}=await admin.storage.from('media').upload(path,bytes,{contentType:'image/jpeg'});assert.equal(uploadError,null);paths.push(path);
    const {error:mediaError}=await admin.from('post_media').insert({post_id:id,storage_path:path,position:0,width:1280,height:1327});assert.equal(mediaError,null);
   }
   return {id,jobId:await enqueue(id,'analyze')};
  };
  const drain=async()=>{
   let result,failure;
   try{result=await drainOnce(scoped);}catch(error){failure=error;}
   // fail_job applies production backoff (30 s for a first retry). Move only our fixture jobs into the
   // distant future before another production worker can claim a test retry. This also runs when the
   // drain threw, is retried, and a failed restore is an error rather than silently ignored.
   let restored=false;
   for(let attempt=0;attempt<3&&!restored;attempt++){
    const {error}=await admin.from('jobs').update({run_after:'2099-01-01T00:00:00Z'}).in('id',[...fixtureJobs]).eq('status','queued');
    restored=!error;
   }
   if(!restored)throw new Error('Could not restore fixture job isolation.');
   if(failure)throw failure;
   for(const id of created){const {data:items}=await admin.from('post_items').select('mask_path').eq('post_id',id);for(const i of items??[])if(i.mask_path&&!paths.includes(i.mask_path))paths.push(i.mask_path);}
   return result;
  };
  // A job the app's own RPC queued for a fixture post joins the fixture set and is parked like the others.
  const adopt=async(jobId)=>{const {data,error}=await admin.from('jobs').update({run_after:'2099-01-01T00:00:00Z'}).eq('id',jobId).in('post_id',created).select('id').single();assert.equal(error,null);assert.ok(data,'Only jobs of fixture posts can be adopted');fixtureJobs.add(jobId);};
  return {admin,user,fake,post,enqueue,adopt,drain,cleanup,control:async(body)=>{const response=await fetch(`${fake.origin}/__control`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(response.status,204);}};
 }catch(error){await cleanup();throw error;}
}
