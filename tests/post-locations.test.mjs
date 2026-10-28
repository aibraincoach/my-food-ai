import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('locations are append-only and private to the post owner', () => {
  assert.ok(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL is required');
  const migration = readFileSync(new URL('../supabase/migrations/0006_post_locations.sql', import.meta.url), 'utf8');
  const sql = `
\\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
select to_regclass('public.post_locations') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner, gen_random_uuid() as other, gen_random_uuid() as post \\gset
insert into auth.users(id) values (:'owner'), (:'other');
insert into public.profiles(id,handle) values (:'owner','loc-' || :'owner'), (:'other','loc-' || :'other');
insert into public.posts(id,user_id) values (:'post', :'owner');
select set_config('test.location_post', :'post', true);
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', :'owner', 'role', 'authenticated')::text, true);
insert into public.post_locations(post_id,lat,lng,accuracy_m) values (:'post', 50, -100, 12);
do $$ declare changed int; begin
  if (select count(*) from public.post_locations where post_id = current_setting('test.location_post')::uuid) <> 1 then raise exception 'owner cannot read location'; end if;
  update public.post_locations set lat = 51 where post_id = current_setting('test.location_post')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'location can be updated'; end if;
  delete from public.post_locations where post_id = current_setting('test.location_post')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'location can be deleted directly'; end if;
end $$;
select set_config('request.jwt.claims', jsonb_build_object('sub', :'other', 'role', 'authenticated')::text, true);
do $$ begin
  if exists (select 1 from public.post_locations where post_id = current_setting('test.location_post')::uuid) then raise exception 'cross-user location leak'; end if;
  begin
    insert into public.post_locations(post_id,lat,lng) values (current_setting('test.location_post')::uuid,0,0);
    raise exception 'cross-user insert allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
select 'location-policies: passed';
rollback;`;
  const result = spawnSync('psql', ['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 60000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /location-policies: passed/);
});
