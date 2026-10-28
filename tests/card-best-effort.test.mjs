// node --import tsx --test tests/card-best-effort.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

// Records the calls; each RPC and table answers from the options.
function fakeAdmin({ completion = { ready: true, old_card_path: "u/post/cards/g/card.png" }, snapshotFails = true } = {}) {
  const calls = [];
  const chain = (result) => new Proxy({}, { get: (_, name) => name === "then" ? (resolve) => resolve(result) : name === "maybeSingle" ? async () => result : () => chain(result) });
  return {
    calls,
    rpc: async (name) => {
      calls.push(name);
      if (name === "complete_post_without_card") return { data: completion, error: null };
      if (name === "results_card_snapshot") return snapshotFails ? { data: null, error: { message: "render unavailable" }, status: 503 } : { data: null, error: null };
      if (name === "enqueue_card_backfill") return { data: 1, error: null };
      throw new Error(`unexpected rpc ${name}`);
    },
    from: () => chain({ data: null, error: null }),
    storage: { from: () => ({ remove: async (paths) => { calls.push(`remove:${paths[0]}`); return { error: null }; } }) },
  };
}

test("completion removes the detached card's object, then a render failure queues maintenance and the meal stays ready", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  assert.equal(await markReady("post", admin, "job"), true);
  assert.deepEqual(admin.calls, ["complete_post_without_card", "remove:u/post/cards/g/card.png", "results_card_snapshot", "enqueue_card_backfill"]);
});

test("no object is deleted when the database returned no path (forged pointer or no old card)", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ completion: { ready: true, old_card_path: null } });
  assert.equal(await markReady("post", admin, "job"), true);
  assert.ok(!admin.calls.some((c) => c.startsWith("remove:")));
  assert.ok(admin.calls.includes("enqueue_card_backfill"));
});

test("the card_backfill job still fails and retries when the card cannot be made", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  await assert.rejects(markReady("post", admin, "job", { requireCard: true }), /Card snapshot failed/);
  assert.ok(!admin.calls.includes("enqueue_card_backfill"));
});

test("a meal that cannot be completed renders no card and removes nothing", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ completion: { ready: false } });
  assert.equal(await markReady("post", admin, "job"), false);
  assert.deepEqual(admin.calls, ["complete_post_without_card"]);
});
