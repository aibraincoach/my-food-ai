// Transactional, disposable local database only.
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
test('all four hint dismissals persist once, retain existing keys and stay owner scoped',()=>{
 const url=process.env.SUPABASE_DB_URL;assert.ok(url);assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname));
 const migration=readFileSync(new URL('../../supabase/migrations/0042_modes_hint.sql',import.meta.url),'utf8');
 const rollback=readFileSync(new URL('../../supabase/rollback/0042_modes_hint.sql',import.meta.url),'utf8');
 const sql=`\\set ON_ERROR_STOP on
begin;
${migration}
insert into auth.users(id,email) values('42000000-0000-4000-8000-000000000001','run10-hints-one.invalid'),('42000000-0000-4000-8000-000000000002','run10-hints-two.invalid');
insert into public.profiles(id,handle,hints_seen) values('42000000-0000-4000-8000-000000000001','run10_hints_one',array['capture','thread','thumbs']),('42000000-0000-4000-8000-000000000002','run10_hints_two',array['thread']);
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
select public.dismiss_hint('modes');
select public.dismiss_hint('modes');
select public.dismiss_hint('capture');select public.dismiss_hint('thread');select public.dismiss_hint('thumbs');
do $$ begin
 if (select hints_seen from public.profiles where id=auth.uid())<>array['capture','thread','thumbs','modes'] then raise exception 'Keys lost or duplicated';end if;
 begin perform public.dismiss_hint('invalid');raise exception 'Invalid key accepted';exception when raise_exception then if sqlerrm<>'Unknown hint' then raise;end if;end;
 begin perform public.dismiss_hint(null);raise exception 'Null key accepted';exception when raise_exception then if sqlerrm<>'Unknown hint' then raise;end if;end;
end $$;
reset role;
do $$ begin if (select hints_seen from public.profiles where id='42000000-0000-4000-8000-000000000002')<>array['thread'] then raise exception 'Other owner changed';end if;end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"42000000-0000-4000-8000-000000000002","role":"authenticated"}',true);
select public.dismiss_hint('modes');
reset role;
do $$ begin if (select hints_seen from public.profiles where id='42000000-0000-4000-8000-000000000002')<>array['thread','modes'] then raise exception 'Second owner did not persist';end if;end $$;
select set_config('request.jwt.claims','{}',true);
do $$ begin begin perform public.dismiss_hint('modes');raise exception 'Unauthenticated accepted';exception when raise_exception then if sqlerrm<>'Authentication required' then raise;end if;end;end $$;
${rollback}
select set_config('request.jwt.claims','{"sub":"42000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
do $$ begin
 begin perform public.dismiss_hint('modes');raise exception 'Rollback accepted modes';exception when raise_exception then if sqlerrm<>'Unknown hint' then raise;end if;end;
 if (select hints_seen from public.profiles where id=auth.uid())<>array['capture','thread','thumbs','modes'] then raise exception 'Rollback destroyed seen history';end if;
end $$;
rollback;`;
 const result=spawnSync('psql',[url,'-X','-q'],{input:sql,encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
