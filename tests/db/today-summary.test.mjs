import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('today_summary matches sumNutrition null semantics for the caller local day', () => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.ok(url, 'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const migration57 = readFileSync(new URL('../../supabase/migrations/0057_today_summary.sql', import.meta.url), 'utf8');
  const migration62 = readFileSync(new URL('../../supabase/migrations/0062_today_summary_nulls.sql', import.meta.url), 'utf8');
  const rollback = readFileSync(new URL('../../supabase/rollbacks/0057_today_summary.down.sql', import.meta.url), 'utf8');
  const zone = 'America/New_York';
  const input = `begin;
${migration57}
${migration62}
do $test$
declare owner uuid := gen_random_uuid();
declare other uuid := gen_random_uuid();
declare ready uuid := gen_random_uuid();
declare pending uuid := gen_random_uuid();
declare item uuid := gen_random_uuid();
declare item2 uuid := gen_random_uuid();
declare summary jsonb;
declare today date := (timezone('${zone}', now()))::date;
begin
  insert into auth.users(id) values (owner), (other);
  insert into profiles(id, handle) values (owner, 'today-' || owner), (other, 'today-' || other);
  perform set_config('request.jwt.claim.sub', owner::text, true);

  select public.today_summary('${zone}') into summary;
  if summary->>'date' <> today::text
    or summary->>'kcal' is not null
    or summary->>'protein_g' is not null
    or summary->>'carbs_g' is not null
    or summary->>'fat_g' is not null
    or (summary->>'posted')::int <> 0
    or (summary->>'pending')::int <> 0 then
    raise exception 'Empty day should be all null: %', summary;
  end if;

  insert into posts(id, user_id, status, eaten_at) values
    (ready, owner, 'ready', (today::text || ' 20:00:00')::timestamp at time zone '${zone}'),
    (pending, owner, 'processing', (today::text || ' 21:00:00')::timestamp at time zone '${zone}');
  insert into post_items(id, post_id, name, source) values (item, ready, 'rice', 'model');
  insert into item_nutrition(post_item_id, calories, protein_g, carbs_g, fat_g) values (item, 120, null, 25, 1);
  select public.today_summary('${zone}') into summary;
  if (summary->>'kcal')::numeric <> 120
    or summary->>'protein_g' is not null
    or (summary->>'carbs_g')::numeric <> 25
    or (summary->>'fat_g')::numeric <> 1
    or (summary->>'posted')::int <> 1
    or (summary->>'pending')::int <> 1 then
    raise exception 'Missing protein should stay null: %', summary;
  end if;

  insert into post_items(id, post_id, name, source) values (item2, ready, 'beans', 'model');
  insert into item_nutrition(post_item_id, calories, protein_g, carbs_g, fat_g) values (item2, 80, 5, 10, 2);
  select public.today_summary('${zone}') into summary;
  if (summary->>'kcal')::numeric <> 200
    or (summary->>'protein_g')::numeric <> 5
    or (summary->>'carbs_g')::numeric <> 35
    or (summary->>'fat_g')::numeric <> 3 then
    raise exception 'Mixed day totals wrong: %', summary;
  end if;

  insert into posts(id, user_id, status, eaten_at) values (gen_random_uuid(), other, 'ready', (today::text || ' 22:00:00')::timestamp at time zone '${zone}');
  select public.today_summary('${zone}') into summary;
  if (summary->>'posted')::int <> 1 then raise exception 'Other user leaked into summary: %', summary; end if;

  update posts set eaten_at = ((today - 1)::text || ' 20:00:00')::timestamp at time zone '${zone}' where id = ready;
  select public.today_summary('${zone}') into summary;
  if (summary->>'posted')::int <> 0 or summary->>'kcal' is not null then raise exception 'Zone boundary failed: %', summary; end if;
end $test$;
${rollback}
revoke execute on function public.today_summary(text) from authenticated;
drop function if exists public.today_summary(text);
rollback;`;
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c', input], { encoding: 'utf8' });
});
