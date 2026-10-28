// node --env-file=.env.local --test tests/search-index.test.mjs
// Runs the search migration in a rolled-back transaction (installing it only when absent).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const file = (name) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");

test("the search index follows item inserts and moves, and locks the post before reading", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const migration = file("0009_posts_search.sql");
  const functionBlock = migration.slice(migration.indexOf("create function public.rebuild_post_search()"), migration.indexOf("create trigger posts_search")).replace("create function", "create or replace function");
  assert.match(migration, /perform 1 from posts where id=target for update;/);
  const sql = `\\set ON_ERROR_STOP on
begin;
select to_regclass('public.current_post_items') is not null as has7 \\gset
\\if :has7
\\else
${file("0007_post_items_supersede.sql")}
\\endif
select to_regprocedure('public.search_consumed_kcal(numeric,jsonb,numeric)') is not null as installed \\gset
\\if :installed
-- Migration 0009 is deployed: re-create only the index function from the file and test that.
${functionBlock}
\\else
${migration.replace(/^create extension.*$/m, "").replace(/^alter table public.posts add column search_tsv.*$/m, "alter table public.posts add column if not exists search_tsv tsvector;").replace(/^create index posts_search_idx.*$/m, "create index if not exists posts_search_idx on public.posts using gin(search_tsv);")}
\\endif
do $t$ declare u uuid:=gen_random_uuid(); a uuid; b uuid; moved uuid;
begin
  insert into auth.users(id) values (u); insert into profiles(id,handle) values (u,'idx-'||u);
  insert into posts(user_id,status) values (u,'ready') returning id into a;
  insert into posts(user_id,status) values (u,'ready') returning id into b;
  insert into post_items(post_id,name) values (a,'chicken');
  insert into post_items(post_id,name) values (a,'rice') returning id into moved;
  if not (select search_tsv @@ to_tsquery('english','chicken & rice') from posts where id=a) then raise exception 'both item names must be searchable'; end if;
  update post_items set post_id=b where id=moved;
  if (select search_tsv @@ to_tsquery('english','rice') from posts where id=a) then raise exception 'moved item still matches the source post'; end if;
  if not (select search_tsv @@ to_tsquery('english','rice') from posts where id=b) then raise exception 'moved item must match the destination post'; end if;
  if not (select search_tsv @@ to_tsquery('english','chicken') from posts where id=a) then raise exception 'remaining item lost'; end if;
  delete from post_items where id=moved;
  if (select search_tsv @@ to_tsquery('english','rice') from posts where id=b) then raise exception 'deleted item still matches'; end if;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: sql, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
