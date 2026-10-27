// All DDL and fixtures roll back; no deployment or persistent migration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('card publication waits for corrections and failed maintenance preserves the meal', () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  const migrations = [['0007_post_items_supersede.sql', "to_regprocedure('public.edit_post_item(uuid,uuid,text,uuid,text,numeric,jsonb)')"], ['0007b_comment_corrections.sql', "to_regprocedure('public.post_work_matches(uuid,uuid)')"], ['0008_post_media_kind.sql', "to_regprocedure('public.publish_results_card(uuid,text,text,integer,uuid)')"]].map(([name, probe]) =>
    `select ${probe} is not null as installed \\gset
\\if :installed
\\else
${readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8')}
\\endif`).join('\n');
  const sql = `\\set ON_ERROR_STOP on
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
${migrations}
-- Exercise the installed-schema branch without persisting any DDL.
${migrations}
do $test$
declare u uuid:=gen_random_uuid(); p uuid; j uuid; previous_job uuid; item uuid; fingerprint text; result jsonb;
begin
 insert into auth.users(id) values(u);
 insert into profiles(id,handle) values(u,'card-'||u);
 insert into posts(user_id,status) values(u,'ready') returning id into p;
 insert into post_items(post_id,name,source) values(p,'Rice','model') returning id into item;
 insert into item_nutrition(post_item_id,calories) values(item,100);
 fingerprint := results_card_snapshot(p)->>'fingerprint';
 insert into jobs(post_id,kind,status) values(p,'correct','queued') returning id into j;
 insert into jobs(post_id,kind,status) values(p,'analyze','running') returning id into previous_job;
 update posts set active_job_id=previous_job where id=p;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/fixture/card.png',1080,previous_job);
 if (result->>'published')::boolean or (select status from posts where id=p)<>'queued'
 or exists(select 1 from post_media where post_id=p and kind='card') then raise exception 'card published over pending correction'; end if;
 update jobs set status='finished' where id=previous_job;
 update jobs set status='running',payload='{"correction_applied":true,"post_ownership":true}' where id=j;
 update jobs set payload=payload||'{"post_ownership":true}'::jsonb where id=j;
 update posts set active_job_id=j where id=p;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/unauthorized/card.png',1080);
 if (result->>'published')::boolean then raise exception 'null job bypassed active owner'; end if;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/unauthorized/card.png',1080,gen_random_uuid());
 if (result->>'published')::boolean then raise exception 'foreign job bypassed active owner'; end if;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/fixture/card.png',1080,j);
 if not (result->>'published')::boolean or (select status from posts where id=p)<>'ready' then raise exception 'applied correction blocked publication'; end if;

 previous_job:=j;
 update jobs set status='finished' where id=j;
 -- Completed ownership remains recorded; maintenance must claim its own job.
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/after-completion/card.png',1080);
 if (result->>'published')::boolean then raise exception 'null maintenance bypassed retained owner'; end if;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/stale-owner/card.png',1080,j);
 if (result->>'published')::boolean then raise exception 'finished job retained publication rights'; end if;
 insert into jobs(post_id,kind,status,attempts) values(p,'card_backfill','running',3) returning id into j;
 update jobs set payload=payload||'{"post_ownership":true}'::jsonb where id=j;
 update posts set active_job_id=j where id=p;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/new-backfill/card.png',1080,j);
 if not (result->>'published')::boolean then raise exception 'current backfill owner could not publish'; end if;
 perform fail_job(j,'Card storage unavailable',true);
 if (select status from jobs where id=j)<>'error' or (select status from posts where id=p)<>'ready'
 or not exists(select 1 from item_nutrition where post_item_id=item and calories=100) then raise exception 'card failure damaged meal'; end if;
 insert into jobs(post_id,kind,status,attempts) values(p,'analyze','running',3) returning id into j;
 update jobs set payload=payload||'{"post_ownership":true}'::jsonb where id=j;
 update posts set active_job_id=j where id=p;
 perform fail_job(j,'Analysis unavailable',true);
 if (select status from posts where id=p)<>'failed' then raise exception 'analysis failure was not recorded'; end if;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/stale/card.png',1080,previous_job);
 if (result->>'published')::boolean or (select status from posts where id=p)<>'failed'
 or exists(select 1 from post_media where post_id=p and storage_path like '%/stale/card.png') then raise exception 'stale render cleared terminal failure'; end if;

 update posts set status='processing',active_job_id=null where id=p;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/unowned/card.png',1080);
 if (result->>'published')::boolean then raise exception 'unowned processing meal published'; end if;
 update posts set status='ready' where id=p;
 result := publish_results_card(p,fingerprint,u::text||'/'||p::text||'/cards/maintenance/card.png',1080);
 if not (result->>'published')::boolean then raise exception 'ready maintenance blocked'; end if;
end;
$test$;
rollback;`;
  const result = spawnSync('psql', ['-X','-q','--dbname',process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 90000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
