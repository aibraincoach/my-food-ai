import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990: rule g1 (plain coffee or tea above 0.25 kcal per gram) leaves out a coffee matched to a record that holds
// milk, in 03, 04 and 14 alike, and still flags a plain coffee.
const rules = name => fileURLToPath(new URL(`../scripts/numbers/${name}`, import.meta.url));
test('rule g1 leaves out a coffee matched to a milk record and keeps a plain one, in 03, 04 and 14', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const run = (file, uid) => execFileSync('psql', ['-X', '-qAt', '-F', '|', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `uid=${uid}`, '-f', rules(file)], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), milky = randomUUID(), plain = randomUUID(), milkyItem = randomUUID(), plainItem = randomUUID();
  const milkRecord = '990000171', plainRecord = '990002710';
  t.after(() => sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';
delete from fdc_cache where query in ('fdc-detail:${milkRecord}','fdc-detail:${plainRecord}');`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','rules-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${milky}','${user}','ready',now()),('${plain}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${milkyItem}','${milky}','Vietnamese iced coffee','model',100),('${plainItem}','${plain}','black coffee','model',100);
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values('${milkyItem}',71,1.98,12.6,1.38,'${milkRecord}'),('${plainItem}',30,0.1,0,0,'${plainRecord}');
insert into fdc_cache(query,response)values
 ('fdc-detail:${milkRecord}','{"kind":"fdc-detail-v1","fdcId":${milkRecord},"payload":{"fdcId":${milkRecord},"description":"Beverages, coffee, ready to drink, milk based, sweetened"}}'),
 ('fdc-detail:${plainRecord}','{"kind":"fdc-detail-v1","fdcId":${plainRecord},"payload":{"fdcId":${plainRecord},"description":"Beverages, coffee, brewed, prepared with tap water"}}');`);
  const failing = run('14-rule-failures.sql', user).trim().split('\n').filter(Boolean).map(line => line.split('|').slice(0, 3).join('|'));
  assert.deepEqual(failing, [`${plain.slice(0, 8)}|1|g1`], '14 lists only the plain coffee');
  const suspicious = run('03-suspicious.sql', user).trim().split('\n').filter(line => line.includes('|g1 '));
  assert.deepEqual(suspicious.map(line => line.split('|')[0]), [plain.slice(0, 8)], '03 flags only the plain coffee');
  const summary = run('04-summary.sql', user).trim().split('\n').filter(line => line.startsWith('g1 '));
  assert.deepEqual(summary.map(line => line.split('|').slice(1, 3).join('|')), ['1|1'], '04 counts one item in one meal');
});
