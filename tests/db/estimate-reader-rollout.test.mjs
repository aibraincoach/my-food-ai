import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {storedEstimateFood} from '../../src/lib/fdc/approximation-metadata.ts';

const legacy={};
vm.runInNewContext(ts.transpileModule(execFileSync('git',['show','376e3306:src/lib/fdc/approximation-metadata.ts'],{encoding:'utf8'}),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:legacy});
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const compactMigration=read('../../supabase/migrations/0055_approximation_once.sql');
function rolloutBody(path){
 const source=read(path);let sql=source.slice(source.indexOf('\nbegin;')+1).replace(/^begin;|^commit;/gm,'');
 return sql.replace(/\\ir (.+)/g,(_,relative)=>read('../../scripts/'+relative)).replaceAll(":'reader_floor'","repeat('a',40)");
}
const activate=rolloutBody('../../scripts/activate-compact-nutrition.sql');
const rollback=rolloutBody('../../scripts/rollback-compact-nutrition.sql');
const url=process.env.TEST_SQL_DATABASE_URL;
const check=()=>{assert.ok(url,'Disposable SQL URL is required');assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname));};
const run=input=>execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
const legacyEntries=JSON.stringify([200,10].map((per100,index)=>({nutrientId:index?1003:1008,nutrientName:index?'Protein':'Energy',unitName:index?'G':'KCAL',value:null,approximation:{kind:'estimate',basis:'fixture',sourceRef:'estimate:fixture',per100}})));
const compactEntries=JSON.stringify(JSON.parse(legacyEntries).map(({approximation,...entry},index)=>({...entry,per100:approximation.per100,...(!index?{approximation:{kind:approximation.kind,basis:approximation.basis,sourceRef:approximation.sourceRef}}:{})})));
const fixtures=`
create temporary table rollout_fixture(item uuid,post uuid,job uuid);
do $$declare u uuid:=gen_random_uuid();p uuid:=gen_random_uuid();i uuid:=gen_random_uuid();j uuid:=gen_random_uuid();begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'rollout-'||u);
 insert into posts(id,user_id,status)values(p,u,'ready');
 insert into post_items(id,post_id,name,source)values(i,p,'fixture','model');
 insert into item_nutrition(post_item_id,source_ref,micronutrients)values(i,'estimate:fixture','${compactEntries}');
 insert into jobs(id,post_id,kind,status,run_after)values(j,p,'analyze','queued',now());
 insert into rollout_fixture values(i,p,j);
end $$;`;
const capture=state=>`select jsonb_build_object('state','${state}','row',jsonb_build_object('source_ref',source_ref,'micronutrients',micronutrients)) from item_nutrition where post_item_id=(select item from rollout_fixture);`;

test('stored write boundary, actual legacy reader, compact activation, claim fences and rollback interoperate',()=>{
 check();
 const input=`begin;
 do $$begin
 if has_table_privilege('authenticated','public.nutrition_provenance_format','SELECT')
 or has_table_privilege('service_role','public.nutrition_provenance_format','UPDATE') then raise exception 'Write-format activation is exposed through the app API';end if;
 end $$;
 update nutrition_provenance_format set compact=false,reader_floor=null where id;
 ${fixtures}
 ${capture('preparation-new-writer')}
 update item_nutrition set micronutrients='${legacyEntries}' where post_item_id=(select item from rollout_fixture);
 ${capture('preparation-old-writer')}
 ${activate}
 ${capture('activated-migrated')}
 update item_nutrition set micronutrients='${legacyEntries}' where post_item_id=(select item from rollout_fixture);
 ${capture('activated-old-writer')}
 update item_nutrition set micronutrients='${compactEntries}' where post_item_id=(select item from rollout_fixture);
 ${capture('activated-new-writer')}
 do $$declare claimed uuid;begin
 if (claim_owned_job()).id is not null or (claim_job()).id is not null then raise exception 'Old immutable worker claimed compact work';end if;
 select (claim_owned_job(p_reader_format=>2)).id into claimed;
 if claimed is distinct from (select job from rollout_fixture) then raise exception 'Dual reader did not claim the fixture';end if;
 update jobs set status='finished' where id=claimed;
 begin perform claim_owned_job(p_reader_format=>1);raise exception 'Unknown reader accepted';exception when invalid_parameter_value then null;end;
 end $$;
 ${rollback}
 ${capture('rollback-migrated')}
 update item_nutrition set micronutrients='${compactEntries}' where post_item_id=(select item from rollout_fixture);
 ${capture('rollback-still-live-new-writer')}
 do $$declare claimed uuid;begin
 update jobs set status='queued' where id=(select job from rollout_fixture);
 select (claim_owned_job()).id into claimed;
 if claimed is distinct from (select job from rollout_fixture) then raise exception 'Old worker was not restored after row expansion';end if;
 end $$;
 ${read('../../supabase/rollbacks/0053_estimate_reader_rollout.down.sql')}
 rollback;`;
 const rows=run(input).split('\n').filter(line=>line.startsWith('{')).map(line=>JSON.parse(line));
 assert.equal(rows.length,7);
 for(const {state,row} of rows){
  assert.deepEqual(storedEstimateFood(row).foodNutrients.map(n=>n.value),[200,10],state);
  if(state.startsWith('activated')){
   assert.equal(row.micronutrients.filter(e=>e.approximation).length,1,state);
   assert.equal(legacy.storedEstimateFood(row),null,state);
  }else{
   assert.deepEqual(Array.from(legacy.storedEstimateFood(row).foodNutrients.map(n=>n.value)),[200,10],state);
   assert.equal(row.micronutrients.filter(e=>e.approximation).length,2,state);
  }
 }
});

test('raw compaction is guarded and running jobs abort activation without a timed drain',()=>{
 check();
 for(const [input,message] of [
  [`begin;update nutrition_provenance_format set compact=false,reader_floor=null where id;${compactMigration}`,'run compact activation'],
  [`begin;${fixtures}update jobs set status='running' where id=(select job from rollout_fixture);${activate}`,'Running jobs remain'],
 ]){
  const result=spawnSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input,encoding:'utf8'});
  assert.notEqual(result.status,0);assert.ok(result.stderr.includes(message),result.stderr);
 }
});
