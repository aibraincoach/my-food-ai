import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const url=process.env.LOCAL_TEST_DB_URL;
test('drink time moves atomically and generic item/servings/correction edits cannot contradict intake', {skip:!url},()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'disposable local database only');
 // Exercise just the trigger definitions in an isolated fixture schema; install no migration.
 const source=readFileSync(new URL('../supabase/migrations/0019_intake_logs_drink.sql',import.meta.url),'utf8');
 const triggers=source.slice(source.indexOf('create or replace function public.keep_drink_record_consistent'))
   .replaceAll('public.','drink_fixture.').replaceAll('search_path=public,','search_path=drink_fixture,');
 const result=execFileSync('psql',[url,'-X','-qAt','-v','ON_ERROR_STOP=1'],{encoding:'utf8',input:`
 begin;
 create schema drink_fixture;
 create table drink_fixture.posts(id uuid primary key,eaten_at timestamptz,servings numeric,status text);
 create table drink_fixture.intake_logs(id uuid default gen_random_uuid(),post_id uuid references drink_fixture.posts on delete set null,logged_at timestamptz,ml int);
 create table drink_fixture.post_items(id uuid default gen_random_uuid(),post_id uuid references drink_fixture.posts on delete cascade,name text,portion_grams numeric);
 ${triggers}
 insert into drink_fixture.posts values('00000000-0000-0000-0000-000000000001','2026-10-29 08:00Z',1,'ready');
 insert into drink_fixture.post_items(post_id,name,portion_grams) values('00000000-0000-0000-0000-000000000001','Coffee',240);
 insert into drink_fixture.intake_logs(post_id,logged_at,ml) values('00000000-0000-0000-0000-000000000001','2026-10-29 08:00Z',240);
 update drink_fixture.posts set eaten_at='2026-10-28 08:00Z';
 do $$ begin
 if (select logged_at from drink_fixture.intake_logs) <> '2026-10-28 08:00Z'::timestamptz then raise exception 'timestamp mismatch';end if;
 if (select coalesce(sum(ml),0) from drink_fixture.intake_logs where logged_at>='2026-10-29 00:00Z')<>0 then raise exception 'old day still counted';end if;
 if (select sum(ml) from drink_fixture.intake_logs where logged_at<'2026-10-29 00:00Z')<>240 then raise exception 'new day missing';end if;
 begin update drink_fixture.post_items set name='Milk',portion_grams=500;raise exception 'edit accepted';exception when invalid_parameter_value then null;end;
 begin insert into drink_fixture.post_items(post_id,name) select id,'Extra' from drink_fixture.posts;raise exception 'add accepted';exception when invalid_parameter_value then null;end;
 begin delete from drink_fixture.post_items;raise exception 'remove accepted';exception when invalid_parameter_value then null;end;
 begin update drink_fixture.posts set servings=2;raise exception 'servings accepted';exception when invalid_parameter_value then null;end;
 begin update drink_fixture.posts set status='queued';raise exception 'correction accepted';exception when invalid_parameter_value then null;end;
 if (select name from drink_fixture.post_items)<>'Coffee' then raise exception 'item changed';end if;
 end $$;
 delete from drink_fixture.posts;
 rollback;
 select 'drink_consistency_passed';`});
 assert.match(result,/drink_consistency_passed/);
});
