#!/usr/bin/env node
// G.3.10(a): real Meta, empty USDA transport, and an owned disposable reanalysis.
// node --env-file=<our local env> --import tsx scripts/run15-unavailable-stack.mjs \
//   --credentials=<private root .env.local> --out=uploads/run15/unavailable-stack.json
// Never target production: every database and storage destination must be loopback.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {parseEnv} from 'node:util';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';

const args=Object.fromEntries(process.argv.slice(2).map(arg=>{const i=arg.indexOf('=');if(!arg.startsWith('--')||i<0)throw Error('Use --name=value');return[arg.slice(2,i),arg.slice(i+1)];}));
const local=new Set(['127.0.0.1','localhost','[::1]']);
for(const key of ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_DB_URL'])assert.ok(local.has(new URL(process.env[key]).hostname),`Disposable loopback ${key} required`);
assert.equal(process.env.MFA_TEST_DISPOSABLE,'1','Disposable stack marker required');
assert.ok(args.credentials,'A private credentials file is required');
const privateEnv=parseEnv(await readFile(resolve(args.credentials),'utf8'));
assert.ok(privateEnv.MODEL_API_KEY,'Real Meta key is required');
process.env.MODEL_API_KEY=privateEnv.MODEL_API_KEY;
process.env.MODEL_API_BASE_URL=privateEnv.MODEL_API_BASE_URL||'https://api.meta.ai/v1';
const meta=new URL(process.env.MODEL_API_BASE_URL);
assert.equal(meta.protocol,'https:');assert.ok(!local.has(meta.hostname),'Real Meta endpoint required');
// Selectively import only Meta credentials. Local Supabase credentials remain local.
process.env.FDC_API_KEY='run15-empty-usda';
delete process.env.TEST_FDC_FIXTURE_URL;
const out=resolve(args.out||'uploads/run15/unavailable-stack.json');
const privateLedger=out.replace(/\.json$/, '')+'-private.json';
await mkdir(dirname(out),{recursive:true});
const checked=result=>{if(result.error)throw Error(result.error.message);return result.data;};
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const receipt={observedAt:new Date().toISOString(),scope:'disposable stack, real Meta, empty USDA transport',fixture:null,post:null,usdaRequests:0,metaRequests:0,cleanup:null};
const ledger={run:'run15-unavailable-stack',createdUser:null,createdPost:null,storagePaths:[],cleanup:null};
const save=()=>writeFile(privateLedger,JSON.stringify(ledger,null,2)+'\n',{mode:0o600});
const originalFetch=globalThis.fetch;
// Keep real application request/parser code; only USDA's transport is empty.
globalThis.fetch=async(input,init)=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 if(url.hostname==='api.nal.usda.gov'&&url.pathname.startsWith('/fdc/v1/')){receipt.usdaRequests++;return Response.json({foods:[]});}
 if(url.origin===meta.origin){receipt.metaRequests++;return originalFetch(input,init);}
 if(local.has(url.hostname))return originalFetch(input,init);
 throw Error('Unexpected external destination in disposable check');
};
async function ownedObjects(prefix){
 const paths=[];
 for(let offset=0;;offset+=1000){
  const rows=checked(await admin.storage.from('media').list(prefix,{limit:1000,offset}));
  for(const row of rows){const path=prefix+'/'+row.name;if(row.id)paths.push(path);else paths.push(...await ownedObjects(path));}
  if(rows.length<1000)return paths;
 }
}
let failure;
try{
 const fixtures=JSON.parse(await readFile(new URL('./fixtures/food-matching.json',import.meta.url),'utf8'));
 const fixture=fixtures.find(row=>row.unavailable===true);assert.equal(fixture.name,'ceramic plate');receipt.fixture=fixture;
 const userId=checked(await admin.auth.admin.createUser({email:`run15-unavailable-${randomUUID()}@fixture.invalid`,password:randomUUID()+randomUUID(),email_confirm:true})).user.id;
 ledger.createdUser=userId;await save();
 checked(await admin.from('profiles').upsert({id:userId,handle:`run15-unavailable-${userId.slice(0,8)}`}));
 const postId=randomUUID(),jobId=randomUUID();ledger.createdPost=postId;await save();
 checked(await admin.from('posts').insert({id:postId,user_id:userId,status:'processing',caption:fixture.caption}));
 // This is an existing unavailable meal, with a first summary to replace.
 checked(await admin.from('post_items').insert({post_id:postId,name:fixture.name,source:'model',portion_grams:50}));
 const initial=checked(await admin.from('post_comments').insert({post_id:postId,author:'model',body:'Old unavailable summary without a reason.'}).select('id').single());
 checked(await admin.from('jobs').insert({id:jobId,post_id:postId,kind:'analyze',status:'running',payload:{post_ownership:true}}));
 checked(await admin.from('posts').update({active_job_id:jobId,analysis_initialized_at:null}).eq('id',postId).eq('user_id',userId));
 // Avoid a stale local USDA cache turning an empty transport into nonempty results.
 // Scope the empty cache read to this process; no shared cache row is deleted.
 const pipelineAdmin=new Proxy(admin,{get(target,key){
  if(key==='from')return table=>{
   if(table==='fdc_cache')return{select(){return this},eq(){return this},abortSignal(){return this},async maybeSingle(){return{data:null,error:null}},async upsert(){return{data:null,error:null}}};
   return target.from(table);
  };
  const value=target[key];return typeof value==='function'?value.bind(target):value;
 }});
 const {persistAnalysis}=await import('../src/lib/pipeline/persist.ts');
 const {traceContext}=await import('../src/lib/trace/context.ts');
 const started=Date.now();
 await traceContext.run({postId,deadlineAt:Date.now()+270000},()=>persistAnalysis(pipelineAdmin,{postId,userId,photoWidth:0,photoHeight:0,regions:[],captionOnly:[{regionIndex:null,name:fixture.name,portionText:null,portionGrams:50,confidence:null}],summary:'Disposable ceramic plate reanalysis.',needsInput:null,hasNotEaten:true},undefined,jobId));
 const post=checked(await admin.from('posts').select('status').eq('id',postId).eq('user_id',userId).single());
 const items=checked(await admin.from('current_post_items').select('name,item_nutrition(source_ref,calories)').eq('post_id',postId));
 const first=checked(await admin.from('post_comments').select('id,body').eq('post_id',postId).eq('author','model').order('created_at').order('id').limit(1).single());
 const calls=checked(await admin.from('model_calls').select('kind,model,host,request_text,response_text,duration_ms,error').eq('post_id',postId).order('started_at'));
 receipt.post={idPrefix:postId.slice(0,8),status:post.status,elapsedMs:Date.now()-started,items,firstComment:first.body,sameFirstComment:first.id===initial.id,calls};
 assert.ok(items.some(item=>{const nutrition=Array.isArray(item.item_nutrition)?item.item_nutrition[0]:item.item_nutrition;return nutrition?.source_ref?.startsWith('unavailable:not_food:');}),'Durable not_food reason required');
 assert.ok(first.body.includes('did not treat “ceramic plate” as a food'),'The first comment must explain the unavailable item');
 assert.equal(first.id,initial.id,'Reanalysis must replace the existing first comment');
 assert.ok(receipt.usdaRequests>0&&receipt.metaRequests>0,'Both empty USDA transport and real Meta must run');
 receipt.passed=true;
}catch(error){failure=error;receipt.passed=false;receipt.failure={name:error.name,message:error.message};}
finally{
 try{
  if(ledger.createdPost&&ledger.createdUser){
   const post=checked(await admin.from('posts').select('user_id').eq('id',ledger.createdPost).maybeSingle());
   if(post)assert.equal(post.user_id,ledger.createdUser,'Cleanup owner must match our created account');
   const prefix=`${ledger.createdUser}/${ledger.createdPost}`;
   ledger.storagePaths=await ownedObjects(prefix);await save();
   if(ledger.storagePaths.length)checked(await admin.storage.from('media').remove(ledger.storagePaths));
   checked(await admin.from('posts').delete().eq('id',ledger.createdPost).eq('user_id',ledger.createdUser));
   assert.equal(checked(await admin.from('posts').select('id').eq('id',ledger.createdPost).maybeSingle()),null);
   assert.equal((await ownedObjects(prefix)).length,0);
  }
  if(ledger.createdUser)checked(await admin.auth.admin.deleteUser(ledger.createdUser));
  ledger.cleanup={verifiedAt:new Date().toISOString(),postAbsent:true,storageAbsent:true,userRemoved:Boolean(ledger.createdUser)};
  receipt.cleanup=ledger.cleanup;await save();
 }catch(error){failure??=error;receipt.cleanup={failed:true,message:error.message};}
 globalThis.fetch=originalFetch;
 await writeFile(out,JSON.stringify(receipt,null,2)+'\n');
}
console.log(JSON.stringify({out,passed:receipt.passed,cleanup:receipt.cleanup}));
if(failure)throw failure;
