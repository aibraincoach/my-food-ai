// Actual pre-0032 local REST gate:
// TRACE_ROLLOUT_URL=http://127.0.0.1:<port> TRACE_ROLLOUT_SERVICE_KEY=<local service JWT> node --import tsx scripts/trace-rollout-smoke.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
test('the actual pre-0032 REST schema still stores a normal Meta trace',async()=>{
 if(!process.env.TRACE_ROLLOUT_URL&&process.env.NEXT_PUBLIC_SUPABASE_URL)process.env.TRACE_ROLLOUT_URL=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!process.env.TRACE_ROLLOUT_SERVICE_KEY&&process.env.SUPABASE_SECRET_KEY)process.env.TRACE_ROLLOUT_SERVICE_KEY=process.env.SUPABASE_SECRET_KEY;
 assert.ok(process.env.TRACE_ROLLOUT_URL);assert.ok(process.env.TRACE_ROLLOUT_SERVICE_KEY);assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(process.env.TRACE_ROLLOUT_URL).hostname),'Local disposable REST only');
 process.env.NEXT_PUBLIC_SUPABASE_URL=process.env.TRACE_ROLLOUT_URL;process.env.SUPABASE_SECRET_KEY=process.env.TRACE_ROLLOUT_SERVICE_KEY;
 const db=createClient(process.env.TRACE_ROLLOUT_URL,process.env.TRACE_ROLLOUT_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const absent=await db.from('model_calls').select('model').limit(0);assert.ok(['42703','PGRST204'].includes(absent.error?.code),'This gate requires the actual pre-0032 schema');
 const request={model:'muse-spark-1.3',fixture:randomUUID()},requestText=JSON.stringify(request);
 const {recordCall}=await import('../src/lib/trace/record.ts');
 try{assert.equal(await recordCall('spark_identify',request,async()=>({answer:'Rice'}),out=>({text:out.answer,usage:{input_tokens:1,output_tokens:2}})).then(out=>out.answer),'Rice');const {data,error}=await db.from('model_calls').select('kind,input_tokens,output_tokens,error').eq('request_text',requestText);assert.equal(error,null);assert.equal(data.length,1);assert.equal(data[0].kind,'spark_identify');assert.equal(data[0].input_tokens,1);assert.equal(data[0].output_tokens,2);assert.equal(data[0].error,null);}finally{const {error}=await db.from('model_calls').delete().eq('request_text',requestText);assert.equal(error,null);}
});
