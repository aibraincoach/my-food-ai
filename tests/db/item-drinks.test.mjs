// Disposable local DB only: node --env-file=.env.local --test tests/db/item-drinks.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
test('manual intake cannot reserve another owners item link; worker sync remains authoritative', () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.SUPABASE_DB_URL).hostname), 'Disposable local database only');
  const source = readFileSync(new URL('../../supabase/migrations/0029_drinks_from_items.sql', import.meta.url), 'utf8');
  const shape = source.match(/alter table public\.intake_logs add constraint intake_source_shape check \([\s\S]*?\n\);/)[0];
  const copyFunctions = ['copy_owned_post', 'copy_owned_saved_meal'].map(name => { const start = source.indexOf(`create or replace function public.${name}(`); return source.slice(start, source.indexOf('end $$;', start) + 7); }).join('\n');
  const insertPolicy = source.match(/alter policy intake_owner_insert[^;]+;/)[0];
  const sql = `\\set ON_ERROR_STOP on
begin;
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='intake_logs' and column_name='source') as migration_installed \\gset
\\if :migration_installed
-- Recheck the current constraint even on a disposable database loaded with an
-- earlier draft of 0029. Everything, including this DDL, is rolled back.
alter table public.intake_logs drop constraint if exists intake_source_shape;
${shape}
\\else
${source}
\\endif
${insertPolicy}
${copyFunctions}
insert into auth.users(id,email) values('10000000-0000-4000-8000-000000000001','run6-drinks-one.invalid'),('10000000-0000-4000-8000-000000000002','run6-drinks-two.invalid') on conflict(id) do nothing;
insert into public.profiles(id,handle) values('10000000-0000-4000-8000-000000000001','run6_drinks_one'),('10000000-0000-4000-8000-000000000002','run6_drinks_two') on conflict(id) do nothing;
insert into public.posts(id,user_id,caption,status,eaten_at) values('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Cola','ready',now());
insert into public.post_items(id,post_id,name,portion_text,portion_grams,source) values('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Cola','355 ml',355,'model');
insert into public.item_nutrition(post_item_id,calories,food_category) values('30000000-0000-4000-8000-000000000001',140,'soft drinks');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
do $$ begin
 begin
  insert into public.intake_logs(user_id,kind,amount,ml,source,post_item_id) values(auth.uid(),'water',250,250,'item','30000000-0000-4000-8000-000000000001');
  raise exception 'Unlinked item poisoning allowed';
 exception when check_violation or insufficient_privilege then null;end;
 begin
  insert into public.intake_logs(user_id,kind,amount,ml,source,post_item_id) values(auth.uid(),'water',250,250,'sheet','30000000-0000-4000-8000-000000000001');
  raise exception 'Sheet item poisoning allowed';
 exception when check_violation or insufficient_privilege then null;end;
 insert into public.intake_logs(user_id,kind,amount) values(auth.uid(),'water',250);
 if not exists(select 1 from public.intake_logs where user_id=auth.uid() and post_id is null and post_item_id is null and amount=250) then raise exception 'Legacy manual water refused';end if;
 begin perform public.sync_item_drinks('20000000-0000-4000-8000-000000000001','[]');raise exception 'Owner sync allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role service_role;
select public.sync_item_drinks('20000000-0000-4000-8000-000000000001','[{"post_item_id":"30000000-0000-4000-8000-000000000001","kind":"caffeine","amount":34,"ml":355,"label":"Cola"}]');
do $$ begin
 if not exists(select 1 from public.intake_logs where post_item_id='30000000-0000-4000-8000-000000000001' and post_id='20000000-0000-4000-8000-000000000001' and user_id='10000000-0000-4000-8000-000000000001' and amount=34 and ml=355) then raise exception 'Worker link corrupted';end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.log_post_again('20000000-0000-4000-8000-000000000001',now()-interval '1 hour') as copied_id \\gset
select set_config('run6.copied',:'copied_id',true);
reset role;
set local role service_role;
do $$ begin
 if not exists(select 1 from public.jobs where post_id=current_setting('run6.copied')::uuid and kind='recompute' and payload->>'reason'='drink_sync' and status='queued') then raise exception 'Copied meal has no durable hydration repair';end if;
 if not exists(select 1 from public.current_post_items i join public.item_nutrition n on n.post_item_id=i.id where i.post_id=current_setting('run6.copied')::uuid and n.food_category='soft drinks') then raise exception 'Copy category lost';end if;
end $$;
-- With only 0029 installed the post FK still sets post_id to NULL before the
-- item FK cascades it. Deletion must work without 0030 already being present.
delete from public.posts where id='20000000-0000-4000-8000-000000000001';
do $$ begin
 if exists(select 1 from public.post_items where id='30000000-0000-4000-8000-000000000001') or exists(select 1 from public.intake_logs where post_item_id='30000000-0000-4000-8000-000000000001') then raise exception 'Item or hydration survived post deletion';end if;
end $$;
rollback;`;
  const result = spawnSync('psql', ['-X', '-qAt', '--dbname', process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 90000 });
  assert.equal(result.status, 0, result.stderr);
});
