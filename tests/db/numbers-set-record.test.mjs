import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';

test('set-record guards and same-name bridge preserve each original and queue one operator job', t => {
 const url=process.env.SUPABASE_DB_URL;
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname));
 const sql=input=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',url],{input,encoding:'utf8',timeout:10000});
 const user=randomUUID(),post=randomUUID(),item=randomUUID(),other=randomUUID();
 t.after(()=>sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`));
 sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','setrecord-${user.slice(0,8)}');
 insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
 insert into post_items(id,post_id,name,source,portion_grams)values('${item}','${post}','Lemon wedge','model',10),('${other}','${post}','rice','model',100);
 insert into item_nutrition(post_item_id,source_ref,calories,protein_g,carbs_g,fat_g)values('${item}','168946',16.2,1,2,3),('${other}','170000',130,2,28,1);`);
 const run=(fdc='2709168')=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',url,'-v',`post=${post}`,'-v',`item=${item}`,'-v',`fdc=${fdc}`,'-f',fileURLToPath(new URL('../../scripts/numbers/27-set-record.sql',import.meta.url))],{encoding:'utf8',timeout:10000});
 assert.equal(run('168946').trim(),'','same record refused');
 assert.equal(run('0').trim(),'','zero id refused');
 sql(`update post_items set not_eaten_grams=2 where id='${item}'`);assert.equal(run().trim(),'','leftovers refused');
 sql(`update post_items set not_eaten_grams=null where id='${item}';update posts set deleted_at=now() where id='${post}'`);assert.equal(run().trim(),'','deleted refused');
 sql(`update posts set deleted_at=null where id='${post}';insert into jobs(post_id,kind,status)values('${post}','recompute','queued')`);assert.equal(run().trim(),'','queued job refused');
 sql(`delete from jobs where post_id='${post}'`);
 assert.match(run(),/recompute/);
 const rows=JSON.parse(sql(`select json_agg(json_build_object('id',i.id,'supersedes',i.supersedes,'old',i.superseded_at is not null,'name',i.name,'n',to_jsonb(n))) from post_items i left join item_nutrition n on n.post_item_id=i.id where i.post_id='${post}';`));
 assert.equal(rows.filter(r=>!r.old).length,2);
 const chosen=rows.find(r=>!r.old&&r.name==='Lemon wedge'),bridge=rows.find(r=>r.id===chosen.supersedes);
 assert.equal(bridge.old,true);assert.equal(bridge.supersedes,item);assert.equal(bridge.n.source_ref,'2709168');
 for(const k of ['calories','protein_g','carbs_g','fat_g','fibre_g','sugar_g','sodium_mg'])assert.equal(bridge.n[k],null,k);
 assert.deepEqual(bridge.n.micronutrients,[]);
 assert.equal(rows.find(r=>!r.old&&r.name==='rice').supersedes,other);
 assert.equal(rows.find(r=>r.id===item).n.calories,16.2);
 assert.equal(sql(`select count(*) from jobs where post_id='${post}' and payload='{"operator":"set-record"}'::jsonb`).trim(),'1');
});

