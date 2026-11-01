import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolvePortionNutrition} from '../src/lib/nutrition/portion.ts';
import {PackPhotoUpload} from '../src/lib/media/pack-photo-upload.ts';
import {queueStagedPhotoCleanup} from '../src/lib/media/staged-photo.ts';
import {createRequire} from 'node:module';
const cleanup=createRequire(import.meta.url)('../src/lib/worker/jobs/media_cleanup.ts').default;

const nutrient={post_item_id:'original',calories:150,protein_g:5,carbs_g:20,fat_g:6,fibre_g:1,sugar_g:8,sodium_mg:30,source_ref:'77',micronutrients:[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:150,basis:'portion'}]};
test('volume servings recompute preserves selected nutrition through pending revisions without FDC',async()=>{
 const items={pending:{name:'Oat drink',portion_grams:null,portion_text:'375 ml',supersedes:'original'},original:{name:'Oat drink',portion_grams:null,portion_text:'250 ml',supersedes:null}};
 const admin={from(table){assert.ok(['post_items','item_nutrition'].includes(table),'must not query FDC');let id;const q={select(){return q},eq(key,value){if(key!=='post_id')id=value;return q},async maybeSingle(){return{data:table==='post_items'?items[id]:id==='original'?nutrient:null,error:null}}};return q}};
 const n=await resolvePortionNutrition(admin,'post','pending','Oat drink',null,'500 ml');
 assert.equal(n.calories,300);assert.equal(n.protein_g,10);assert.equal(n.source_ref,'77');assert.equal(n.micronutrients[0].value,300);
});

test('failed save retry reuses uploaded photo; a partial upload retries only its unfinished PUT',async()=>{
 const calls=[];let fail=true;
 const request=async(url,options)=>{calls.push([url,options.method]);if(options.method==='POST')return Response.json({uploads:[{originalPath:'stage/0.jpg',originalSignedUrl:'original',feedSignedUrl:'feed'}]});if(url==='feed'&&fail){fail=false;return new Response('',{status:503})}return new Response('')};
 const uploader=new PackPhotoUpload(async()=>({original:new Blob(['original']),feed:new Blob(['feed']),width:100,height:100}),request);
 const file=new File(['photo'],'pack.jpg');
 await assert.rejects(uploader.prepare(file),/could not be uploaded/);
 const photo=await uploader.prepare(file);assert.equal(photo.path,'stage/0.jpg');
 // Product save can fail or lose its response: preparing again changes no storage.
 assert.deepEqual(await uploader.prepare(file),photo);
 assert.deepEqual(calls,[['/api/media/sign-upload','POST'],['original','PUT'],['feed','PUT'],['feed','PUT']]);
});

test('lost PUT responses reconcile stored bytes instead of re-uploading or orphaning another stage',async()=>{
 const stored=new Map(),calls=[];
 const uploader=new PackPhotoUpload(async()=>({original:new Blob(['x']),feed:new Blob(['y']),width:1,height:1}),async(url,options)=>{
 calls.push([url,options.method]);if(options.method==='POST')return Response.json({uploads:[{originalPath:'stage/0.jpg',feedPath:'stage/0.feed.jpg',originalSignedUrl:'original',feedSignedUrl:'feed'}]});stored.set(url==='original'?'stage/0.jpg':'stage/0.feed.jpg',await options.body.text());throw new Error('response lost');
 },Date.now,async(path,blob)=>stored.get(path)===await blob.text());
 const file=new File(['photo'],'pack.jpg');assert.equal((await uploader.prepare(file)).path,'stage/0.jpg');await uploader.prepare(file);
 assert.deepEqual(calls,[['/api/media/sign-upload','POST'],['original','PUT'],['feed','PUT']]);
});

test('expired partial and completed stages renew before upload and cleanup expiry',async()=>{
 let now=0,signs=0;const uploader=new PackPhotoUpload(async()=>({original:new Blob(['x']),feed:new Blob(['y']),width:1,height:1}),async(url,options)=>options.method==='POST'?Response.json({uploads:[{originalPath:`stage${++signs}/0.jpg`,originalSignedUrl:'original',feedSignedUrl:'feed'}]}):new Response(''),()=>now);
 const file=new File(['photo'],'pack.jpg');assert.equal((await uploader.prepare(file)).path,'stage1/0.jpg');
 now=111*60*1000;assert.equal((await uploader.prepare(file)).path,'stage2/0.jpg');assert.equal(signs,2);
 now=4*60*60*1000;assert.equal((await uploader.prepare(file)).path,'stage3/0.jpg');assert.equal(signs,3);
});

