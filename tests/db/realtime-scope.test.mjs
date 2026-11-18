import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
test('Realtime scope migration removes unused tables, indexes running jobs, and rolls back',()=>{
 const url=process.env.TEST_SQL_DATABASE_URL;assert.ok(url,'Set the isolated local database URL');assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(url).hostname));
 const up=readFileSync(new URL('../../supabase/migrations/0070_realtime_scope.sql',import.meta.url),'utf8'),down=readFileSync(new URL('../../supabase/rollbacks/0070_realtime_scope.down.sql',import.meta.url),'utf8');
 const sql=`begin;
 select exists(select 1 from pg_indexes where schemaname='public' and indexname='jobs_running_post') as migrated \\gset
 \\if :migrated
 ${down}
 \\endif
 ${up}
 do $$begin
 if (select array_agg(tablename::text order by tablename) from pg_publication_tables where pubname='supabase_realtime') <> array['post_comments','posts'] then raise exception 'publication scope';end if;
 if not exists(select 1 from pg_indexes where schemaname='public' and indexname='jobs_running_post' and indexdef like '%(post_id)%' and indexdef like '%status = %running%') then raise exception 'running index missing';end if;
 end$$;
 ${down}
 do $$begin
 if (select count(*) from pg_publication_tables where pubname='supabase_realtime') <> 5 then raise exception 'publication rollback';end if;
 if to_regclass('public.jobs_running_post') is not null then raise exception 'index rollback';end if;
 end$$;
 rollback;`;
 const out=execFileSync('psql',['-X',url,'-v','ON_ERROR_STOP=1','-At'],{input:sql,encoding:'utf8'});assert.match(out,/ROLLBACK/);
});
