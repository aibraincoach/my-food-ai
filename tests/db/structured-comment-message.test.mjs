import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const url=process.env.TEST_SQL_DATABASE_URL;
const summary={code:'mealSummary',values:{kind:'consumed',totals:{calories:100,protein_g:5,carbs_g:10,fat_g:2},approximations:[],unavailable:[]}};
const literal=value=>"'"+JSON.stringify(value).replaceAll("'","''")+"'::jsonb";
function run(prefix=''){
 assert.ok(url&&['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable local migrated database required');
 const input=`begin;set local statement_timeout='5s';${prefix}
 do $test$ declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();old_post uuid:=gen_random_uuid();j uuid:=gen_random_uuid();s uuid;q uuid;before_message jsonb;expected jsonb;copied uuid;saved uuid;
 message jsonb:=${literal(summary)};
 items jsonb:='[{"name":"Rice","portion_grams":100,"nutrition":{"calories":100,"protein_g":5,"carbs_g":10,"fat_g":2,"micronutrients":[],"source_ref":"1"}}]';
 question jsonb:='{"short":"Question","question":"Is this rice?","options":["Yes","No"]}';
 begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'structured-'||u);
 insert into posts(id,user_id,status)values(p,u,'processing'),(old_post,u,'ready');
 insert into post_comments(post_id,author,body)values(old_post,'model','Old summary stays English.');
 insert into jobs(id,post_id,kind,status,payload)values(j,p,'analyze','running','{"post_ownership":true}');
 update posts set active_job_id=j where id=p;
 -- Missing question text fails after the numeric work; the whole transaction rolls back.
 begin
  perform persist_analysis_with_question(p,j,items,message,'{"short":"Question"}'::jsonb);
  raise exception 'Invalid question was accepted';
 exception when check_violation then null;end;
 if exists(select 1 from post_comments where post_id=p) or exists(select 1 from current_post_items where post_id=p)
  or (select summary_comment_id from posts where id=p) is not null or (select analysis_initialized_at from posts where id=p) is not null then raise exception 'Failed writer committed partial state';end if;
 perform persist_analysis_with_question(p,j,items,message,question);
 select summary_comment_id into s from posts where id=p;
 select id into q from post_comments where post_id=p and body='Is this rice?';
 if s is null or q is null or s=q or (select c.message from post_comments c where c.id=s)<>message then raise exception 'Summary/question identities are not distinct';end if;
 perform persist_analysis_with_question(p,j,items,message,question);
 if (select count(*) from post_comments where post_id=p)<>2 or (select summary_comment_id from posts where id=p)<>s then raise exception 'Replay created a duplicate summary';end if;
 select jsonb_agg(jsonb_build_object('id',i.id,'source_ref',n.source_ref)) into expected from current_post_items i join item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 message:=jsonb_set(message,'{values,totals,calories}','200');
 perform refresh_owned_approximation_summary(p,j,message,expected);
 if (select c.message from post_comments c where c.id=s)<>message or (select body from post_comments where id=q)<>'Is this rice?' then raise exception 'Refresh changed the question or missed the pointed row';end if;
 -- The code guard must reject a pointer whose comment was changed to a non-summary.
 update post_comments set message='{"code":"editRemoved","values":{"name":"rice"}}' where id=s;
 begin perform refresh_owned_approximation_summary(p,j,message,expected);raise exception 'Non-summary code was refreshed';exception when invalid_parameter_value then null;end;
 -- Pointer cross-post integrity, even for the service role.
 begin update posts set summary_comment_id=s where id=old_post;raise exception 'Cross-post pointer accepted';exception when invalid_parameter_value or foreign_key_violation then null;end;
 -- A new correction owns a new structured summary, not the previous question.
 update post_comments set message=${literal(summary)} where id=s;
 update jobs set kind='correct',payload='{"post_ownership":true,"correction_from_sequence":0}' where id=j;
 insert into post_comments(post_id,author,body)values(p,'user','Use 120 grams') returning id into q;
 perform persist_correction_question(p,j,array(select id from current_post_items where post_id=p),q,items,message,question);
 if (select summary_comment_id from posts where id=p)=s or not exists(select 1 from post_comments where post_id=p and body='Is this rice?') then raise exception 'Correction did not create its own summary/question';end if;
 -- A photo correction writes a new summary pointer and keeps its model question separate.
 update jobs set status='finished' where id=j;
 j:=gen_random_uuid();
 insert into jobs(id,post_id,kind,status,payload)values(j,p,'correct','running','{"post_ownership":true,"photo_added":true,"correction_from_sequence":1,"correction_pending_ids":[]}');
 update posts set active_job_id=j where id=p;
 perform persist_photo_correction(p,j,array(select id from current_post_items where post_id=p),items,message,question);
 if (select summary_comment_id from posts where id=p) is null or not exists(select 1 from post_comments where post_id=p and body='Is this rice?') then raise exception 'Photo correction missed structured summary/question';end if;
 -- Copies do not copy comment history. A source pointer must never leak to the copy.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated')::text,true);
 update posts set status='ready' where id=p;
 copied:=copy_owned_post(p,now());
 if (select summary_comment_id from posts where id=copied) is not null or exists(select 1 from post_comments where post_id=copied) then raise exception 'Copied source summary pointer/history leaked';end if;
 saved:=save_meal_from_post(p,'Snapshot');
 copied:=copy_owned_saved_meal(saved,now());
 if (select summary_comment_id from posts where id=copied) is not null or exists(select 1 from post_comments where post_id=copied) then raise exception 'Saved copy summary pointer/history leaked';end if;
 -- Old rows have no pointer; refresh is a no-op, never a prose search or backfill.
 update jobs set status='finished' where id=j;update posts set active_job_id=null,status='ready' where id=p;
 perform refresh_owned_approximation_summary(old_post,null,message,'[]'::jsonb);
 if (select summary_comment_id from posts where id=old_post) is not null or (select count(*) from post_comments where post_id=old_post)<>1
 or (select body from post_comments where post_id=old_post)<>'Old summary stays English.' then raise exception 'Old history was rebuilt';end if;
 begin insert into post_comments(post_id,author)values(p,'model');raise exception 'Missing content accepted';exception when check_violation then null;end;
 begin insert into post_comments(post_id,author,message)values(p,'model','{"values":{}}');raise exception 'Missing code accepted';exception when check_violation then null;end;
 end $test$;
 rollback;`;
 const r=spawnSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',timeout:20000});assert.ifError(r.error);return r;
}
test('structured SQL writers preserve questions, fence retries and own one same-post summary pointer atomically',()=>{const r=run();assert.equal(r.status,0,r.stderr);});
test('refresh code guard rejects non-summary pointers and goes red when the guard is removed',()=>{
 const source=readFileSync(new URL('../../supabase/migrations/0084_structured_comment_messages.sql',import.meta.url),'utf8');
 const a=source.indexOf('create function public.refresh_owned_approximation_summary'),b=source.indexOf('revoke all on function public.refresh_owned_approximation_summary',a);
 const original=source.slice(a,b);
 const mutant=original.replace('create function','create or replace function').replace("and author='model' and message->>'code'='mealSummary'","and author='model'");
 assert.ok(!mutant.includes("message->>'code'='mealSummary'"));const r=run(mutant);assert.notEqual(r.status,0);assert.match(r.stderr,/Non-summary code was refreshed/);
});
