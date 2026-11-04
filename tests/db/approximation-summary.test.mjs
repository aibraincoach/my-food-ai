import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('closest-record reanalysis refreshes its summary atomically behind job ownership and retry gates',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0051_approximation_summary.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0051_approximation_summary.down.sql',import.meta.url),'utf8');
 const input=`begin;
 ${migration}
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();j uuid:=gen_random_uuid();new_job uuid:=gen_random_uuid();
 expected jsonb;
 label text:='Nutrition for macaroni is taken from the closest USDA record, Pasta, cooked.';
 payload jsonb:='[{"name":"macaroni","portion_grams":50,"nutrition":{"calories":78.5,"protein_g":2,"carbs_g":15,"fat_g":0.5,"micronutrients":[],"source_ref":"2708357"}}]';
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'approximation-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into post_items(post_id,name,source)values(p,'macaroni','model');
 insert into post_comments(post_id,author,body)values(p,'model','Old unavailable summary');
 insert into jobs(id,post_id,kind,status,payload)values(j,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=j where id=p;
 perform persist_approximated_analysis(p,j,payload,label,null,'muse-spark-1.3','meta',false);
 if (select body from post_comments where post_id=p and author='model')<>label
 or not exists(select 1 from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p and n.calories=78.5 and n.source_ref='2708357')
 or not exists(select 1 from posts where id=p and status='ready' and identify_model='muse-spark-1.3') then raise exception 'Reanalysis did not commit source, label and ready together';end if;
 perform persist_approximated_analysis(p,j,payload,'Retry must not replace the committed label');
 if (select body from post_comments where post_id=p and author='model')<>label then raise exception 'Retry replaced committed summary';end if;
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 perform refresh_owned_approximation_summary(p,j,label,expected);
 begin
 perform refresh_owned_approximation_summary(p,j,'Wrong source must not replace summary','[]');
 raise exception 'Changed current items unexpectedly succeeded';
 exception when sqlstate 'PT409' then null;
 end;
 -- Removing the final approximate source must remove its old disclosure.
 perform refresh_owned_approximation_summary(p,j,'Consumed exact nutrition.',expected);
 if (select body from post_comments where post_id=p and author='model')<>'Consumed exact nutrition.' then raise exception 'Approximate to exact recompute kept stale label';end if;
 perform refresh_owned_approximation_summary(p,j,label,expected);
 update post_items set superseded_at=now() where post_id=p;
 perform refresh_owned_approximation_summary(p,j,'Consumed: 0 kcal.','[]');
 if (select body from post_comments where post_id=p and author='model')<>'Consumed: 0 kcal.' then raise exception 'Removing final approximate item kept stale label';end if;
 update post_items set superseded_at=null where post_id=p;
 update post_comments set body=label where post_id=p and author='model';
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,j,payload,'New exact reanalysis.');
 if (select body from post_comments where post_id=p and author='model')<>'New exact reanalysis.' then raise exception 'Exact reanalysis kept prior approximation label';end if;
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,j,payload,'Ordinary historical summary must not be rewritten.');
 if (select body from post_comments where post_id=p and author='model')<>'New exact reanalysis.' then raise exception 'Exact-only historical summary was rewritten';end if;
 update post_comments set body=label where post_id=p and author='model';
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 insert into jobs(id,post_id,kind,status,payload)values(new_job,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=new_job,status='processing',analysis_initialized_at=null where id=p;
 begin
 perform persist_approximated_analysis(p,j,payload,'Stale job must not replace summary');
 raise exception 'Stale job unexpectedly succeeded';
 exception when serialization_failure then null;
 end;
 begin
 perform refresh_owned_approximation_summary(p,j,'Stale recompute must not replace summary',expected);
 raise exception 'Stale recompute unexpectedly succeeded';
 exception when sqlstate 'PT409' then null;
 end;
 if (select body from post_comments where post_id=p and author='model')<>label then raise exception 'Stale job changed summary';end if;
 if has_function_privilege('anon','public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean)','EXECUTE')
 or has_function_privilege('authenticated','public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean)','EXECUTE') or has_function_privilege('anon','public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)','EXECUTE')
 or has_function_privilege('authenticated','public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'App clients may invoke approximation persistence';end if;
 end $test$;
 ${rollback}
 do $test$begin
 if to_regprocedure('public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean)') is not null
 or to_regprocedure('public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)') is not null
 or to_regprocedure('public.persist_owned_analysis(uuid,uuid,jsonb,text,jsonb)') is null
 or to_regprocedure('public.persist_identified_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean)') is null then raise exception 'Rollback changed original analysis entrypoints';end if;
 end $test$;
 select 'approximation-summary-ok';rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
 assert.match(out,/approximation-summary-ok/);
});
