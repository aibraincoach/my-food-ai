import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {sendFeedback} from '../src/lib/posts/feedback.ts';
test('feedback sends and broadcasts the displayed immutable revision',async()=>{
 const oldFetch=globalThis.fetch,oldWindow=globalThis.window;let sent,event;
 try{
  globalThis.fetch=async(_url,init)=>{sent=JSON.parse(init.body);return new Response(null,{status:204});};
  globalThis.window={dispatchEvent:value=>{event=value;}};
  await sendFeedback('post','up','displayed-model','fingerprint');
  assert.deepEqual(sent,{verdict:'up',modelCommentId:'displayed-model',fingerprint:'fingerprint'});
  assert.equal(event.detail.modelCommentId,'displayed-model');
 }finally{globalThis.fetch=oldFetch;globalThis.window=oldWindow;}
});
test('feedback revision belongs to owned model comment and never follows later replies',()=>{
 assert.ok(process.env.SUPABASE_DB_URL,'SUPABASE_DB_URL required');
 const itemsMigration=readFileSync(new URL('../supabase/migrations/0007_post_items_supersede.sql',import.meta.url),'utf8');
 const migration=readFileSync(new URL('../supabase/migrations/0007c_feedback_revision.sql',import.meta.url),'utf8');
 const sql=`
\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
select to_regprocedure('public.mark_post_ready(uuid)') is not null as items_installed \\gset
\\if :items_installed
\\else
${itemsMigration}
\\endif
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_feedback' and column_name='model_comment_id') as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner,gen_random_uuid() as other \\gset
insert into auth.users(id)values(:'owner'),(:'other');
insert into profiles(id,handle)values(:'owner','vote-'||:'owner'),(:'other','vote-'||:'other');
insert into posts(user_id,status)values(:'owner','ready')returning id as post \\gset
insert into posts(user_id,status)values(:'other','ready')returning id as other_post \\gset
insert into post_comments(post_id,author,body)values(:'post','model','First')returning id as first \\gset
insert into post_comments(post_id,author,body)values(:'post','user','User')returning id as user_comment \\gset
insert into post_comments(post_id,author,body)values(:'other_post','model','Other')returning id as other_comment \\gset
select set_config('test.post',:'post',true),set_config('test.owner',:'owner',true),set_config('test.first',:'first',true),set_config('test.user_comment',:'user_comment',true),set_config('test.other_comment',:'other_comment',true);
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
select save_revision_feedback(:'post',:'first',feedback_revision(:'post')->>'fingerprint','up');
do $t$ begin
 begin
  update post_feedback set model_comment_id=current_setting('test.user_comment')::uuid where post_id=current_setting('test.post')::uuid;
  raise exception 'User comment accepted';
 exception when insufficient_privilege then null;end;
 begin
  update post_feedback set model_comment_id=current_setting('test.other_comment')::uuid where post_id=current_setting('test.post')::uuid;
  raise exception 'Other meal accepted';
 exception when insufficient_privilege then null;end;
end;$t$;
reset role;
insert into post_comments(post_id,author,body)values(:'post','model','Later correction');
do $t$ begin
 if (select model_comment_id from post_feedback where post_id=current_setting('test.post')::uuid)<>current_setting('test.first')::uuid then raise exception 'Approval moved to new revision';end if;
end;$t$;
select set_config('test.fingerprint',feedback_revision(:'post')->>'fingerprint',true);
insert into post_items(post_id,name,source,portion_grams)values(:'post','Manual added food','user',50);
set local role authenticated;
do $t$ begin
 begin
  perform save_revision_feedback(current_setting('test.post')::uuid,current_setting('test.first')::uuid,current_setting('test.fingerprint'),'up');
  raise exception 'Stale manual-edit vote accepted';
 exception when serialization_failure then null;end;
 perform save_revision_feedback(current_setting('test.post')::uuid,current_setting('test.first')::uuid,feedback_revision(current_setting('test.post')::uuid)->>'fingerprint','up');
end;$t$;
reset role;
rollback;
`;
 const result=spawnSync('psql',['-X','-q','--dbname',process.env.SUPABASE_DB_URL],{input:sql,encoding:'utf8',timeout:60000});
 assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
});
test('feed never binds a new revision to data hydrated across a correction commit',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {getPostCard}=await import('../src/lib/posts/feed.ts');
 let revisions=[{modelCommentId:'old',fingerprint:'a'},{modelCommentId:'new',fingerprint:'b'}];
 const client=createClient('http://localhost:1234','test',{global:{fetch:async(input)=>{
  const url=new URL(input);let data=[];
  if(url.pathname.endsWith('/posts'))data={id:'post',status:'ready',caption:'',created_at:'2026-10-27',eaten_at:'2026-10-27'};
  if(url.pathname.endsWith('/rpc/feedback_revision'))data=revisions.shift();
  return new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
 }}});
 assert.equal((await getPostCard(client,'post')).modelCommentId,null);
 revisions=[{modelCommentId:'new',fingerprint:'b'},{modelCommentId:'new',fingerprint:'b'}];assert.equal((await getPostCard(client,'post')).modelCommentId,'new');
 revisions=[{modelCommentId:'new',fingerprint:'b'},{modelCommentId:'new',fingerprint:'c'}];
 assert.equal((await getPostCard(client,'post')).modelCommentId,null);
});
