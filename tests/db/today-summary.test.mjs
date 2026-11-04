import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('today_summary counts ready nutrition, pending meals, zone boundaries and excludes other users', () => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.ok(url, 'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const migration = readFileSync(new URL('../../supabase/migrations/0057_today_summary.sql', import.meta.url), 'utf8');
  const rollback = readFileSync(new URL('../../supabase/rollbacks/0057_today_summary.down.sql', import.meta.url), 'utf8');
  const input = `begin;
${migration}
do $test$
declare owner uuid := gen_random_uuid();
declare other uuid := gen_random_uuid();
declare ready uuid := gen_random_uuid();
declare pending uuid := gen_random_uuid();
declare item uuid := gen_random_uuid();
declare summary jsonb;
begin
  insert into auth.users(id) values (owner), (other);
  insert into profiles(id, handle) values (owner, 'today-' || owner), (other, 'today-' || other);
  insert into posts(id, user_id, status, eaten_at) values
    (ready, owner, 'ready', timestamptz '2026-06-15 20:00:00+00'),
    (pending, owner, 'processing', timestamptz '2026-06-15 21:00:00+00');
  insert into post_items(id, post_id, name, source) values (item, ready, 'rice', 'model');
  insert into item_nutrition(post_item_id, calories, protein_g, carbs_g, fat_g) values (item, 120, 3, 25, 1);
  perform set_config('request.jwt.claim.sub', owner::text, true);
  select public.today_summary('America/New_York') into summary;
  if summary->>'date' <> '2026-06-15'
    or (summary->>'kcal')::numeric <> 120
    or (summary->>'posted')::int <> 1
    or (summary->>'pending')::int <> 1 then
    raise exception 'Owner summary wrong: %', summary;
  end if;
  insert into posts(id, user_id, status, eaten_at) values (gen_random_uuid(), other, 'ready', timestamptz '2026-06-15 22:00:00+00');
  select public.today_summary('America/New_York') into summary;
  if (summary->>'posted')::int <> 1 then raise exception 'Other user leaked into summary: %', summary; end if;
  update posts set eaten_at = timestamptz '2026-06-14 20:00:00+00' where id = ready;
  select public.today_summary('America/New_York') into summary;
  if (summary->>'posted')::int <> 0 or (summary->>'kcal') is not null then raise exception 'Zone boundary failed: %', summary; end if;
end $test$;
${rollback}
rollback;`;
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c', input], { encoding: 'utf8' });
});
