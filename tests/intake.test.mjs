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

import { getDays } from "../src/lib/posts/days.ts";

test("the day story adds up every intake row across pages, not just the first page", async () => {
  // 2,500 rows on the same local day come back in pages of 1,000; all of them must be counted.
  const rows = Array.from({ length: 2500 }, (_, i) => ({ kind: "water", amount: 10, logged_at: `2026-10-27T12:${String(i % 60).padStart(2, "0")}:00Z` }));
  const post = { id: "p1", caption: "", eaten_at: "2026-10-27T13:00:00Z" };
  const calls = { intakePages: 0 };
  const builder = (table) => {
    let range = null;
    const result = () => {
      if (table === "posts") return { data: range && range[0] === 0 ? [post] : [], error: null };
      if (table === "intake_logs") { calls.intakePages++; return { data: rows.slice(range[0], range[1] + 1), error: null }; }
      return { data: [], error: null };
    };
    const chain = new Proxy({}, { get: (_, name) => {
      if (name === "then") return (resolve) => resolve(result());
      if (name === "range") return (from, to) => { range = [from, to]; return chain; };
      if (name === "maybeSingle") return async () => ({ data: null, error: null });
      return () => chain;
    } });
    return chain;
  };
  const days = await getDays({ from: builder, storage: { from: () => ({ createSignedUrl: async () => ({ data: null, error: { message: "none" } }) }) } }, "u", "UTC", "2026-10-27", "2026-10-27");
  assert.equal(calls.intakePages, 3);
  assert.deepEqual(days[0].intake, { water: 25000, caffeine: 0 });
});
