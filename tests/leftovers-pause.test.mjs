import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync,appendFileSync}from'node:fs';import{spawnSync}from'node:child_process';
const url=process.env.LOCAL_TEST_DB_URL;
test('emergency pause preserves two accepted leftovers and resumes queued work without blocking ordinary meals',{skip:!url},()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname));
 const script=name=>readFileSync(new URL('../supabase/rollback/'+name,import.meta.url),'utf8').replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,'').replaceAll('public.','leftovers_pause_fixture.').replaceAll('search_path=public,','search_path=leftovers_pause_fixture,');
 const sql=`\\set ON_ERROR_STOP on
begin;
create schema leftovers_pause_fixture;
create table leftovers_pause_fixture.posts(id uuid primary key);
create table leftovers_pause_fixture.post_media(id uuid primary key default gen_random_uuid(),post_id uuid,kind text default 'photo',not_eaten boolean default false);
create table leftovers_pause_fixture.jobs(id uuid primary key default gen_random_uuid(),post_id uuid,kind text,status text,payload jsonb default '{}',run_after timestamptz);
create table leftovers_pause_fixture.items(post_id uuid,grams numeric,leftovers_grams numeric,leftovers_calories numeric);
insert into leftovers_pause_fixture.posts values('10000000-0000-4000-8000-000000000001'),('10000000-0000-4000-8000-000000000002');
insert into leftovers_pause_fixture.post_media(post_id,not_eaten) values('10000000-0000-4000-8000-000000000001',true),('10000000-0000-4000-8000-000000000001',true);
insert into leftovers_pause_fixture.items values('10000000-0000-4000-8000-000000000001',30,70,140);
insert into leftovers_pause_fixture.jobs(post_id,kind,status,run_after) values('10000000-0000-4000-8000-000000000001','correct','queued','2026-11-02T00:00:00Z');
${script('0028_pause_leftovers.sql')}
do $$ begin
 if (select count(*) from leftovers_pause_fixture.post_media where not_eaten)<>2 or not exists(select 1 from leftovers_pause_fixture.items where grams=30 and leftovers_grams=70 and leftovers_calories=140) then raise exception 'Accepted records changed';end if;
 if not exists(select 1 from leftovers_pause_fixture.jobs where run_after='2100-01-01' and payload#>>'{leftovers_pause,run_after}' is not null) then raise exception 'Existing work not parked';end if;
 begin insert into leftovers_pause_fixture.post_media(post_id,not_eaten) values('10000000-0000-4000-8000-000000000001',false);raise exception 'Ordinary photo of affected meal accepted';exception when object_not_in_prerequisite_state then null;end;
 begin insert into leftovers_pause_fixture.post_media(post_id,not_eaten) values('10000000-0000-4000-8000-000000000002',true);raise exception 'New leftovers accepted';exception when object_not_in_prerequisite_state then null;end;
 begin update leftovers_pause_fixture.post_media set not_eaten=false;raise exception 'Existing marker removed';exception when object_not_in_prerequisite_state then null;end;
end $$;
insert into leftovers_pause_fixture.post_media(post_id,not_eaten) values('10000000-0000-4000-8000-000000000002',false);
insert into leftovers_pause_fixture.jobs(post_id,kind,status,run_after) values('10000000-0000-4000-8000-000000000002','analyze','queued','2026-11-02T01:00:00Z'),('10000000-0000-4000-8000-000000000001','remainder','queued','2026-11-02T02:00:00Z');
do $$ begin
 if not exists(select 1 from leftovers_pause_fixture.jobs where kind='analyze' and run_after='2026-11-02T01:00:00Z' and not(payload ? 'leftovers_pause')) then raise exception 'Unrelated work paused';end if;
 if not exists(select 1 from leftovers_pause_fixture.jobs where kind='remainder' and run_after='2100-01-01') then raise exception 'New affected work escaped pause';end if;
end $$;
${script('0028_resume_leftovers.sql')}
do $$ begin
 if exists(select 1 from leftovers_pause_fixture.jobs where payload ? 'leftovers_pause' or run_after='2100-01-01') then raise exception 'Work not resumed';end if;
 if not exists(select 1 from leftovers_pause_fixture.jobs where kind='correct' and run_after='2026-11-02T00:00:00Z') or not exists(select 1 from leftovers_pause_fixture.jobs where kind='remainder' and run_after='2026-11-02T02:00:00Z') then raise exception 'Deadlines not restored';end if;
 if (select count(*) from leftovers_pause_fixture.post_media where not_eaten)<>2 then raise exception 'Markers lost on resume';end if;
end $$;
rollback;
`;
 const r=spawnSync('psql',[url,'-X','-qAt'],{input:sql,encoding:'utf8',timeout:20000});assert.equal(r.status,0,r.stderr);
 if(process.env.FIXTURE_POST_LEDGER)for(const id of ['10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002'])appendFileSync(process.env.FIXTURE_POST_LEDGER,JSON.stringify({event:'local_rollback_fixture',id,postGone:true})+'\n');
});
