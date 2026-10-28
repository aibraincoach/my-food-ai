// node --import tsx --test tests/prior-hint.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

// Every query chain resolves to the table's canned result, however it is awaited.
function fakeAdmin({ candidate, mediaResult }) {
  const tables = {
    post_items: { data: [{ id: "i", name: "Rice", portion_text: "a bowl", portion_grams: 150, confidence: 0.9, item_nutrition: [] }], error: null },
    posts: { data: { user_id: "u", caption: "two bowls of rice" }, error: null },
    post_media: mediaResult,
  };
  const chain = (result) => new Proxy({}, { get: (_, name) => {
    if (name === "then") return (resolve) => resolve(result);
    if (name === "single" || name === "maybeSingle") return async () => result;
    return () => chain(result);
  } });
  return {
    rpc: async () => ({ data: [candidate], error: null }),
    from: (name) => chain(tables[name]),
    storage: { from: () => ({ download: async () => ({ data: null, error: { message: "gone" } }) }) },
  };
}

test("a weak prior is only historical reference and never tells the model to keep portions", async () => {
  const { findPrior } = await import("../src/lib/pipeline/prior.ts");
  const result = await findPrior(fakeAdmin({ candidate: { post_id: "p", text_score: 0.7, photo_score: null, distance_m: null }, mediaResult: { data: null, error: null } }), "current");
  assert.match(result.hint, /Historical reference only/);
  assert.match(result.hint, /changed caption takes precedence/);
  assert.doesNotMatch(result.hint, /keep these names and portions/);
});

test("a caption-only meal with a strong prior falls back to the neutral hint", async () => {
  const { findPrior } = await import("../src/lib/pipeline/prior.ts");
  const result = await findPrior(fakeAdmin({ candidate: { post_id: "p", text_score: 1, photo_score: null, distance_m: null }, mediaResult: { data: null, error: null } }), "current");
  assert.match(result.hint, /Historical reference only/);
  assert.equal(result.named, undefined);
});

test("a retryable photo metadata failure reaches the worker instead of becoming a hint", async () => {
  const { findPrior } = await import("../src/lib/pipeline/prior.ts");
  const admin = fakeAdmin({ candidate: { post_id: "p", text_score: 1, photo_score: null, distance_m: null }, mediaResult: { data: null, error: { message: "unavailable" }, status: 503 } });
  await assert.rejects(findPrior(admin, "current"), (error) => error.status === 503);
});

test("an empty top-ranked prior does not hide a usable runner-up", async () => {
  const { findPrior } = await import("../src/lib/pipeline/prior.ts");
  const asked = [];
  const chain = (result) => new Proxy({}, { get: (_, name) => name === "then" ? (resolve) => resolve(result) : () => chain(result) });
  const admin = {
    rpc: async () => ({ data: [
      { post_id: "empty", text_score: 1, photo_score: null, distance_m: null },
      { post_id: "used", text_score: 0.7, photo_score: null, distance_m: null },
    ], error: null }),
    from: () => ({
      select: () => ({
        eq: (_, id) => { asked.push(id); return chain({ data: id === "empty" ? [] : [{ id: "i", name: "Rice", portion_text: null, portion_grams: 150, confidence: 0.9, item_nutrition: [] }], error: null }); },
      }),
    }),
  };
  const result = await findPrior(admin, "current");
  assert.deepEqual(asked, ["empty", "used"]);
  assert.match(result.hint, /Rice, 150 g/);
});

test("same-meal confirmation retries the gateway's transient 404 like identification does", { timeout: 20000 }, async () => {
  const { findPrior } = await import("../src/lib/pipeline/prior.ts");
  const original = globalThis.fetch;
  const key = process.env.MODEL_API_KEY;
  process.env.MODEL_API_KEY = "test-key";
  let calls = 0;
  globalThis.fetch = async () => (calls++ === 0 ? new Response("", { status: 404 }) : new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ same_meal: false }) }] }] }), { status: 200 }));
  try {
    const photo = { data: new Blob([new Uint8Array([1, 2, 3])]), error: null };
    const chain = (result) => new Proxy({}, { get: (_, name) => name === "then" ? (resolve) => resolve(result) : name === "single" || name === "maybeSingle" ? async () => result : () => chain(result) });
    const tables = {
      post_items: { data: [{ id: "i", name: "Rice", portion_text: null, portion_grams: 150, confidence: 0.9, item_nutrition: [] }], error: null },
      posts: { data: { user_id: "u", caption: "rice" }, error: null },
      post_media: { data: { storage_path: "u/p/photo.jpg", width: 10, height: 10 }, error: null },
    };
    const admin = { rpc: async () => ({ data: [{ post_id: "p", text_score: 1, photo_score: 1, distance_m: null }], error: null }), from: (name) => chain(tables[name]), storage: { from: () => ({ download: async () => photo }) } };
    const result = await findPrior(admin, "current");
    assert.equal(calls, 2);
    assert.equal(result.hint, "");
  } finally { globalThis.fetch = original; if (key === undefined) delete process.env.MODEL_API_KEY; else process.env.MODEL_API_KEY = key; }
});
