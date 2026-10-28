// node --import tsx --test tests/days-summary.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { getLoggedDates } from "../src/lib/posts/days.ts";

// Records every table read; rows come back for posts only.
function fakeClient(rows) {
  const tables = [];
  const chain = new Proxy({}, { get: (_, name) => name === "then" ? undefined : name === "range" ? async () => ({ data: rows, error: null }) : () => chain });
  return { tables, from: (table) => { tables.push(table); return chain; } };
}

test("Home bubbles read only post dates, never items, media or photo URLs", async () => {
  const client = fakeClient([
    { id: "a", eaten_at: "2026-10-27T03:00:00Z" },
    { id: "b", eaten_at: "2026-10-27T20:00:00Z" },
    { id: "c", eaten_at: "2026-10-25T12:00:00Z" },
  ]);
  const days = await getLoggedDates(client, "u", "UTC", "2026-10-22", "2026-10-28");
  assert.deepEqual(days, [{ date: "2026-10-25" }, { date: "2026-10-27" }]);
  assert.deepEqual([...new Set(client.tables)], ["posts"]);
});

test("a post outside the local range does not count", async () => {
  const client = fakeClient([{ id: "a", eaten_at: "2026-10-21T23:30:00Z" }]);
  assert.deepEqual(await getLoggedDates(client, "u", "UTC", "2026-10-22", "2026-10-28"), []);
});
