import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {persistAnalysis} from '../src/lib/pipeline/persist.ts';
import {getCurrentItems} from '../src/lib/nutrition/totals.ts';
import {renderNutritionTable} from './fixtures/render-nutrition-table.mjs';
const checked=r=>{assert.ifError(r.error);return r.data;};
for(const [name,ref,label]of [['Label meal','label','the package label you photographed'],['Repeated meal','170000','USDA FoodData Central'],['Historical meal',null,'Source not recorded']])test(`real persistAnalysis preserves ${name} values and source`,async()=>{
 assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'127.0.0.1');
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false},global:{fetch:async(url,init)=>{const result=await fetch(url,{...init,signal:AbortSignal.timeout(15000)});return result;}}});
 const user=checked(await db.from('profiles').select('id').eq('handle','test-owner').maybeSingle());
 const owner=user?.id??checked(await db.from('profiles').select('id').limit(1).single()).id;
 const post=checked(await db.from('posts').insert({user_id:owner,status:'processing',caption:name,render_time_zone:'UTC'}).select('id').single());
 const job=checked(await db.from('jobs').insert({post_id:post.id,kind:'analyze',status:'running',payload:{}}).select('id').single());
 const nutrition={calories:180,protein_g:4,carbs_g:30,fat_g:5,fibre_g:null,sugar_g:null,sodium_mg:null,micronutrients:[],source_ref:ref,food_category:null};
 try{
 const named={postId:post.id,regions:[],captionOnly:[{name,portionText:'one serving',portionGrams:100,confidence:0.9}],summary:'',needsInput:null,hasNotEaten:true,...(ref==='label'?{labelNutrition:nutrition}:{})};
 await persistAnalysis(db,named,[nutrition],job.id);
 const items=await getCurrentItems(db,post.id);assert.equal(items.length,1);assert.equal(items[0].source_ref,ref);assert.equal(items[0].calories,180);assert.equal(items[0].protein_g,4);assert.equal(items[0].fibre_g,null);assert.deepEqual(items[0].micronutrients,[]);
 const html=renderNutritionTable('en',JSON.parse(fs.readFileSync(new URL('../messages/en.json',import.meta.url),'utf8')),items);assert.ok(html.includes(label),html);assert.ok(!String(items[0].source_ref).startsWith('unavailable:')); 
 assert.equal(checked(await db.from('posts').select('status').eq('id',post.id).single()).status,'ready');
 }finally{checked(await db.from('posts').delete().eq('id',post.id));}
});
test('current nullable matcher callers always pass the reason and copies bypass scaling',()=>{
 const expected=['src/lib/worker/jobs/recompute.ts','src/lib/worker/jobs/correct.ts','src/lib/intake/identify-drinks.ts','src/lib/pipeline/persist.ts'];
 for(const file of expected){const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');assert.match(source,/scaleNutrition\(match\.food,[^;]*match\.unavailable\)/,file);}
 const persist=fs.readFileSync(new URL('../src/lib/pipeline/persist.ts',import.meta.url),'utf8');
 const copy=persist.slice(persist.indexOf('if(copied){'),persist.indexOf('}else{',persist.indexOf('if(copied){')));
 assert.ok(copy.includes('source_ref:copied.source_ref'));assert.ok(!copy.includes('scaleNutrition('));assert.ok(!copy.includes('unavailable:'));
 assert.ok(!/copied\s*\?\s*\{\s*food\s*:\s*null/.test(persist));
});
