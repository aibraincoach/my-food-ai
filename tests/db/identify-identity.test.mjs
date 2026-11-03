// Disposable local DB: node --env-file=.env.local --test tests/db/identify-identity.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

test('committed model identity is atomic, replay-safe, job-fenced and service-managed',()=>{
 const url=process.env.SUPABASE_DB_URL;
 assert.ok(url);assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'Disposable local database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0032_identify_provider.sql',import.meta.url),'utf8');
 const addition=migration.slice(migration.indexOf('-- Successful identification provenance'));
 const sql=`\\set ON_ERROR_STOP on
begin;
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='identify_provider') as provider_installed \\gset
\\if :provider_installed
\\else
${migration}
\\endif
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='identify_model') as identity_installed \\gset
\\if :identity_installed
\\else
${addition}
\\endif
grant select,insert,update on posts to authenticated;
insert into auth.users(id,email) values('70000000-0000-4000-8000-000000000031','identity-one.invalid'),('70000000-0000-4000-8000-000000000032','identity-two.invalid');
insert into profiles(id,handle) values('70000000-0000-4000-8000-000000000031','identity_one'),('70000000-0000-4000-8000-000000000032','identity_two');
insert into posts(id,user_id,status) values('70000000-0000-4000-8000-000000000033','70000000-0000-4000-8000-000000000031','processing');
insert into jobs(id,post_id,kind,status,payload) values('70000000-0000-4000-8000-000000000034','70000000-0000-4000-8000-000000000033','analyze','running','{"post_ownership":true}');
update posts set active_job_id='70000000-0000-4000-8000-000000000034' where id='70000000-0000-4000-8000-000000000033';
select persist_identified_analysis('70000000-0000-4000-8000-000000000033','70000000-0000-4000-8000-000000000034','[{"name":"Rice","portion_grams":100,"nutrition":{"calories":100}}]','Consumed rice',null,'meta-models/muse-spark-open-1026','baseten');
do $$begin
 if not exists(select 1 from posts where id='70000000-0000-4000-8000-000000000033' and identify_host='baseten' and identify_model='meta-models/muse-spark-open-1026' and analysis_initialized_at is not null) then raise exception 'Committed identity missing';end if;
end$$;
-- Trace success alone, a replay, or an invalid failed transaction cannot relabel
-- the meal that is actually displayed.
select persist_identified_analysis('70000000-0000-4000-8000-000000000033','70000000-0000-4000-8000-000000000034','[]','Replay',null,'muse-spark-1.3','meta');
insert into model_calls(post_id,kind,started_at,duration_ms,request_text,response_text,error,model,host) values('70000000-0000-4000-8000-000000000033','spark_identify',now(),1,'{}','invalid HTTP 200 fallback',null,'muse-spark-1.3','meta');
do $$begin
 if (select identify_host from posts where id='70000000-0000-4000-8000-000000000033')<>'baseten' then raise exception 'Replay or failed fallback relabeled meal';end if;
 begin perform persist_identified_analysis('70000000-0000-4000-8000-000000000033','70000000-0000-4000-8000-000000000039','[]','Stale',null,'muse-spark-1.3','meta');raise exception 'Wrong job accepted';exception when serialization_failure then null;end;
end$$;
-- Prove an initial persistence exception rolls back the attribution with items.
insert into posts(id,user_id,status) values('70000000-0000-4000-8000-000000000035','70000000-0000-4000-8000-000000000031','processing');
insert into jobs(id,post_id,kind,status,payload) values('70000000-0000-4000-8000-000000000036','70000000-0000-4000-8000-000000000035','analyze','running','{"post_ownership":true}');
update posts set active_job_id='70000000-0000-4000-8000-000000000036' where id='70000000-0000-4000-8000-000000000035';
do $$begin
 begin perform persist_identified_analysis('70000000-0000-4000-8000-000000000035','70000000-0000-4000-8000-000000000036','[{"name":"Bad","nutrition":{"calories":"bad-number"}}]','Invalid',null,'muse-spark-1.3','meta');raise exception 'Invalid items committed';exception when invalid_text_representation then null;end;
 if exists(select 1 from posts where id='70000000-0000-4000-8000-000000000035' and (identify_model is not null or analysis_initialized_at is not null)) then raise exception 'Failed transaction changed identity';end if;
end$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000031',true);
do $$begin
 begin update posts set identify_host='meta',identify_model='muse-spark-1.3' where id='70000000-0000-4000-8000-000000000033';raise exception 'Owner spoofed identity';exception when insufficient_privilege then null;end;
 begin insert into posts(user_id,identify_model,identify_host) values(auth.uid(),'muse-spark-1.3','meta');raise exception 'Insert spoofed identity';exception when insufficient_privilege then null;end;
 begin perform persist_identified_analysis('70000000-0000-4000-8000-000000000033',null,'[]','Spoof',null,'muse-spark-1.3','meta');raise exception 'Owner called worker RPC';exception when insufficient_privilege then null;end;
end$$;
select set_config('request.jwt.claim.sub','70000000-0000-4000-8000-000000000032',true);
do $$begin if exists(select 1 from posts where id='70000000-0000-4000-8000-000000000033') then raise exception 'Cross-owner identity read';end if;end$$;
rollback;`;
 const r=spawnSync('psql',['-X','-qAt','--dbname',url],{input:sql,encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr);
});
