import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {isRetriable} from '../src/lib/worker/errors.ts';
const cleanup=createRequire(import.meta.url)('../src/lib/worker/jobs/media_cleanup.ts').default;

test('discard commits durable cleanup atomically and retries survive post cascade',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const migration=readFileSync(new URL('../supabase/migrations/0011_posts_needs_input.sql',import.meta.url),'utf8');
 const rpc=migration.slice(migration.indexOf('-- Detached cleanup survives'));
 const setup=`select to_regprocedure('public.discard_post(uuid,uuid,text[])') is not null as installed \\gset
\\if :installed
\\else
${rpc}
\\endif`;
 const sql=`\\set ON_ERROR_STOP on
begin;set local lock_timeout='5s';set local statement_timeout='30s';
${setup}
${setup}
do $t$ declare u uuid:=gen_random_uuid();p uuid;other uuid:=gen_random_uuid();j uuid;n integer;path text;begin
insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'discard-'||u);
insert into posts(user_id,status)values(u,'needs_input')returning id into p;
path:=u::text||'/'||p::text||'/photo.jpg';
insert into post_media(post_id,storage_path)values(p,path);
insert into jobs(post_id,kind,status)values(p,'analyze','finished');
select count(*) into n from jobs where kind='media_cleanup';
if discard_post(p,other,array[path]) then raise exception 'wrong owner discard accepted';end if;
begin
 perform discard_post(p,u,array['another-owner/photo.jpg']);raise exception 'foreign path accepted';
exception when invalid_parameter_value then null;end;
if not exists(select 1 from posts where id=p) or (select count(*) from jobs where kind='media_cleanup')<>n then raise exception 'failed discard partly committed';end if;
update posts set status='ready' where id=p;
if discard_post(p,u,array[path]) then raise exception 'changed ready meal discarded';end if;
update posts set status='needs_input' where id=p;
if not discard_post(p,u,array[path]) then raise exception 'discard failed';end if;
if exists(select 1 from posts where id=p) or exists(select 1 from jobs where post_id=p) then raise exception 'post cascade incomplete';end if;
select id into j from jobs where kind='media_cleanup' and payload->>'deleted_post_id'=p::text;
if j is null or not exists(select 1 from jobs where id=j and post_id is null and payload->'paths'=jsonb_build_array(path)) then raise exception 'cleanup lost after cascade';end if;
update jobs set status='running',attempts=1 where id=j;
perform fail_job(j,'Storage unavailable',true);
if not exists(select 1 from jobs where id=j and status='queued' and payload->>'deleted_post_id'=p::text and run_after>now()) then raise exception 'cleanup cannot retry after deletion';end if;
if discard_post(p,u,array[path]) then raise exception 'repeat discard created duplicate';end if;
end;$t$;
set local role authenticated;
do $t$ begin
begin perform discard_post(gen_random_uuid(),gen_random_uuid(),'{}');raise exception 'client RPC accepted';exception when insufficient_privilege then null;end;
end;$t$;
rollback;`;
 const result=spawnSync('psql',['-X','-q','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
});

test('cleanup retries partial storage removal using durable paths and stays within the deleted meal',async()=>{
 const owner='00000000-0000-0000-0000-000000000001',post='00000000-0000-0000-0000-000000000002';
 const prefix=`${owner}/${post}`,path=`${prefix}/photo.jpg`;
 const job={post_id:null,payload:{owner_id:owner,deleted_post_id:post,paths:[path]}};
 let fail=true;const removed=[];
 const draftDeletes=[];
 const admin={from:table=>{assert.ok(['post_media','post_upload_drafts'].includes(table));const filters=[];return {select(){assert.equal(table,'post_media');return this},like(column,value){assert.equal(column,'storage_path');assert.equal(value,`${prefix}/%`);return this},async limit(){return {data:[],error:null}},delete(){assert.equal(table,'post_upload_drafts');return this},eq(column,value){filters.push([column,value]);return this},then(resolve){assert.deepEqual(filters,[['id',post],['user_id',owner],['published',false]]);draftDeletes.push(filters);return Promise.resolve({error:null}).then(resolve)}}},storage:{from:()=>({list:async directory=>{assert.equal(directory,prefix);return {data:[{id:'object',name:'copy.jpg'}],error:null};},remove:async paths=>{
   removed.push(paths);return {error:fail?{status:503,message:'unavailable'}:null};
 }})}};
 await assert.rejects(cleanup(admin,job),error=>isRetriable(error));
 assert.equal(draftDeletes.length,0,'failed storage removal retains the draft for retry');
 fail=false;await cleanup(admin,job);assert.equal(draftDeletes.length,1);
 assert.deepEqual(removed,[[path,`${prefix}/copy.jpg`],[path,`${prefix}/copy.jpg`]]);
 await assert.rejects(cleanup(admin,{...job,payload:{...job.payload,paths:['other/meal.jpg']}}),/Invalid media cleanup paths/);
});
