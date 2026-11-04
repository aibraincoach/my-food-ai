import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('a question beside a meal saves with its items, ready flip and comment, or not at all (#626)',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0059_question_atomic.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0059_question_atomic.down.sql',import.meta.url),'utf8');
 const input=`begin;
 ${migration}
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();j uuid:=gen_random_uuid();
 payload jsonb:=jsonb_build_array(jsonb_build_object('name','glass of beer','portion_grams',330,'nutrition',jsonb_build_object('calories',142,'micronutrients','[]'::jsonb)));
 q jsonb:='{"short":"Clarification needed","question":"Which beer is it?","options":["Lager","Stout"]}';
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'question-atomic-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into jobs(id,post_id,kind,status,payload)values(j,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=j where id=p;
 -- Part-way failure: items, ready flip and question are written, then the comment insert fails (no question text).
 begin
  perform persist_analysis_with_question(p,j,payload,'Fixture summary','{"short":"Clarification needed","options":["Lager"]}'::jsonb);
  raise exception 'A question without text was saved';
 exception when not_null_violation then null;
 end;
 if exists(select 1 from current_post_items where post_id=p) or exists(select 1 from post_comments where post_id=p)
 or (select status from posts where id=p)<>'processing' or (select question from posts where id=p) is not null
 or (select analysis_initialized_at from posts where id=p) is not null then raise exception 'A part-way failure left part of the question save behind';end if;
 -- Success: all of it lands together.
 if not persist_analysis_with_question(p,j,payload,'Fixture summary',q) then raise exception 'The question meal did not publish';end if;
 if (select status from posts where id=p)<>'ready' or (select question from posts where id=p)<>q
 or (select count(*) from post_comments where post_id=p and author='model' and body='Which beer is it?')<>1
 or not exists(select 1 from current_post_items where post_id=p) then raise exception 'The question meal did not save as one unit';end if;
 if has_function_privilege('authenticated','public.persist_analysis_with_question(uuid,uuid,jsonb,text,jsonb,text,text,boolean)','EXECUTE') then raise exception 'App clients can invoke the question save';end if;
 end $test$;
 ${rollback}
 select 'question-atomic-ok';rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
 assert.match(out,/question-atomic-ok/);
});
