// node --import tsx --test tests/days-range.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { validDate, validMonth, shiftDay } from "../src/lib/posts/days.ts";

test("only years 2000-2999 are accepted for months and days", () => {
  for (const month of ["2026-10", "2000-01", "2999-12", "2024-02"]) assert.equal(validMonth(month), true, month);
  for (const month of ["0000-02", "0099-12", "1999-12", "3000-01", "2026-13", "2026-00", "26-10", undefined, ""]) assert.equal(validMonth(month), false, String(month));
  assert.equal(validDate("2024-02-29"), true);
  assert.equal(validDate("2023-02-29"), false);
  assert.equal(validDate("0000-01-01"), false);
  assert.equal(validDate("1999-12-31"), false);
});

test("shifting a supported day across a year boundary stays a valid date", () => {
  assert.equal(shiftDay("2026-01-01", -1), "2025-12-31");
  assert.equal(shiftDay("2024-02-28", 1), "2024-02-29");
});

test('two requested days a month apart read separate windows rather than the gap', async () => {
  const {createClient}=await import('@supabase/supabase-js');
  const {getDayTotals}=await import('../src/lib/posts/days.ts');
  const bounds=[];
  const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
    const url=new URL(input instanceof Request?input.url:String(input));
    bounds.push(url.searchParams.getAll('eaten_at'));return Response.json([]);
  }}});
  const result=await getDayTotals(db,'user','UTC',['2026-10-01','2026-11-01']);
  assert.equal(result.length,2);assert.equal(bounds.length,2);
  assert.deepEqual(bounds,[['gte.2026-09-30T00:00:00Z','lt.2026-10-03T00:00:00Z'],['gte.2026-10-31T00:00:00Z','lt.2026-11-03T00:00:00Z']]);
});
