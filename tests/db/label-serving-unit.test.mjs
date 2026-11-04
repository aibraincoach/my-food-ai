import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

test('create_food_post accepts serving and rejects cup portion units', () => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.ok(url, 'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const migration = readFileSync(new URL('../../supabase/migrations/0060_label_serving_unit.sql', import.meta.url), 'utf8');
  const input = `begin;
${migration}
do $test$
declare owner uuid := gen_random_uuid();
declare post uuid;
begin
  insert into auth.users(id) values (owner);
  insert into profiles(id, handle) values (owner, 'label-' || owner);
  post := public.create_food_post(owner, now(), 'Crackers', 2, '{"calories":200,"portion_unit":"serving","source_ref":"label"}');
  if (select portion_text from current_post_items where post_id = post) <> '2 servings' then
    raise exception 'serving portion text wrong';
  end if;
  if (select portion_grams from current_post_items where post_id = post) is not null then
    raise exception 'serving should not store grams';
  end if;
  begin
    perform public.create_food_post(owner, now(), 'Bad', 1, '{"calories":1,"portion_unit":"cup"}');
    raise exception 'cup should be rejected';
  exception when invalid_parameter_value then null;
  end;
end $test$;
rollback;`;
  execFileSync('psql', [url, '-v', 'ON_ERROR_STOP=1', '-c', input], { encoding: 'utf8' });
});
