import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { deliberateRemovals } from '../scripts/numbers/reanalyse.mjs';

// #456: caffeine on an alcoholic drink that names no caffeine source is removed on purpose; nothing else may change.
test('a decaf run counts only caffeine (nutrient 1057) as removed; any other lost value still restores the meal', () => {
  assert.deepEqual(deliberateRemovals(['food 2: nutrient 1057']), { removed: ['food 2: nutrient 1057'], kept: [] });
  assert.deepEqual(deliberateRemovals(['food 2: nutrient 1057', 'food 2: nutrient 1018', 'food 1: calories']),
    { removed: ['food 2: nutrient 1057'], kept: ['food 2: nutrient 1018', 'food 1: calories'] });
  assert.deepEqual(deliberateRemovals(['renamed foods: nutrient 1057']), { removed: [], kept: ['renamed foods: nutrient 1057'] });
  assert.deepEqual(deliberateRemovals(undefined), { removed: [], kept: [] });
});

const file = fileURLToPath(new URL('../scripts/numbers/20-decaf.sql', import.meta.url));
test('20-decaf.sql removes caffeine from a cocktail only, keeps a rum and cola and a coffee, and queues one operator recompute', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const decaf = post => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), tiki = randomUUID(), cuba = randomUUID(), coffee = randomUUID(), wine = randomUUID();
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  const micro = list => `'${JSON.stringify(list.map(([nutrientId, value]) => ({ nutrientId, value, unit: nutrientId === 1018 ? 'G' : 'MG', basis: 'portion' })))}'`;
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','decaf-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${tiki}','${post}','lime and rum tiki cocktail','model',220),
 ('${cuba}','${post}','rum and cola','model',250),('${coffee}','${post}','black coffee','model',240),('${wine}','${post}','red wine','model',150);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients,food_category)values
 ('${tiki}',196,0,17,0,${micro([[1018, 18.26], [1057, 15.4], [1092, 40]])},null),
 ('${cuba}',180,0,20,0,${micro([[1018, 14], [1057, 10]])},null),
 ('${coffee}',2,0.3,0,0,${micro([[1057, 72]])},null),
 ('${wine}',128,0.1,4,0,${micro([[1057, 1]])},'Alcoholic Beverages');`);
  assert.match(decaf(post), /recompute/);
  const ids = row => sql(`select string_agg(m->>'nutrientId',',' order by o) from item_nutrition n, jsonb_array_elements(n.micronutrients) with ordinality e(m,o) where n.post_item_id='${row}';`).trim();
  assert.equal(ids(tiki), '1018,1092', 'the cocktail keeps its alcohol and potassium, in order');
  assert.equal(ids(cuba), '1018,1057', 'a rum and cola keeps its caffeine');
  assert.equal(ids(coffee), '1057', 'a coffee keeps its caffeine');
  assert.equal(ids(wine), '', 'a wine (alcoholic category) loses its caffeine');
  assert.equal(sql(`select calories from item_nutrition where post_item_id='${tiki}';`).trim(), '196');
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "decaf"}');
  assert.equal(decaf(post).trim(), '', 'a meal with a job queued is refused');
  sql(`update jobs set status='finished',finished_at=now() where post_id='${post}';update posts set status='ready' where id='${post}';`);
  assert.equal(decaf(post).trim(), '', 'a second run changes nothing and queues nothing');
});
