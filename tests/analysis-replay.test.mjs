import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('committed analysis replay preserves user edits, removed meals and zero-food marker',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const migration=readFileSync(new URL('../supabase/migrations/0007_post_items_supersede.sql',import.meta.url),'utf8');
 const sql=`\\set ON_ERROR_STOP on
begin;set local lock_timeout='5s';set local statement_timeout='30s';
${migration}
select gen_random_uuid() as owner \\gset
insert into auth.users(id)values(:'owner');insert into profiles(id,handle)values(:'owner','replay-'||:'owner');
select set_config('test.owner',:'owner',true);
set local role service_role;
do $t$
declare p uuid;empty_post uuid;i uuid;replacement uuid;marker timestamptz;payload jsonb:='[{"name":"Rice","portion_grams":100,"nutrition":{"calories":200}}]'::jsonb;
begin
 insert into posts(user_id,status)values(current_setting('test.owner')::uuid,'queued')returning id into p;
 insert into post_comments(post_id,author,body)values(p,'user','Halve it');
 insert into jobs(post_id,kind,status)values(p,'correct','error');
 perform persist_analysis(p,payload,'Rice.');
 if (select count(*)from jobs where post_id=p and kind='correct' and status='queued')<>1 then raise exception 'successful initial retry stranded comments';end if;select analysis_initialized_at into marker from posts where id=p;
 if marker is null then raise exception 'missing atomic marker';end if;
 select id into i from current_post_items where post_id=p;
 replacement:=edit_post_item(p,current_setting('test.owner')::uuid,'portion',i,null,50,null);
 perform persist_analysis(p,payload,'Retry must not replace edit.');
 if (select count(*)from current_post_items where post_id=p)<>1 or not exists(select 1 from current_post_items where id=replacement and portion_grams=50) then raise exception 'retry recreated edited food';end if;
 if (select analysis_initialized_at from posts where id=p)<>marker then raise exception 'marker changed on replay';end if;
 perform edit_post_item(p,current_setting('test.owner')::uuid,'remove',replacement,null,null,null);
 perform persist_analysis(p,payload,'Retry must not restore removed meal.');
 if exists(select 1 from current_post_items where post_id=p)then raise exception 'retry restored removed food';end if;
 insert into posts(user_id,status)values(current_setting('test.owner')::uuid,'queued')returning id into empty_post;
 perform persist_analysis(empty_post,'[]','No food.');perform persist_analysis(empty_post,payload,'Retry');
 if exists(select 1 from current_post_items where post_id=empty_post)or not exists(select 1 from posts where id=empty_post and analysis_initialized_at is not null)then raise exception 'empty initialization replayed';end if;
 perform set_config('test.post',p::text,true);
end;$t$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
do $t$begin
 begin update posts set analysis_initialized_at=null where id=current_setting('test.post')::uuid;raise exception 'client changed marker';exception when insufficient_privilege then null;end;
 begin insert into posts(user_id,status,analysis_initialized_at)values(current_setting('test.owner')::uuid,'queued',now());raise exception 'client forged marker';exception when insufficient_privilege then null;end;
end;$t$;
rollback;`;
 const r=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:90000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);
});
