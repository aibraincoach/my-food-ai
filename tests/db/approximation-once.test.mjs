import test from 'node:test';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {scaleNutrition} from '../../src/lib/fdc/nutrients.ts';

test('the single-format end state stores one provenance tag and every retained estimate density unchanged',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url&&['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable migrated database required');
 const foodNutrients=[{nutrientId:1008,nutrientName:'Energy',unitName:'KCAL',value:10},{nutrientId:1003,nutrientName:'Protein',unitName:'G',value:20},{nutrientId:1004,nutrientName:'Fat',unitName:'G',value:30}];
 const food={fdcId:123,description:'Fixture',dataType:'Foundation',foodNutrients},estimate=scaleNutrition({...food,approximation:{kind:'estimate',basis:'b'}},50),closest=scaleNutrition({...food,approximation:{kind:'closest',basis:'Plain food'}},50);
 for(const n of [estimate,closest])assert.equal(n.micronutrients.filter(e=>e.approximation).length,1);assert.deepEqual(estimate.micronutrients.map(e=>e.per100),[10,20,30]);assert.deepEqual(estimate.micronutrients.map(e=>e.value),[5,10,15]);assert.ok(closest.micronutrients.every(e=>!Object.hasOwn(e,'per100')));
 const literal=v=>"'"+JSON.stringify(v).replaceAll("'","''")+"'::jsonb";
 const input=`begin;set local statement_timeout='5s';
 do $guard$ begin if to_regclass('public.nutrition_provenance_format') is not null or exists(select 1 from pg_trigger where tgname='enforce_nutrition_provenance_format') then raise exception 'Expected the0081 single-format end state';end if;end $guard$;
 create temporary table nutrition_write_fixture(kind text,item uuid);
 do $test$ declare owner_id uuid:=gen_random_uuid();meal uuid:=gen_random_uuid();a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();begin
 insert into auth.users(id)values(owner_id);insert into profiles(id,handle)values(owner_id,'single-format-'||owner_id);insert into posts(id,user_id,status)values(meal,owner_id,'ready');insert into post_items(id,post_id,name,source)values(a,meal,'Estimate fixture','model'),(b,meal,'Closest fixture','model');
 insert into item_nutrition(post_item_id,source_ref,micronutrients)values(a,'${estimate.sourceRef}',${literal(estimate.micronutrients)}),(b,'${closest.sourceRef}',${literal(closest.micronutrients)});insert into nutrition_write_fixture values('estimate',a),('closest',b);end $test$;
 select json_object_agg(f.kind,n.micronutrients) from nutrition_write_fixture f join item_nutrition n on n.post_item_id=f.item;rollback;`;
 const out=execFileSync('psql',['-XqAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input,encoding:'utf8'}),stored=JSON.parse(out.trim().split('\n').find(line=>line.startsWith('{')));assert.deepEqual(stored.estimate,estimate.micronutrients);assert.deepEqual(stored.closest,closest.micronutrients);
});
