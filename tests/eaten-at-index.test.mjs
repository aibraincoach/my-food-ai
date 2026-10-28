// node --env-file=.env.local --test tests/eaten-at-index.test.mjs
// Runs migration 0015 in a rolled-back transaction and checks the keyset-pagination index exists.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the feed's keyset pagination has a (user_id, eaten_at desc, id desc) index", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const migration = readFileSync(new URL("../supabase/migrations/0015_posts_eaten_at_index.sql", import.meta.url), "utf8");
  const sql = `\\set ON_ERROR_STOP on\nbegin;\n${migration}\nselect indexdef from pg_indexes where schemaname='public' and indexname='posts_user_eaten_idx';\nrollback;`;
  const r = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: sql, encoding: "utf8", timeout: 60000 });
  assert.ifError(r.error);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\(user_id, eaten_at DESC, id DESC\)/);
});
