import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
test('an ordinary account cannot provision or promote itself as admin',()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL is required');
 const sql=`begin;
${readFileSync(new URL('../supabase/migrations/0005b_profile_role_guard.sql',import.meta.url),'utf8')}
select gen_random_uuid() fixture_user \\gset
insert into auth.users(id) values(:'fixture_user');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'fixture_user','role','authenticated')::text,true);
do $$begin
 begin insert into profiles(id,handle,role) values(auth.uid(),'role-'||auth.uid(),'admin');raise exception 'admin self-provision allowed';exception when insufficient_privilege then null;end;
 insert into profiles(id,handle,role)values(auth.uid(),'role-'||auth.uid(),'user');
 begin update profiles set role='admin' where id=auth.uid();raise exception 'admin self-promotion allowed';exception when insufficient_privilege then null;end;
 update profiles set handle='ordinary-'||auth.uid() where id=auth.uid();
 if (select role from profiles where id=auth.uid())<>'user' then raise exception 'role changed';end if;
end$$;
select 'profile-role: passed';rollback;`;
 const result=spawnSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:60000});
 assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/profile-role: passed/);
});
