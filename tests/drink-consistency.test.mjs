import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const url=process.env.LOCAL_TEST_DB_URL;
test('drink time moves atomically and generic item/servings/correction edits cannot contradict intake', {skip:!url},()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'disposable local database only');
 // Exercise just the trigger definitions in an isolated fixture schema; install no migration.
 const source=readFileSync(new URL('../supabase/migrations/0019_intake_logs_drink.sql',import.meta.url),'utf8');
 const triggers=(source.slice(source.indexOf('create or replace function public.keep_drink_record_consistent'),source.indexOf('-- Only the server')) + source.slice(source.indexOf('create or replace function public.validate_drink_owner')))
   .replaceAll('public.','drink_fixture.').replaceAll('search_path=public,','search_path=drink_fixture,');
 const result=execFileSync('psql',[url,'-X','-qAt','-v','ON_ERROR_STOP=1'],{encoding:'utf8',input:`
 begin;
 create schema drink_fixture;
 create table drink_fixture.posts(id uuid primary key,user_id uuid,eaten_at timestamptz,servings numeric,status text);
 create table drink_fixture.intake_logs(id uuid default gen_random_uuid(),post_id uuid references drink_fixture.posts on delete set null,user_id uuid,logged_at timestamptz,ml int,kind text,amount numeric,label text not null);
 create table drink_fixture.post_items(id uuid default gen_random_uuid(),post_id uuid references drink_fixture.posts on delete cascade,name text,portion_grams numeric);
 create function drink_fixture.create_food_post(p_user_id uuid,p_eaten_at timestamptz,p_name text,p_grams numeric,p_nutrition jsonb) returns uuid language plpgsql as $$ declare p uuid:=gen_random_uuid();begin insert into drink_fixture.posts values(p,p_user_id,p_eaten_at,1,'ready');return p;end $$;
 ${triggers}
 insert into drink_fixture.posts values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','2026-10-29 08:00Z',1,'ready');
 insert into drink_fixture.post_items(post_id,name,portion_grams) values('00000000-0000-0000-0000-000000000001','Coffee',240);
 insert into drink_fixture.intake_logs(post_id,user_id,label,logged_at,ml) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','Coffee','2026-10-29 08:00Z',240);
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
 do $$ declare p uuid; n int;begin
 select count(*) into n from drink_fixture.posts;
 begin perform drink_fixture.create_drink_post('00000000-0000-0000-0000-000000000011',now(),'caffeine',240,null,95,'{}');raise exception 'null label accepted';exception when not_null_violation then null;end;
 if (select count(*) from drink_fixture.posts)<>n then raise exception 'partial drink published';end if;
 p:=drink_fixture.create_drink_post('00000000-0000-0000-0000-000000000011',now(),'water',330,'Water',0,'{}');
 if not exists(select 1 from drink_fixture.intake_logs i join drink_fixture.posts p on p.id=i.post_id where i.user_id='00000000-0000-0000-0000-000000000011' and i.logged_at=p.eaten_at and i.ml=330) then raise exception 'atomic link missing';end if;
 begin insert into drink_fixture.intake_logs(user_id,label,post_id,logged_at,ml) values('00000000-0000-0000-0000-000000000012','Water',p,now(),330);raise exception 'cross owner accepted';exception when insufficient_privilege then null;end;
 end $$;
 rollback;
 select 'drink_consistency_passed';`});
 assert.match(result,/drink_consistency_passed/);
});
