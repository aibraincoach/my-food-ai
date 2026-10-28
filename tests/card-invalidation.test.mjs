// node --env-file=.env.local --test tests/card-invalidation.test.mjs
// Runs migration 0015 in a rolled-back transaction (installing it only when absent).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/0015_card_best_effort.sql", import.meta.url), "utf8");

test("completion detaches the old card atomically, only for the owning worker, and backfill then selects the meal", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const sql = `\\set ON_ERROR_STOP on
begin;
select to_regprocedure('public.complete_post_without_card(uuid,uuid)') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
do $t$
declare u uuid:=gen_random_uuid(); other uuid:=gen_random_uuid(); p uuid; running uuid; ended uuid; item uuid;
  good text; forged text; r jsonb;
begin
  insert into auth.users(id) values (u),(other);
  insert into profiles(id,handle) values (u,'card-'||u),(other,'card-'||other);
  insert into posts(user_id,status) values (u,'processing') returning id into p;
  insert into post_items(post_id,name,portion_grams) values (p,'Rice',100) returning id into item;
  insert into jobs(post_id,kind,status,started_at) values (p,'recompute','running',now()) returning id into running;
  insert into jobs(post_id,kind,status,finished_at) values (p,'recompute','error',now()) returning id into ended;
  good := u::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png';
  insert into post_media(post_id,kind,storage_path,position,width,height) values (p,'card',good,0,1080,1080);

  -- Without complete nutrition nothing is completed and the card is untouched.
  if (public.complete_post_without_card(p, running)->>'ready')::boolean then raise exception 'ready without nutrition'; end if;
  if not exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'card detached without completion'; end if;
  insert into item_nutrition(post_item_id,calories) values (item,130);
  -- A stale worker (job no longer running) cannot complete the meal or detach its card.
  if (public.complete_post_without_card(p, ended)->>'ready')::boolean then raise exception 'a stale worker completed the meal'; end if;
  if not exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'a stale worker detached the card'; end if;
  -- A meal waiting on an answer is not completed and keeps its card.
  update posts set status='needs_input' where id=p;
  if (public.complete_post_without_card(p, running)->>'ready')::boolean then raise exception 'ready over needs_input'; end if;
  update posts set status='processing' where id=p;
  if not exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'card lost while not ready'; end if;
  -- The owning worker completes the meal; its old card is detached atomically and its object path returned.
  r := public.complete_post_without_card(p, running);
  if not (r->>'ready')::boolean or r->>'old_card_path' is distinct from good then raise exception 'owner completion failed: %', r; end if;
  if (select status from posts where id=p) <> 'ready' then raise exception 'post not ready'; end if;
  if exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'old card still attached'; end if;
  -- With the card gone the backfill selects the meal, so a failed regeneration is always repaired.
  perform public.enqueue_card_backfill();
  if not exists (select 1 from jobs where post_id=p and kind='card_backfill' and status='queued') then raise exception 'backfill did not select the card-less meal'; end if;

  -- A historical pointer outside this owner's meal namespace is detached but never handed back for deletion.
  update posts set status='processing' where id=p;
  forged := other::text||'/'||p::text||'/cards/'||gen_random_uuid()::text||'/card.png';
  insert into post_media(post_id,kind,storage_path,position,width,height) values (p,'card',forged,0,1080,1080);
  r := public.complete_post_without_card(p, running);
  if not (r->>'ready')::boolean or r->>'old_card_path' is not null then raise exception 'a forged path was returned for deletion: %', r; end if;
  if exists (select 1 from post_media where post_id=p and kind='card') then raise exception 'forged pointer left in place'; end if;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: sql, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
