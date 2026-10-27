// node --env-file=.env.local --test tests/comments-policy.test.mjs
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const read=name=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');
test('comments are owner-authored and immutable; corrections preserve history atomically',()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL required');
 const sql=`
\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
select to_regprocedure('public.mark_post_ready(uuid)') is not null as item_installed \\gset
\\if :item_installed
\\else
${read('0007_post_items_supersede.sql')}
\\endif
select to_regprocedure('public.append_post_comment(uuid,uuid,text)') is not null as comments_installed \\gset
\\if :comments_installed
\\else
${read('0007b_comment_corrections.sql')}
\\endif
select gen_random_uuid() as owner,gen_random_uuid() as other \\gset
insert into auth.users(id)values(:'owner'),(:'other');
insert into profiles(id,handle)values(:'owner','comment-'||:'owner'),(:'other','comment-'||:'other');
insert into posts(user_id,status)values(:'owner','ready')returning id as post \\gset
select set_config('test.post',:'post',true),set_config('test.owner',:'owner',true);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
do $t$
begin
 insert into post_comments(post_id,author,body)values(current_setting('test.post')::uuid,'user','User words');
 begin
  insert into post_comments(post_id,author,body)values(current_setting('test.post')::uuid,'model','Forged');raise exception 'model author allowed';
 exception when insufficient_privilege then null;end;
 begin
  update post_comments set body='Changed' where post_id=current_setting('test.post')::uuid;raise exception 'update allowed';
 exception when insufficient_privilege then null;end;
 begin
  delete from post_comments where post_id=current_setting('test.post')::uuid;raise exception 'delete allowed';
 exception when insufficient_privilege then null;end;
end;$t$;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'other','role','authenticated')::text,true);
do $t$
begin
 if exists(select 1 from post_comments where post_id=current_setting('test.post')::uuid)then raise exception 'other owner read thread';end if;
 begin
  insert into post_comments(post_id,author,body)values(current_setting('test.post')::uuid,'user','Other');raise exception 'other owner inserted';
 exception when insufficient_privilege then null;end;
end;$t$;
set local role service_role;
do $t$
declare p uuid:=current_setting('test.post')::uuid;old_id uuid;j uuid;c post_comments;later post_comments;later2 post_comments;payload jsonb;j2 uuid;j3 uuid;
begin
 insert into post_items(post_id,name,portion_grams,source)values(p,'Rice',100,'model')returning id into old_id;
 insert into item_nutrition(post_item_id,calories)values(old_id,200);
 c:=append_post_comment(p,current_setting('test.owner')::uuid,'Half the rice');
 select id into j from jobs where post_id=p and kind='correct' and status='queued';
 update jobs set status='running',payload=jsonb_build_object('correction_from_sequence',0,'correction_pending_ids',(select jsonb_agg(id) from post_comments where post_id=p and author='user')) where id=j;
 later:=append_post_comment(p,current_setting('test.owner')::uuid,'Also add beans');
 later2:=append_post_comment(p,current_setting('test.owner')::uuid,'Then halve the beans');
 if(select count(*)from jobs where post_id=p and kind='correct')<>1 then raise exception 'duplicated running correction';end if;
 payload:=jsonb_build_array(jsonb_build_object('name','Rice','portion_text','50 g','portion_grams',50,'supersedes',old_id,'nutrition',jsonb_build_object('calories',100)));
 begin
  perform persist_correction(p,j,array[]::uuid[],c.id,payload,'Changed rice.');raise exception 'stale snapshot accepted';
 exception when serialization_failure then null;end;
 if not exists(select 1 from current_post_items where id=old_id)then raise exception 'failed transaction modified items';end if;
 if not persist_correction(p,j,array[old_id],c.id,payload,'Changed rice. Consumed 100 kcal.')then raise exception 'correction not applied';end if;
 if exists(select 1 from current_post_items where id=old_id)
 or not exists(select 1 from post_items where id=old_id and superseded_at is not null)
 or not exists(select 1 from item_nutrition where post_item_id=old_id and calories=200)
 or (select count(*)from post_comments where post_id=p and author='model')<>1
 or (select count(*)from jobs where post_id=p and kind='correct' and status='queued')<>1 then raise exception 'history/reply/follow-up missing';end if;
 if persist_correction(p,j,array[old_id],c.id,payload,'Duplicate') then raise exception 'retry applied twice';end if;
 if(select count(*)from post_comments where post_id=p and author='model')<>1 then raise exception 'duplicate model reply';end if;
 -- A distinct job consumes both messages arriving during the previous call.
 select id into j2 from jobs where post_id=p and kind='correct' and status='queued';
 update jobs set status='running',payload=jsonb_build_object('correction_from_sequence',1,'correction_pending_ids',jsonb_build_array(later.id,later2.id)) where id=j2;
 select id into old_id from current_post_items where post_id=p;
 if not persist_correction(p,j2,array[old_id],later2.id,'[]'::jsonb,'Removed all items.') then raise exception 'second job not applied';end if;
 if (select (jobs.payload->>'correction_sequence')::int from jobs where id=j2)<>2 or (select jsonb_array_length(jobs.payload->'correction_pending_ids') from jobs where id=j2)<>2 then raise exception 'progress not durable across job IDs';end if;
 -- Empty item arrays cannot detect a competing empty-to-empty correction;
 -- the monotonic progress sequence must reject its stale snapshot.
 c:=append_post_comment(p,current_setting('test.owner')::uuid,'Keep empty');
 select id into j3 from jobs where post_id=p and kind='correct' and status='queued';
 update jobs set status='running',payload=jsonb_build_object('correction_from_sequence',1,'correction_pending_ids',jsonb_build_array(c.id)) where id=j3;
 begin
  perform persist_correction(p,j3,array[]::uuid[],c.id,'[]'::jsonb,'Stale');raise exception 'stale empty snapshot accepted';
 exception when serialization_failure then null;end;
 if (select count(*) from post_comments where post_id=p and author='model')<>2 then raise exception 'stale transaction wrote reply';end if;
end;$t$;
select 'comments: passed';rollback;
`;
 const r=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});
 assert.ifError(r.error);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/comments: passed/);
});
