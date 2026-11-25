// Isolated PostgreSQL contract. No environment files, production, or network services.
import {after,before,test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';
const root=mkdtempSync(path.join(os.tmpdir(),'mext-trace-db-')),pgBin='/usr/pgsql-17/bin';
let port,started=false;
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const migration=read('../supabase/migrations/0086_mext_trace_reference.sql');
const rollback=read('../supabase/rollback/0086_mext_trace_reference.sql');
const old=read('../supabase/migrations/0072_trace_retention.sql');
const oldKinds=['sam','spark_identify','spark_correct','spark_same_meal','spark_search','fdc','transcribe','spark_label','spark_remainder'];
function run(binary,args,input) {
  const r=spawnSync(binary,args,{input,encoding:'utf8',timeout:20000});
  if(r.error||r.status!==0)throw Error(`${path.basename(binary)}: ${r.stderr||r.error}`);
  return r.stdout.trim();
}
const args=()=>['-X','-qAt','-h','127.0.0.1','-p',String(port),'-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'];
const sql=text=>run('psql',args(),text);
const hasColumn=()=>sql("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='model_calls' and column_name='reference_ref')");
before(async()=>{
  const server=net.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  port=server.address().port;await new Promise(resolve=>server.close(resolve));
  run(path.join(pgBin,'initdb'),['-D',path.join(root,'pg'),'-U','postgres','-A','trust','--locale=C.UTF-8','--encoding=UTF8']);
  run(path.join(pgBin,'pg_ctl'),['-D',path.join(root,'pg'),'-l',path.join(root,'postgres.log'),'-o',`-p ${port} -h 127.0.0.1 -k ${root}`,'start']);started=true;
  // Minimal related tables; model_calls and the retention functions use their real migrations.
  sql(`create role anon;create role authenticated;
    create table posts(id uuid primary key,identify_host text);
    create table post_items(id uuid primary key,post_id uuid references posts(id),superseded_at timestamptz);
    create table item_nutrition(post_item_id uuid references post_items(id),source_ref text);
    create table retention_summary(table_name text,rule text,day date,kind text,deleted bigint);`);
  const calls=read('../supabase/migrations/0014_model_calls.sql');
  sql(calls.slice(calls.indexOf('create table public.model_calls'),calls.indexOf('alter table public.model_calls enable')));
  sql(`alter table model_calls add column host text;
    alter table model_calls drop constraint model_calls_kind_check;
    alter table model_calls add constraint model_calls_kind_check check(kind in (${oldKinds.map(k=>`'${k}'`).join(',')}));`);
  sql(old);sql(migration);
});
after(()=>{if(started)run(path.join(pgBin,'pg_ctl'),['-D',path.join(root,'pg'),'-m','fast','stop']);rmSync(root,{recursive:true,force:true});});

test('every previous kind still inserts; MEXT requires its exact typed identity and no synthetic FDC id',()=>{
  for(const kind of oldKinds)sql(`insert into model_calls(kind,started_at,duration_ms) values('${kind}',now(),1)`);
  for(const ref of [null,'01088','mext:1088','mext:010880','mext:abcde','usda:01088','mext:01088\n']) {
    const value=ref===null?'null':`'${ref}'`;
    assert.throws(()=>sql(`insert into model_calls(kind,started_at,duration_ms,reference_ref) values('mext',now(),1,${value})`),/model_calls_reference_ref_check/);
  }
  assert.throws(()=>sql("insert into model_calls(kind,started_at,duration_ms,reference_ref,fdc_id) values('mext',now(),1,'mext:01088',1088)"),/model_calls_reference_ref_check/);
  assert.throws(()=>sql("insert into model_calls(kind,started_at,duration_ms,reference_ref) values('fdc',now(),1,'mext:01088')"),/model_calls_reference_ref_check/);
  sql("insert into model_calls(kind,started_at,duration_ms,reference_ref) values('mext',now(),1,'mext:01088')");
  sql('truncate model_calls');
});

test('the USDA retention predicate is byte-identical and all old-kind candidate decisions are unchanged',()=>{
  const predicate=s=>s.slice(s.indexOf("    and not (c.kind = 'fdc'"),s.indexOf('    -- A pre-0032')).replace(/    and not \(c.kind = 'mext'[\s\S]*/, '');
  assert.equal(predicate(migration),predicate(old));
  sql(`insert into posts values('00000000-0000-0000-0000-000000000001','meta');
    insert into post_items values('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',null);
    insert into item_nutrition values('00000000-0000-0000-0000-000000000002','12345');`);
  for(const kind of oldKinds)for(const fdc of ['null','12345','999'])for(const error of ['null',"'failed'"])for(const host of ['null',"'meta'","'baseten'"])sql(`insert into model_calls(post_id,kind,started_at,duration_ms,fdc_id,error,host) values('00000000-0000-0000-0000-000000000001','${kind}',now()-interval '50 days',1,${fdc},${error},${host})`);
  const candidates=()=>sql("select coalesce(string_agg(id::text,',' order by id),'') from retention_trace_candidates(now())");
  const before=candidates();sql(rollback);assert.equal(candidates(),before);sql(migration);assert.equal(candidates(),before);
  sql('truncate model_calls');
});

test('purge preserves only error-free exact current MEXT references, and counts expired rows',()=>{
  sql("update item_nutrition set source_ref='mext:01088'");
  const post="'00000000-0000-0000-0000-000000000001'";
  const insert=(ref,error='null',age=50)=>sql(`insert into model_calls(post_id,kind,started_at,duration_ms,reference_ref,error) values(${post},'mext',now()-interval '${age} days',1,'${ref}',${error}) returning id`);
  const keep=insert('mext:01088'),young=insert('mext:01089','null',44);
  insert('mext:01089');insert('mext:01088',"'failed'");
  assert.equal(sql('select retention_traces_batch(100)'), '2');
  assert.equal(sql(`select count(*) from model_calls where id in ('${keep}','${young}')`),'2');
  assert.equal(sql("select sum(deleted) from retention_summary where kind='mext'"),'2');
  sql("update post_items set superseded_at=now()");
  assert.equal(sql('select retention_traces_batch(100)'),'1');
  assert.equal(sql(`select count(*) from model_calls where id='${keep}'`),'0');
  sql('truncate model_calls');
});

test('rollback refuses existing typed traces and leaves their identity intact',()=>{
  sql("insert into model_calls(kind,started_at,duration_ms,reference_ref) values('mext',now(),1,'mext:01088')");
  assert.throws(()=>sql(rollback),/rollback refused/);assert.equal(hasColumn(),'t');
  assert.equal(sql('select reference_ref from model_calls'),'mext:01088');
  sql('truncate model_calls');sql(rollback);assert.equal(hasColumn(),'f');sql(migration);
});

test('a real held table lock causes fast full rollback with no new schema',async()=>{
  sql(rollback);
  const child=spawn('psql',args(),{stdio:['pipe','pipe','pipe']});
  child.stdin.end("begin;lock model_calls in access exclusive mode;select 'lock-ready:'||pg_backend_pid();select pg_sleep(15);rollback;");
  let holderPid;
  await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error('lock holder not ready')),3000);
    child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/lock-ready:(\d+)/);if(match){holderPid=Number(match[1]);clearTimeout(timer);resolve();}});
    child.on('error',reject);
  });
  try {
    const start=Date.now();assert.throws(()=>sql(migration),/lock timeout/);
    assert.ok(Date.now()-start<4000,'must fail at 1s lock bound');
    assert.equal(hasColumn(),'f');
  } finally {const closed=new Promise(resolve=>child.once('close',resolve));sql(`select pg_terminate_backend(${holderPid})`);await closed;}
  sql(migration);
});

test('a slow ALTER hits the 5s statement bound and rolls back every change',()=>{
  sql(rollback);
  sql(`create function test_slow_ddl() returns event_trigger language plpgsql as $$begin perform pg_sleep(6);end$$;
    create event trigger test_slow_alter on ddl_command_start when tag in ('ALTER TABLE') execute function test_slow_ddl();`);
  try {
    const start=Date.now();assert.throws(()=>sql(migration),/statement timeout/);
    assert.ok(Date.now()-start<8000,'must fail at 5s statement bound');assert.equal(hasColumn(),'f');
  } finally {sql('drop event trigger test_slow_alter;drop function test_slow_ddl();');}
  sql(migration);
});
