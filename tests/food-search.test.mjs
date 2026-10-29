// node --import tsx --env-file=.env.local --test tests/food-search.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { caloriesPerServing, servingGrams } from "../src/lib/fdc/serving.ts";
import { searchFoods } from "../src/lib/fdc/client.ts";
import { scaleNutrition } from "../src/lib/fdc/nutrients.ts";

const kcal = (value) => [{ nutrientId: 1008, nutrientName: "Energy", unitName: "KCAL", value }];

test("a serving is the label's gram serving, else 100 g, and calories follow it", () => {
  const branded = { fdcId: 1, description: "Cereal", dataType: "Branded", foodNutrients: kcal(370), servingSize: 27, servingSizeUnit: "g" };
  assert.equal(servingGrams(branded), 27);
  assert.equal(caloriesPerServing(branded), 100);
  const sr = { fdcId: 2, description: "Croissant", dataType: "SR Legacy", foodNutrients: kcal(406) };
  assert.equal(servingGrams(sr), 100);
  assert.equal(caloriesPerServing(sr), 406);
  assert.equal(servingGrams({ ...branded, servingSizeUnit: "ml" }), 100);
  assert.equal(caloriesPerServing({ ...sr, foodNutrients: [] }), null);
});

// An admin client whose cache always misses, so the search really goes to FDC and the time is honest.
const coldAdmin = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), upsert: async () => ({ error: null }), insert: async () => ({ error: null }) }) };
const migration = readFileSync(new URL("../supabase/migrations/0018_food_posts.sql", import.meta.url), "utf8");

test("searching croissant and picking one logs a ready post in under 3 seconds, with no model call", { skip: !process.env.FDC_API_KEY || !process.env.SUPABASE_DB_URL }, () => {
  return (async () => {
    const started = performance.now();
    const foods = await searchFoods(coldAdmin, "croissant");
    assert.ok(foods.length > 0, "FDC returned no croissant");
    const food = foods[0];
    const grams = servingGrams(food);
    const n = scaleNutrition(food, grams);
    const nutrition = JSON.stringify({ calories: n.calories, protein_g: n.proteinG, carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG, sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef });
    const searchMs = performance.now() - started;
    const script = `\\set ON_ERROR_STOP on
begin;
select exists(select 1 from pg_proc where proname='create_food_post') as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner \\gset
insert into auth.users(id) values (:'owner');
insert into profiles(id,handle) values (:'owner','fs-'||:'owner');
select clock_timestamp() as t0 \\gset
select public.create_food_post(:'owner', now(), $q$${food.description.replace(/\$q\$/g, "")}$q$, ${grams}, $q$${nutrition}$q$::jsonb) as post \\gset
select (extract(epoch from clock_timestamp() - :'t0'::timestamptz) * 1000)::int as rpc_ms \\gset
select (select status from posts where id=:'post') = 'ready' and (select analysis_initialized_at is not null from posts where id=:'post') as ready_ok \\gset
\\if :ready_ok
\\else
select 1/0 as not_ready;
\\endif
select (select count(*) from current_post_items where post_id=:'post') = 1 and (select count(*) from item_nutrition n join post_items i on i.id=n.post_item_id where i.post_id=:'post') = 1 as item_ok \\gset
\\if :item_ok
\\else
select 1/0 as no_item;
\\endif
select (select count(*) from jobs where post_id=:'post') = 0 as no_jobs \\gset
\\if :no_jobs
\\else
select 1/0 as job_queued;
\\endif
\\echo rpc_ms=:rpc_ms
rollback;`;
    const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: script, encoding: "utf8", timeout: 90000 });
    assert.ifError(r.error);
    assert.equal(r.status, 0, r.stderr);
    const rpcMs = Number(/rpc_ms=(\d+)/.exec(r.stdout)?.[1]);
    assert.ok(searchMs + rpcMs < 3000, `search ${Math.round(searchMs)} ms + save ${rpcMs} ms`);
  })();
});

test("create_food_post refuses a missing user, an empty name and an absurd portion", { skip: !process.env.SUPABASE_DB_URL }, () => {
  const script = `\\set ON_ERROR_STOP on
begin;
select exists(select 1 from pg_proc where proname='create_food_post') as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner \\gset
insert into auth.users(id) values (:'owner');
insert into profiles(id,handle) values (:'owner','fs2-'||:'owner');
select set_config('fs.owner', :'owner', false);
do $t$ begin
  begin perform public.create_food_post(gen_random_uuid(), now(), 'Rice', 100, '{}'::jsonb); raise exception 'unknown user allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.create_food_post(current_setting('fs.owner')::uuid, now(), '  ', 100, '{}'::jsonb); raise exception 'empty name allowed';
  exception when invalid_parameter_value then null; end;
  begin perform public.create_food_post(current_setting('fs.owner')::uuid, now(), 'Rice', 0, '{}'::jsonb); raise exception 'zero portion allowed';
  exception when invalid_parameter_value then null; end;
  begin perform public.create_food_post(current_setting('fs.owner')::uuid, now() + interval '1 day', 'Rice', 100, '{}'::jsonb); raise exception 'future allowed';
  exception when invalid_parameter_value then null; end;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: script, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
