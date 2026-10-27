// All DDL and fixtures roll back; no deployment or persistent migration.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('failed card maintenance preserves ready meal; analysis failures still mark failed', () => {
  assert.ok(process.env.SUPABASE_DB_URL);
  const migrations = [['0007_post_items_supersede.sql', "to_regprocedure('public.edit_post_item(uuid,uuid,text,uuid,text,numeric,jsonb)')"], ['0008_post_media_kind.sql', "to_regprocedure('public.publish_results_card(uuid,text,text,integer)')"]].map(([name, probe]) =>
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
declare u uuid:=gen_random_uuid(); p uuid; j uuid; item uuid;
begin
 insert into auth.users(id) values(u);
 insert into profiles(id,handle) values(u,'card-'||u);
 insert into posts(user_id,status) values(u,'ready') returning id into p;
 insert into post_items(post_id,name,source) values(p,'Rice','model') returning id into item;
 insert into item_nutrition(post_item_id,calories) values(item,100);
 insert into jobs(post_id,kind,status,attempts) values(p,'card_backfill','running',3) returning id into j;
 perform fail_job(j,'Card storage unavailable',true);
 if (select status from jobs where id=j)<>'error' or (select status from posts where id=p)<>'ready'
 or not exists(select 1 from item_nutrition where post_item_id=item and calories=100) then raise exception 'card failure damaged meal'; end if;
 insert into jobs(post_id,kind,status,attempts) values(p,'analyze','running',3) returning id into j;
 perform fail_job(j,'Analysis unavailable',true);
 if (select status from posts where id=p)<>'failed' then raise exception 'analysis failure was not recorded'; end if;
end;
$test$;
rollback;`;
  const result = spawnSync('psql', ['-X','-q','--dbname',process.env.SUPABASE_DB_URL], { input: sql, encoding: 'utf8', timeout: 90000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
