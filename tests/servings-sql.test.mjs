// node --env-file=.env.local --test tests/servings-sql.test.mjs
// Migration 0017 in a rolled-back transaction: set_post_servings scales every current item, keeps history, queues one
// recompute, notes the change in the thread, and refuses other owners and out-of-range values.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/0017_servings.sql", import.meta.url), "utf8");

test("set_post_servings scales items, queues a recompute and notes it in the thread", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const expect = (name, sql) => `select (${sql}) as ${name} \\gset\n\\if :${name}\n\\else\nselect 1/0 as failed_${name};\n\\endif\n`;
  const script = `\\set ON_ERROR_STOP on
begin;
select exists(select 1 from information_schema.columns where table_name='posts' and column_name='servings') as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner, gen_random_uuid() as other, gen_random_uuid() as post \\gset
select set_config('sv.post', :'post', false), set_config('sv.owner', :'owner', false), set_config('sv.other', :'other', false);
insert into auth.users(id) values (:'owner'),(:'other');
insert into profiles(id,handle) values (:'owner','sv-'||:'owner'),(:'other','sv-'||:'other');
insert into posts(id,user_id,caption,status,analysis_initialized_at) values (:'post',:'owner','rice and beans','ready',now());
insert into post_items(post_id,name,portion_text,portion_grams,source) values (:'post','Rice','100 g',100,'model'),(:'post','Beans','50 g',50,'model');
select public.set_post_servings(:'post', :'owner', 2) as r \\gset
${expect("doubled", "(select sum(portion_grams) from current_post_items where post_id=:'post') = 300")}
${expect("history", "(select count(*) from post_items where post_id=:'post' and superseded_at is not null) = 2 and (select count(*) from current_post_items where post_id=:'post') = 2")}
${expect("job", "(select count(*) from jobs where post_id=:'post' and kind='recompute' and status='queued') = 1")}
${expect("note", "(select count(*) from post_comments where post_id=:'post' and author='model' and body like 'Servings changed from 1 to 2.%') = 1")}
${expect("stored", "(select servings from posts where id=:'post') = 2 and (select status from posts where id=:'post') = 'queued'")}
select public.set_post_servings(:'post', :'owner', 3) as r3 \\gset
${expect("tripled", "(select sum(portion_grams) from current_post_items where post_id=:'post') = 450")}
do $t$ begin
  begin perform public.set_post_servings(current_setting('sv.post')::uuid, current_setting('sv.other')::uuid, 2); raise exception 'other owner allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.set_post_servings(current_setting('sv.post')::uuid, current_setting('sv.owner')::uuid, 0.1); raise exception 'range allowed';
  exception when invalid_parameter_value then null; end;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: script, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
