import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('0061 allows 0.1 servings and rejects 0.09', () => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.ok(url, 'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const migration = readFileSync(new URL('../../supabase/migrations/0061_servings_floor.sql', import.meta.url), 'utf8');
  const input = `begin;
${migration}
do $test$
declare owner uuid := gen_random_uuid();
declare post uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (owner);
  insert into profiles(id, handle) values (owner, 'sf-' || owner);
  insert into posts(id, user_id, caption, status, analysis_initialized_at, servings) values (post, owner, 'rice', 'ready', now(), 1);
  insert into post_items(post_id, name, portion_text, portion_grams, source) values (post, 'Rice', '100 g', 100, 'model');
  perform public.set_post_servings(post, owner, 0.1);
  if (select servings from posts where id = post) <> 0.1 then raise exception '0.1 not stored'; end if;
  begin
    perform public.set_post_servings(post, owner, 0.09);
    raise exception '0.09 should be rejected';
  exception when invalid_parameter_value then null;
  end;
end $test$;
rollback;`;
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c', input], { encoding: 'utf8' });
});
