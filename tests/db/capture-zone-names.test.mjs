import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {captureZone} from '../../src/lib/posts/capture-zone.ts';
test('canonical ICU capture names all exist in the local PostgreSQL tzdata', {skip:!process.env.SUPABASE_DB_URL},()=>{
 const url=new URL(process.env.SUPABASE_DB_URL);assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
 const names=new Set(execFileSync('psql',['-XqAt','--dbname',url.href,'-v','ON_ERROR_STOP=1','-c','select name from pg_timezone_names'],{encoding:'utf8'}).trim().split('\n'));
 const samples=[...Intl.supportedValuesOf('timeZone'),'asia/tokyo','Asia/Calcutta','UTC'];
 const missing=samples.map(value=>captureZone(value)).filter(value=>!value||!names.has(value));assert.deepEqual(missing,[]);
});

test('capture input corpus distinguishes database names from ICU offsets and abbreviations',{skip:!process.env.SUPABASE_DB_URL},()=>{
 const url=new URL(process.env.SUPABASE_DB_URL);assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
 const names=new Set(execFileSync('psql',['-XqAt','--dbname',url.href,'-v','ON_ERROR_STOP=1','-c','select name from pg_timezone_names'],{encoding:'utf8'}).trim().split('\n'));
 for(const value of ['+01:00','-0530','GMT+1','Not/AZone']){assert.equal(captureZone(value),null);assert.equal(names.has(value),false);}
 assert.equal(captureZone('EST'),null,'abbreviations are deliberately outside the capture contract even when PG knows them');
 for(const value of ['UTC','asia/tokyo','Asia/Kolkata']){const canonical=captureZone(value);assert.ok(canonical);assert.equal(names.has(canonical),true);}
});