test('a cleanup record is durable before upload, delayed past capability expiry, and scheduling failure is fatal',async()=>{
 let row;const before=Date.now();
 await queueStagedPhotoCleanup({from(table){assert.equal(table,'jobs');return{async insert(value){row=value;return{error:null}}}}},'owner','stage');
 assert.equal(row.post_id,null);assert.equal(row.kind,'media_cleanup');assert.deepEqual(row.payload.paths,['owner/stage/0.jpg','owner/stage/0.feed.jpg']);
 assert.ok(Date.parse(row.run_after)>=before+3*60*60*1000);
 await assert.rejects(queueStagedPhotoCleanup({from(){return{async insert(){return{error:{message:'offline'}}}}}},'owner','stage'),/could not be scheduled/);
});

test('orphan cleanup removes both copies and only an unpublished owner draft; committed stages bypass every deletion',async()=>{
 const owner='00000000-0000-0000-0000-000000000001',stage='00000000-0000-0000-0000-000000000002';
 const paths=[`${owner}/${stage}/0.jpg`,`${owner}/${stage}/0.feed.jpg`],removed=[],deletions=[];let listings=0;
 const job={post_id:null,payload:{owner_id:owner,deleted_post_id:stage,paths}};
 const admin=claimed=>({from(table){
  if(table==='post_media')return{select(){return this},like(column,prefix){assert.equal(column,'storage_path');assert.equal(prefix,`${owner}/${stage}/%`);return this},async limit(){return{data:claimed?[{id:'media'}]:[],error:null}}};
  assert.equal(table,'post_upload_drafts');assert.equal(claimed,false,'a committed stage must never delete its manifest');
  const predicates={};return{delete(){return this},eq(key,value){predicates[key]=value;return this},then(resolve){deletions.push({...predicates});return Promise.resolve({error:null}).then(resolve)}};
 },storage:{from(){return{async list(directory){assert.equal(claimed,false);assert.equal(directory,`${owner}/${stage}`);listings++;return{data:[],error:null}},async remove(values){removed.push(...values);return{error:null}}}}}});
 await cleanup(admin(true),job);assert.deepEqual(removed,[]);assert.deepEqual(deletions,[]);assert.equal(listings,0);
 await cleanup(admin(false),job);assert.deepEqual(removed,paths);assert.deepEqual(deletions,[{id:stage,user_id:owner,published:false}]);assert.equal(listings,1);
});

test('attachment cleanup removes only reserved unclaimed copies and preserves an attached photo without scanning the meal',async()=>{
 const owner='00000000-0000-0000-0000-000000000001',post='00000000-0000-0000-0000-000000000002',attachment='00000000-0000-0000-0000-000000000003';
 const paths=[`${owner}/${post}/1.jpg`,`${owner}/${post}/1.feed.jpg`],removed=[];
 const job={id:'cleanup',post_id:null,payload:{owner_id:owner,deleted_post_id:post,attachment_id:attachment,exact:true,paths}};
 const admin=claimed=>({from(table){const predicates={};return{
  select(){return this},eq(key,value){predicates[key]=value;return this},async maybeSingle(){assert.equal(table,'post_photo_attachments');assert.deepEqual(predicates,{id:attachment,post_id:post,user_id:owner});return{data:{target_path:paths[0],cleanup_job_id:'cleanup'},error:null}},
  async in(column,values){assert.equal(table,'post_media');assert.equal(column,'storage_path');assert.deepEqual(values,paths);return{data:claimed?[{storage_path:paths[0]}]:[],error:null}},
 }},storage:{from(){return{async list(){assert.fail('an attachment cleanup must not scan other meal media')},async remove(values){removed.push(...values);return{error:null}}}}}});
 await cleanup(admin(true),job);assert.deepEqual(removed,[]);
 await cleanup(admin(false),job);assert.deepEqual(removed,paths);
});

