import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const migration=name=>readFileSync(new URL(`../supabase/migrations/${name}`,import.meta.url),'utf8');

test('a question preserves queued follow-up work and cannot publish its stale card',()=>{
  assert.ok(process.env.SUPABASE_DB_URL);
  const sql=`\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
select to_regprocedure('public.mark_post_ready(uuid)') is not null as installed \\gset
\\if :installed
\\else
${migration('0007_post_items_supersede.sql')}
\\endif
select to_regprocedure('public.append_post_comment(uuid,uuid,text)') is not null as installed \\gset
\\if :installed
\\else
${migration('0007b_comment_corrections.sql')}
\\endif
select to_regprocedure('public.results_card_snapshot(uuid)') is not null as installed \\gset
\\if :installed
\\else
${migration('0008_post_media_kind.sql')}
\\endif
select to_regprocedure('public.persist_correction_question(uuid,uuid,uuid[],uuid,jsonb,text,jsonb)') is not null as installed \\gset
\\if :installed
\\else
${migration('0011_posts_needs_input.sql')}
\\endif
do $$ declare u uuid:=gen_random_uuid();p uuid;j uuid;j2 uuid;c public.post_comments;c2 public.post_comments;s jsonb;begin
 insert into auth.users(id)values(u);
 insert into profiles(id,handle)values(u,'question-order-'||u);
 insert into posts(user_id,status)values(u,'ready')returning id into p;
 c:=append_post_comment(p,u,'Was this rice?');
 select id into j from jobs where post_id=p and status='queued';
 update jobs set status='running',payload=jsonb_build_object('correction_from_sequence',0,'correction_pending_ids',jsonb_build_array(c.id))where id=j;
 update posts set active_job_id=j where id=p;
 c2:=append_post_comment(p,u,'It was pasta');
 perform persist_correction_question(p,j,array[]::uuid[],c.id,'[]','Consumed: 0 kcal.','{"question":"Rice or pasta?","short":"Clarification needed","options":["Rice","Pasta"]}');
 if(select status from posts where id=p)<>'queued'then raise exception 'question hid queued answer';end if;
 if(select count(*)from post_comments where post_id=p and author='model')<>1 then raise exception 'question wrote duplicate model replies';end if;
 select id into j2 from jobs where post_id=p and status='queued';
 if j2 is null then raise exception 'follow-up missing';end if;
 s:=results_card_snapshot(p);
 update posts set status='ready' where id=p;
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,(select active_job_id from posts where id=p))->>'published')::boolean then raise exception 'pending answer was published ready';end if;
 if(select status from posts where id=p)<>'queued'then raise exception 'pending answer left ready status';end if;
 update jobs set status='running',payload=jsonb_build_object('correction_from_sequence',1,'correction_pending_ids',jsonb_build_array(c2.id))where id=j2;
 update posts set active_job_id=j2 where id=p;
 perform persist_correction(p,j2,array[]::uuid[],c2.id,'[]','Consumed: 0 kcal.');
 s:=results_card_snapshot(p);
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,j)->>'published')::boolean then raise exception 'prior owner published clarification';end if;
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,null)->>'published')::boolean then raise exception 'unowned render bypassed owner';end if;
 if not(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,(select active_job_id from posts where id=p))->>'published')::boolean then raise exception 'resolved follow-up could not publish';end if;
 if exists(select 1 from posts where id=p and (status<>'ready' or needs_input is not null))then raise exception 'ready publication exposed stale clarification';end if;
 update post_media set storage_path=gen_random_uuid()||'/'||gen_random_uuid()||'/cards/'||gen_random_uuid()||'/card.png' where post_id=p and kind='card';
 if publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,(select active_job_id from posts where id=p))->>'old_path' is not null then raise exception 'clarification publisher returned foreign cleanup path';end if;
 update posts set status='failed',fail_reason='Correction failed' where id=p;
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,(select active_job_id from posts where id=p))->>'published')::boolean then raise exception 'stale card cleared failed correction';end if;
 if(select status from posts where id=p)<>'failed'then raise exception 'failed state changed';end if;
 update posts set status='queued' where id=p;
 if not(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,(select active_job_id from posts where id=p))->>'published')::boolean then raise exception 'explicit retry blocked';end if;
end $$;
do $$ declare u uuid:=gen_random_uuid();p uuid;i uuid;replacement uuid;initial_question jsonb:='{"question":"How much rice?","short":"Portion needed","options":["50g","100g"]}';begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'initial-question-'||u);
 insert into posts(user_id,status)values(u,'queued')returning id into p;
 perform persist_analysis_question(p,'[{"name":"Rice","portion_grams":100,"nutrition":{"calories":200}}]','Summary',initial_question);
 if not exists(select 1 from posts where id=p and analysis_initialized_at is not null and status='needs_input')then raise exception 'initial question did not initialize';end if;
 select id into i from current_post_items where post_id=p;
 replacement:=edit_post_item(p,u,'portion',i,null,50,null);
 perform persist_analysis_question(p,'[]','Retry','{"question":"Stale retry?","short":"Stale","options":["A","B"]}');
 if not exists(select 1 from current_post_items where id=replacement and portion_grams=50)then raise exception 'question retry replaced edit';end if;
 if not exists(select 1 from posts where id=p and needs_input=initial_question and status='queued')then raise exception 'question retry restored stale clarification';end if;
 if (select count(*)from post_comments where post_id=p and author='model')<>1 then raise exception 'question retry duplicated comment';end if;
end $$;
do $$ declare u uuid:=gen_random_uuid();p uuid;j uuid;c public.post_comments;s jsonb;
 q jsonb:='{"question":"Rice or pasta?","short":"Clarification needed","options":["Rice","Pasta"]}';begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'question-replay-'||u);
 insert into posts(user_id,status)values(u,'processing')returning id into p;
 insert into jobs(post_id,kind,status,attempts,payload)values(p,'analyze','running',1,'{"post_ownership":true}')returning id into j;
 update posts set active_job_id=j where id=p;
 perform persist_owned_analysis(p,j,'[]','Question',q);
 -- Persistence succeeded but finishing failed; retry takes ownership again.
 perform fail_job(j,'finish response timed out',true);
 update jobs set status='running',attempts=2 where id=j;update posts set status='processing' where id=p;
 s:=results_card_snapshot(p);
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,j)->>'published')::boolean then raise exception 'initial question replay published ready';end if;
 if not exists(select 1 from posts where id=p and status='needs_input' and needs_input=q)then raise exception 'initial question was lost';end if;
 update jobs set status='finished' where id=j;
 c:=append_post_comment(p,u,'Maybe rice');select id into j from jobs where post_id=p and status='queued';
 update jobs set status='running',attempts=1,payload=jsonb_build_object('post_ownership',true,'correction_from_sequence',0,'correction_pending_ids',jsonb_build_array(c.id))where id=j;
 update posts set active_job_id=j,status='processing' where id=p;
 perform persist_correction_question(p,j,array[]::uuid[],c.id,'[]','Question',q);
 perform fail_job(j,'finish response timed out',true);
 update jobs set status='running',attempts=2 where id=j;update posts set status='processing' where id=p;
 s:=results_card_snapshot(p);
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,j)->>'published')::boolean then raise exception 'correction question replay published ready';end if;
 if not exists(select 1 from posts where id=p and status='needs_input' and needs_input=q)then raise exception 'correction question was lost';end if;
 update jobs set status='finished' where id=j;
 insert into jobs(post_id,kind,status,payload)values(p,'correct','running','{"post_ownership":true}')returning id into j;
 update posts set active_job_id=j,status='processing' where id=p;
 if not complete_empty_correction(p,j)then raise exception 'empty correction could not finish';end if;
 if(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,j)->>'published')::boolean then raise exception 'empty correction answered a question';end if;
 update jobs set status='finished' where id=j;
 -- A later actual answer advances the sequence and may clear the question.
 c:=append_post_comment(p,u,'It was pasta');select id into j from jobs where post_id=p and status='queued';
 update jobs set status='running',payload=jsonb_build_object('post_ownership',true,'correction_from_sequence',1,'correction_pending_ids',jsonb_build_array(c.id))where id=j;
 update posts set active_job_id=j,status='processing' where id=p;
 perform persist_correction(p,j,array[]::uuid[],c.id,'[]','Pasta.');
 -- The answer committed, but a successor recompute owns final publication.
 update jobs set status='finished' where id=j;
 insert into jobs(post_id,kind,status,payload)values(p,'recompute','running','{"post_ownership":true}')returning id into j;
 update posts set active_job_id=j,status='processing' where id=p;
 s:=results_card_snapshot(p);
 if not(publish_results_card(p,s->>'fingerprint',u||'/'||p||'/cards/'||gen_random_uuid()||'/card.png',1080,j)->>'published')::boolean then raise exception 'successor recompute lost the actual answer';end if;
 if exists(select 1 from posts where id=p and needs_input is not null)then raise exception 'resolved question remains';end if;
end $$;
select 'clarification-order: passed';
rollback;`;
  const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:60000});
  assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/clarification-order: passed/);
});
