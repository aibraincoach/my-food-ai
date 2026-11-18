// Disposable local DB only. #684: 0068 lets a meal that already has a leftovers photo take another, as 0028 meant, and
// 0069's failure log takes a row only from the person it describes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const url = process.env.SUPABASE_DB_URL;
const psql = sql => spawnSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '--dbname', url], { input: sql, encoding: 'utf8', timeout: 60000 });
const migration = name => readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8');

test('a meal with a leftovers photo takes a second one, and the failure log accepts only the person\'s own rows', () => {
  assert.ok(url && ['localhost', '127.0.0.1'].includes(new URL(url).hostname), 'Disposable local database only');
  const user = randomUUID(), other = randomUUID(), post = randomUUID(), stage = randomUUID();
  const stagePath = `${user}/${stage}/0.jpg`;
  const setup = `\\set ON_ERROR_STOP on
begin;
${migration('0068_leftovers_again.sql')}
select to_regclass('public.upload_failures') is not null as failures_installed \\gset
\\if :failures_installed
\\else
${migration('0069_upload_failures.sql')}
\\endif
insert into auth.users(id,email) values('${user}','f35b-${user.slice(0, 8)}.invalid'),('${other}','f35b-${other.slice(0, 8)}.invalid');
insert into public.profiles(id,handle) values('${user}','f35b_${user.slice(0, 8)}'),('${other}','f35b_${other.slice(0, 8)}');
insert into public.posts(id,user_id,status,analysis_initialized_at) values('${post}','${user}','ready',now());
insert into public.post_media(post_id,storage_path,position,kind,not_eaten) values('${post}','${user}/${post}/0.jpg',0,'photo',false);
insert into public.post_media(post_id,storage_path,position,kind,not_eaten) values('${post}','${user}/${post}/1.jpg',1,'photo',true);
insert into public.jobs(post_id,kind,priority,status,run_after,payload) values(null,'media_cleanup',200,'queued',now()+interval '3 hours',
  jsonb_build_object('owner_id','${user}','deleted_post_id','${stage}','paths',jsonb_build_array('${stagePath}','${user}/${stage}/0.feed.jpg')));
insert into storage.objects(bucket_id,name) values('media','${stagePath}'),('media','${user}/${stage}/0.feed.jpg');
`;
  const attach = psql(`${setup}
select 'attached:'||position||':'||not_eaten from public.prepare_post_photo_attachment('${post}','${user}','${stagePath}',true);
rollback;`);
  assert.equal(attach.status, 0, attach.stderr);
  assert.match(attach.stdout, /attached:2:true/, 'a second leftovers photo is reserved at position 2');

  const log = psql(`${setup}
set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub','${user}','role','authenticated')::text,true);
insert into public.upload_failures(user_id,post_id,kind,stage,status,detail,bytes,mime,user_agent) values('${user}','${post}','attachment','encode',null,'NotReadableError: x',1234,'image/jpeg','Safari');
select 'own row added';
select 'rows visible:'||count(*) from public.upload_failures;
savepoint other;
insert into public.upload_failures(user_id,kind,stage) values('${other}','attachment','sign');
rollback;`);
  assert.match(log.stdout, /own row added/);
  assert.match(log.stdout, /rows visible:0/, 'a person cannot read the log back');
  assert.match(log.stderr, /row-level security/, 'a row for another person is refused');
});
