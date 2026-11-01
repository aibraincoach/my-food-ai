import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
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
 assert.throws(()=>parseBarcodeCorrection({name:'x'.repeat(81)}));
 assert.throws(()=>parseBarcodeCorrection({name:'Valid',per_100:{calories:-1}}));
});
test('label nutrition scales only the server-held reading and preserves unknown nutrients',()=>{
 const reading=parseLabelReading({is_label:true,serving:{amount:55,unit:'g'},per_serving:{kcal:230,protein_g:3,carbs_g:37,fat_g:8,fibre_g:4,sugar_g:12,sodium_mg:160},product_name:null,box:null});
 assert.equal(labelNutrition(reading,2).calories,460);assert.equal(labelNutrition(reading,0.5).protein_g,1.5);
 assert.throws(()=>parseLabelReading({...reading,per_serving:{...reading.per_serving,kcal:-1}}));
 assert.throws(()=>labelNutrition({...reading,serving:null},1));
});
test('barcode corrections and label readings enforce owner access and three-author shared-name threshold',{skip:!process.env.SUPABASE_DB_URL},()=>{
 const script=`\\set ON_ERROR_STOP on
begin;
${migration}
select gen_random_uuid() as a,gen_random_uuid() as b,gen_random_uuid() as c \\gset
insert into auth.users(id) values(:'a'),(:'b'),(:'c');
insert into profiles(id,handle) values(:'a','bc-'||:'a'),(:'b','bc-'||:'b'),(:'c','bc-'||:'c');
insert into label_readings(user_id,photo_path,reading) values(:'a',:'a'||'/photo.jpg','{}');
select set_config('request.jwt.claims',jsonb_build_object('sub',:'a','role','authenticated')::text,true);
set local role authenticated;
insert into barcode_corrections(gtin,user_id,name,source) values('00016000275683',:'a','  Coffee  ','user');
select count(*)=1 as owner_ok from barcode_corrections where user_id=:'a' \\gset
\\if :owner_ok
\\else
select 1/0 as owner_read_failed;
\\endif
select public.barcode_shared_name('00016000275683') is null as one_ok \\gset
\\if :one_ok
\\else
select 1/0 as one_vote_shared;
\\endif
select set_config('request.jwt.claims',jsonb_build_object('sub',:'b','role','authenticated')::text,true);
select (select count(*)=0 from barcode_corrections where user_id=:'a') and (select count(*)=0 from label_readings) as hidden_ok \\gset
\\if :hidden_ok
\\else
select 1/0 as cross_owner_read;
\\endif
insert into barcode_corrections(gtin,user_id,name,source) values('00016000275683',:'b','COFFEE','user');
select public.barcode_shared_name('00016000275683') is null as two_ok \\gset
\\if :two_ok
\\else
select 1/0 as two_votes_shared;
\\endif
select set_config('request.jwt.claims',jsonb_build_object('sub',:'c','role','authenticated')::text,true);
insert into barcode_corrections(gtin,user_id,name,source) values('00016000275683',:'c','coffee','user');
select public.barcode_shared_name('00016000275683')='coffee' as three_ok \\gset
\\if :three_ok
\\else
select 1/0 as three_votes_not_shared;
\\endif
reset role;
rollback;
\\echo barcode_correction_access_passed`;
 const result=spawnSync('psql',['-X','-qAt','--dbname',process.env.SUPABASE_DB_URL],{input:script,encoding:'utf8',timeout:90000});assert.ifError(result.error);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/barcode_correction_access_passed/);
});
