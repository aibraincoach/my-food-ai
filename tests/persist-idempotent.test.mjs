// Run with node --env-file=.env.local --test tests/persist-idempotent.test.mjs.
// The migration, fixtures and assertions all roll back, even before deployment.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/0004_persist_analysis.sql", import.meta.url),
  "utf8"
);

test("analysis persistence replaces atomically and preserves history", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required for this database test");
  const sql = `
\u005cset ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
select to_regprocedure('public.persist_analysis(uuid,jsonb,text)') is not null as installed \u005cgset
\u005cif :installed
\u005celse
${migration}
\u005cendif

-- Create a disposable ordinary account without any Auth API or email call.
select gen_random_uuid() as fixture_user \u005cgset
insert into auth.users (id) values (:'fixture_user');
insert into public.profiles (id, handle) values (:'fixture_user', 'persist-' || :'fixture_user');
select set_config('test.persist_user', :'fixture_user', true);
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

do $test$
declare
  v_post uuid;
  v_user_item uuid;
  v_history uuid;
  v_replacement uuid;
  v_initial_ids uuid[];
  v_payload jsonb := '[
    {"name":"Rice","portion_text":"one bowl","portion_grams":150,"box":{"x":1,"y":2,"width":3,"height":4},"mask_path":"fixture-mask.png","confidence":0.9,
     "nutrition":{"calories":195,"protein_g":4,"carbs_g":42,"fat_g":0.5,"fibre_g":1,"sugar_g":0,"sodium_mg":2,"micronutrients":[{"name":"Iron","value":1,"unit":"MG"}],"source_ref":"fixture-rice"}},
    {"name":"Beans","portion_text":null,"portion_grams":null,"box":null,"mask_path":null,"confidence":null,
     "nutrition":{"calories":null,"protein_g":null,"carbs_g":null,"fat_g":null,"fibre_g":null,"sugar_g":null,"sodium_mg":null,"micronutrients":[],"source_ref":null}}
  ]';
begin
  insert into public.posts (user_id, status)
    values (current_setting('test.persist_user')::uuid, 'processing') returning id into v_post;
  insert into public.post_comments (post_id, author, body) values (v_post, 'user', 'Caption');
  insert into public.post_items (post_id, name, source) values (v_post, 'User item', 'user') returning id into v_user_item;
  insert into public.post_items (post_id, name, source, superseded_at)
    values (v_post, 'Original history', 'model', now()) returning id into v_history;
  insert into public.post_items (post_id, name, source, supersedes)
    values (v_post, 'Correction', 'model', v_history) returning id into v_replacement;
  insert into public.item_nutrition (post_item_id, calories)
    values (v_user_item, 10), (v_history, 20), (v_replacement, 30);

  perform public.persist_analysis(v_post, v_payload, 'First summary');
  perform public.persist_analysis(v_post, v_payload, 'Retry summary');

  if (select count(*) from public.post_items where post_id = v_post) <> 5 then
    raise exception 'retry duplicated items or removed history/user rows';
  end if;
  if (select count(*) from public.item_nutrition n join public.post_items i on i.id = n.post_item_id where i.post_id = v_post) <> 5 then
    raise exception 'retry duplicated or lost nutrition';
  end if;
  if (select count(*) from public.post_comments where post_id = v_post and author = 'model') <> 1
    or (select body from public.post_comments where post_id = v_post and author = 'model') <> 'First summary' then
    raise exception 'retry duplicated or changed the initial model summary';
  end if;
  if (select count(*) from public.post_comments where post_id = v_post and author = 'user') <> 1 then
    raise exception 'user comment was removed';
  end if;
  if (select status from public.posts where id = v_post) <> 'ready' then
    raise exception 'post was not marked ready';
  end if;
  if not exists (
    select 1 from public.post_items i join public.item_nutrition n on n.post_item_id = i.id
    where i.post_id = v_post and i.name = 'Rice' and i.portion_grams = 150
      and i.portion_text = 'one bowl' and i.confidence = 0.9
      and i.box = '{"x":1,"y":2,"width":3,"height":4}'::jsonb
      and i.mask_path = 'fixture-mask.png' and n.calories = 195
      and n.protein_g = 4 and n.carbs_g = 42 and n.fat_g = 0.5
      and n.fibre_g = 1 and n.sugar_g = 0 and n.sodium_mg = 2
      and n.source_ref = 'fixture-rice'
      and n.micronutrients = '[{"name":"Iron","value":1,"unit":"MG"}]'::jsonb
  ) then raise exception 'item/nutrition values did not round trip'; end if;

  select array_agg(id order by id) into v_initial_ids from public.post_items where post_id = v_post;
  update public.posts set status = 'processing' where id = v_post;
  -- The second item fails after the first inserted. Both the deletion and
  -- partial insertion must unwind, leaving the original IDs and post status.
  begin
    perform public.persist_analysis(v_post, jsonb_build_array(v_payload -> 0, '{"nutrition":{}}'::jsonb), 'Bad retry');
    raise exception 'invalid item unexpectedly accepted';
  exception when not_null_violation then null;
  end;
  if (select array_agg(id order by id) from public.post_items where post_id = v_post) is distinct from v_initial_ids
    or (select status from public.posts where id = v_post) <> 'processing' then
    raise exception 'failed persist did not roll back atomically';
  end if;

  perform public.persist_analysis(v_post, '[]'::jsonb, 'No food');
  if (select count(*) from public.post_items where post_id = v_post) <> 3
    or (select count(*) from public.item_nutrition n join public.post_items i on i.id = n.post_item_id where i.post_id = v_post) <> 3
    or (select status from public.posts where id = v_post) <> 'ready' then
    raise exception 'empty analysis left model items or removed protected rows';
  end if;
end;
$test$;

-- Exercise the caller boundary, not just pg_proc ACL metadata.
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', :'fixture_user', 'role', 'authenticated')::text, true);
do $test$
begin
  begin
    perform public.persist_analysis(gen_random_uuid(), '[]'::jsonb, 'Unauthorized');
    raise exception 'authenticated callers must not execute persist_analysis';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
select 'persist-idempotent: passed';
rollback;
`;
  const result = spawnSync("psql", ["-X", "-q", "-A", "-t", "--dbname", process.env.SUPABASE_DB_URL], {
    input: sql,
    encoding: "utf8",
    timeout: 90_000,
    env: process.env,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /persist-idempotent: passed/);
});
