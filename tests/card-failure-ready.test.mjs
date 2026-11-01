// node --import tsx --test tests/card-failure-ready.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

function fakeAdmin({ snapshotFails = true, ready = true } = {}) {
  const calls = [];
  return {
    calls,
    rpc: async (name, args) => {
      calls.push(name);
      if (name === "results_card_snapshot") return snapshotFails ? { data: null, error: { message: "render unavailable" }, status: 503 } : { data: null, error: null };
      if (name === "mark_post_ready") { assert.equal(args.p_job_id, "job"); return { data: ready, error: null }; }
      if (name === "save_ready_meal") { assert.equal(args.p_post_id,"post"); assert.equal(ready,true,"an unpublished meal cannot be saved"); return {data:null,error:null}; }
      throw new Error(`unexpected rpc ${name}`);
    },
  };
}

test("a card failure is logged and the meal is marked ready anyway", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const original = console.error;
  const logged = [];
  console.error = (...args) => logged.push(args.join(" "));
  try {
    const admin = fakeAdmin();
    assert.equal(await markReady("post", admin, "job"), true);
    assert.deepEqual(admin.calls, ["results_card_snapshot", "mark_post_ready", "save_ready_meal"]);
    assert.match(logged.join("\n"), /results card failed.*Card snapshot failed/s);
  } finally { console.error = original; }
});

test("a meal that cannot be completed still reports not ready", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const original = console.error;
  console.error = () => {};
  try {
    const admin=fakeAdmin({ready:false});
    assert.equal(await markReady("post",admin,"job"),false);
    assert.deepEqual(admin.calls,["results_card_snapshot","mark_post_ready"],"a failed publication must not save a meal");
  } finally { console.error = original; }
});

test("a failure to save readiness still surfaces (and retries) rather than being swallowed", async () => {
  const { markReady } = await import("../src/lib/pipeline/persist.ts");
  const original = console.error;
  console.error = () => {};
  const admin = { rpc: async (name) => name === "results_card_snapshot" ? { data: null, error: { message: "x" }, status: 503 } : { data: null, error: { message: "down" }, status: 503 } };
  try { await assert.rejects(markReady("post", admin, "job"), (error) => error.status === 503); } finally { console.error = original; }
});

test("the card_backfill job stays strict: a card failure fails the job so it retries", async () => {
  const { default: backfill } = await import("../src/lib/worker/jobs/card_backfill.ts");
  const original = console.error;
  console.error = () => {};
  const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({ data: { status: "ready" }, error: null }) };
  const admin = { from: () => chain, rpc: async () => ({ data: null, error: { message: "render unavailable" }, status: 503 }) };
  try { await assert.rejects(backfill(admin, { id: "job", post_id: "post" }), /Card snapshot failed/); } finally { console.error = original; }
});
