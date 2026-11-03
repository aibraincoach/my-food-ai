// Disposable local DB only: node --env-file=.env.local --test tests/db/open-identify.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('identify preference defaults off and is scoped to the authenticated owner without role escalation',()=>{
 assert.ok(process.env.SUPABASE_DB_URL);assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.SUPABASE_DB_URL).hostname),'Disposable local DB only');
 const migration=readFileSync(new URL('../../supabase/migrations/0032_identify_provider.sql',import.meta.url),'utf8');
 const sql=`\\set ON_ERROR_STOP on
begin;
${migration}
grant select,update on public.profiles to authenticated;
insert into auth.users(id,email) values ('10000000-0000-4000-8000-000000000001','open-one.invalid'),('10000000-0000-4000-8000-000000000002','open-two.invalid');
insert into public.profiles(id,handle) values ('10000000-0000-4000-8000-000000000001','open_one'),('10000000-0000-4000-8000-000000000002','open_two');
do $$ begin if exists(select 1 from public.profiles where handle like 'open_%' and identify_provider<>'meta') then raise exception 'Wrong default';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select public.set_identify_provider('open');
update public.profiles set identify_provider='open' where id='10000000-0000-4000-8000-000000000002';
do $$ begin
 begin update public.profiles set role='admin' where id=auth.uid();raise exception 'Escalated';exception when insufficient_privilege then null;end;
 begin perform public.set_identify_provider('wrong');raise exception 'Invalid provider accepted';exception when invalid_parameter_value then null;end;
end $$;
reset role;
do $$ begin
 if (select identify_provider from public.profiles where handle='open_one')<>'open' then raise exception 'Own update failed';end if;
 if (select identify_provider from public.profiles where handle='open_two')<>'meta' then raise exception 'Cross-user update';end if;
end $$;
rollback;`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:30000});assert.equal(result.status,0,result.stderr);
});
