import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990: one food gets the weight both reviewers judged right; every other food is copied exactly.
const file = fileURLToPath(new URL('../scripts/numbers/21-portion.sql', import.meta.url));
test('21-portion.sql gives one food its new weight, copies every food with supersedes, queues one operator recompute, and refuses the rest', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const portion = (post, item, grams) => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${item}`, '-v', `grams=${grams}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), papaya = randomUUID(), melon = randomUUID(), leftover = randomUUID(), other = randomUUID();
  t.after(() => sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','portion-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now()),('${other}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${papaya}','${post}','papaya','model',210,'1 cup'),('${melon}','${post}','honeydew melon','model',150,'1 cup');
insert into post_items(id,post_id,name,source,portion_grams,not_eaten_grams)values('${leftover}','${other}','fried rice','model',300,100);`);
  assert.equal(portion(post, papaya, 210).trim(), '', 'the same weight is refused');
  assert.equal(portion(post, papaya, 0).trim(), '', 'a weight of zero is refused');
  assert.equal(portion(other, leftover, 200).trim(), '', 'a food with a leftovers weight is refused');
  assert.match(portion(post, papaya, 100), /recompute/);
  const rows = sql(`select name||'|'||portion_grams||'|'||portion_text||'|'||supersedes from post_items where post_id='${post}' and superseded_at is null;`).trim().split('\n').sort();
  assert.deepEqual(rows, [`honeydew melon|150|1 cup|${melon}`, `papaya|100|100 g|${papaya}`]);
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "portion"}');
  assert.equal(portion(post, papaya, 90).trim(), '', 'the old food is no longer current, and the meal has a job queued');
});
