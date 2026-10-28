// node --import tsx --test tests/history-budget.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { boundedHistory } from "../src/lib/pipeline/history-budget.ts";

const message = (n, size = 100) => ({ id: String(n), body: "x".repeat(size) });

test("a short history is sent whole and in order", () => {
  const history = [message(1), message(2), message(3)];
  assert.deepEqual(boundedHistory(history), history);
});

test("an oversized history keeps the most recent messages that fit, in order", () => {
  const history = Array.from({ length: 1000 }, (_, n) => message(n, 1000));
  const kept = boundedHistory(history, 5000);
  assert.ok(JSON.stringify(kept).length <= 5000 + 200);
  assert.deepEqual(kept.map((m) => m.id), history.slice(-kept.length).map((m) => m.id));
  assert.ok(kept.length >= 3 && kept.length < 10);
});

test("the newest message is always kept even if it alone exceeds the budget", () => {
  const kept = boundedHistory([message(1), message(2, 50_000)], 1000);
  assert.deepEqual(kept.map((m) => m.id), ["2"]);
});
