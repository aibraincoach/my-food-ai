// node --test tests/load-test-schedule.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { scheduleSummary } from "../scripts/lib/schedule.mjs";

const cfg = { count: 20, intervalMs: 6000, windowMs: 120000 };
const onTime = Array.from({ length: 20 }, (_, i) => i * 6000 + 30);

test("an on-pace schedule inside the window is met", () => {
  const s = scheduleSummary(onTime, cfg);
  assert.equal(s.met, true);
  assert.equal(s.lastStart, 19 * 6000 + 30);
  assert.equal(s.drift, 30);
  assert.equal(s.maxLateness, 30);
});

test("a stalled event loop that pushes the last start past the window is not met", () => {
  const s = scheduleSummary(Array.from({ length: 20 }, (_, i) => i * 6000 + (i > 10 ? 15000 : 0)), cfg);
  assert.equal(s.met, false);
  assert.equal(s.inWindow, false);
});

test("twenty starts at once meet the deadline but not the pacing", () => {
  const s = scheduleSummary(Array(20).fill(0), cfg);
  assert.equal(s.inWindow, true);
  assert.equal(s.onPace, false);
  assert.equal(s.met, false);
  assert.equal(s.minGap, 0);
});

test("a burst released late inside the window is not the intended workload", () => {
  const s = scheduleSummary([...Array.from({ length: 10 }, (_, i) => i * 6000), ...Array(10).fill(114000)], cfg);
  assert.equal(s.inWindow, true);
  assert.equal(s.met, false);
});

test("posts that never started also miss the schedule", () => {
  const s = scheduleSummary(Array.from({ length: 20 }, (_, i) => i < 5 ? i * 6000 : NaN), cfg);
  assert.equal(s.met, false);
  assert.equal(s.started, 5);
});
