// TEST_SQL_DATABASE_URL=... node --test tests/db/sugar-backfill.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

test('sugar backfill fills only eligible portion 1063 nulls with feedback locking active', () => {
 const url=process.env.TEST_SQL_DATABASE_URL;
 assert.ok(url,'Set TEST_SQL_DATABASE_URL to the isolated migrated local database.');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname),'Disposable local DB only');
 const migration=readFileSync(new URL('../../supabase/migrations/0050_sugar_total_backfill.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollbacks/0050_sugar_total_backfill.down.sql',import.meta.url),'utf8');
 const sql=`begin;
 create temp table sugar_fixture(label text primary key,id uuid default gen_random_uuid(),expected numeric);
 insert into sugar_fixture(label,expected) values ('eligible',4.275),('existing',2),('preexisting-equal',4.275),('edited',4.275),('preferred',null),('unscaled',null),('wrong-unit',null),('no-calories',null),('missing-value',null);
 do $$declare p uuid;begin
 insert into public.posts(user_id,caption,status) select id,'Sugar backfill integration fixture','ready' from public.profiles limit 1 returning id into p;
 if p is null then raise exception 'Disposable profile fixture is required';end if;
 insert into public.post_items(id,post_id,name,source) select id,p,label,'model' from sugar_fixture;
 end $$;
 insert into public.item_nutrition(post_item_id,calories,sugar_g,micronutrients)
 select id,case when label='no-calories' then null else 100 end,case when label='existing' then 2 when label='preexisting-equal' then 4.275 else null end,
 jsonb_build_array(jsonb_build_object('nutrientId',1063,'unitName',case when label='wrong-unit' then 'MG' else 'G' end,'basis',case when label='unscaled' then '100g' else 'portion' end,'value',case when label='missing-value' then null else 4.275 end))
 || case when label='preferred' then '[{"nutrientId":2000,"unitName":"G","basis":"portion","value":5}]'::jsonb else '[]'::jsonb end
 from sugar_fixture;
 ${migration}
 do $$begin
 if exists(select 1 from sugar_fixture f join public.item_nutrition n on n.post_item_id=f.id where n.sugar_g is distinct from f.expected or n.calories is distinct from case when f.label='no-calories' then null else 100 end) then raise exception 'Sugar backfill changed an ineligible row or missed an eligible row';end if;
 end $$;
 ${migration}
 do $$begin
 if exists(select 1 from sugar_fixture f join public.item_nutrition n on n.post_item_id=f.id where n.sugar_g is distinct from f.expected) then raise exception 'Sugar backfill is not idempotent';end if;
 end $$;
 update public.item_nutrition set sugar_g=6 where post_item_id=(select id from sugar_fixture where label='edited');
 do $$begin
 if has_table_privilege('anon','public.sugar_total_backfill_0050','SELECT') or has_table_privilege('authenticated','public.sugar_total_backfill_0050','SELECT') then raise exception 'Backfill ledger exposed to app clients';end if;
 if (select count(*) from public.sugar_total_backfill_0050 b join sugar_fixture f on f.id=b.post_item_id) <> 2 then raise exception 'Backfill ledger includes unchanged fixtures';end if;
 end $$;
 ${rollback}
 do $$begin
 if exists(select 1 from sugar_fixture f join public.item_nutrition n on n.post_item_id=f.id where n.sugar_g is distinct from case when f.label='existing' then 2 when f.label='preexisting-equal' then 4.275 when f.label='edited' then 6 else null end) then raise exception 'Sugar rollback missed a backfill or changed preserved fixture sugar';end if;
 end $$;
 select 'sugar-backfill-ok';
 rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});
 assert.match(out,/sugar-backfill-ok/);
});
