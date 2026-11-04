// node --import tsx --test tests/days-summary.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { getLoggedDates, getDays, getMonthSummary, LOGGED_STATUSES } from "../src/lib/posts/days.ts";

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

test("a meal still being analysed or waiting for a reply marks its day; a failed one does not", async () => {
  const seen = [];
  const chain = new Proxy({}, { get: (_, name) => name === "range" ? async () => ({ data: [], error: null }) : (...args) => { seen.push([name, ...args]); return chain; } });
  await getLoggedDates({ from: () => chain }, "u", "UTC", "2026-10-22", "2026-10-28");
  const statuses = seen.find(([name, column]) => name === "in" && column === "status");
  assert.deepEqual(statuses?.[2], ["ready", "queued", "processing", "needs_input"]);
  assert.ok(!LOGGED_STATUSES.includes("failed"));
});


test('calendar and day panel count ready meals and unfinished meals separately', async () => {
 const {createClient}=await import('@supabase/supabase-js');
 const rows=[{id:'ready',status:'ready',caption:'Rice',eaten_at:'2026-10-31T18:00:00Z',post_media:[],current_post_items:[{id:'i',name:'Rice',portion_grams:100,item_nutrition:[{calories:100,micronutrients:[]}]}]}, {id:'pending',status:'needs_input',eaten_at:'2026-10-31T19:00:00Z',current_post_items:[]}];
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{const url=new URL(input instanceof Request?input.url:String(input));return Response.json(url.pathname.endsWith('/posts')?rows:[]);}}});
 const month=await getMonthSummary(db,'u','America/Edmonton','2026-10');
 assert.equal(month.days[0].posts,1);assert.equal(month.days[0].pending,1);assert.equal(month.days[0].kcal,100);
 const days=await getDays(db,'u','America/Edmonton','2026-10-31','2026-10-31');
 assert.equal(days[0].posts.length,1);assert.equal(days[0].pending,1);assert.equal(days[0].totals.calories,100);
});


test('an earlier unfinished meal does not add unknown nutrition to a fully known ready meal',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {unavailableFoods}=await import('../src/lib/nutrition/totals.ts');
 const nutrition={calories:100,protein_g:5,carbs_g:10,fat_g:4,fibre_g:0,sugar_g:0,sodium_mg:0,micronutrients:[]};
 const ready={id:'ready',status:'ready',caption:'Rice',eaten_at:'2026-10-31T19:00:00Z',post_media:[],current_post_items:[{id:'i',name:'Rice',portion_grams:100,item_nutrition:[nutrition]}]};
 const pending={id:'pending',status:'needs_input',eaten_at:'2026-10-31T18:00:00Z',current_post_items:[]};
 for(const rows of [[pending,ready],[ready,pending]]){
  const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>Response.json(new URL(input instanceof Request?input.url:String(input)).pathname.endsWith('/posts')?rows:[])}});
  const [day]=await getDays(db,'u','America/Edmonton','2026-10-31','2026-10-31');
  assert.equal(day.posts.length,1);assert.equal(day.pending,1);assert.equal(day.totals.calories,100);assert.deepEqual(unavailableFoods(day.totals),[]);
 }
});
