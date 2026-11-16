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
  assert.deepEqual(bounds,[['gte.2026-10-01T00:00:00.000Z','lt.2026-10-02T00:00:00.000Z'],['gte.2026-11-01T00:00:00.000Z','lt.2026-11-02T00:00:00.000Z']]);
});

test('prior-day SQL and today SQL do not overlap, including DST and extreme zones',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {getDayTotals,getDays,shiftDay}=await import('../src/lib/posts/days.ts');
 for(const [zone,today,hours] of [['UTC','2026-11-02',24],['America/Edmonton','2026-11-02',25],['America/Edmonton','2026-03-09',23],['Pacific/Kiritimati','2026-11-02',24],['Etc/GMT+12','2026-11-02',24]]){
  const reads=[];
  const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{const url=new URL(input instanceof Request?input.url:String(input));reads.push({table:url.pathname.split('/').at(-1),bounds:url.searchParams.getAll('eaten_at')});return Response.json([]);}}});
  const yesterday=shiftDay(today,-1);
  await getDayTotals(db,'user',zone,[yesterday]);await getDays(db,'user',zone,today,today);
  const [prior,current]=reads.filter(read=>read.table==='posts').map(read=>read.bounds.map(bound=>bound.slice(bound.indexOf('.')+1)));
  assert.equal(prior[1],current[0],zone+': yesterday excludes every row fetched for today');
  assert.equal((Date.parse(prior[1])-Date.parse(prior[0]))/3600000,hours,zone+': DST length');
 }
});
