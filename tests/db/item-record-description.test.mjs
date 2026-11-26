import {effectiveFunctions,nutritionWriters} from '../fixtures/sql-functions.mjs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import{spawnSync}from'node:child_process';
const raw=fs.readFileSync(new URL('../../supabase/migrations/0087_item_record_description.sql',import.meta.url),'utf8');
const migration=raw.replace(/^begin;$/m,'').replace(/^commit;$/m,'');
const summary=`'{"code":"mealSummary","values":{"kind":"consumed","totals":{"calories":100,"protein_g":5,"carbs_g":10,"fat_g":2},"approximations":[],"unavailable":[]}}'::jsonb`;
// Exercise the rollout boundary on either a base DB or an already-migrated disposable DB.
// All temporary body/schema restoration is inside this test's rollback transaction.
const migrationDir=new URL('../../supabase/migrations/',import.meta.url).pathname;
const priorWriters=nutritionWriters(effectiveFunctions(migrationDir,file=>path.basename(file)==='0087_item_record_description.sql'?'':fs.readFileSync(file,'utf8')));
const restoreBase=`select exists(select 1 from information_schema.columns where table_schema='public' and table_name='item_nutrition' and column_name='record_description') as record_installed \\gset
\\if :record_installed
${priorWriters.map(row=>row.sql.replace(/^create(?:\s+or\s+replace)?\s+function/i,'create or replace function')).join('\n')}
alter table public.item_nutrition drop column record_description,drop column record_data_type;
\\endif
`;
function sql(text,preinstall=false){
 const db=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(db&&['127.0.0.1','localhost','[::1]'].includes(new URL(db).hostname),'Disposable local DB required');
 const dir=fs.mkdtempSync(path.join(tmpdir(),'mfa-record-sql-')),file=path.join(dir,'case.sql');
 try {
  fs.writeFileSync(file,'begin;'+restoreBase+(preinstall?migration+restoreBase:'')+text+'rollback;',{mode:0o600});
  const r=spawnSync('psql',['-XqAt','--dbname',db,'-v','ON_ERROR_STOP=1','--file',file],{encoding:'utf8',timeout:15000});
  assert.ifError(r.error);return r;
 }finally{fs.unlinkSync(file);fs.rmdirSync(dir);}
}
function check(text){const r=sql(migration+text);assert.equal(r.status,0,r.stderr);}
const helpers=String.raw`
create function pg_temp.record_fixture() returns table(owner_id uuid,post_id uuid,item_id uuid) language plpgsql as $f$
begin
 owner_id:=gen_random_uuid();insert into auth.users(id)values(owner_id);insert into profiles(id,handle)values(owner_id,'record-'||owner_id);
 post_id:=public.create_food_post(owner_id,now(),'Fixture food',100,'{"calories":100,"protein_g":5,"carbs_g":10,"fat_g":2,"micronutrients":[],"source_ref":"1","record_description":"Source food","record_data_type":"SR Legacy","gtin":"00016000275683"}'::jsonb);
 select i.id into item_id from public.current_post_items i where i.post_id=record_fixture.post_id;
 return next;
end $f$;
create function pg_temp.assert_record(p uuid,d text,t text) returns void language plpgsql as $f$
declare actual record;
begin
 select n.record_description,n.record_data_type into actual from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p;
 if not found or actual.record_description is distinct from d or actual.record_data_type is distinct from t then raise exception 'Record pair mismatch for fixture';end if;
end $f$;
`;
test('0087 rejects missing prerequisites and rerun, without rewriting old rows',()=>{
 const missing=sql("alter function public.require_capture_zone(text) rename to hidden_capture_zone;"+migration);assert.notEqual(missing.status,0);assert.match(missing.stderr,/requires applied 0082/);
 const missingStructured=sql("alter function public.require_meal_summary(jsonb) rename to hidden_meal_summary;"+migration);assert.notEqual(missingStructured.status,0);assert.match(missingStructured.stderr,/requires applied 0084/);
 const rerun=sql(migration+migration);assert.notEqual(rerun.status,0);assert.match(rerun.stderr,/record metadata already exists/);
 const old=`create temporary table record_before as select to_jsonb(n) as row from public.item_nutrition n;`;
 const r=sql(old+migration+`do $test$ begin if exists((select row from record_before except select to_jsonb(n)-'record_description'-'record_data_type' from public.item_nutrition n) union all (select to_jsonb(n)-'record_description'-'record_data_type' from public.item_nutrition n except select row from record_before)) or exists(select 1 from public.item_nutrition where record_description is not null or record_data_type is not null) then raise exception 'Old nutrition rewritten';end if;end $test$;`);assert.equal(r.status,0,r.stderr);
});
test('0087 constraints reject invalid pairs, lengths and non-FDC or null refs',()=>check(helpers+String.raw`
do $test$ declare f record;candidate jsonb;begin
 select * into f from pg_temp.record_fixture();
 for candidate in select value from jsonb_array_elements(jsonb_build_array(
  jsonb_build_object('source_ref','estimate:x','record_description','Food','record_data_type','SR Legacy'),
  jsonb_build_object('source_ref',null,'record_description','Food','record_data_type','SR Legacy'),
  jsonb_build_object('source_ref','1','record_description','Food','record_data_type',null),
  jsonb_build_object('source_ref','1','record_description',null,'record_data_type','SR Legacy'),
  jsonb_build_object('source_ref','1','record_description',' ','record_data_type','SR Legacy'),
  jsonb_build_object('source_ref','1','record_description',repeat('x',501),'record_data_type','SR Legacy'),
  jsonb_build_object('source_ref','1','record_description','Food','record_data_type',''),
  jsonb_build_object('source_ref','1','record_description','Food','record_data_type',repeat('x',81)))) loop
  begin
   update public.item_nutrition set source_ref=candidate->>'source_ref',record_description=candidate->>'record_description',record_data_type=candidate->>'record_data_type' where post_item_id=f.item_id;
   raise exception 'Invalid record accepted';
  exception when check_violation then null;end;
 end loop;
 update public.item_nutrition set source_ref='0',record_description=repeat('x',500),record_data_type=repeat('x',80) where post_item_id=f.item_id;
 update public.item_nutrition set source_ref='label',record_description=null,record_data_type=null where post_item_id=f.item_id;
end $test$;`));
test('fresh and saved-copy RPCs store the exact pair; old snapshots remain null',()=>check(helpers+String.raw`
do $test$ declare f record;p uuid;s uuid;items jsonb;begin
 select * into f from pg_temp.record_fixture();perform pg_temp.assert_record(f.post_id,'Source food','SR Legacy');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',f.owner_id,'role','authenticated')::text,true);
 p:=public.copy_owned_post(f.post_id,now());perform pg_temp.assert_record(p,'Source food','SR Legacy');
 s:=public.save_meal_from_post(f.post_id,'Fixture snapshot');
 p:=public.copy_owned_saved_meal(s,now());perform pg_temp.assert_record(p,'Source food','SR Legacy');
 update public.saved_meals target set items=jsonb_build_array((target.items->0)||jsonb_build_object('nutrition',(target.items#>'{0,nutrition}')-'record_description'-'record_data_type')) where target.id=s;
 p:=public.copy_owned_saved_meal(s,now());perform pg_temp.assert_record(p,null,null);
 items:='[{"name":"Fresh rice","portion_grams":100,"nutrition":{"calories":100,"protein_g":5,"carbs_g":10,"fat_g":2,"micronutrients":[],"source_ref":"2","record_description":"Fresh matched rice","record_data_type":"Foundation"}}]';
 insert into posts(user_id,status)values(f.owner_id,'processing')returning id into p;
 perform public.persist_analysis_initial(p,items,'Fixture summary'::text);perform pg_temp.assert_record(p,'Fresh matched rice','Foundation');
 insert into posts(user_id,status)values(f.owner_id,'processing')returning id into p;
 perform public.persist_analysis_initial(p,items,`+summary+String.raw`);perform pg_temp.assert_record(p,'Fresh matched rice','Foundation');
 p:=public.edit_post_item_with_nutrition(f.post_id,f.owner_id,'add',null,'New rice',100,null,items#>'{0,nutrition}');
 if (select record_description from public.item_nutrition where post_item_id=p) is distinct from 'Fresh matched rice' then raise exception 'Edit lost fresh record';end if;
end $test$;`));
for(const structured of [false,true])for(const kind of ['comment','photo','remainder','rebuild'])test(`${kind} ${structured?'structured':'text'}: retained same-ref pair survives; changed refs never inherit it`,()=>check(helpers+String.raw`
do $test$ declare f record;mode integer;j uuid;c uuid;photo uuid;n jsonb;items jsonb;actual uuid;begin
 for mode in 0..2 loop
 select * into f from pg_temp.record_fixture();j:=gen_random_uuid();
 n:=jsonb_build_object('calories',100,'protein_g',5,'carbs_g',10,'fat_g',2,'micronutrients','[]'::jsonb,'source_ref',case when mode=0 then '1' else '2' end);
 if mode<2 then n:=n||jsonb_build_object('record_description','New payload food','record_data_type','Foundation');end if;
 items:=jsonb_build_array(jsonb_build_object('name','Fixture food','portion_grams',100,'portion_text','100 g','supersedes',f.item_id,'old_id',f.item_id,'not_eaten_grams',0,'nutrition',n));
 insert into public.jobs(id,post_id,kind,status,payload)values(j,f.post_id,'`+(kind==='remainder'?'remainder':kind==='rebuild'?'recompute':'correct')+String.raw`','running','{"post_ownership":true,"correction_from_sequence":0,"correction_pending_ids":[],"photo_added":true,"reason":"media_removed"}');
 update public.posts set active_job_id=j where id=f.post_id;
 `+(kind==='comment'?String.raw`
 insert into public.post_comments(post_id,author,body)values(f.post_id,'user','Fixture correction')returning id into c;
 update public.jobs set payload=payload||jsonb_build_object('correction_pending_ids',jsonb_build_array(c)) where id=j;
 perform public.persist_correction(f.post_id,j,array[f.item_id],c,items,`+(structured?summary:"'Fixture summary'::text")+');':kind==='photo'?`perform public.persist_photo_correction(f.post_id,j,array[f.item_id],items,${structured?summary:"'Fixture summary'::text"},null);`:kind==='remainder'?String.raw`
 insert into public.post_media(post_id,storage_path,kind,not_eaten,position)values(f.post_id,f.owner_id||'/'||f.post_id||'/1.jpg','photo',true,1)returning id into photo;
 update public.jobs set payload=payload||jsonb_build_object('remainder_photo_id',photo)where id=j;
 perform public.apply_post_remainder(f.post_id,j,photo,array[f.item_id],items,`+(structured?summary:"'Fixture summary'::text")+');':`perform public.persist_removed_rebuild(f.post_id,j,array[f.item_id],'{}'::uuid[],'{}'::uuid[],items,${structured?summary:"'Fixture summary'::text"});`)+String.raw`
 perform pg_temp.assert_record(f.post_id,case when mode=0 then 'Source food' when mode=1 then 'New payload food' else null end,case when mode=0 then 'SR Legacy' when mode=1 then 'Foundation' else null end);
 end loop;
end $test$;`));
for(const structured of [false,true])test('barcode correction '+structured+' stores the new supplied pair',()=>check(helpers+String.raw`
do $test$ declare f record;fresh uuid;n jsonb;begin
 select * into f from pg_temp.record_fixture();
 n:='{"calories":50,"micronutrients":[],"source_ref":"2","record_description":"Correct matched food","record_data_type":"Foundation"}';
 fresh:=public.correct_barcode_item(f.post_id,f.owner_id,'00016000275683','Corrected food',100,'g',n`+(structured?`, '{"code":"productCorrected","values":{"name":"Corrected food"}}'::jsonb`:'')+String.raw`);
 perform pg_temp.assert_record(f.post_id,'Correct matched food','Foundation');
end $test$;`));

