import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {isRetriable} from '../src/lib/worker/errors.ts';
const cleanup=createRequire(import.meta.url)('../src/lib/worker/jobs/media_cleanup.ts').default;

// #1095 (Fleet 50, migration 0074): discarding a meal that waits for an answer is a soft delete, as the owner's
// delete is. The media stay until the daily purge, which queues the prefix cleanup and removes the row.
test('discard soft-deletes only the owner\'s waiting meal, and the purge cleans it up later',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const sql=`\\set ON_ERROR_STOP on
begin;set local lock_timeout='5s';set local statement_timeout='30s';
do $t$ declare u uuid:=gen_random_uuid();p uuid;other uuid:=gen_random_uuid();n integer;path text;begin
if to_regprocedure('public.discard_post(uuid,uuid,text[])') is not null then raise exception 'the old discard function remains';end if;
insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'discard-'||u);
insert into posts(user_id,status)values(u,'needs_input')returning id into p;
path:=u::text||'/'||p::text||'/photo.jpg';
insert into post_media(post_id,storage_path)values(p,path);
select count(*) into n from jobs where kind='media_cleanup';
if discard_post(p,other) then raise exception 'wrong owner discard accepted';end if;
update posts set status='ready' where id=p;
if discard_post(p,u) then raise exception 'changed ready meal discarded';end if;
update posts set status='needs_input' where id=p;
if not discard_post(p,u) then raise exception 'discard failed';end if;
if not exists(select 1 from posts where id=p and deleted_at is not null) then raise exception 'discard was not a soft delete';end if;
if not exists(select 1 from post_media where post_id=p) then raise exception 'media removed before the purge';end if;
if (select count(*) from jobs where kind='media_cleanup')<>n then raise exception 'cleanup queued before the purge';end if;
if discard_post(p,u) then raise exception 'repeat discard accepted';end if;
update posts set deleted_at=now()-interval '31 days' where id=p;
perform purge_deleted_posts();
if exists(select 1 from posts where id=p) then raise exception 'purge left the discarded meal';end if;
if not exists(select 1 from jobs where kind='media_cleanup' and post_id is null and payload->>'deleted_post_id'=p::text) then raise exception 'purge queued no cleanup';end if;
end;$t$;
set local role authenticated;
do $t$ begin
begin perform discard_post(gen_random_uuid(),gen_random_uuid());raise exception 'client RPC accepted';exception when insufficient_privilege then null;end;
end;$t$;
rollback;`;
 const result=spawnSync('psql',['-X','-q','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
});

test('the discard route soft-deletes through one call and lists or removes no storage itself (#1095)',()=>{
 const route=readFileSync(new URL('../src/app/api/posts/[id]/discard/route.ts',import.meta.url),'utf8');
 assert.match(route,/rpc\("discard_post",\{p_post_id:id,p_user_id:user\.id\}\)/);
 assert.doesNotMatch(route,/storage|\.list\(|p_paths|jobs\/tick/);
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
