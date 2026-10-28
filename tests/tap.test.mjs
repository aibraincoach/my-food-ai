// node --import tsx --test tests/tap.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { decideTap, SINGLE_TAP_WAIT_MS } from "../src/lib/posts/tap.ts";

const at = (time, x = 100, y = 100) => ({ time, x, y });

test("a single tap on a photo that can take a vote waits out a possible second tap, then opens the meal", () => {
  assert.deepEqual(decideTap(null, at(1000), { canVote: true, hasHref: true }), { action: "open", afterMs: SINGLE_TAP_WAIT_MS });
});

test("a single tap on a photo that cannot take a vote opens the meal at once", () => {
  assert.deepEqual(decideTap(null, at(1000), { canVote: false, hasHref: true }), { action: "open", afterMs: 0 });
});

test("a quick, close second tap votes and does not open the meal", () => {
  assert.deepEqual(decideTap(at(1000), at(1200, 110, 105), { canVote: true, hasHref: true }), { action: "vote" });
});

test("a second tap with nothing to vote on does nothing", () => {
  assert.deepEqual(decideTap(at(1000), at(1200), { canVote: false, hasHref: true }), { action: "ignore" });
});

test("a slow or distant second tap is a new first tap", () => {
  assert.equal(decideTap(at(1000), at(1400), { canVote: true, hasHref: true }).action, "open");
  assert.equal(decideTap(at(1000), at(1100, 200, 100), { canVote: true, hasHref: true }).action, "open");
});

test("without a destination a first tap is ignored", () => {
  assert.deepEqual(decideTap(null, at(1000), { canVote: true, hasHref: false }), { action: "ignore" });
});
