// node --import tsx --test tests/worker-concurrency.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { workerConcurrency, MAX_WORKER_CONCURRENCY } from "../src/lib/worker/concurrency.ts";

test("worker concurrency accepts only a small positive integer", () => {
  assert.equal(workerConcurrency(undefined), 1);
  assert.equal(workerConcurrency(""), 1);
  assert.equal(workerConcurrency("  "), 1);
  assert.equal(workerConcurrency("2"), 2);
  assert.equal(workerConcurrency(String(MAX_WORKER_CONCURRENCY)), MAX_WORKER_CONCURRENCY);
  assert.equal(workerConcurrency(String(MAX_WORKER_CONCURRENCY + 1)), 1);
  assert.equal(workerConcurrency("100000"), 1);
  assert.equal(workerConcurrency("1.5"), 1);
  assert.equal(workerConcurrency("-2"), 1);
  assert.equal(workerConcurrency("0"), 1);
  assert.equal(workerConcurrency("abc"), 1);
});
