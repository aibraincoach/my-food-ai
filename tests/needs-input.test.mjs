import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
test('a second user cannot read or discard a clarification post',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);
 const sql=`\\set ON_ERROR_STOP on
begin;
select gen_random_uuid() owner, gen_random_uuid() other, gen_random_uuid() post \\gset
insert into auth.users(id) values(:'owner'),(:'other');
insert into profiles(id,handle)values(:'owner','question-'||:'owner'),(:'other','question-'||:'other');
insert into posts(id,user_id,status)values(:'post',:'owner','needs_input');
select set_config('test.question_post',:'post',true);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'other','role','authenticated')::text,true);
do $$ declare n int;begin
 if exists(select 1 from posts where id=current_setting('test.question_post')::uuid)then raise exception 'cross-user read';end if;
 delete from posts where id=current_setting('test.question_post')::uuid;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'cross-user discard';end if;
end $$;
reset role;
update posts set status='ready' where id=:'post';
do $$ declare n int;begin
 delete from posts where id=current_setting('test.question_post')::uuid and status='needs_input';
 get diagnostics n=row_count;
 if n<>0 or not exists(select 1 from posts where id=current_setting('test.question_post')::uuid and status='ready')then
  raise exception 'changed meal was discarded';
 end if;
end $$;
select 'needs-input: passed';
rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:60000});
 assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/needs-input: passed/);
});
