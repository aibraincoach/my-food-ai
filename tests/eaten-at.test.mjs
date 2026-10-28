// node --import tsx --test tests/eaten-at.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { validEatenAt, fromLocalInput, toLocalInput, EATEN_AT_MAX_AGE_MS } from "../src/lib/posts/eaten-at.ts";
import { mergeFeedPosts } from "../src/lib/posts/feed-order.ts";
import { getLoggedDates } from "../src/lib/posts/days.ts";

const now = Date.parse("2026-10-28T15:00:00Z");

test("a time earlier today is accepted; the future and the distant past are not", () => {
  assert.equal(validEatenAt("2026-10-28T14:30:00.000Z", now), "2026-10-28T14:30:00.000Z");
  assert.equal(validEatenAt("2026-10-28T15:04:00Z", now) !== null, true); // five minutes of clock slack
  assert.equal(validEatenAt("2026-10-28T15:10:00Z", now), null);
  assert.equal(validEatenAt(new Date(now - EATEN_AT_MAX_AGE_MS - 1000).toISOString(), now), null);
  for (const bad of [undefined, null, 5, "", "not a date", "2026-13-45T00:00:00Z"]) assert.equal(validEatenAt(bad, now), null, String(bad));
});

test("a picker value round-trips through local wall-clock time", () => {
  const instant = fromLocalInput("2026-10-28T08:30", Date.parse("2026-10-28T23:59:00Z") + 86_400_000);
  assert.ok(instant);
  assert.equal(toLocalInput(new Date(instant)), "2026-10-28T08:30");
  assert.equal(fromLocalInput("nonsense", now), null);
});

test("a meal logged now for 8:30 this morning sits by its eaten time in the feed, not its creation time", () => {
  const nineAm = { id: "a", eaten_at: "2026-10-28T09:00:00.000000+00:00", created_at: "2026-10-28T09:01:00+00:00" };
  const backdated = { id: "b", eaten_at: "2026-10-28T08:30:00.000000+00:00", created_at: "2026-10-28T20:00:00+00:00" };
  const dinner = { id: "c", eaten_at: "2026-10-28T19:00:00.000000+00:00", created_at: "2026-10-28T19:05:00+00:00" };
  assert.deepEqual(mergeFeedPosts([nineAm, dinner], [backdated]).map((p) => p.id), ["c", "a", "b"]);
});

test("it appears at 8:30 on today's bubble (Days groups by eaten_at in the reader's zone)", async () => {
  const rows = [{ id: "b", eaten_at: "2026-10-28T14:30:00Z" }]; // 08:30 in America/Edmonton (UTC-6)
  const chain = new Proxy({}, { get: (_, name) => name === "range" ? async () => ({ data: rows, error: null }) : () => chain });
  const client = { from: () => chain };
  assert.deepEqual(await getLoggedDates(client, "u", "America/Edmonton", "2026-10-22", "2026-10-28"), [{ date: "2026-10-28" }]);
});