// Scripted worker completion deliberately injects each fault. SQL and CLI restore are real on throwaway PG.
test('set-record puts back each scripted worker fault before continuing', {timeout:120000}, async t=>{
 const {mkdtempSync,writeFileSync,readFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');const path=await import('node:path');
 const url=process.env.SUPABASE_DB_URL;
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname));
 const sql=input=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',url],{input,encoding:'utf8',timeout:10000});
 const dir=mkdtempSync(path.join(tmpdir(),'set-record-fault-')),user=randomUUID();
 t.after(()=>{try{sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`);}finally{rmSync(dir,{recursive:true,force:true});}});
 sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','fault-${user.slice(0,8)}');`);
 const preload=path.join(dir,'fault.mjs');
 writeFileSync(preload,`import {execFileSync}from'node:child_process';
 const run=input=>execFileSync('psql',['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',process.env.SUPABASE_DB_URL],{input,encoding:'utf8',timeout:10000});
 globalThis.fetch=async url=>{
  if(String(url)!=='http://127.0.0.1:1/api/jobs/tick')throw Error('Fixture tick only');
  const p=process.env.FAULT_POST||run("select j.post_id from jobs j join posts p on p.id=j.post_id where p.user_id='"+process.env.FAULT_USER+"'and j.status='queued'order by j.created_at limit 1").trim();
  const restoring=run("select count(*) from jobs where post_id='"+p+"'and status='queued'and payload->>'operator'='restore'").trim()==='1';
  if(!restoring){
   run("insert into item_nutrition(post_item_id,source_ref,calories,protein_g,carbs_g,fat_g,fibre_g,sugar_g,sodium_mg,micronutrients) select i.id,n.source_ref,case when n.source_ref='2709168'then 2.9 else n.calories end,n.protein_g,n.carbs_g,n.fat_g,n.fibre_g,n.sugar_g,n.sodium_mg,n.micronutrients from current_post_items i join item_nutrition n on n.post_item_id=i.supersedes where i.post_id='"+p+"';");
   const current="select id from current_post_items where post_id='"+p+"'and name='";
   const chosen=current+"Lemon wedge'",other=current+"Rice'";
   const faults={
    'other-value':"update item_nutrition set calories=999 where post_item_id=("+other+")",
    'other-name':"update post_items set name='Changed' where id=("+other+")",
    'other-grams':"update post_items set portion_grams=999 where id=("+other+")",
    'wrong-record':"update item_nutrition set source_ref='9' where post_item_id=("+chosen+")",
    'null-calories':"update item_nutrition set calories=null where post_item_id=("+chosen+")",
    'food-count':"update post_items set superseded_at=now() where id=("+other+")",
   };
   if(faults[process.env.FAULT_KIND])run(faults[process.env.FAULT_KIND]);
  }
  const state=!restoring&&['failed','needs_input'].includes(process.env.FAULT_KIND)?process.env.FAULT_KIND:'ready';
  run("update jobs set status='finished',finished_at=now()where post_id='"+p+"'and status='queued';update posts set status='"+state+"'where id='"+p+"';");
  return new Response(null,{status:204});
 };`);
 for(const fault of ['other-value','other-name','other-grams','wrong-record','null-calories','food-count','failed','needs_input']){
  const post=randomUUID(),chosen=randomUUID(),other=randomUUID();
  sql(`insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
  insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${chosen}','${post}','Lemon wedge','model',10,'10 g'),('${other}','${post}','Rice','model',100,'100 g');
  insert into item_nutrition(post_item_id,source_ref,calories,protein_g,carbs_g,fat_g,micronutrients)values('${chosen}','168946',16.2,1,2,3,'[]'),('${other}','170000',130,2,28,1,'[]');
  insert into post_comments(post_id,author,body)values('${post}','model','Original summary.');`);
  const before=sql(`select json_agg(to_jsonb(n) order by n.post_item_id)from item_nutrition n join current_post_items i on i.id=n.post_item_id where i.post_id='${post}';`).trim();
  const file=path.join(dir,fault+'.jsonl'),ledger=path.join(dir,fault);
  writeFileSync(file,JSON.stringify({meal:post.slice(0,8),item:chosen,fdc:2709168,description:'Lemon, raw'})+'\n');
  const out=execFileSync(process.execPath,['--import',preload,'scripts/numbers/reanalyse.mjs','run','--mode=set-record','--foods-file='+file,'--ledger='+ledger,'--wait-seconds=10'],{encoding:'utf8',timeout:15000,env:{...process.env,APP_URL:'http://127.0.0.1:1',FAULT_POST:post,FAULT_KIND:fault}});
  const entry=JSON.parse(readFileSync(path.join(ledger,'ledger.jsonl'),'utf8').trim());
  assert.equal(entry.outcome,'restored',fault+out);assert.equal(entry.restored,true);assert.ok(entry.restore_reason);
  const after=sql(`select json_agg(to_jsonb(n) order by n.post_item_id)from item_nutrition n join current_post_items i on i.id=n.post_item_id where i.post_id='${post}';`).trim();
  assert.equal(after,before,fault+' restores original nutrition and ids');
  assert.equal(sql(`select status from posts where id='${post}'`).trim(),'ready');
  assert.equal(sql(`select body from post_comments where post_id='${post}' and author='model'`).trim(),'Original summary.');
 }
 const posts=[];
 for(let index=0;index<3;index++){
  const post=randomUUID(),chosen=randomUUID(),other=randomUUID();posts.push({post,chosen});
  sql(`insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());
  insert into post_items(id,post_id,name,source,portion_grams,portion_text)values('${chosen}','${post}','Lemon wedge','model',10,'10 g'),('${other}','${post}','Rice','model',100,'100 g');
  insert into item_nutrition(post_item_id,source_ref,calories,protein_g,carbs_g,fat_g,micronutrients)values('${chosen}','168946',16.2,1,2,3,'[]'),('${other}','170000',130,2,28,1,'[]');`);
 }
 const choices=path.join(dir,'three.jsonl'),ledger=path.join(dir,'three');
 writeFileSync(choices,posts.map(({post,chosen})=>JSON.stringify({meal:post.slice(0,8),item:chosen,fdc:2709168,description:'Lemon, raw'})).join('\n')+'\n');
 const {spawnSync}=await import('node:child_process');
 const stopped=spawnSync(process.execPath,['--import',preload,'scripts/numbers/reanalyse.mjs','run','--mode=set-record','--foods-file='+choices,'--ledger='+ledger,'--wait-seconds=10'],{encoding:'utf8',timeout:20000,env:{...process.env,APP_URL:'http://127.0.0.1:1',FAULT_POST:'',FAULT_USER:user,FAULT_KIND:'wrong-record'}});
 assert.equal(stopped.status,3,stopped.stdout+stopped.stderr);assert.match(stopped.stdout,/two meals in a row/);
 const rows=readFileSync(path.join(ledger,'ledger.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(rows.length,2);assert.ok(rows.every(r=>r.restored));
 assert.equal(sql(`select count(*)from jobs where post_id='${posts[2].post}'`).trim(),'0','third meal was not started');

});

test('set-record reports an uncertain committed write as failed, never skipped',async t=>{
 const fs=await import('node:fs'),path=await import('node:path'),{tmpdir}=await import('node:os'),{spawnSync}=await import('node:child_process');
 const db=process.env.SUPABASE_DB_URL;assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(db).hostname));
 const real=execFileSync('which',['psql'],{encoding:'utf8'}).trim(),sql=input=>execFileSync(real,['-X','-qAt','-v','ON_ERROR_STOP=1','--dbname',db],{input,encoding:'utf8',timeout:10000});
 const dir=fs.mkdtempSync(path.join(tmpdir(),'set-record-uncertain-')),user=randomUUID(),post=randomUUID(),item=randomUUID();
 t.after(()=>{try{sql(`delete from posts where user_id='${user}';delete from profiles where id='${user}';delete from auth.users where id='${user}';`);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
 sql(`insert into auth.users(id)values('${user}');insert into profiles(id,handle)values('${user}','uncertain-${user.slice(0,8)}');insert into posts(id,user_id,status,analysis_initialized_at)values('${post}','${user}','ready',now());insert into post_items(id,post_id,name,source,portion_grams)values('${item}','${post}','Lemon wedge','model',10);insert into item_nutrition(post_item_id,source_ref,calories)values('${item}','168946',16.2);`);
 const wrapper=path.join(dir,'psql');fs.writeFileSync(wrapper,`#!${process.execPath}
const fs=require('node:fs'),{spawnSync}=require('node:child_process'),a=process.argv.slice(2),f=a.indexOf('-f');
const r=spawnSync(process.env.REAL_PSQL,a,{input:f<0?fs.readFileSync(0):undefined,stdio:['pipe','inherit','inherit']});
process.exit(r.status===0&&f>=0&&a[f+1].endsWith('/27-set-record.sql')?7:r.status??1);
`);fs.chmodSync(wrapper,0o700);
 const file=path.join(dir,'choices'),ledger=path.join(dir,'ledger');fs.writeFileSync(file,JSON.stringify({meal:post.slice(0,8),item,fdc:2709168,description:'Lemon, raw'}));
 const r=spawnSync(process.execPath,['scripts/numbers/reanalyse.mjs','run','--mode=set-record','--foods-file='+file,'--ledger='+ledger],{encoding:'utf8',timeout:10000,env:{...process.env,PATH:dir+path.delimiter+process.env.PATH,REAL_PSQL:real,APP_URL:'http://127.0.0.1:1'}});
 assert.equal(r.status,1,r.stdout+r.stderr);
 const entry=JSON.parse(fs.readFileSync(path.join(ledger,'ledger.jsonl'),'utf8').trim());assert.equal(entry.outcome,'failed');assert.equal(entry.restored,false);assert.match(entry.restore_error,/queued|running/);
 assert.equal(sql(`select count(*)from jobs where post_id='${post}'and status='queued'`).trim(),'1','no retry or racing restore');
});
