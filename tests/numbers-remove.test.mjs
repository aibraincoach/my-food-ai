import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// #990, the PM's ruling of 2026-11-17 19:35Z: a food counted twice is removed on purpose; nothing else may change.
const file = fileURLToPath(new URL('../scripts/numbers/18-remove.sql', import.meta.url));
test('18-remove.sql removes one food, keeps the others with their ids as supersedes, and queues one operator recompute', { skip: !process.env.TEST_SQL_DATABASE_URL }, t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const remove = (post, item) => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${item}`, '-f', file], { encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), veg = randomUUID();
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','remove-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams,portion_text)values
 ('${coffee}','${post}','Vietnamese drip coffee','model',100,'1 small glass'),('${milk}','${post}','sweetened condensed milk','model',30,'2 Tbsp'),('${veg}','${post}','stir-fried mixed vegetables','model',120,'1/2 cup');
insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g)values('${coffee}',71,1.98,12.6,1.38),('${milk}',100.8,2.214,17.37,2.499),('${veg}',85.2,2.412,11.58,3.408);`);
  assert.match(remove(post, milk), /recompute/);
  const current = sql(`select name||'|'||supersedes from post_items where post_id='${post}' and superseded_at is null;`).trim().split('\n').sort();
  assert.deepEqual(current, [`Vietnamese drip coffee|${coffee}`, `stir-fried mixed vegetables|${veg}`].sort());
  assert.equal(sql(`select count(*) from post_items where post_id='${post}' and superseded_at is not null;`).trim(), '3', 'every old row is kept, superseded');
  assert.equal(sql(`select status from posts where id='${post}';`).trim(), 'queued');
  assert.equal(sql(`select string_agg(payload::text,',') from jobs where post_id='${post}';`).trim(), '{"operator": "remove"}');
  assert.equal(remove(post, veg).trim(), '', 'a meal with a job queued is refused');
  sql(`update jobs set status='finished',finished_at=now() where post_id='${post}';update posts set status='ready' where id='${post}';`);
  assert.equal(remove(post, milk).trim(), '', 'a food that is no longer current is refused');
  const [last] = sql(`select id from post_items where post_id='${post}' and superseded_at is null and name like 'Viet%';`).trim().split('\n');
  sql(`update post_items set superseded_at=now() where post_id='${post}' and superseded_at is null and id<>'${last}';`);
  assert.equal(remove(post, last).trim(), '', 'the last food of a meal is never removed');
});

// #1040: a writer that queues the meal while the removal waits must win; the removal then changes nothing.
test('18-remove.sql waits for a concurrent queue change and then refuses the meal', { skip: !process.env.TEST_SQL_DATABASE_URL }, async t => {
  const url = process.env.TEST_SQL_DATABASE_URL;
  assert.equal(process.env.MFA_TEST_DISPOSABLE, '1');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Disposable database only');
  const sql = input => execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input, encoding: 'utf8', timeout: 10000 });
  const user = randomUUID(), post = randomUUID(), coffee = randomUUID(), milk = randomUUID(), app = `remove-${post.slice(0, 8)}`;
  // #1047: an unexpected error must not leave either psql running. Hooks run in the order they are registered, so
  // this one ends both children (and the writer's lock) before the fixture is deleted.
  let writer = null, removal = null;
  t.after(() => { for (const child of [writer, removal]) if (child && child.exitCode === null && child.signalCode === null) child.kill('SIGKILL'); });
  t.after(() => sql(`delete from posts where id='${post}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
  sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','remove-${user.slice(0, 8)}');
insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
insert into post_items(id,post_id,name,source,portion_grams)values('${coffee}','${post}','Vietnamese drip coffee','model',100),('${milk}','${post}','sweetened condensed milk','model',30);`);
  // The other writer: it holds the meal's row, queued, until this test lets it commit.
  writer = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { stdio: ['pipe', 'pipe', 'pipe'] });
  const writerDone = new Promise(resolve => writer.on('close', resolve));
  writer.stdin.write(`begin;update posts set status='queued' where id='${post}';select 'held';\n`);
  await new Promise((resolve, reject) => { writer.stdout.on('data', chunk => { if (String(chunk).includes('held')) resolve(); }); writer.on('close', () => reject(new Error('writer ended early'))); });
  removal = spawn('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url, '-v', `post=${post}`, '-v', `item=${milk}`, '-f', file], { env: { ...process.env, PGAPPNAME: app } });
  let output = '';
  removal.stdout.on('data', chunk => { output += chunk; });
  const removalDone = new Promise(resolve => removal.on('close', resolve));
  let waiting = false;
  for (let i = 0; i < 50 && !waiting; i += 1) {
    waiting = sql(`select count(*) from pg_stat_activity where application_name='${app}' and wait_event_type='Lock';`).trim() === '1';
    if (!waiting) await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(waiting, 'the removal waits on the meal row');
  writer.stdin.end(`insert into jobs(post_id,kind,priority,status)values('${post}','recompute',100,'queued');commit;\n`);
  await writerDone;
  assert.equal(await removalDone, 0);
  assert.equal(output.trim(), '', 'the removal queued nothing');
  assert.equal(sql(`select count(*) from post_items where post_id='${post}' and superseded_at is null;`).trim(), '2', 'both foods are still current');
  assert.equal(sql(`select count(*) from jobs where post_id='${post}';`).trim(), '1', 'only the other writer queued a job');
});
