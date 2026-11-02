// Disposable local DB only: node --env-file=.env.local --test tests/db/agent-tokens.test.mjs
// SUPABASE_DB_URL must point at the isolated acceptance database, not production.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { user } from './helpers.mjs';
import { absentMigration } from '../fixtures/absent-migration.mjs';
test('agent token RLS, revocation, attribution and rate gates', async () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  const first = await user(1), second = await user(2);
  assert.match(first.user.id, /^[0-9a-f-]{36}$/); assert.match(second.user.id, /^[0-9a-f-]{36}$/);
  const migration = absentMigration(readFileSync(new URL('../../supabase/migrations/0031_agent_tokens.sql', import.meta.url), 'utf8'), '0031_agent_tokens.sql');
  const sql = `\\set ON_ERROR_STOP on
begin;
${migration}
insert into public.agent_tokens(user_id,name,token_hash,token_last4) values('${first.user.id}','Agent 1',encode(gen_random_bytes(32),'hex'),'abcd') returning id as token_id \\gset
select set_config('run6.token',:'token_id',true);
select public.agent_log_meal('${first.user.id}',:'token_id','coffee',now()-interval '1 hour') as post_id \\gset
select set_config('run6.post',:'post_id',true);
do $$ begin
 if (select agent_token_id from public.posts where id=current_setting('run6.post')::uuid)<>current_setting('run6.token')::uuid then raise exception 'Attribution lost';end if;
 if (select eaten_at from public.posts where id=current_setting('run6.post')::uuid)<>now()-interval '1 hour' then raise exception 'Time lost';end if;
 if not exists(select 1 from public.agent_activity where token_id=current_setting('run6.token')::uuid and action='posted') then raise exception 'Missing activity';end if;
 for i in 1..60 loop if not public.agent_hit(current_setting('run6.token')::uuid,60) then raise exception 'Early limit';end if;end loop;
 if public.agent_hit(current_setting('run6.token')::uuid,60) then raise exception '61st call allowed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub','${second.user.id}','role','authenticated')::text,true);
do $$ begin
 if exists(select 1 from public.agent_tokens where id=current_setting('run6.token')::uuid) then raise exception 'Other token visible';end if;
 if exists(select 1 from public.agent_activity where token_id=current_setting('run6.token')::uuid) then raise exception 'Other activity visible';end if;
 update public.agent_tokens set revoked_at=now() where id=current_setting('run6.token')::uuid;
 if found then raise exception 'Other token revoked';end if;
 if exists(select 1 from public.agent_token_hits) then raise exception 'Rate counters visible';end if;
end $$;
select set_config('request.jwt.claims',json_build_object('sub','${first.user.id}','role','authenticated')::text,true);
do $$ begin
 begin update public.agent_tokens set name='Changed' where id=current_setting('run6.token')::uuid;raise exception 'Name editable';exception when insufficient_privilege then null;end;
 begin update public.posts set agent_token_id=null where id=current_setting('run6.post')::uuid;raise exception 'Attribution editable';exception when insufficient_privilege then null;end;
 begin insert into public.agent_tokens(user_id,name,token_hash,token_last4) values(auth.uid(),'Injected','injected','xxxx');raise exception 'Owner inserted token';exception when insufficient_privilege then null;end;
 update public.agent_tokens set revoked_at=now() where id=current_setting('run6.token')::uuid;
 begin update public.agent_tokens set revoked_at=null where id=current_setting('run6.token')::uuid;raise exception 'Revocation reversed';exception when insufficient_privilege then null;end;
end $$;
reset role;
do $$ begin
 if public.agent_hit(current_setting('run6.token')::uuid,60) then raise exception 'Revoked token accepted';end if;
 begin perform public.agent_log_meal('${second.user.id}',current_setting('run6.token')::uuid,'stolen',now());raise exception 'Other user token accepted';exception when insufficient_privilege then null;end;
end $$;
rollback;`;
  try {
    const result = spawnSync('psql', ['-X', '-qAt', '--dbname', process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 90000 });
    assert.equal(result.status, 0, result.stderr);
  } finally { await first.client.auth.signOut({ scope: 'local' }); await second.client.auth.signOut({ scope: 'local' }); }
});
