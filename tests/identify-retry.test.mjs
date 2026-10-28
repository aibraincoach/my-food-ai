// node --import tsx --test tests/identify-retry.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

const ok = () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ items: [] }) }] }] }), { status: 200 });

async function withFetch(sequence, run) {
  const original = globalThis.fetch;
  const originalKey = process.env.MODEL_API_KEY;
  process.env.MODEL_API_KEY = "test-key";
  let calls = 0;
  // Only model calls follow the scripted sequence; anything else (the trace insert) just succeeds.
  globalThis.fetch = async (input) => { if (!String(input instanceof Request ? input.url : input).includes('/v1/responses')) return new Response(null, { status: 201 }); const next = sequence[calls++]; return next(); };
  try { return await run(() => calls); } finally { globalThis.fetch = original; if (originalKey === undefined) delete process.env.MODEL_API_KEY; else process.env.MODEL_API_KEY = originalKey; }
}

test("a transient empty-body 404 is retried: the second response is the one that gets parsed", { timeout: 20000 }, async () => {
  const { identifyItems } = await import("../src/lib/meta/spark.ts");
  await withFetch([() => new Response("", { status: 404 }), ok], async (calls) => {
    // The retry reached the second (completed) response; its minimal body then fails schema validation,
    // which proves the 404 was not terminal.
    await assert.rejects(identifyItems(null, "image/jpeg", "rice", []), /failed validation/);
    assert.equal(calls(), 2);
  });
});

test("a 400 is terminal at once and is not retried here", { timeout: 20000 }, async () => {
  const { identifyItems } = await import("../src/lib/meta/spark.ts");
  await withFetch([() => new Response("bad", { status: 400 }), ok], async (calls) => {
    await assert.rejects(identifyItems(null, "image/jpeg", "rice", []), (error) => error.status === 400);
    assert.equal(calls(), 1);
  });
});
