// node --import tsx --test tests/card-optional.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

function fakeAdmin({ ready = true, snapshotError = true, card = { storage_path: "u/post/cards/g/card.png" }, snapshot = null, published = null } = {}) {
  const calls = [];
  const table = (name) => {
    const chain = { select: () => chain, eq: () => chain, delete: () => { calls.push(`delete:${name}`); return chain; }, maybeSingle: async () => ({ data: card, error: null }), then: (res) => res({ error: null }) };
    return chain;
  };
  return {
    calls,
    from: (name) => table(name),
    storage: { from: () => ({ remove: async (paths) => { calls.push(`remove:${paths[0]}`); return { error: null }; } }) },
    rpc: async (name) => {
      calls.push(name);
      if (name === "mark_post_ready") return { data: ready, error: null };
      if (name === "results_card_snapshot" && snapshot) return { data: snapshot, error: null };
      if (name === "publish_results_card") return { data: published, error: null };
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
  // The outdated card is dropped (row and object) so the feed shows live nutrition, then maintenance is queued.
  assert.deepEqual(admin.calls, ["mark_post_ready", "results_card_snapshot", "delete:post_media", "remove:u/post/cards/g/card.png", "enqueue_card_backfill"]);
});

test("a failed regeneration with no old card just queues maintenance", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const admin = fakeAdmin({ card: null });
  assert.equal(await markReady("post", admin, "job"), true);
  assert.ok(!admin.calls.some((c) => c.startsWith("delete:") || c.startsWith("remove:")));
  assert.ok(admin.calls.includes("enqueue_card_backfill"));
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
