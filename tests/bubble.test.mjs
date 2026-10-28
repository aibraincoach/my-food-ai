// node --import tsx --test tests/bubble.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { bubbleClass, bubbleLinkClass } from "../src/lib/posts/bubble.ts";

test("today with a meal is filled; today without one keeps the plain ring", () => {
  assert.match(bubbleClass({ empty: false, isToday: true, hasDay: true }), /bg-text/);
  assert.doesNotMatch(bubbleClass({ empty: false, isToday: true, hasDay: false }), /bg-text/);
});

test("an empty feed does not hide a logged day, e.g. today's only meal is waiting for a reply", () => {
  assert.match(bubbleClass({ empty: true, isToday: true, hasDay: true }), /bg-text/);
  assert.match(bubbleClass({ empty: true, isToday: false, hasDay: true }), /border-ring/);
  assert.equal(bubbleLinkClass(true), "text-text");
});

test("an empty feed still dashes days with nothing logged", () => {
  assert.match(bubbleClass({ empty: true, isToday: true, hasDay: false }), /dashed/);
  assert.match(bubbleClass({ empty: true, isToday: false, hasDay: false }), /dashed/);
  assert.equal(bubbleLinkClass(false), "text-faint");
});
