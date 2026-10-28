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

import { mock } from "node:test";
import { createTapController } from "../src/lib/posts/tap.ts";

function rig(canVote = true) {
  let clock = 0;
  const log = [];
  const controller = createTapController({ now: () => clock, open: (href) => log.push(`open:${href}`), vote: () => log.push("vote") });
  const options = { canVote, href: "/posts/1" };
  const tap = (at, x = 100, y = 100) => { clock = at; controller.down(x, y); controller.up(x, y, options); };
  return { controller, log, tap, options, setClock: (at) => { clock = at; } };
}

test("controller: an ordinary single tap opens the meal exactly once", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { log, tap } = rig();
    tap(0);
    mock.timers.tick(319); assert.deepEqual(log, []);
    mock.timers.tick(5); assert.deepEqual(log, ["open:/posts/1"]);
    mock.timers.tick(1000); assert.deepEqual(log, ["open:/posts/1"]);
  } finally { mock.timers.reset(); }
});

test("controller: an ordinary double tap votes once and never opens", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { log, tap } = rig();
    tap(0); mock.timers.tick(150); tap(150);
    mock.timers.tick(2000);
    assert.deepEqual(log, ["vote"]);
  } finally { mock.timers.reset(); }
});

test("controller: starting a swipe or a cancelled pointer before the wait ends opens nothing", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const a = rig();
    a.tap(0); mock.timers.tick(100); a.controller.down(100, 100); a.controller.up(100, 160, a.options); // dragged: not a tap
    mock.timers.tick(2000); assert.deepEqual(a.log, []);
    const b = rig();
    b.tap(0); mock.timers.tick(100); b.controller.cancel();
    mock.timers.tick(2000); assert.deepEqual(b.log, []);
  } finally { mock.timers.reset(); }
});

test("controller: a second press inside the window holds the navigation; released inside the window it is a double tap", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { controller, log, options, setClock } = rig();
    setClock(0); controller.down(100, 100); controller.up(100, 100, options);   // first tap, navigation queued for 320 ms
    mock.timers.tick(250); setClock(250); controller.down(100, 100);            // second press starts: the queued navigation is suspended
    mock.timers.tick(30); setClock(280); assert.deepEqual(log, []);             // nothing opens under the finger
    controller.up(100, 100, options);                                          // released at 280 ms, inside the window: a double tap
    mock.timers.tick(2000);
    assert.deepEqual(log, ["vote"]);
  } finally { mock.timers.reset(); }
});

test("controller: a second press held past the window and released is a new single tap that opens once, after the wait", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { controller, log, options, setClock } = rig();
    setClock(0); controller.down(100, 100); controller.up(100, 100, options);   // first tap
    mock.timers.tick(250); setClock(250); controller.down(100, 100);            // second press starts and is held
    mock.timers.tick(100); setClock(350); assert.deepEqual(log, []);            // no navigation fires while the finger is down
    controller.up(100, 100, options);                                          // released at 350 ms: too late to pair with the first tap
    mock.timers.tick(319); assert.deepEqual(log, []);
    mock.timers.tick(5); assert.deepEqual(log, ["open:/posts/1"]);
  } finally { mock.timers.reset(); }
});

test("controller: disposing with a navigation queued opens nothing later", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  try {
    const { controller, log, tap } = rig();
    tap(0); controller.dispose();
    mock.timers.tick(2000); assert.deepEqual(log, []);
  } finally { mock.timers.reset(); }
});
