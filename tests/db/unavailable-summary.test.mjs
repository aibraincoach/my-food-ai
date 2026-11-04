import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {plainConsumed} from '../../src/lib/pipeline/wording.ts';
import {unavailableRef} from '../../src/lib/fdc/unavailable.ts';

test('unavailable disclosure refreshes atomically on reanalysis and recompute behind revision and job fences',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the disposable migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0054_unavailable_summary.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0054_unavailable_summary.down.sql',import.meta.url),'utf8');
 const ref=unavailableRef({code:'not_food',detail:'Fixture rejection'});
 const summary=plainConsumed({calories:null,protein_g:null,carbs_g:null,fat_g:null},[],[{name:'ceramic plate',sourceRef:ref}]);
 const quote=value=>"'"+value.replaceAll("'","''")+"'";
 const input=`begin;
 ${migration}
 do $test$
 declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();j uuid:=gen_random_uuid();other_job uuid:=gen_random_uuid();
 initial_comment uuid;current_comment uuid:=gen_random_uuid();expected jsonb;
 summary text:=${quote(summary)};
 payload jsonb:=jsonb_build_array(jsonb_build_object('name','ceramic plate','portion_grams',50,'nutrition',jsonb_build_object('source_ref',${quote(ref)},'micronutrients','[]'::jsonb)));
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'unavailable-summary-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing');
 insert into post_items(post_id,name,source)values(p,'ceramic plate','model');
 insert into post_comments(post_id,author,body)values(p,'model','Old unavailable summary')returning id into initial_comment;
 insert into jobs(id,post_id,kind,status,payload)values(j,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=j where id=p;
 perform persist_approximated_analysis(p,j,payload,summary);
 if (select body from post_comments where id=initial_comment)<>summary
 or not exists(select 1 from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p and n.source_ref=${quote(ref)}) then raise exception 'Reanalysis did not commit nutrition reason and first comment together';end if;
 perform persist_approximated_analysis(p,j,payload,'Retry must preserve summary');
 if (select body from post_comments where id=initial_comment)<>summary then raise exception 'Retry rewrote initialized summary';end if;
 -- Removing the reason through a new analysis clears the stale disclosure.
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,j,'[]','Exact reanalysis summary');
 if (select body from post_comments where id=initial_comment)<>'Exact reanalysis summary' then raise exception 'Exact reanalysis kept unavailable disclosure';end if;
 update posts set status='processing',analysis_initialized_at=null where id=p;
 perform persist_approximated_analysis(p,j,'[]','Do not rewrite ordinary exact history');
 if (select body from post_comments where id=initial_comment)<>'Exact reanalysis summary' then raise exception 'Exact-only history changed';end if;
 -- Recompute targets feedback's current revision and preserves prior comments.
 insert into post_comments(id,post_id,author,body,created_at)values(current_comment,p,'model','Current summary before reason',clock_timestamp()+interval '1 second');
 update posts set status='processing' where id=p;
 select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)),'[]'::jsonb) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 perform refresh_owned_approximation_summary(p,j,summary,expected);
 if (select body from post_comments where id=initial_comment)<>'Exact reanalysis summary'
 or (select body from post_comments where id=current_comment)<>summary then raise exception 'Recompute changed history or failed to add reason';end if;
 perform refresh_owned_approximation_summary(p,j,'Current exact summary',expected);
 if (select body from post_comments where id=current_comment)<>'Current exact summary' then raise exception 'Recompute kept removed reason';end if;
 -- Job ownership remains mandatory for both entrypoints.
 insert into jobs(id,post_id,kind,status,payload)values(other_job,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=other_job,status='processing',analysis_initialized_at=null where id=p;
 begin
 perform persist_approximated_analysis(p,j,payload,summary);
 raise exception 'Stale analysis unexpectedly succeeded';
 exception when serialization_failure then null;
 end;
 begin
 perform refresh_owned_approximation_summary(p,j,summary,expected);
 raise exception 'Stale recompute unexpectedly succeeded';
 exception when sqlstate 'PT409' then null;
 end;
 if (select body from post_comments where id=current_comment)<>'Current exact summary' then raise exception 'Stale job changed reason summary';end if;
 if has_function_privilege('authenticated','public.persist_approximated_analysis(uuid,uuid,jsonb,text,jsonb,text,text,boolean)','EXECUTE')
 or has_function_privilege('authenticated','public.refresh_owned_approximation_summary(uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'App clients can invoke summary persistence';end if;
 end $test$;
 ${rollback}
 select 'unavailable-summary-ok';rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
 assert.match(out,/unavailable-summary-ok/);
});
