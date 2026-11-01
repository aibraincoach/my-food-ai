import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {mergeProduct,productFromFood} from '../src/lib/fdc/barcode-product.ts';
import {canonicalGtin,parseBarcodeCorrection} from '../src/lib/posts/barcode-correction.ts';
import {labelNutrition,parseLabelReading} from '../src/lib/meta/label.ts';
const migration=readFileSync(new URL('../supabase/migrations/0025_barcode_corrections.sql',import.meta.url),'utf8');
test('own correction takes precedence over corroborated name and FDC, including a stored label for an unknown product',()=>{
 const code='016000275683';const base=productFromFood({fdcId:7,description:'Database name',foodNutrients:[{nutrientId:1008,value:90}]},code);
 assert.equal(mergeProduct(code,base,null,null).name,'Database name');
 assert.equal(mergeProduct(code,base,null,'Shared name').name,'Shared name');
 const own={name:'My name',per_100:{calories:70,protein_g:null,carbs_g:null,fat_g:null,fibre_g:null,sugar_g:null,sodium_mg:null},source:'label',serving_amount:30,serving_unit:'g'};
 const result=mergeProduct(code,base,own,'Shared name');assert.equal(result.name,'My name');assert.equal(result.per100g.calories,70);
 assert.equal(mergeProduct(code,null,own,null).name,'My name');assert.equal(mergeProduct(code,null,null,'Shared name'),null);
 assert.equal(canonicalGtin('0016000275683'),canonicalGtin(code));
 assert.equal(parseBarcodeCorrection({name:'  Diet  \t Cola  '}).name,'Diet Cola');
 assert.throws(()=>parseBarcodeCorrection({name:'x'.repeat(81)}));
 assert.throws(()=>parseBarcodeCorrection({name:'Valid',per_100:{calories:-1}}));
});
test('label nutrition scales only the server-held reading and preserves unknown nutrients',()=>{
 const reading=parseLabelReading({is_label:true,serving:{amount:55,unit:'g'},per_serving:{kcal:230,protein_g:3,carbs_g:37,fat_g:8,fibre_g:4,sugar_g:12,sodium_mg:160},product_name:null,box:null});
 assert.equal(labelNutrition(reading,2).calories,460);assert.equal(labelNutrition(reading,0.5).protein_g,1.5);
 assert.throws(()=>parseLabelReading({...reading,per_serving:{...reading.per_serving,kcal:-1}}));
 assert.throws(()=>labelNutrition({...reading,serving:null},1));
});
test('barcode corrections and label readings enforce owner access and withhold names with fewer than three authors',{skip:!process.env.SUPABASE_DB_URL},async()=>{
 const users=[];
 for(const prefix of ['TEST_USER','TEST_USER2']){
  if(!process.env[`${prefix}_EMAIL`]||!process.env[`${prefix}_PASSWORD`])continue;
  const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.signInWithPassword({email:process.env[`${prefix}_EMAIL`],password:process.env[`${prefix}_PASSWORD`]});assert.ifError(error);users.push(data.user.id);
 }
 assert.ok(users.length>=2,'Two configured test accounts are required.');
 const code=String(Date.now()).padStart(14,'0');
 const script=`\\set ON_ERROR_STOP on
begin;
${migration}
select '${users[0]}'::uuid as a,'${users[1]}'::uuid as b \\gset
insert into label_readings(user_id,photo_path,reading) values(:'a',:'a'||'/photo.jpg','{}');
select set_config('request.jwt.claims',jsonb_build_object('sub',:'a','role','authenticated')::text,true);
set local role authenticated;
insert into barcode_corrections(gtin,user_id,name,source) values('${code}',:'a','  Coffee  ','user');
select count(*)=1 as owner_ok from barcode_corrections where user_id=:'a' and gtin='${code}' \\gset
\\if :owner_ok
\\else
select 1/0 as owner_read_failed;
\\endif
select public.barcode_shared_name('${code}') is null as one_ok \\gset
\\if :one_ok
\\else
select 1/0 as one_vote_shared;
\\endif
select set_config('request.jwt.claims',jsonb_build_object('sub',:'b','role','authenticated')::text,true);
select (select count(*)=0 from barcode_corrections where user_id=:'a' and gtin='${code}') and (select count(*)=0 from label_readings where photo_path=:'a'||'/photo.jpg') as hidden_ok \\gset
\\if :hidden_ok
\\else
select 1/0 as cross_owner_read;
\\endif
insert into barcode_corrections(gtin,user_id,name,source) values('${code}',:'b','COFFEE','user');
select public.barcode_shared_name('${code}') is null as two_ok \\gset
\\if :two_ok
\\else
select 1/0 as two_votes_shared;
\\endif
reset role;
-- Run the actual sharing function's body against an isolated fixture relation.
-- No third auth profile is created or impersonated in the connected project.
create temporary table share_fixture(gtin text,user_id uuid,name text);
select replace(replace(pg_get_functiondef('public.barcode_shared_name(text)'::regprocedure),'public.barcode_shared_name','pg_temp.fixture_shared_name'),'public.barcode_corrections','pg_temp.share_fixture') \\gexec
insert into share_fixture values('fixture',gen_random_uuid(),' Diet  Coffee '),('fixture',gen_random_uuid(),'DIET COFFEE');
select pg_temp.fixture_shared_name('fixture') is null as isolated_two \\gset
\\if :isolated_two
\\else
select 1/0 as fixture_two_shared;
\\endif
insert into share_fixture values('fixture',gen_random_uuid(),E'diet\\tcoffee');
select pg_temp.fixture_shared_name('fixture')='diet coffee' as isolated_three \\gset
\\if :isolated_three
\\else
select 1/0 as fixture_three_not_shared;
\\endif
select count(*) filter(where retry=0)=6 as limit_six from (select public.consume_label_read(:'a') retry from generate_series(1,6)) calls \\gset
\\if :limit_six
\\else
select 1/0 as quota_refused_early;
\\endif
select public.consume_label_read(:'a') between 1 and 60 and public.consume_label_read(:'b')=0 as limit_owner \\gset
\\if :limit_owner
\\else
select 1/0 as quota_not_owner_scoped;
\\endif
update label_read_limits set window_started_at=now()-interval '61 seconds' where user_id=:'a';
select public.consume_label_read(:'a') as reset_retry \\gset
select :reset_retry=0 and (select calls=1 from label_read_limits where user_id=:'a') as reset_ok \\gset
\\if :reset_ok
\\else
select 1/0 as quota_did_not_reset;
\\endif
select not has_function_privilege('authenticated','public.consume_label_read(uuid)','execute') and not has_table_privilege('authenticated','public.label_read_limits','update') as quota_private \\gset
\\if :quota_private
\\else
select 1/0 as quota_mutable_by_browser;
\\endif
rollback;
\\echo barcode_correction_access_passed`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:script,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/barcode_correction_access_passed/);
});
