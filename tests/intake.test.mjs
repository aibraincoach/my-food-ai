// node --import tsx --test tests/intake.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { groupIntakeByDay, intakeLine, sumIntake, validIntake, emptyIntake } from "../src/lib/intake/intake.ts";
import { dateInZone } from "../src/lib/posts/days.ts";

test("only whole amounts inside each kind's limits are intake", () => {
  assert.equal(validIntake("water", 250), true);
  assert.equal(validIntake("caffeine", 95), true);
  for (const [kind, amount] of [["water", 0], ["water", 5001], ["caffeine", 1001], ["caffeine", 1.5], ["water", "250"], ["weight", 70], ["exercise", 30], [undefined, 5]]) {
    assert.equal(validIntake(kind, amount), false, `${kind} ${amount}`);
  }
});

test("totals add up what was logged, ignoring anything invalid", () => {
  const rows = [{ kind: "water", amount: 250, logged_at: "x" }, { kind: "water", amount: 500, logged_at: "x" }, { kind: "caffeine", amount: 95, logged_at: "x" }, { kind: "water", amount: -5, logged_at: "x" }, { kind: "sugar", amount: 9, logged_at: "x" }];
  assert.deepEqual(sumIntake(rows), { water: 750, caffeine: 95 });
});

test("logged intake is grouped by the reader's local day", () => {
  const rows = [
    { kind: "water", amount: 250, logged_at: "2026-10-28T03:00:00Z" },   // 21:00 on the 27th in Edmonton
    { kind: "water", amount: 500, logged_at: "2026-10-28T15:00:00Z" },   // 09:00 on the 28th
    { kind: "caffeine", amount: 95, logged_at: "2026-10-28T16:00:00Z" },
  ];
  const days = groupIntakeByDay(rows, (instant) => dateInZone(instant, "America/Edmonton"));
  assert.deepEqual(days.get("2026-10-27"), { water: 250, caffeine: 0 });
  assert.deepEqual(days.get("2026-10-28"), { water: 500, caffeine: 95 });
});

test("the line shows totals only; a day with nothing logged shows nothing", () => {
  assert.equal(intakeLine({ water: 750, caffeine: 95 }), "Water 750 ml · Caffeine 95 mg");
  assert.equal(intakeLine({ water: 0, caffeine: 95 }), "Caffeine 95 mg");
  assert.equal(intakeLine(emptyIntake()), "");
  assert.equal(intakeLine(emptyIntake(), { includeZero: true }), "Water 0 ml · Caffeine 0 mg");
});

test("no intake text or code mentions a target, a goal or what is left", () => {
  for (const file of ["../src/lib/intake/intake.ts", "../src/components/IntakeBar.tsx"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8")
      .split("\n").filter((line) => !/^\s*(\/\/|\*)/.test(line)).join("\n");   // comments may say what the feature is not
    assert.doesNotMatch(source, /\b(?<!event\.)(target|goal|remaining|left|quota|recommended|daily value)\b/i, file);
  }
});
