// node --import tsx --test tests/card-best-effort.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

// Records the calls; each RPC and table answers from the options.
function fakeAdmin({ complete = true, card = { storage_path: "u/post/cards/g/card.png" }, removed = "u/post/cards/g/card.png", snapshotFails = true } = {}) {
  const calls = [];
  const chain = (result) => new Proxy({}, { get: (_, name) => name === "then" ? (resolve) => resolve(result) : name === "maybeSingle" ? async () => result : () => chain(result) });
  return {
    calls,
    rpc: async (name, args) => {
      calls.push(name);
      if (name === "complete_post_without_card") return { data: complete, error: null };
      if (name === "results_card_snapshot") return snapshotFails ? { data: null, error: { message: "render unavailable" }, status: 503 } : { data: null, error: null };
      if (name === "invalidate_results_card") { calls.push(`expected:${args.p_expected_path}`); return { data: removed, error: null }; }
      if (name === "enqueue_card_backfill") return { data: 1, error: null };
      throw new Error(`unexpected rpc ${name}`);
    },
    from: () => chain({ data: card, error: null }),
    storage: { from: () => ({ remove: async (paths) => { calls.push(`remove:${paths[0]}`); return { error: null }; } }) },
  };
}

test("a card failure leaves the meal ready, invalidates through the RPC and queues maintenance", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  assert.equal(await markReady("post", admin, "job"), true);
  assert.deepEqual(admin.calls, ["complete_post_without_card", "results_card_snapshot", "invalidate_results_card", "expected:u/post/cards/g/card.png", "remove:u/post/cards/g/card.png", "enqueue_card_backfill"]);
});

test("storage is untouched when the database refuses the invalidation (stale worker or forged path)", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ removed: null });
  assert.equal(await markReady("post", admin, "job"), true);
  assert.ok(!admin.calls.some((c) => c.startsWith("remove:")));
  assert.ok(admin.calls.includes("enqueue_card_backfill"));
});

test("a failed regeneration with no old card only queues maintenance", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ card: null });
  assert.equal(await markReady("post", admin, "job"), true);
  assert.ok(!admin.calls.includes("invalidate_results_card"));
  assert.ok(admin.calls.includes("enqueue_card_backfill"));
});

test("the card_backfill job still fails and retries when the card cannot be made", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  await assert.rejects(markReady("post", admin, "job", { requireCard: true }), /Card snapshot failed/);
  assert.ok(!admin.calls.includes("invalidate_results_card") && !admin.calls.includes("enqueue_card_backfill"));
});

test("a meal that cannot be completed renders no card", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ complete: false });
  assert.equal(await markReady("post", admin, "job"), false);
  assert.deepEqual(admin.calls, ["complete_post_without_card"]);
});
