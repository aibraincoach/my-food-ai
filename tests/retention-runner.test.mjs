import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {parseArgs} from '../scripts/retention/run.mjs';
test('retention refuses inherited table names and values on its delete switch',()=>{
 for(const table of ['__proto__','constructor','toString'])assert.throws(()=>parseArgs(['--table='+table]));
 for(const option of ['--batches','--batch-size','--pause-ms'])assert.throws(()=>parseArgs(['--table=jobs',option]));
 for(const value of ['false','true','yes'])assert.throws(()=>parseArgs(['--table=jobs','--delete='+value]));
});
for(const table of ['jobs','model_calls'])for(const deleting of [false,true])test(table+' retention sends one bounded '+(deleting?'delete':'read-only dry-run')+' transaction to psql',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'retention-cli-')),sqlLog=path.join(dir,'sql'),callsLog=path.join(dir,'calls');
 try{
  writeFileSync(path.join(dir,'psql'),'#!/usr/bin/env node\nconst fs=require("node:fs");fs.writeFileSync(process.env.RETENTION_SQL_LOG,fs.readFileSync(0,"utf8"));fs.appendFileSync(process.env.RETENTION_CALLS_LOG,"call\\n");if(process.env.RETENTION_FAKE_DELETE)process.stdout.write("0\\n");\n',{mode:0o700});
  const result=spawnSync(process.execPath,['scripts/retention/run.mjs','--table='+table,...(deleting?['--delete','--batches=3']:[])],{cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:5000,env:{...process.env,PATH:dir+path.delimiter+process.env.PATH,SUPABASE_DB_URL:'postgres://postgres@127.0.0.1:1/never',RETENTION_SQL_LOG:sqlLog,RETENTION_CALLS_LOG:callsLog,RETENTION_FAKE_DELETE:deleting?'1':''}});
  assert.equal(result.status,0,result.stderr);const sql=readFileSync(sqlLog,'utf8').toLowerCase();
  assert.match(sql,deleting?/^begin\s*;/:/^begin read only\s*;/);
  assert.match(sql,/set local lock_timeout\s*=\s*'5s'/);assert.match(sql,/set local statement_timeout\s*=\s*'30s'/);assert.match(sql,/commit\s*;\s*$/);
  assert.match(sql,new RegExp('public\\.'+(table==='jobs'?'retention_jobs_':'retention_traces_')+(deleting?'batch':'dry_run')));
  assert.equal(readFileSync(callsLog,'utf8'),'call\n','a zero-row batch stops without a retry or another read');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
