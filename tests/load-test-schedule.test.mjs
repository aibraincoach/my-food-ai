// node --test tests/load-test-schedule.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { scheduleSummary } from "../scripts/lib/schedule.mjs";

const cfg = { count: 20, intervalMs: 6000, windowMs: 120000 };

test("an on-time schedule meets the window", () => {
  const starts = Array.from({ length: 20 }, (_, i) => i * 6000 + 30);
  const s = scheduleSummary(starts, cfg);
  assert.equal(s.met, true);
  assert.equal(s.lastStart, 19 * 6000 + 30);
  assert.equal(s.drift, 30);
});

test("a stalled event loop is reported as a missed window", () => {
  const starts = Array.from({ length: 20 }, (_, i) => i * 6000 + (i > 10 ? 15000 : 0));
  const s = scheduleSummary(starts, cfg);
  assert.equal(s.met, false);
  assert.equal(s.drift, 15000);
});

test("posts that never started also miss the window", () => {
  const starts = Array.from({ length: 20 }, (_, i) => i < 5 ? i * 6000 : NaN);
  const s = scheduleSummary(starts, cfg);
  assert.equal(s.met, false);
  assert.equal(s.started, 5);
});
