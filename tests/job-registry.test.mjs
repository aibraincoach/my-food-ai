// node --import tsx --test tests/job-registry.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { jobHandlers, runJob } from "../src/lib/worker/handlers.ts";
import { testHandlers } from "./fixtures/job-handlers.mjs";

test("the production registry lists exactly the real job kinds, and no fixture kind", () => {
  assert.deepEqual(Object.keys(jobHandlers).sort(), ["analyze", "card_backfill", "correct", "media_cleanup", "recompute"]);
  assert.ok(!("test_throw" in jobHandlers) && !("test_noop" in jobHandlers));
  assert.ok(Object.isFrozen(jobHandlers));
});

test("every handler file in the worker's jobs folder is registered (an omission would fail its jobs)", () => {
  const kinds = readdirSync(new URL("../src/lib/worker/jobs/", import.meta.url)).filter((name) => name.endsWith(".ts")).map((name) => name.replace(/\.ts$/, "")).sort();
  assert.deepEqual(Object.keys(jobHandlers).sort(), kinds);
});

test("an unknown or inherited job kind is rejected before anything runs", async () => {
  for (const kind of ["test_throw", "nope", "constructor", "__proto__", "toString", "../jobs/analyze", ""]) {
    await assert.rejects(runJob({}, { id: "j", kind, payload: {} }), /unknown job kind/, kind);
  }
});

test("a test passes its own handlers explicitly", async () => {
  let ran = false;
  await runJob({}, { id: "j", kind: "test_noop", payload: {} }, { ...testHandlers, test_noop: async () => { ran = true; } });
  assert.equal(ran, true);
});

test("the worker has no dynamic import and no test handler in its production folder", () => {
  const files = readdirSync(new URL("../src/lib/worker/jobs/", import.meta.url));
  assert.ok(!files.some((name) => name.startsWith("test_")), files.join(","));
  for (const name of ["handlers.ts", "drain.ts"]) {
    assert.doesNotMatch(readFileSync(new URL(`../src/lib/worker/${name}`, import.meta.url), "utf8"), /\bimport\s*\(/, name);
  }
});
