// Disposable full local stack: node --env-file=.env.local --test tests/db/user-cap.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { tsImport } from 'tsx/esm/api';
const { capUser } = await tsImport('../../src/lib/limits/user-cap.ts', import.meta.url);

test('hourly account caps enforce each boundary, isolate accounts/routes, expire old rows, and deny client access', () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.SUPABASE_DB_URL).hostname), 'Disposable local DB only');
  const sql = `begin;
  set local statement_timeout='20s';
  do $test$
  declare owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); i integer; bucket text; cap integer;
  begin
   insert into auth.users(id) values(owner_id),(other_id);
   for bucket,cap in select * from (values ('label',30),('transcribe',60),('fdc_search',300),('fdc_barcode',120),('post',40),('correct',100),('drink_identify',120)) as limits(route,cap) loop
    for i in 1..cap loop
     if not public.user_hit(owner_id,bucket) then raise exception 'Early refusal: % hit %',bucket,i;end if;
    end loop;
    if public.user_hit(owner_id,bucket) then raise exception 'Cap bypass: %',bucket;end if;
    if not public.user_hit(other_id,bucket) then raise exception 'Other account blocked: %',bucket;end if;
   end loop;
   for i in 1..41 loop
    if not public.user_hit(other_id,'drink_identify') then raise exception 'Independent drink bucket refused';end if;
   end loop;
   if (select hits from public.user_call_hits where user_id=other_id and route='post' and hour=date_trunc('hour',clock_timestamp())) <> 1 then raise exception 'Drink changed post count';end if;
   insert into public.user_call_hits(user_id,route,hour,hits) values(owner_id,'post',date_trunc('hour',clock_timestamp())-interval '2 days',40),(other_id,'post',date_trunc('hour',clock_timestamp())-interval '2 days',40);
   perform public.user_hit(owner_id,'post');
   if exists(select 1 from public.user_call_hits where user_id=owner_id and hour<clock_timestamp()-interval '1 day') then raise exception 'Own old rows retained';end if;
   if not exists(select 1 from public.user_call_hits where user_id=other_id and hour<clock_timestamp()-interval '1 day') then raise exception 'Other account rows changed';end if;
   begin perform public.user_hit(owner_id,'unknown');raise exception 'Unknown route accepted';exception when invalid_parameter_value then null;end;
   begin perform public.user_hit(owner_id,null);raise exception 'Null route accepted';exception when invalid_parameter_value then null;end;
   if has_function_privilege('authenticated','public.user_hit(uuid,text)','execute') or has_function_privilege('anon','public.user_hit(uuid,text)','execute') then raise exception 'Client can count';end if;
   if not has_function_privilege('service_role','public.user_hit(uuid,text)','execute') then raise exception 'Service cannot count';end if;
   if has_table_privilege('authenticated','public.user_call_hits','select') or has_table_privilege('authenticated','public.user_call_hits','update') then raise exception 'Client can inspect/reset';end if;
  end $test$;
  set local role authenticated;
  do $test$ begin
   begin perform public.user_hit(gen_random_uuid(),'post');raise exception 'Authenticated execution succeeded';exception when insufficient_privilege then null;end;
  end $test$;
  reset role;
  select 'user-cap: passed';rollback;`;
  const result = spawnSync('psql', ['-X', '-qAt', '--dbname', process.env.SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1'], { input: sql, encoding: 'utf8', timeout: 25000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /user-cap: passed/);
});

test('cap response carries the next-hour wait and fails open without exposing diagnostics', async () => {
  let args;
  const denied = await capUser('owner-id', 'label', { rpc: async (...values) => { args = values; return { data: false, error: null }; } });
  assert.deepEqual(args, ['user_hit', { p_user_id: 'owner-id', p_route: 'label' }]);
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('Retry-After')) >= 1);
  assert.ok(Number(denied.headers.get('Retry-After')) <= 3600);
  assert.deepEqual(await denied.json(), { error: 'You have made a lot of requests this hour. Try again later.' });
  assert.equal(await capUser('owner-id', 'post', { rpc: async () => ({ data: true, error: null }) }), null);
  const logs = [], original = console.error;
  console.error = (...values) => logs.push(values.join(' '));
  try {
    assert.equal(await capUser('owner-id', 'post', { rpc: async () => ({ data: null, error: { message: 'private diagnostic' } }) }), null);
    assert.equal(await capUser('owner-id', 'post', { rpc: async () => { throw Error('private diagnostic'); } }), null);
  } finally { console.error = original; }
  assert.deepEqual(logs, ['user cap check failed post', 'user cap check failed post']);
});

test('each spending route allows its final slot then refuses before invalid input can spend credit', { timeout: 45000 }, async () => {
  assert.ok(process.env.APP_URL, 'APP_URL is required');
  for (const key of ['APP_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_DB_URL']) {
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env[key]).hostname), `${key}: disposable local services only`);
  }
  const { signInAsTestUser } = await import('../../scripts/lib/session.mjs');
  const { user } = await import('./helpers.mjs');
  const account = await user(1);
  const cookie = await signInAsTestUser(1);
  const id = '00000000-0000-4000-8000-000000000000';
  const boundaries = [
    ['POST', '/api/label/read', 'label', 30, 400],
    ['POST', '/api/transcribe', 'transcribe', 60, 400],
    ['GET', '/api/fdc/search', 'fdc_search', 300, 400],
    ['GET', '/api/fdc/barcode', 'fdc_barcode', 120, 400],
    ['POST', '/api/posts', 'post', 40, 400],
    ['POST', '/api/posts/food', 'post', 40, 400],
    ['POST', `/api/posts/${id}/comments`, 'correct', 100, 404],
    ['POST', `/api/posts/${id}/items`, 'correct', 100, 404],
    ['POST', `/api/posts/${id}/retry`, 'correct', 100, 409],
    ['POST', `/api/posts/${id}/servings`, 'correct', 100, 400],
    ['POST', `/api/posts/${id}/media`, 'correct', 100, 404],
    ['PUT', '/api/barcode/invalid/correction', 'correct', 100, 400],
  ];
  const runSql = (input) => {
    const result = spawnSync('psql', ['-X', '-qAt', '--dbname', process.env.SUPABASE_DB_URL, '-v', 'ON_ERROR_STOP=1'], { input, encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
  };
  try {
    for (const [method, path, route, cap, expected] of boundaries) {
      runSql(`insert into public.user_call_hits(user_id,route,hour,hits) values('${account.user.id}','${route}',date_trunc('hour',clock_timestamp()),${cap - 1}) on conflict(user_id,route,hour) do update set hits=excluded.hits;`);
      const options = { method, headers: { cookie, 'Content-Type': 'application/json' }, ...(method === 'GET' ? {} : { body: '{}' }), signal: AbortSignal.timeout(15000) };
      const last = await fetch(new URL(path, process.env.APP_URL), options);
      assert.equal(last.status, expected, `${method} ${path}: final allowed slot reaches validation`);
      await last.text();
      const refused = await fetch(new URL(path, process.env.APP_URL), { ...options, signal: AbortSignal.timeout(15000) });
      assert.equal(refused.status, 429, `${method} ${path}: next call refused`);
      assert.ok(Number(refused.headers.get('Retry-After')) > 0);
      assert.deepEqual(await refused.json(), { error: 'You have made a lot of requests this hour. Try again later.' });
    }
  } finally {
    runSql(`delete from public.user_call_hits where user_id='${account.user.id}';`);
    await account.client.auth.signOut({ scope: 'local' });
  }
});
