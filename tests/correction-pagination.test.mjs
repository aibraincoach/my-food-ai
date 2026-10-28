import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {readPostComments,readCorrectionProgress} from '../src/lib/posts/timeline.ts';
import {correctionWindow} from '../src/lib/pipeline/correction-state.ts';
test('all comments and applied progress survive server caps and timestamp ties',async()=>{
 const created_at='2026-10-27T00:00:00+00:00';
 const comments=Array.from({length:1201},(_,n)=>({id:String(n).padStart(8,'0'),created_at,author:'user',body:'halve rice'}));
 const jobs=comments.slice(0,1200).map((c,n)=>({id:c.id,created_at,payload:{correction_sequence:n+1,correction_pending_ids:[c.id]}}));
 let requests=0;
 const client=createClient('http://localhost:1234','test',{global:{fetch:async(input)=>{
  requests++;const url=new URL(input);const rows=url.pathname.endsWith('/jobs')?jobs:comments;
  const cursor=url.searchParams.get('or')?.match(/id\.gt\.([^)]*)/)?.[1];
  const page=rows.filter(r=>!cursor||r.id>cursor).slice(0,37);
  return new Response(JSON.stringify(page),{headers:{'Content-Type':'application/json'}});
 }}});
 const [thread,progress]=await Promise.all([readPostComments(client,'post'),readCorrectionProgress(client,'post')]);
 assert.equal(thread.length,1201);assert.equal(progress.length,1200);assert.ok(requests>60);
 assert.deepEqual(correctionWindow(thread,progress).pending.map(c=>c.id),['00001200']);
});
