// node --env-file=.env.local --test tests/search-or.test.mjs
// The search RPC must read "chicken or rice" as alternatives and "-rice" as an exclusion.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the search migration parses alternatives and exclusions with websearch syntax", () => {
  const migration = readFileSync(new URL("../supabase/migrations/0009_posts_search.sql", import.meta.url), "utf8");
  assert.match(migration, /websearch_to_tsquery\('english',p_terms\)/);
  assert.doesNotMatch(migration, /plainto_tsquery/);
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const run = (sql) => spawnSync("psql", ["-X", "-q", "-A", "-t", "--dbname", process.env.SUPABASE_DB_URL, "-c", sql], { encoding: "utf8" });
  const or = run("select to_tsvector('english','chicken') @@ websearch_to_tsquery('english','chicken or rice'), to_tsvector('english','rice') @@ websearch_to_tsquery('english','chicken or rice'), to_tsvector('english','chicken rice') @@ websearch_to_tsquery('english','chicken -rice')");
  assert.equal(or.status, 0, or.stderr);
  assert.equal(or.stdout.trim(), "t|t|f");
});
