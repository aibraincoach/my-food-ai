import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { withPushLock, pushSessionStarted, pushSignOutStarted, pushIsSigningOut, detachCurrentPushDevice } from '../src/lib/push/lifecycle.ts';

test('logout waits for registration then removes only the current endpoint before unsubscribe', async () => {
  const events = [];
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => ({ endpoint: 'https://fixture.invalid/device-A', unsubscribe: async () => { events.push('unsubscribe'); return true; } }) } }) } } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { removeItem: () => events.push('clear-owner') } });
    globalThis.fetch = async (_url, init) => {
      assert.equal(init.method, 'DELETE');
      assert.deepEqual(JSON.parse(init.body), { endpoint: 'https://fixture.invalid/device-A' });
      events.push('delete-device'); return new Response('{}');
    };
    pushSessionStarted();
    let release;
    const pending = withPushLock(async () => { await new Promise(resolve => { release = resolve; }); events.push('registration-complete'); });
    await new Promise(resolve => setImmediate(resolve));
    pushSignOutStarted();
    assert.equal(pushIsSigningOut(), true);
    const cleanup = withPushLock(detachCurrentPushDevice);
    release(); await pending; await cleanup;
    assert.deepEqual(events, ['registration-complete', 'delete-device', 'unsubscribe', 'clear-owner']);
  } finally {
    if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator); else delete globalThis.navigator;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else delete globalThis.localStorage;
    globalThis.fetch = originalFetch; pushSessionStarted();
  }
});

test('authenticated logout cannot remove other devices or another account endpoint', () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  const migration = readFileSync(new URL('../supabase/migrations/0012_push_subscriptions.sql', import.meta.url), 'utf8');
  const sql = `\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
${migration}
select gen_random_uuid() a, gen_random_uuid() b \\gset
insert into auth.users(id)values(:'a'),(:'b');
insert into profiles(id,handle)values(:'a','push-'||:'a'),(:'b','push-'||:'b');
insert into push_subscriptions(user_id,endpoint,keys)values(:'a','device-A','{}'),(:'a','device-other','{}'),(:'b','device-B','{}');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'a','role','authenticated')::text,true);
delete from push_subscriptions where user_id=:'a' and endpoint='device-A';
delete from push_subscriptions where endpoint='device-B';
reset role;
do $test$ begin
 if exists(select 1 from push_subscriptions where endpoint='device-A') or not exists(select 1 from push_subscriptions where endpoint='device-other') or not exists(select 1 from push_subscriptions where endpoint='device-B') then raise exception 'logout scope violated'; end if;
end; $test$;
rollback;`;
  const result = spawnSync('psql', ['-X','-q','--dbname',process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 90000 });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
});
