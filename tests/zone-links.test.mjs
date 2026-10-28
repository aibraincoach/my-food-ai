// node --import tsx --test tests/zone-links.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { withZone } from "../src/lib/posts/days.ts";

test("a time zone from the UTC fallback is not written into links", () => {
  assert.equal(withZone("/days/2026-10-27", "UTC", false), "/days/2026-10-27");
  assert.equal(withZone("/days?month=2026-10", "UTC", false), "/days?month=2026-10");
});

test("a time zone the reader chose or the cookie holds is carried in links", () => {
  assert.equal(withZone("/days/2026-10-27", "America/Edmonton", true), "/days/2026-10-27?tz=America%2FEdmonton");
  assert.equal(withZone("/days?month=2026-10", "Asia/Tokyo", true), "/days?month=2026-10&tz=Asia%2FTokyo");
});
