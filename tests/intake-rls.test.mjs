// node --env-file=.env.local --test tests/intake-rls.test.mjs
// Runs migration 0016 in a rolled-back transaction: owner-only rows and bounded amounts.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/0016_intake_logs.sql", import.meta.url), "utf8");

test("intake rows belong to their owner, have limits, and cannot be edited", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const script = `\\set ON_ERROR_STOP on
begin;
select to_regclass('public.intake_logs') is not null as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner, gen_random_uuid() as other \\gset
insert into auth.users(id) values (:'owner'),(:'other');
insert into profiles(id,handle) values (:'owner','intake-'||:'owner'),(:'other','intake-'||:'other');
select set_config('test.owner', :'owner', true);
insert into intake_logs(user_id,kind,amount) values (:'owner','water',250),(:'owner','caffeine',95);
do $t$ begin
  begin insert into intake_logs(user_id,kind,amount) values ((select id from profiles limit 1),'water',5001); raise exception 'water above the limit accepted';
  exception when check_violation then null; end;
  begin insert into intake_logs(user_id,kind,amount) values ((select id from profiles limit 1),'weight',70); raise exception 'unknown kind accepted';
  exception when check_violation then null; end;
end $t$;
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub',:'owner','role','authenticated')::text, true);
do $t$
declare owner_id uuid := (current_setting('request.jwt.claims')::jsonb->>'sub')::uuid;
begin
  if (select count(*) from intake_logs) <> 2 then raise exception 'owner cannot read own rows'; end if;
  insert into intake_logs(user_id,kind,amount) values (owner_id,'water',500);
  begin update intake_logs set amount = 1; if found then raise exception 'update allowed'; end if;
  exception when insufficient_privilege then null; end;
end $t$;
select set_config('request.jwt.claims', jsonb_build_object('sub',:'other','role','authenticated')::text, true);
do $t$ begin
  if (select count(*) from intake_logs) <> 0 then raise exception 'another account read the rows'; end if;
  begin insert into intake_logs(user_id,kind,amount) values (current_setting('test.owner')::uuid,'water',100); raise exception 'inserted for someone else';
  exception when insufficient_privilege then null; end;
end $t$;
rollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: script, encoding: "utf8", timeout: 90000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
});