test('pre-0087 RPC accepts unknown JSON keys but cannot retain them; app must wait for apply',()=>{
 const r=sql(String.raw`do $test$ declare u uuid:=gen_random_uuid();p uuid;begin
 insert into auth.users(id)values(u);insert into profiles(id,handle)values(u,'before-record-'||u);
 p:=public.create_food_post(u,now(),'Before migration',100,'{"calories":100,"micronutrients":[],"source_ref":"1","record_description":"Ignored before apply","record_data_type":"Foundation"}'::jsonb);
 if exists(select 1 from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=p and (to_jsonb(n)?'record_description' or to_jsonb(n)?'record_data_type')) then raise exception 'Pre-migration unexpectedly retained keys';end if;
 end $test$;`);assert.equal(r.status,0,r.stderr);
});
test('unexpected writer body fails the guard before DDL; all catalog writers keep their privileges',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('../fixtures/item-record-writers.json',import.meta.url)));
 const sig=base.find(x=>x.signature.startsWith('copy_owned_post(')).signature;
 const tamper="do $change$ declare body text;begin select pg_get_functiondef('public."+sig+"'::regprocedure)into body;execute replace(body,'begin','begin -- unexpected body');end $change$;";
 const failed=sql(tamper+migration);assert.notEqual(failed.status,0);assert.match(failed.stderr,/unexpected writer state/);
 const old="create temporary table record_writer_before as select oid,proowner,proacl,prosecdef,proconfig from pg_proc where pronamespace='public'::regnamespace and prokind='f' and prosrc ~* 'insert[[:space:]]+into[[:space:]]+(public[.])?item_nutrition';";
 const r=sql(old+migration+String.raw`do $test$ declare row record;begin
 for row in select p.prosrc from pg_proc p where p.oid in(select oid from record_writer_before) loop
  if row.prosrc !~* 'insert[[:space:]]+into[[:space:]]+public.item_nutrition[[:space:]]*\([^)]*record_description[^)]*record_data_type' then raise exception 'Catalog writer omitted pair';end if;
 end loop;
 if exists(select 1 from record_writer_before b join pg_proc p on p.oid=b.oid where (p.proowner,p.proacl,p.prosecdef,p.proconfig) is distinct from (b.proowner,b.proacl,b.prosecdef,b.proconfig))then raise exception 'Writer privileges changed';end if;
 end $test$;`);assert.equal(r.status,0,r.stderr);
});

test('rollout tests also run when the disposable stack already applied0087',()=>{
 const r=sql(migration+helpers+`do $test$ declare f record;begin select * into f from pg_temp.record_fixture();perform pg_temp.assert_record(f.post_id,'Source food','SR Legacy');end $test$;`,true);assert.equal(r.status,0,r.stderr);
});
