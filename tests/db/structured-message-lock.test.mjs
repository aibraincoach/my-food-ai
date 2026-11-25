import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
const migration=readFileSync(new URL('../../supabase/migrations/0084_structured_comment_messages.sql',import.meta.url),'utf8');
const down=readFileSync(new URL('../../supabase/rollback/0084_structured_comment_messages.down.sql',import.meta.url),'utf8');
function context(){
 const db=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(db&&new URL(db).hostname==='127.0.0.1'&&process.env.MFA_TEST_DISPOSABLE==='1','Own disposable database required');
 const args=['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1'];
 const query=(sql,timeout=10000)=>{const r=spawnSync('psql',args,{input:sql,encoding:'utf8',timeout});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 return{args,query};
}
async function heldPosts(args){
 const child=spawn('psql',args,{stdio:['pipe','pipe','pipe']});
 let errors='';child.stderr.on('data',data=>{errors+=data;});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(Error('Own lock holder did not become ready'));},4000);
  child.once('error',error=>{clearTimeout(timer);reject(error);});
  child.once('exit',code=>{clearTimeout(timer);reject(Error('Own lock holder exited '+code+': '+errors));});
  child.stdout.on('data',data=>{if(String(data).includes('LOCK_HELD')){clearTimeout(timer);resolve();}});
  child.stdin.write("begin;lock table public.posts in access share mode;select 'LOCK_HELD';\n");
 });
 return async()=>{const done=new Promise(resolve=>child.once('close',resolve));child.stdin.end('rollback;\n\\q\n');await done;};
}
for(const variant of ['lock','statement'])test('0084 '+variant+' timeout under a held posts lock rolls back earlier ALTERs and leaves old text intact',async()=>{
 const{args,query}=context();const user=randomUUID(),post=randomUUID();
 query(down);
 query(`begin;insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','locked-${user}');insert into posts(id,user_id,status)values('${post}','${user}','ready');insert into post_comments(post_id,author,body)values('${post}','model','Historical text');commit;`);
 let release;
 try{
  release=await heldPosts(args);
  // Removing only the short lock guard proves that the independent 5s
  // statement guard still bounds the same actual DDL. This is local test SQL.
  const sql=variant==='lock'?migration:migration.replace("set local lock_timeout='1s';","set local lock_timeout='0';");
  const started=performance.now();
  const result=spawnSync('psql',args,{input:sql,encoding:'utf8',timeout:variant==='lock'?3500:7000});
  const elapsed=performance.now()-started;
  assert.ifError(result.error);
  assert.notEqual(result.status,0,'busy DDL must refuse, never commit');
  assert.match(result.stderr,variant==='lock'?/canceling statement due to lock timeout/:/canceling statement due to statement timeout/);
  assert.ok(elapsed<(variant==='lock'?3000:6500),'migration exceeded its short bound: '+elapsed);
  await release();release=null;
  const state=JSON.parse(query(`select json_build_object('message_column',exists(select 1 from information_schema.columns where table_schema='public' and table_name='post_comments' and column_name='message'),'pointer_column',exists(select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='summary_comment_id'),'new_helper',to_regprocedure('public.append_meal_summary(uuid,jsonb)') is not null,'old_text',(select body from post_comments where post_id='${post}'));`));
  assert.deepEqual(state,{message_column:false,pointer_column:false,new_helper:false,old_text:'Historical text'});
 }finally{
  if(release)await release();
  // Restore this disposable test schema after the failed rehearsal, never
  // an automatic production retry. Every fixture is removed explicitly.
  query(migration);
  query(`begin;delete from posts where id='${post}';delete from auth.users where id='${user}';commit;`);
 }
});
