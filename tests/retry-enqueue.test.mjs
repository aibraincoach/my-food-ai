// node --import tsx --test tests/retry-enqueue.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { enqueueRetry } from "../src/lib/posts/retry.ts";
import { mergeFeedPosts } from "../src/lib/posts/feed-order.ts";

// A recording stand-in for the admin client: each table call returns a chain
// whose terminal methods resolve from the supplied outcomes.
function fakeAdmin({ insert, update }) {
  const calls = [];
  const chain = (table, op, result) => {
    const c = { table, op, filters: [] };
    calls.push(c);
    const api = new Proxy({}, { get: (_, name) => {
      if (name === "then") return undefined;
      if (name === "eq") return (k, v) => { c.filters.push([k, v]); return api; };
      if (name === "select") return () => api;
      if (name === "single" || name === "maybeSingle") return async () => result;
      return () => api;
    } });
    return api;
  };
  return {
    calls,
    from: (table) => ({
      insert: (row) => {const result=chain(table, "insert", insert);calls.at(-1).row=row;return result;},
      update: () => chain(table, "update", update),
      delete: () => chain(table, "delete", { data: null, error: null }),
    }),
  };
}
const args = { postId: "p", userId: "u", kind: "analyze" };

test("a failed job insert leaves the post untouched", async () => {
  const admin = fakeAdmin({ insert: { data: null, error: { message: "x" } }, update: { data: { id: "p" }, error: null } });
  assert.equal(await enqueueRetry(admin, args), "error");
  assert.deepEqual(admin.calls.map((c) => c.op), ["insert"]);
});

test("losing the compare-and-set withdraws the inserted job", async () => {
  const admin = fakeAdmin({ insert: { data: { id: "j1" }, error: null }, update: { data: null, error: null } });
  assert.equal(await enqueueRetry(admin, args), "conflict");
  const del = admin.calls.find((c) => c.op === "delete");
  assert.deepEqual(del.filters, [["id", "j1"], ["status", "queued"]]);
});

test("a failed post update withdraws the job and reports an error", async () => {
  const admin = fakeAdmin({ insert: { data: { id: "j1" }, error: null }, update: { data: null, error: { message: "x" } } });
  assert.equal(await enqueueRetry(admin, args), "error");
  assert.ok(admin.calls.some((c) => c.op === "delete"));
});

test("a successful retry queues the job and the post once", async () => {
  const admin = fakeAdmin({ insert: { data: { id: "j1" }, error: null }, update: { data: { id: "p" }, error: null } });
  assert.equal(await enqueueRetry(admin, args), "queued");
  assert.deepEqual(admin.calls.map((c) => c.op), ["insert", "update"]);
});

test("recovery after a lost discovery overlap keeps loaded history", () => {
  const post = (n) => ({ id: `id${n}`, eaten_at: `2026-10-27T12:00:${String(n).padStart(2, "0")}.000000+00:00` });
  const loaded = [post(10), post(9), post(8)];
  const fresh = [post(30), post(29)];
  const merged = mergeFeedPosts(loaded, fresh);
  assert.deepEqual(merged.map((p) => p.id), ["id30", "id29", "id10", "id9", "id8"]);
  assert.deepEqual(mergeFeedPosts(merged, [post(9)]).map((p) => p.id), merged.map((p) => p.id));
});


test("retry retains removal reason and completion marker instead of publishing stale nutrition", async () => {
  const admin = fakeAdmin({ insert: { data: { id: "j2" }, error: null }, update: { data: { id: "p" }, error: null } });
  const payload = { reason: "correction_reverted", comment_id: "removed-comment", removal_rebuilt: true };
  assert.equal(await enqueueRetry(admin, { ...args, kind: "recompute", payload }), "queued");
  assert.deepEqual(admin.calls.find(call => call.op === "insert").row.payload, payload);
});
