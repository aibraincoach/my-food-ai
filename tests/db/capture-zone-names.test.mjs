import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {captureZone} from '../../src/lib/posts/capture-zone.ts';
test('canonical ICU capture names all exist in the local PostgreSQL tzdata', {skip:!process.env.SUPABASE_DB_URL},()=>{
 const url=new URL(process.env.SUPABASE_DB_URL);assert.ok(['127.0.0.1','localhost'].includes(url.hostname));
 const names=new Set(execFileSync('psql',['-XqAt','--dbname',url.href,'-v','ON_ERROR_STOP=1','-c','select name from pg_timezone_names'],{encoding:'utf8'}).trim().split('\n'));
 const samples=[...Intl.supportedValuesOf('timeZone'),'asia/tokyo','Asia/Calcutta','UTC'];
 const missing=samples.map(value=>captureZone(value)).filter(value=>!value||!names.has(value));assert.deepEqual(missing,[]);
});
