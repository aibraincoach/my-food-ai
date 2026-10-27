import test from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {waitForInitialAnalysis} from '../src/lib/pipeline/correction-ready.ts';
import {isRetriable} from '../src/lib/worker/errors.ts';
test('queued initial analysis in future backoff prevents correction before any model call',async()=>{
 for(const active of [true,false]){
 const admin=createClient('http://127.0.0.1:1','fixture',{auth:{persistSession:false},global:{fetch:async(url)=>{
  const query=new URL(url).searchParams;assert.equal(query.get('kind'),'eq.analyze');assert.equal(query.get('status'),'in.(queued,running)');assert.equal(query.has('run_after'),false);
  return Response.json(active?{id:'delayed-analysis'}:null);
 }}});
 if(active)await assert.rejects(waitForInitialAnalysis(admin,'post'),isRetriable);
 else await waitForInitialAnalysis(admin,'post');
 }
});
