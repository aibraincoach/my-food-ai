// node --env-file=.env.local --test tests/card-invalidation.test.mjs
// Runs migration 0015 in a rolled-back transaction (installing it only when absent).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/0015_card_best_effort.sql", import.meta.url), "utf8");

test("card invalidation is owner-, worker- and generation-checked, and ready needs complete nutrition", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const sql = `\\set ON_ERROR_STOP on
begin;
select to_regprocedure('public.invalidate_results_card(uuid,uuid,text)') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
do $t$
declare u uuid:=gen_random_uuid(); other uuid:=gen_random_uuid(); p uuid; running uuid; ended uuid; item uuid;
  good text; forged text; result text;
begin
  insert into auth.users(id) values (u),(other);
  insert into profiles(id,handle) values (u,'card-'||u),(other,'card-'||other);
  insert into posts(user_id,status) values (u,'processing') returning id into p;
  insert into post_items(post_id,name,portion_grams) values (p,'Rice',100) returning id into item;
  insert into jobs(post_id,kind,status,started_at) values (p,'recompute','running',now()) returning id into running;
  insert into jobs(post_id,kind,status,finished_at) values (p,'recompute','error',now()) returning id into ended;

  -- Ready needs complete nutrition (an item with no nutrition row is not complete).
  if public.complete_post_without_card(p, running) then raise exception 'ready without nutrition'; end if;
  insert into item_nutrition(post_item_id,calories) values (item,130);
  -- A stale worker (job no longer running) cannot complete the meal.
  if public.complete_post_without_card(p, ended) then raise exception 'a stale worker completed the meal'; end if;
  if not public.complete_post_without_card(p, running) then raise exception 'the owning worker must complete the meal'; end if;
  if (select status from posts where id=p) <> 'ready' then raise exception 'post not ready'; end if;
  -- A pending unanswered question keeps it out of ready.
  update posts set status='needs_input' where id=p;
  if public.complete_post_without_card(p, running) then raise exception 'ready over needs_input'; end if;
  update posts set status='ready' where id=p;

  good := u::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png';
  insert into post_media(post_id,kind,storage_path,position,width,height) values (p,'card',good,0,1080,1080);

  -- A stale worker removes nothing.
  if public.invalidate_results_card(p, ended, good) is not null then raise exception 'a stale worker invalidated the card'; end if;
  if not exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'card removed by a stale worker'; end if;
  -- A different generation than the one read removes nothing.
  if public.invalidate_results_card(p, running, u::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png') is not null
    or not exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'a newer card was removed'; end if;
  -- The owning worker removes exactly the generation it read and gets that path back.
  result := public.invalidate_results_card(p, running, good);
  if result is distinct from good or exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'owner invalidation failed'; end if;

  -- A historical pointer outside this owner's meal namespace is unlinked but never handed back for deletion.
  forged := other::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png';
  insert into post_media(post_id,kind,storage_path,position,width,height) values (p,'card',forged,0,1080,1080);
  if public.invalidate_results_card(p, running, forged) is not null then raise exception 'a forged path was returned for deletion'; end if;
  if exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'forged pointer left in place'; end if;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: sql, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