const url=process.env.LOCAL_TEST_DB_URL;
test('servings RPC scales volume labels and gram portions and claims a staged photo idempotently', {skip:!url},()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'disposable local database only');
 const source=readFileSync(new URL('../supabase/migrations/0020_food_post_photo.sql',import.meta.url),'utf8');
 const functions=source.slice(source.indexOf('create or replace function')).replaceAll('public.','barcode_fixture.').replaceAll('search_path = public,','search_path = barcode_fixture,');
 const output=execFileSync('psql',[url,'-X','-qAt','-v','ON_ERROR_STOP=1'],{encoding:'utf8',input:`
 begin;
 create schema barcode_fixture;create schema storage;
 create table storage.objects(bucket_id text,name text);
 create table barcode_fixture.profiles(id uuid primary key);
 create table barcode_fixture.posts(id uuid primary key default gen_random_uuid(),user_id uuid,caption text,eaten_at timestamptz,status text,analysis_initialized_at timestamptz,servings numeric default 1,fail_reason text);
 create table barcode_fixture.post_items(id uuid primary key default gen_random_uuid(),post_id uuid,name text,portion_text text,portion_grams numeric,source text,box jsonb,mask_path text,confidence numeric,supersedes uuid,superseded_at timestamptz);
 create table barcode_fixture.item_nutrition(post_item_id uuid,calories numeric,protein_g numeric,carbs_g numeric,fat_g numeric,fibre_g numeric,sugar_g numeric,sodium_mg numeric,micronutrients jsonb,source_ref text);
 create table barcode_fixture.post_media(post_id uuid,storage_path text,position int,width int,height int,kind text);
 create table barcode_fixture.jobs(post_id uuid,kind text,priority int,status text,payload jsonb,run_after timestamptz);
 create table barcode_fixture.post_comments(post_id uuid,author text,body text);
 ${functions}
 do $$ declare owner uuid:=gen_random_uuid();stage uuid:=gen_random_uuid();p uuid;again uuid;gram uuid;path text;begin
 insert into barcode_fixture.profiles values(owner);path:=owner||'/'||stage||'/0.jpg';
 insert into storage.objects values('media',path),('media',replace(path,'.jpg','.feed.jpg'));
 p:=barcode_fixture.create_food_post(owner,now(),'Oat drink',250,'{"calories":150,"portion_unit":"ml"}',jsonb_build_object('path',path,'width',100,'height',100));
 again:=barcode_fixture.create_food_post(owner,now(),'Oat drink',250,'{"calories":150,"portion_unit":"ml"}',jsonb_build_object('path',path,'width',100,'height',100));
 if p<>stage then raise exception 'photo path is not post scoped';end if;
 if again<>p or (select count(*) from barcode_fixture.posts)<>1 then raise exception 'duplicate post';end if;
 perform barcode_fixture.set_post_servings(p,owner,2);
 if not exists(select 1 from barcode_fixture.post_items where post_id=p and superseded_at is null and portion_text='500 ml' and portion_grams is null) then raise exception 'volume scaling failed';end if;
 perform barcode_fixture.set_post_servings(p,owner,0.5);
 if not exists(select 1 from barcode_fixture.post_items where post_id=p and superseded_at is null and portion_text='125 ml' and portion_grams is null) then raise exception 'repeated volume scaling failed';end if;
 gram:=barcode_fixture.create_food_post(owner,now(),'Rice',100,'{"calories":130}');
 perform barcode_fixture.set_post_servings(gram,owner,2);
 if not exists(select 1 from barcode_fixture.post_items where post_id=gram and superseded_at is null and portion_grams=200) then raise exception 'mass regression';end if;
 -- An unclaimed stage whose cleanup has started/expired cannot race a new post claim.
 stage:=gen_random_uuid();path:=owner||'/'||stage||'/0.jpg';
 insert into storage.objects values('media',path),('media',replace(path,'.jpg','.feed.jpg'));
 insert into barcode_fixture.jobs(kind,status,run_after,payload) values('media_cleanup','running',now()+interval '1 hour',jsonb_build_object('owner_id',owner,'deleted_post_id',stage));
 begin perform barcode_fixture.create_food_post(owner,now(),'Oat drink',250,'{"calories":150,"portion_unit":"ml"}',jsonb_build_object('path',path,'width',100,'height',100));raise exception 'cleanup race accepted';exception when invalid_parameter_value then null;end;
 update barcode_fixture.jobs set status='queued',run_after=now()-interval '1 second' where payload->>'deleted_post_id'=stage::text;
 begin perform barcode_fixture.create_food_post(owner,now(),'Oat drink',250,'{"calories":150,"portion_unit":"ml"}',jsonb_build_object('path',path,'width',100,'height',100));raise exception 'expired stage accepted';exception when invalid_parameter_value then null;end;
 end $$;
 rollback;select 'barcode_consistency_passed';`});
 assert.match(output,/barcode_consistency_passed/);
});
