import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('saving a processing meal is refused; its ready version saves under the same owner',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const input=`begin;
 select gen_random_uuid() as u,gen_random_uuid() as p \\gset
 insert into auth.users(id)values(:'u');
 insert into profiles(id,handle)values(:'u','save-not-ready-'||:'u');
 insert into posts(id,user_id,status)values(:'p',:'u','processing');
 insert into post_items(post_id,name,source)values(:'p','rice','model');
 select set_config('test.post_id',:'p',true);
 set local role authenticated;
 select set_config('request.jwt.claims',json_build_object('sub',:'u')::text,true);
 do $test$begin
 begin
 perform save_meal_from_post(current_setting('test.post_id')::uuid,'x');
 raise exception 'Processing meal was unexpectedly saved';
 exception when sqlstate '42501' then null;
 end;
 end $test$;
 reset role;
 update posts set status='ready' where id=:'p';
 set local role authenticated;
 do $test$declare saved uuid;begin
 saved:=save_meal_from_post(current_setting('test.post_id')::uuid,'x');
 if saved is null then raise exception 'Ready meal was not saved';end if;
 end $test$;
 select 'saved-meal-not-ready-ok';rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
 assert.match(out,/saved-meal-not-ready-ok/);
});
