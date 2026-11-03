// node --env-file=.env.local --test tests/db/copy-operations.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('copy receipts keep one owned drink snapshot across retry, source deletion and cancellation',()=>{
 const url=process.env.SUPABASE_DB_URL;assert.ok(url);assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname),'Disposable database only');
 const migration=readFileSync(new URL('../../supabase/migrations/0044_copy_post_operations.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollback/0044_copy_post_operations.sql',import.meta.url),'utf8');
 const sql=`\\set ON_ERROR_STOP on
begin;
select to_regclass('public.copy_post_operations') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
insert into auth.users(id,email) values('44000000-0000-4000-8000-000000000001','copy-one.invalid'),('44000000-0000-4000-8000-000000000002','copy-two.invalid');
insert into public.profiles(id,handle)values('44000000-0000-4000-8000-000000000001','copy_one'),('44000000-0000-4000-8000-000000000002','copy_two');
insert into public.posts(id,user_id,caption,eaten_at,status,analysis_initialized_at)values('44000000-0000-4000-8000-000000000101','44000000-0000-4000-8000-000000000001','Coffee fixture',now()-interval '1 hour','ready',now());
insert into public.post_items(id,post_id,name,portion_grams,portion_text,source)values('44000000-0000-4000-8000-000000000201','44000000-0000-4000-8000-000000000101','Coffee',240,'240 ml','user');
insert into public.item_nutrition(post_item_id,calories,protein_g,carbs_g,fat_g,micronutrients,source_ref)values('44000000-0000-4000-8000-000000000201',2,0,0,0,'[]','copy-fixture');
insert into public.intake_logs(user_id,post_id,kind,amount,ml,label,logged_at)values('44000000-0000-4000-8000-000000000001','44000000-0000-4000-8000-000000000101','caffeine',95,240,'Coffee',now()-interval '1 hour');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select set_config('copy.time',(now()-interval '30 minutes')::text,true);
select public.save_meal_from_post('44000000-0000-4000-8000-000000000101','Saved Coffee') as saved_id \\gset
select set_config('copy.saved',:'saved_id',true);
update public.saved_meals set last_logged_at='2026-10-01T00:00:00Z' where id=:'saved_id';
select public.publish_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz) as post_copy \\gset
select set_config('copy.post',:'post_copy',true);
do $$begin
 if public.publish_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz)<>current_setting('copy.post')::uuid then raise exception 'Retry duplicated post';end if;
 if (select count(*) from public.posts where source_post_id='44000000-0000-4000-8000-000000000101')<>1 then raise exception 'Multiple copied posts';end if;
 if not exists(select 1 from public.intake_logs where post_id=current_setting('copy.post')::uuid and ml=240 and amount=95 and source='sheet') then raise exception 'Authoritative drink lost';end if;
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz+interval '1 minute');raise exception 'Changed time accepted';exception when sqlstate 'PT409' then null;end;
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000301',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz);raise exception 'Changed selection accepted';exception when sqlstate 'PT409' then null;end;
 begin perform * from public.copy_post_operations;raise exception 'Private receipt table readable';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claims','{"sub":"44000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$begin
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz);raise exception 'Other owner reused receipt';exception when insufficient_privilege then null;end;
 begin perform public.cancel_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz);raise exception 'Other owner cancelled receipt';exception when insufficient_privilege then null;end;
end $$;
reset role;
delete from public.posts where id='44000000-0000-4000-8000-000000000101';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"44000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$begin if public.publish_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz)<>current_setting('copy.post')::uuid then raise exception 'Lost response retry required deleted source';end if;end $$;
select set_config('copy.logged_before',(select last_logged_at::text from public.saved_meals where id=current_setting('copy.saved')::uuid),true);
select public.publish_copy_operation('44000000-0000-4000-8000-000000000302',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz) as saved_copy \\gset
select set_config('copy.saved_post',:'saved_copy',true);
do $$begin
 if not exists(select 1 from public.intake_logs where post_id=current_setting('copy.saved_post')::uuid and ml=240 and amount=95 and source='sheet') then raise exception 'Source-deleted saved drink lost';end if;
 if public.cancel_copy_operation('44000000-0000-4000-8000-000000000302',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz)<>current_setting('copy.saved_post')::uuid then raise exception 'Committed cancellation lost target';end if;
 if exists(select 1 from public.posts where id=current_setting('copy.saved_post')::uuid) then raise exception 'Cancelled copy remains visible under RLS';end if;
 if (select last_logged_at from public.saved_meals where id=current_setting('copy.saved')::uuid) is distinct from current_setting('copy.logged_before')::timestamptz then raise exception 'Cancelled bookkeeping not restored';end if;
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000302',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz);raise exception 'Cancellation resurrected post';exception when sqlstate 'PT410' then null;end;
end $$;
select public.publish_copy_operation('44000000-0000-4000-8000-000000000303',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz) as later_copy \\gset
select set_config('copy.later',:'later_copy',true);
select set_config('copy.logged_later',(select last_logged_at::text from public.saved_meals where id=current_setting('copy.saved')::uuid),true);
select public.cancel_copy_operation('44000000-0000-4000-8000-000000000301','44000000-0000-4000-8000-000000000101',false,current_setting('copy.time')::timestamptz);
do $$begin
 if (select last_logged_at from public.saved_meals where id=current_setting('copy.saved')::uuid) is distinct from current_setting('copy.logged_later')::timestamptz then raise exception 'Cancellation overwrote a later log';end if;
 if public.cancel_copy_operation('44000000-0000-4000-8000-000000000304','44000000-0000-4000-8000-000000000999',false,current_setting('copy.time')::timestamptz) is not null then raise exception 'Pre-publication cancellation invented post';end if;
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000304','44000000-0000-4000-8000-000000000999',false,current_setting('copy.time')::timestamptz);raise exception 'Pre-publication tombstone ignored';exception when sqlstate 'PT410' then null;end;
end $$;
reset role;
update public.posts set deleted_at=now() where id=:'later_copy';
set local role authenticated;
do $$begin
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000305',current_setting('copy.later')::uuid,false,current_setting('copy.time')::timestamptz);raise exception 'Deleted source copied';exception when insufficient_privilege then null;end;
 begin perform public.publish_copy_operation('44000000-0000-4000-8000-000000000303',current_setting('copy.saved')::uuid,true,current_setting('copy.time')::timestamptz);raise exception 'Deleted receipt target restored';exception when sqlstate 'PT410' then null;end;
end $$;
reset role;
${rollback}
do $$begin if to_regclass('public.copy_post_operations') is not null then raise exception 'Rollback left receipt table';end if;end $$;
set local role authenticated;
select public.log_saved_meal(current_setting('copy.saved')::uuid,current_setting('copy.time')::timestamptz);
rollback;`;
 const result=spawnSync('psql',[url,'-X','-q'],{input:sql,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
