// node --import tsx --test tests/release-parked.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { releaseParkedAnalyze } from "../src/lib/queue/release.ts";

test("upload confirmation releases only a never-claimed, queued analyze job of that post", async () => {
  const seen = { table: null, values: null, filters: [] };
  const chain = { eq(column, value) { seen.filters.push([column, value]); return chain; }, then(resolve) { return Promise.resolve({ error: null }).then(resolve); } };
  const admin = { from(table) { seen.table = table; return { update(values) { seen.values = values; return chain; } }; } };
  const at = new Date("2026-10-28T12:00:00Z");
  assert.deepEqual(await releaseParkedAnalyze(admin, "post-1", at), { error: null });
  assert.equal(seen.table, "jobs");
  assert.deepEqual(seen.values, { run_after: at.toISOString() });
  assert.deepEqual(seen.filters, [["post_id", "post-1"], ["kind", "analyze"], ["status", "queued"], ["attempts", 0]]);
});

test("a database error is returned to the caller", async () => {
  const failure = { message: "down" };
  const chain = { eq() { return chain; }, then(resolve) { return Promise.resolve({ error: failure }).then(resolve); } };
  const admin = { from: () => ({ update: () => chain }) };
  assert.equal((await releaseParkedAnalyze(admin, "p")).error, failure);
});
