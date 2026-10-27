// node --env-file=.env.local --test tests/supersede.test.mjs
// All migration DDL, fixtures, edits and grants are rolled back.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const migration = readFileSync(new URL('../supabase/migrations/0007_post_items_supersede.sql', import.meta.url),'utf8');
test('edits preserve immutable history, ownership and atomic readiness', () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  const sql = `
\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
select to_regprocedure('public.mark_post_ready(uuid)') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner, gen_random_uuid() as other \\gset
insert into auth.users(id) values (:'owner'),(:'other');
insert into profiles(id,handle) values (:'owner','edit-'||:'owner'),(:'other','edit-'||:'other');
select set_config('test.owner', :'owner', true), set_config('test.other', :'other', true);
set local role service_role;
do $test$
declare p uuid; old_id uuid; new_id uuid; added uuid;
begin
 insert into posts(user_id,status) values(current_setting('test.owner')::uuid,'ready') returning id into p;
 insert into post_items(post_id,name,portion_grams,source,mask_path,box) values(p,'Rice',100,'model','mask.png','{"left":0,"top":0,"right":10,"bottom":10}') returning id into old_id;
 insert into item_nutrition(post_item_id,calories) values(old_id,200);
 new_id := edit_post_item(p,current_setting('test.owner')::uuid,'portion',old_id,null,50,null);
 if not exists(select 1 from post_items where id=old_id and superseded_at is not null and name='Rice')
 or not exists(select 1 from item_nutrition where post_item_id=old_id and calories=200)
 or not exists(select 1 from current_post_items where id=new_id and supersedes=old_id and source='user' and portion_grams=50 and mask_path='mask.png')
 or (select count(*) from current_post_items where post_id=p)<>1
 or (select status from posts where id=p)<>'queued'
 or (select count(*) from jobs where post_id=p and kind='recompute' and status='queued')<>1 then raise exception 'edit lost history/current state/job'; end if;
 begin
  perform edit_post_item(p,current_setting('test.owner')::uuid,'portion',new_id,null,-1,null);
  raise exception 'invalid portion accepted';
 exception when invalid_parameter_value then null; end;
 if not exists(select 1 from current_post_items where id=new_id) then raise exception 'failed edit modified old row'; end if;
 begin
  perform edit_post_item(p,current_setting('test.owner')::uuid,'remove',old_id,null,null,null);
  raise exception 'stale edit accepted';
 exception when serialization_failure then null; end;
 begin
  perform edit_post_item(p,current_setting('test.other')::uuid,'remove',new_id,null,null,null);
  raise exception 'wrong owner accepted';
 exception when insufficient_privilege then null; end;
 if mark_post_ready(p) then raise exception 'ready with missing nutrition'; end if;
 insert into item_nutrition(post_item_id,calories) values(new_id,100);
 if not mark_post_ready(p) then raise exception 'complete post not ready'; end if;
 added := edit_post_item(p,current_setting('test.owner')::uuid,'add',null,'Beans',40,null);
 if mark_post_ready(p) then raise exception 'stale recompute marked new item ready'; end if;
 perform edit_post_item(p,current_setting('test.owner')::uuid,'remove',added,null,null,null);
 if not mark_post_ready(p) then raise exception 'removed item blocked readiness'; end if;
 perform set_config('test.post',p::text,true); perform set_config('test.item',new_id::text,true);
end;
$test$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
do $test$
begin
 begin
  update post_items set name='Changed' where id=current_setting('test.item')::uuid;
  raise exception 'name update accepted';
 exception when insufficient_privilege then null; end;
 begin
  update post_items set name='Changed',superseded_at=now() where id=current_setting('test.item')::uuid;
  raise exception 'combined mutation accepted';
 exception when insufficient_privilege then null; end;
 begin
  update item_nutrition set calories=999 where post_item_id=current_setting('test.item')::uuid;
  raise exception 'nutrition history mutation accepted';
 exception when insufficient_privilege then null; end;
 begin
  delete from post_items where id=current_setting('test.item')::uuid;
  raise exception 'delete accepted';
 exception when insufficient_privilege then null; end;
 begin
  insert into post_items(post_id,name,source) values(current_setting('test.post')::uuid,'Forgery','model');
  raise exception 'model insertion accepted';
 exception when insufficient_privilege then null; end;
 begin
  perform edit_post_item(current_setting('test.post')::uuid,current_setting('test.owner')::uuid,'remove',current_setting('test.item')::uuid,null,null,null);
  raise exception 'client RPC accepted';
 exception when insufficient_privilege then null; end;
 insert into post_items(post_id,name,source) values(current_setting('test.post')::uuid,'Own item','user');
 update post_items set superseded_at=now() where id=current_setting('test.item')::uuid;
 if exists(select 1 from current_post_items where id=current_setting('test.item')::uuid) then raise exception 'owner supersede failed'; end if;
end;
$test$;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'other','role','authenticated')::text,true);
do $test$
begin
 if exists(select 1 from current_post_items where post_id=current_setting('test.post')::uuid) then raise exception 'view leaks another owner'; end if;
 update post_items set superseded_at=now() where post_id=current_setting('test.post')::uuid;
 if found then raise exception 'other owner mutated item'; end if;
end;
$test$;
select 'supersede: passed';
rollback;
`;
  const result=spawnSync('psql',['-X','-q','-A','-t','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});
  assert.ifError(result.error); assert.equal(result.status,0,result.stderr); assert.match(result.stdout,/supersede: passed/);
});
