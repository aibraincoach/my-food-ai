import test from 'node:test';import assert from 'node:assert/strict';import{execFileSync}from'node:child_process';import{readFileSync}from'node:fs';
const url=process.env.TEST_SQL_DATABASE_URL;
function sql(body){assert.ok(url,'Set TEST_SQL_DATABASE_URL to the final migrated disposable database');assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Local database only');return execFileSync('psql',['-X','-qAt','--dbname',url,'-v','ON_ERROR_STOP=1'],{input:body,encoding:'utf8',timeout:20000});}
const setup=`declare owner_id uuid:=gen_random_uuid(); other_id uuid:=gen_random_uuid(); operation uuid:=gen_random_uuid(); bad_operation uuid:=gen_random_uuid(); result uuid; again uuid; old_item uuid; new_item uuid; before_count bigint; path text; photo jsonb; nutrition jsonb:='{"calories":60,"protein_g":2,"carbs_g":10,"fat_g":1,"gtin":"00016000275683","food_category":"Beverages","portion_unit":"ml"}'; begin
insert into storage.buckets(id,name,public)values('media','media',false) on conflict(id)do nothing;
insert into auth.users(id)values(owner_id),(other_id);insert into public.profiles(id,handle)values(owner_id,'barcode-'||owner_id),(other_id,'barcode-'||other_id);`;
const run=body=>sql("begin;set local statement_timeout='15s';do $case$ "+setup+body+' end $case$;rollback;');
test('operation preserves canonical barcode and scanned drink category on final schema',()=>run(`
result:=public.publish_food_operation(operation,owner_id,repeat('a',64),now(),'Fixture drink',150,nutrition);
if not exists(select 1 from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=result and i.gtin='00016000275683' and n.food_category='Beverages' and i.portion_text='150 ml') then raise exception 'Barcode or scanned drink category missing';end if;
again:=public.publish_food_operation(operation,owner_id,repeat('a',64),now(),'Same request',150,nutrition);
if again<>result or (select count(*) from public.current_post_items where post_id=result)<>1 then raise exception 'Operation replay duplicated';end if;
begin perform public.publish_food_operation(operation,other_id,repeat('a',64),now(),'Foreign replay',150,nutrition);raise exception 'Foreign replay accepted';exception when insufficient_privilege then null;end;
`));
test('correct product finds the scanned item and preserves its supersession lineage',()=>run(`
result:=public.publish_food_operation(operation,owner_id,repeat('a',64),now(),'Fixture drink',150,nutrition);
select id into old_item from public.current_post_items where post_id=result;
new_item:=public.correct_barcode_item(result,owner_id,'00016000275683','Corrected drink',150,'ml',nutrition||'{"calories":75}');
if new_item=old_item or (select count(*) from public.current_post_items where post_id=result)<>1 then raise exception 'Correction duplicated or did not replace';end if;
if not exists(select 1 from public.current_post_items where id=new_item and gtin='00016000275683' and supersedes=old_item) or not exists(select 1 from public.post_items where id=old_item and superseded_at is not null) then raise exception 'Correction lineage or barcode lost';end if;
`));
test('direct creation preserves barcode while ordinary non-barcode food stays null',()=>run(`
result:=public.create_food_post(owner_id,now(),'Direct drink',150,nutrition);
if (select gtin from public.current_post_items where post_id=result) is distinct from '00016000275683' then raise exception 'Direct barcode missing';end if;
result:=public.create_food_post(owner_id,now(),'Ordinary food',100,nutrition-'gtin');
if (select gtin from public.current_post_items where post_id=result) is not null then raise exception 'Invented barcode';end if;
`));
test('malformed barcode fails atomically before a post or operation receipt exists',()=>run(`
select count(*) into before_count from public.posts where user_id=owner_id;
begin perform public.publish_food_operation(bad_operation,owner_id,repeat('a',64),now(),'Malformed',100,nutrition||'{"gtin":"123"}');raise exception 'Bad barcode accepted';exception when invalid_parameter_value then null;end;
if exists(select 1 from public.food_post_operations where operation_id=bad_operation) or (select count(*) from public.posts where user_id=owner_id)<>before_count then raise exception 'Failed barcode left rows';end if;
`));
test('serving, photo ownership, stage and same-photo guards remain on the sole creation path',()=>run(`
result:=public.create_food_post(owner_id,now(),'Serving fixture',2,nutrition||'{"portion_unit":"serving"}');
if (select portion_text from public.current_post_items where post_id=result)<>'2 servings' or (select portion_grams from public.current_post_items where post_id=result) is not null then raise exception 'Serving semantics changed';end if;
begin perform public.create_food_post(owner_id,now(),'Bad cup',1,nutrition||'{"portion_unit":"cup"}');raise exception 'Cup accepted';exception when invalid_parameter_value then null;end;
begin perform public.create_food_post(owner_id,now(),'Foreign photo',1,nutrition,jsonb_build_object('path',other_id||'/'||gen_random_uuid()||'/0.jpg','width',10,'height',10));raise exception 'Foreign photo accepted';exception when invalid_parameter_value then null;end;
path:=owner_id||'/'||gen_random_uuid()||'/0.jpg';photo:=jsonb_build_object('path',path,'width',10,'height',10);
insert into storage.objects(bucket_id,name)values('media',path),('media',regexp_replace(path,'[.]jpg$','.feed.jpg'));
begin perform public.create_food_post(owner_id,now(),'Missing stage',1,nutrition,photo);raise exception 'Missing cleanup stage accepted';exception when invalid_parameter_value then null;end;
insert into public.jobs(kind,status,priority,run_after,payload)values('media_cleanup','queued',10,now()+interval '1 hour',jsonb_build_object('owner_id',owner_id,'deleted_post_id',split_part(path,'/',2)));
result:=public.create_food_post(owner_id,now(),'Photo fixture',1,nutrition,photo);again:=public.create_food_post(owner_id,now(),'Same photo',1,nutrition,photo);
if result<>again or (select count(*) from public.current_post_items where post_id=result)<>1 then raise exception 'Same-photo idempotency changed';end if;
if to_regprocedure('public.create_food_post_without_gtin(uuid,timestamptz,text,numeric,jsonb,jsonb)') is not null then raise exception 'Duplicate creation path remains';end if;
if has_function_privilege('authenticated','public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb)','execute') then raise exception 'Client can forge food nutrition';end if;
`));
test('0075 rollback restores both prior function bodies then rolls forward',()=>{
 const old=readFileSync(new URL('../../supabase/migrations/0071_job_retention.sql',import.meta.url),'utf8');
 const expected=['create_food_post','create_food_post_without_gtin'].map(name=>old.split('create or replace function public.'+name+'(')[1].split('as $$')[1].split('$$;')[0]);
 const down=readFileSync(new URL('../../supabase/rollback/0075_food_post_gtin.down.sql',import.meta.url),'utf8'),up=readFileSync(new URL('../../supabase/migrations/0075_food_post_gtin.sql',import.meta.url),'utf8');
 const quote=s=>"'"+s.replaceAll("'","''")+"'";
 sql('begin;'+down+`do $check$ begin if (select prosrc from pg_proc where oid='public.create_food_post(uuid,timestamptz,text,numeric,jsonb,jsonb)'::regprocedure) is distinct from ${quote(expected[0])} or (select prosrc from pg_proc where oid='public.create_food_post_without_gtin(uuid,timestamptz,text,numeric,jsonb,jsonb)'::regprocedure) is distinct from ${quote(expected[1])} then raise exception 'Rollback body differs from0071';end if;end $check$;`+up+`do $check$ begin if to_regprocedure('public.create_food_post_without_gtin(uuid,timestamptz,text,numeric,jsonb,jsonb)') is not null then raise exception 'Roll-forward duplicate remains';end if;end $check$;rollback;`);
});
