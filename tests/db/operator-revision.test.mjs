import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

// #985: an operator re-analysis or re-match (scripts/numbers) rewrites the meal's summary comment and
// refreshes its saved-meal copy; the same calls from an ordinary job change neither.
test('an operator job rewrites the summary comment and refreshes the saved-meal copy; an ordinary job does not',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0065_operator_revision.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0065_operator_revision.down.sql',import.meta.url),'utf8');
 const input=`begin;
 drop function if exists public.refresh_operator_saved_meal(uuid,uuid);
 ${migration}
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();plain_job uuid:=gen_random_uuid();operator_job uuid:=gen_random_uuid();
 first_comment uuid;item uuid;saved uuid;expected jsonb;
 payload jsonb:=jsonb_build_array(jsonb_build_object('name','black coffee','portion_grams',180,'portion_text','1 cup',
  'nutrition',jsonb_build_object('calories',2,'protein_g',0.2,'carbs_g',0,'fat_g',0,'source_ref','2710375','micronutrients','[]'::jsonb)));
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'operator-revision-'||u);
 insert into posts(id,user_id,status,save_as_meal)values(p,u,'processing',true);
 insert into post_items(post_id,name,source,portion_grams,portion_text)values(p,'black coffee','model',180,'1 cup')returning id into item;
 insert into item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,source_ref)values(item,112,3.7,18.5,2.6,'175224');
 insert into post_comments(post_id,author,body)values(p,'model','Consumed: 112 kcal')returning id into first_comment;
 insert into jobs(id,post_id,kind,status,payload)values(plain_job,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=plain_job,status='ready',analysis_initialized_at=clock_timestamp() where id=p;
 saved:=save_ready_meal(p);
 if saved is null or (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>112 then raise exception 'Fixture saved meal is wrong';end if;

 -- An ordinary re-analysis keeps an ordinary first comment (the rule of 0054), and refreshes no saved meal.
 update post_items set superseded_at=clock_timestamp() where post_id=p;
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,plain_job,payload,'Consumed: 2 kcal');
 if (select body from post_comments where id=first_comment)<>'Consumed: 112 kcal' then raise exception 'An ordinary re-analysis rewrote the first comment';end if;
 update posts set status='ready' where id=p;
 if refresh_operator_saved_meal(p,plain_job)<>0 or (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>112 then raise exception 'An ordinary job refreshed the saved meal';end if;

 -- The operator re-analysis: the first comment and the saved-meal copy take the new numbers.
 insert into jobs(id,post_id,kind,status,payload)values(operator_job,p,'analyze','running','{"operator":"reanalysis","post_ownership":true}');
 update post_items set superseded_at=clock_timestamp() where post_id=p and superseded_at is null;
 update posts set active_job_id=operator_job,status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,operator_job,payload,'Consumed: 2 kcal');
 if (select body from post_comments where id=first_comment)<>'Consumed: 2 kcal' then raise exception 'The operator re-analysis kept the old first comment';end if;
 if (select count(*) from post_comments where post_id=p and author='model')<>1 then raise exception 'The operator re-analysis added a comment';end if;
 update posts set status='processing' where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>0 then raise exception 'A meal that is not ready refreshed its saved meal';end if;
 update posts set status='ready' where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>1 then raise exception 'The operator job did not refresh the saved meal';end if;
 if (select items->0->'nutrition'->>'calories' from saved_meals where id=saved)::numeric<>2
 or (select count(*) from saved_meals where source_post_id=p)<>1 then raise exception 'The saved-meal copy kept the old numbers';end if;

 -- The operator re-match: recompute's summary refresh rewrites the current comment even when it is ordinary.
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)),'[]'::jsonb) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 update posts set active_job_id=plain_job,status='processing' where id=p;
 perform refresh_owned_approximation_summary(p,plain_job,'Consumed: 3 kcal',expected);
 if (select body from post_comments where id=first_comment)<>'Consumed: 2 kcal' then raise exception 'An ordinary recompute rewrote an ordinary comment';end if;
 update jobs set payload='{"operator":"rematch","post_ownership":true}' where id=operator_job;
 update posts set active_job_id=operator_job where id=p;
 perform refresh_owned_approximation_summary(p,operator_job,'Consumed: 3 kcal',expected);
 if (select body from post_comments where id=first_comment)<>'Consumed: 3 kcal' then raise exception 'The operator re-match kept the old comment';end if;

 -- A deleted meal and another meal's job refresh nothing; app clients cannot call the function.
 if refresh_operator_saved_meal(gen_random_uuid(),operator_job)<>0 then raise exception 'A job refreshed a meal that is not its own';end if;
 update posts set status='ready',deleted_at=clock_timestamp() where id=p;
 if refresh_operator_saved_meal(p,operator_job)<>0 then raise exception 'A deleted meal refreshed its saved meal';end if;
 if has_function_privilege('authenticated','public.refresh_operator_saved_meal(uuid,uuid)','EXECUTE')
 or has_function_privilege('anon','public.refresh_operator_saved_meal(uuid,uuid)','EXECUTE') then raise exception 'App clients can refresh a saved meal';end if;
 end $test$;
 ${rollback}
 do $down$ begin
 if to_regprocedure('public.refresh_operator_saved_meal(uuid,uuid)') is not null then raise exception 'The rollback kept the saved-meal refresh';end if;
 end $down$;
 select 'operator-revision-ok';rollback;`;
 const output=execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','--dbname',url,'-At'],{input,encoding:'utf8',timeout:60000});
 assert.match(output,/operator-revision-ok/);
});
