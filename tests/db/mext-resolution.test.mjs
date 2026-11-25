// Local real PostgREST + PostgreSQL + scripted model transport; no providers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createAdminClient} from '../../src/lib/supabase/admin.ts';
import {importRows,importSql} from '../../scripts/lib/mext-import.mjs';
import {resolveFoodReference,scaleFoodReference} from '../../src/lib/mext/resolve.ts';
import {resolvePortionNutrition,storedNutrition} from '../../src/lib/nutrition/portion.ts';
import {traceContext} from '../../src/lib/trace/context.ts';
const dbUrl=process.env.TEST_SQL_DATABASE_URL;
function sql(input){assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.ok(['127.0.0.1','localhost'].includes(new URL(dbUrl).hostname));const r=spawnSync('psql',['-XqAt','--dbname',dbUrl,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',timeout:15000});assert.ifError(r.error);assert.equal(r.status,0,r.stderr);return r.stdout.trim();}
test('scripted ja resolution uses the real reference table and a portion edit re-reads it', {timeout:30000},async()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');
 for(const name of ['NEXT_PUBLIC_SUPABASE_URL','MODEL_API_BASE_URL','TEST_FDC_FIXTURE_URL'])assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env[name]).hostname));
 const imported=importRows(JSON.parse(readFileSync(new URL('../fixtures/mext-source-sample.json',import.meta.url),'utf8')),JSON.parse(readFileSync(new URL('../../scripts/mext-sources.json',import.meta.url),'utf8')));
 assert.equal(sql('select count(*) from jp_foods'),'0','test needs an empty disposable reference table');
 sql(importSql(imported));
 const admin=createAdminClient(),postId=randomUUID(),itemId=randomUUID();
 try{
  const user=await admin.from('profiles').select('id').order('id').limit(1).single();assert.ifError(user.error);
  assert.ifError((await admin.from('posts').insert({id:postId,user_id:user.data.id,status:'ready',render_time_zone:'Asia/Tokyo'})).error);
  await traceContext.run({postId},async()=>{
   const result=await resolveFoodReference(admin,'cooked rice',{kind:'localized',locale:'ja',displayName:'精白米'},'',AbortSignal.timeout(15000));
   assert.equal(result.reference.source,'mext');assert.equal(result.reference.food.foodNumber,'01088');
   const n=scaleFoodReference(result.reference,150,result.unavailable);assert.equal(n.calories,234);assert.equal(n.sourceRef,'mext:01088');
   assert.ifError((await admin.from('post_items').insert({id:itemId,post_id:postId,name:'cooked rice',portion_grams:150,source:'model'})).error);
   assert.ifError((await admin.from('item_nutrition').insert(storedNutrition(n,itemId))).error);
   const resized=await resolvePortionNutrition(admin,postId,itemId,'cooked rice',250);
   assert.equal(resized.calories,390);assert.equal(resized.source_ref,'mext:01088');
   const marker=resized.micronutrients.find(n=>n.nutrientId===1109);assert.equal(marker.marker,'trace');assert.equal(marker.value,null);
   const traces=await admin.from('model_calls').select('kind,fdc_id,reference_ref,error').eq('post_id',postId).eq('kind','mext');assert.ifError(traces.error);
   assert.ok(traces.data.length>=2);assert.ok(traces.data.every(row=>row.reference_ref==='mext:01088'&&row.fdc_id===null&&row.error===null));
   for(const [english,japanese,code] of [['miso soup','味噌汁','mext_none'],['pork belly and rice','豚ばらとご飯','mext_incompatible'],['白飯','白飯','mext_unclassified']]){
    const fallback=await resolveFoodReference(admin,english,{kind:'localized',locale:'ja',displayName:japanese},'',AbortSignal.timeout(15000));
    assert.equal(fallback.reference,null);
    const logged=await admin.from('model_calls').select('response_text').eq('post_id',postId).eq('kind','fdc').like('request_text','%"event":"food_resolution"%').order('started_at',{ascending:false}).limit(1).single();assert.ifError(logged.error);
    const step=JSON.parse(logged.data.response_text).mextSteps[0];assert.equal(step.code,code);assert.deepEqual(Object.keys(step).sort(),['candidateNumbers','code']);
    if(code==='mext_incompatible')assert.ok(step.candidateNumbers.includes('11129'));
   }
   sql("delete from jp_foods where food_number='01088'");
   await assert.rejects(resolvePortionNutrition(admin,postId,itemId,'cooked rice',250),/reference is missing/);
  });
 }finally{
  assert.ifError((await admin.from('posts').delete().eq('id',postId)).error);
  sql('delete from jp_foods');
 }
});
