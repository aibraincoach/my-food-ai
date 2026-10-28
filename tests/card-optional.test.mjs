// node --import tsx --test tests/card-optional.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

function fakeAdmin({ ready = true, snapshotError = true } = {}) {
  const calls = [];
  return {
    calls,
    rpc: async (name) => {
      calls.push(name);
      if (name === "mark_post_ready") return { data: ready, error: null };
      if (name === "results_card_snapshot") return snapshotError ? { data: null, error: { message: "render unavailable" }, status: 503 } : { data: null, error: null };
      if (name === "enqueue_card_backfill") return { data: 1, error: null };
      throw new Error(`unexpected rpc ${name}`);
    },
  };
}

test("a card failure leaves the meal ready and queues card maintenance", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  assert.equal(await markReady("post", admin, "job"), true);
  assert.deepEqual(admin.calls, ["mark_post_ready", "results_card_snapshot", "enqueue_card_backfill"]);
});

test("the card_backfill job still fails (and retries) when the card cannot be made", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin();
  await assert.rejects(markReady("post", admin, "job", { requireCard: true }), /Card snapshot failed/);
  assert.ok(!admin.calls.includes("enqueue_card_backfill"));
});

test("a meal that is not ready renders no card", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ ready: false });
  assert.equal(await markReady("post", admin, "job"), false);
  assert.deepEqual(admin.calls, ["mark_post_ready"]);
});
