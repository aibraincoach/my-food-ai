import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #1048: a saved value that is not a number neither stops 19-saved.sql nor becomes zero; it is listed as rule x.
const file = fileURLToPath(new URL('../scripts/numbers/19-saved.sql', import.meta.url));
test('19-saved.sql lists unreadable saved numbers as rule x and still reports every other saved meal', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), item = randomUUID(), good = randomUUID(), bad = randomUUID(), notList = randomUUID();
  t.after(() => sql(`delete from saved_meals where user_id='${user}';delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  const rice = { name: 'rice', portion_grams: 150, nutrition: { calories: 195, protein_g: 4, carbs_g: 42, fat_g: 0.4 } };
  const items = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','saved-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${item}','${post}','rice','model',150);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)values('${item}',195,4,42,0.4);
insert into saved_meals(id,user_id,name,source_post_id,items)values
 ('${good}','${user}','good','${post}',${items([rice])}),
 ('${bad}','${user}','bad',null,${items([rice, { name: 'sambal', portion_grams: 'about 100', nutrition: { calories: '', protein_g: '0', carbs_g: 1, fat_g: { value: 0 } } }])}),
 ('${notList}','${user}','not a list',null,'{"name":"rice"}'::jsonb);`);
  const rows = execFileSync('psql', ['-X', '-qAt', '-F', '|', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-f', file], { encoding: 'utf8', timeout: 10000 })
    .trim().split('\n').map(line => line.split('|')).filter(row => row[1] === user.slice(0, 8));
  const byMeal = Object.fromEntries(rows.map(row => [row[2], { foods: row[4], kcal: row[5], against: row[8], rules: row[9] }]));
  assert.deepEqual(byMeal[good.slice(0, 8)], { foods: '1', kcal: '195.0', against: 'matches source', rules: '' });
  assert.deepEqual(byMeal[bad.slice(0, 8)], { foods: '2', kcal: '195.0', against: 'no source', rules: 'a2,x' }, 'the unreadable food adds no calories and is flagged');
  assert.deepEqual(byMeal[notList.slice(0, 8)], { foods: '0', kcal: '', against: 'no source', rules: 'x' });
});
