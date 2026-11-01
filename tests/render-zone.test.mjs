import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {user} from './db/helpers.mjs';
import {renderTimeZone,readStoredCardData} from '../src/lib/pipeline/render-zone.ts';
import {readCardData} from '../src/lib/pipeline/card-data.ts';

const eatenAt='2026-11-01T00:30:00Z';
const item={name:'Soup',portion_grams:100,portion_text:'100 g',calories:30,protein_g:1,carbs_g:4,fat_g:1,fibre_g:1,sugar_g:1,sodium_mg:10,micronutrients:[{nutrientId:1051,unitName:'G',value:100,basis:'portion'}]};
function hydrationFixture(zone){
 const post={id:'meal',user_id:'owner',eaten_at:eatenAt,status:'processing',render_time_zone:zone};
 const tables={posts:[post],intake_logs:[
  {user_id:'owner',kind:'water',amount:330,ml:330,label:'Water',post_id:null,logged_at:'2026-10-31T23:50:00Z'},
  {user_id:'owner',kind:'water',amount:240,ml:240,label:'Water',post_id:null,logged_at:'2026-11-01T00:20:00Z'},
  {user_id:'owner',kind:'water',amount:999,ml:999,label:'Water',post_id:null,logged_at:'2026-11-01T01:00:00Z'},
 ],current_post_items:[],item_nutrition:[]};
 return {post,from(table){assert.ok(table in tables,`unexpected table ${table}`);const predicates=[];let update;const result=()=>{const rows=tables[table].filter(row=>predicates.every(fn=>fn(row)));if(update)for(const row of rows)Object.assign(row,update);return rows;};const chain={
  select(){return chain},update(value){update=value;return chain},eq(key,value){predicates.push(row=>row[key]===value);return chain},is(key,value){predicates.push(row=>row[key]===value);return chain},in(key,values){predicates.push(row=>values.includes(row[key]));return chain},gte(key,value){predicates.push(row=>row[key]>=value);return chain},lte(key,value){predicates.push(row=>row[key]<=value);return chain},lt(key,value){predicates.push(row=>row[key]<value);return chain},order(){return chain},async range(from,through){return{data:result().slice(from,through+1),error:null}},async maybeSingle(){return{data:result()[0]??null,error:null}},then(resolve){return Promise.resolve({data:result(),error:null}).then(resolve)},
 };return chain;}};
}

test('stored meal card uses its recorded local day across UTC midnight, matching the live card at capture',async()=>{
 const db=hydrationFixture('Asia/Tokyo'),source={id:'meal',eaten_at:eatenAt,items:[item]};
 const stored=await readStoredCardData(db,'owner',source);
 const live=await readCardData(db,'owner',source,'Asia/Tokyo');
 assert.equal(stored.hydration.totalMl,650);assert.equal(stored.hydration.drinksMl,570);assert.equal(stored.waterLine,live.waterLine);
 assert.equal(stored.waterLine,'Water in this meal: 80 ml · Consumed today: 650 ml');
 const legacy=await readStoredCardData(hydrationFixture(null),'owner',source);
 assert.equal(legacy.hydration.totalMl,320,'legacy unknown zone is explicitly qualified as UTC');
});

test('model-free posts record their first explicit render zone and subsequent corrections retain it',async()=>{
 const db=hydrationFixture(null);
 assert.equal(await renderTimeZone(db,'meal','Asia/Tokyo'),'Asia/Tokyo');
 assert.equal(db.post.render_time_zone,'Asia/Tokyo');
 assert.equal(await renderTimeZone(db,'meal'),'Asia/Tokyo');
 assert.equal(await renderTimeZone(db,'meal','UTC'),'Asia/Tokyo','a retry after travel does not rewrite the capture zone');
});

test('upload reservation carries a validated capture zone into the published post atomically and clears the tombstone',{skip:!process.env.SUPABASE_DB_URL},async()=>{
 const owner=await user(1);
 const migrations=['0025_barcode_corrections.sql','0026_saved_meals.sql','0027_not_eaten.sql'].map(name=>readFileSync(new URL('../supabase/migrations/'+name,import.meta.url),'utf8')).join('\n');
 const script=`\\set ON_ERROR_STOP on
begin;
${migrations}
select '${owner.user.id}'::uuid as owner,gen_random_uuid() as operation \\gset
select public.reserve_post_upload_with_options(:'operation',:'owner','Late meal','${eatenAt}','[]',null,null,false,'Asia/Tokyo');
select public.reserve_post_upload_with_options(:'operation',:'owner','Late meal','${eatenAt}','[]',null,null,false,'UTC');
select render_time_zone='Asia/Tokyo' as draft_ok from public.post_upload_drafts where id=:'operation' \\gset
\\if :draft_ok
\\else
select 1/0 as capture_zone_changed_on_retry;
\\endif
select public.publish_uploaded_post(:'operation',:'owner') as post \\gset
select (select render_time_zone='Asia/Tokyo' from public.posts where id=:'post') and (select render_time_zone is null and published from public.post_upload_drafts where id=:'operation') and (select count(*)=1 from public.jobs where post_id=:'post' and kind='analyze') as published_ok \\gset
\\if :published_ok
\\else
select 1/0 as capture_zone_not_published_atomically;
\\endif
select set_config('zone.test_post',:'post',true),set_config('zone.test_owner',:'owner',true);
do $$ begin
 begin perform public.reserve_post_upload_with_options(gen_random_uuid(),current_setting('zone.test_owner')::uuid,'Bad zone',now(),'[]',null,null,false,'Not/AZone');raise exception 'Invalid capture zone accepted';exception when invalid_parameter_value then null;end;
 begin update public.posts set render_time_zone='Not/AZone' where id=current_setting('zone.test_post')::uuid;raise exception 'Invalid stored zone accepted';exception when invalid_parameter_value then null;end;
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
do $$ begin
 begin update public.posts set render_time_zone='UTC' where id=current_setting('zone.test_post')::uuid;raise exception 'Browser rewrote capture zone';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
\\echo render_zone_metadata_passed`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:script,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/render_zone_metadata_passed/);
});
