// node --import tsx --env-file=.env.local --test tests/drink-post.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { parseDrinkInput, postDrink } from "../src/lib/intake/post-drink.ts";
import { customCoffeeCaffeine } from "../src/lib/intake/intake.ts";
import { hydrationSoFar, getDrinkCardsData } from "../src/lib/intake/hydration.ts";
import { dateInZone } from "../src/lib/posts/days.ts";
import { signInAsTestUser } from "../scripts/lib/session.mjs";

const migration = readFileSync(new URL("../supabase/migrations/0019_intake_logs_drink.sql", import.meta.url), "utf8");

test("drink data is bounded and caffeine/labels come from the server", () => {
  assert.deepEqual(parseDrinkInput({ kind: "water", ml: 330, label: "tampered", caffeineMg: 900 }), { kind: "water", ml: 330, label: "Water", caffeineMg: 0 });
  assert.deepEqual(parseDrinkInput({ kind: "caffeine", ml: 240 }), { kind: "caffeine", ml: 240, label: "Coffee, cup", caffeineMg: 95 });
  assert.equal(parseDrinkInput({ kind: "caffeine", ml: 30 }).caffeineMg, 63);
  assert.equal(parseDrinkInput({ kind: "caffeine", ml: 30, custom: true }).caffeineMg, 12);
  for (const ml of [1,2,2527,2528]) {
    const caffeine = customCoffeeCaffeine(ml);
    const parsed = parseDrinkInput({ kind: "caffeine", ml, custom: true });
    assert.equal(parsed?.caffeineMg ?? null, caffeine);
  }
  assert.equal(customCoffeeCaffeine(1), null);
  assert.equal(customCoffeeCaffeine(2), 1);
  for (const body of [null, { kind: "water", ml: 0 }, { kind: "water", ml: 5001 }, { kind: "water", ml: 1.5 }, { kind: "water", ml: "330" }, { kind: "caffeine", ml: 5000 }, { kind: "other", ml: 30 }]) assert.equal(parseDrinkInput(body), null);
});

test("a failed intake insert compensates by removing only its owner's new post", async () => {
  const calls = [];
  const admin = {
    rpc: async () => ({ data: "new-post", error: null }),
    from(table) {
      assert.ok(table === "posts" || table === "intake_logs");
      return {
        insert: async () => ({ error: { message: "write failed" } }),
        delete() { calls.push("delete"); return this; },
        eq(column, value) { calls.push([column, value]); return this; },
        then(resolve) { resolve({ error: null }); },
      };
    },
  };
  await assert.rejects(postDrink(admin, "owner", parseDrinkInput({ kind: "water", ml: 330 }), "UTC"), /could not be saved/);
  assert.deepEqual(calls, ["delete", ["id", "new-post"], ["user_id", "owner"]]);
});

test("hydration counts food water once, old water rows and local-day cutoff", async () => {
  const intake = [
    { kind: "water", amount: 250, ml: null, label: null, post_id: null, logged_at: "2026-10-28T07:00:00Z" },
    { kind: "water", amount: 330, ml: 330, label: "Water", post_id: "water", logged_at: "2026-10-28T08:00:00Z" },
    { kind: "caffeine", amount: 95, ml: 240, label: "Coffee, cup", post_id: "coffee", logged_at: "2026-10-28T09:00:00Z" },
    { kind: "water", amount: 500, ml: 500, label: "Water", post_id: "later", logged_at: "2026-10-28T10:00:00Z" },
    { kind: "water", amount: 600, ml: 600, label: "Water", post_id: null, logged_at: "2026-10-28T03:00:00Z" },
  ];
  const posts = [
    { id: "water", eaten_at: "2026-10-28T08:00:00Z" },
    { id: "coffee", eaten_at: "2026-10-28T09:00:00Z" },
    { id: "meal", eaten_at: "2026-10-28T07:30:00Z" },
    { id: "previous-day", eaten_at: "2026-10-28T03:00:00Z" },
  ];
  const builder = table => {
    let from = 0, through = 999, columns, ids, cutoff;
    const chain = new Proxy({}, { get: (_, method) => {
      if (method === "then") return resolve => {
        let data = [];
        if (table === "intake_logs") data = columns === "post_id" ? intake.filter(row => ids.includes(row.post_id)) : intake;
        if (table === "posts") data = posts.filter(row => !cutoff || row.eaten_at <= cutoff);
        if (table === "current_post_items") data = [{id:"meal-item",post_id:"meal",portion_grams:100}].filter(item => ids.includes(item.post_id));
        if (table === "item_nutrition") data = [{post_item_id:"meal-item",micronutrients:[{nutrientId:1051,unitName:"G",value:420,basis:"portion"}]}];
        resolve({data:data.slice(from,through+1),error:null});
      };
      if (method === "select") return value => { columns=value;return chain; };
      if (method === "in") return (_,value) => { ids=value;return chain; };
      if (method === "lte") return (_,value) => { cutoff=value;return chain; };
      if (method === "range") return (start,end) => { from=start;through=end;return chain; };
      return () => chain;
    } }); return chain;
  };
  const result = await hydrationSoFar({from:builder},"owner","2026-10-28","America/Edmonton","2026-10-28T09:30:00Z");
  assert.deepEqual(result,{drinksMl:820,foodMl:420,totalMl:1240});
});

test("batched cards share a day read, preserve legacy food water, and apply each drink's own cutoff", async () => {
  const calls = [];
  const posts = [
    {id:"w",eaten_at:"2026-10-28T08:00:00Z"},{id:"c",eaten_at:"2026-10-28T09:00:00Z"},
    {id:"meal1",eaten_at:"2026-10-28T07:30:00Z"},{id:"meal2",eaten_at:"2026-10-28T08:30:00Z"},
  ];
  const drinks = [
    {post_id:"w",kind:"water",amount:330,ml:330,label:"Water",logged_at:posts[0].eaten_at},
    {post_id:"c",kind:"caffeine",amount:95,ml:240,label:"Coffee, cup",logged_at:posts[1].eaten_at},
  ];
  const items = [{id:"i1",post_id:"meal1",portion_grams:100},{id:"i2",post_id:"meal2",portion_grams:50}];
  const nutrition = [
    {post_item_id:"i1",micronutrients:[{nutrientId:1051,nutrientName:"Water",unitName:"G",value:420,basis:"portion"}]},
    {post_item_id:"i2",micronutrients:[{nutrientId:1051,nutrientName:"Water",unitName:"G",value:200}]},
  ];
  const builder = table => {
    let columns, filter, offset=0, end=999, cutoff;
    const chain = new Proxy({}, {get:(_,method)=>{
      if(method === "then") return resolve=>{
        calls.push([table,columns]);
        let data = table === "posts" ? posts : table === "intake_logs" ? drinks : table === "current_post_items" ? items : nutrition;
        if(filter)data=data.filter(row=>filter[1].includes(row[filter[0]]));
        if(cutoff)data=data.filter(row=>row.eaten_at <= cutoff);
        resolve({data:data.slice(offset,end+1),error:null});
      };
      if(method === "select")return value=>{columns=value;return chain;};
      if(method === "in")return(column,values)=>{filter=[column,values];return chain;};
      if(method === "lte")return(_,value)=>{cutoff=value;return chain;};
      if(method === "range")return(start,last)=>{offset=start;end=last;return chain;};
      return()=>chain;
    }});return chain;
  };
  const result=await getDrinkCardsData({from:builder},"owner",["w","c","non-drink"],"UTC");
  assert.equal(result.w.drinksMl,330);assert.equal(result.w.foodMl,420);assert.equal(result.w.totalMl,750);
  assert.equal(result.c.drinksMl,570);assert.equal(result.c.foodMl,520);assert.equal(result.c.totalMl,1090);
  assert.equal(result["non-drink"],null);
  assert.equal(calls.filter(([table])=>table === "current_post_items").length,1,"current items are shared across cards");
  assert.equal(calls.filter(([table])=>table === "item_nutrition").length,1,"nutrition is shared across cards");
});

test("migration 0019 enforces bounds and preserves owner-only access in a rolled-back database transaction", () => {
  assert.ok(process.env.SUPABASE_DB_URL, "SUPABASE_DB_URL is required");
  const script = `\\set ON_ERROR_STOP on
begin;
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='intake_logs' and column_name='ml') as installed \\gset
\\if :installed
\\else
${migration}
\\endif
select gen_random_uuid() as owner, gen_random_uuid() as other \\gset
insert into auth.users(id) values (:'owner'),(:'other');
insert into profiles(id,handle) values (:'owner','drink-'||:'owner'),(:'other','drink-'||:'other');
select set_config('test.owner', :'owner', true);
select create_food_post(:'owner',now(),'Water',330,'{"calories":0,"micronutrients":[{"nutrientId":1051,"nutrientName":"Water","unitName":"G","value":330,"basis":"portion"}]}'::jsonb) as post \\gset
insert into intake_logs(user_id,kind,amount,ml,label,post_id) values (:'owner','water',330,330,'Water',:'post');
select set_config('test.post', :'post', true);
do $t$ begin
  if (select status from posts where id=current_setting('test.post')::uuid) <> 'ready' then raise exception 'water post not ready'; end if;
  if (select n.calories from item_nutrition n join post_items i on i.id=n.post_item_id where i.post_id=current_setting('test.post')::uuid) <> 0 then raise exception 'water calories not zero'; end if;
  begin insert into intake_logs(user_id,kind,amount,ml) values (current_setting('test.owner')::uuid,'water',1,0); raise exception 'ml zero allowed'; exception when check_violation then null; end;
  begin insert into intake_logs(user_id,kind,amount,label) values (current_setting('test.owner')::uuid,'water',1,repeat('x',41)); raise exception 'long label allowed'; exception when check_violation then null; end;
end $t$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'owner','role','authenticated')::text,true);
do $t$ begin
  if (select count(*) from intake_logs) <> 1 then raise exception 'owner cannot read drink'; end if;
  begin update intake_logs set ml=1; if found then raise exception 'update allowed'; end if; exception when insufficient_privilege then null; end;
end $t$;
select set_config('request.jwt.claims',jsonb_build_object('sub',:'other','role','authenticated')::text,true);
do $t$ begin
  if exists(select 1 from intake_logs) then raise exception 'other user read drink'; end if;
  if exists(select 1 from posts where id=current_setting('test.post')::uuid) then raise exception 'other user read post'; end if;
end $t$;
rollback;`;
  const result = spawnSync("psql", ["-X", "-qAt", "--dbname", process.env.SUPABASE_DB_URL], { input: script, encoding: "utf8", timeout: 90000 });
  assert.ifError(result.error); assert.equal(result.status, 0, result.stderr);
});

// This route proof runs only after the migration merge order has been executed and the local production build is served.
// Before that it reports an explicit skip, never substitutes a mocked database for the required route proof.
test("real route logs 330 ml water and 240 ml coffee; hydration excludes drink items and another user sees neither", async context => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  const schema = await admin.from("intake_logs").select("ml").limit(0);
  if (schema.error) { context.skip("0019 not deployed; live route proof waits for its migration/merge order"); return; }
  const origin = "http://127.0.0.1:3000";
  try { await fetch(origin, { signal: AbortSignal.timeout(3000) }); }
  catch { context.skip("serve the production build on localhost:3000 for the live route proof"); return; }
  const cookie = await signInAsTestUser();
  const secondCookie = await signInAsTestUser(2);
  const ids = [];
  const read = async (path, second = false) => {
    const response = await fetch(`${origin}${path}`, { headers: { Cookie: second ? secondCookie : cookie }, signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200); return response.json();
  };
  try {
    let userId;
    const userClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const signedIn = await userClient.auth.signInWithPassword({ email: process.env.TEST_USER_EMAIL, password: process.env.TEST_USER_PASSWORD });
    assert.ifError(signedIn.error); userId = signedIn.data.user.id;
    const now = new Date().toISOString();
    const before = await hydrationSoFar(admin, userId, dateInZone(now,"UTC"), "UTC", now);
    for (const [kind, ml] of [["water",330],["caffeine",240]]) {
      const response = await fetch(`${origin}/api/intake/post`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({kind,ml}), signal: AbortSignal.timeout(90000) });
      assert.equal(response.status,201);
      const saved = await response.json(); ids.push(saved.post_id);
      const { data: post } = await admin.from("posts").select("status").eq("id",saved.post_id).single(); assert.equal(post.status,"ready");
      const { data: row } = await admin.from("intake_logs").select("ml,amount,post_id").eq("post_id",saved.post_id).single();
      assert.equal(row.ml,ml); assert.equal(row.amount, kind === "water" ? 330 : 95);
      assert.deepEqual(await read(`/api/intake/post?post_id=${saved.post_id}&tz=UTC`,true),{drink:null});
      if (kind === "water") {
        const {data: items} = await admin.from("post_items").select("id").eq("post_id",saved.post_id);
        const {data: n} = await admin.from("item_nutrition").select("calories").eq("post_item_id",items[0].id).single(); assert.equal(Number(n.calories),0);
      }
    }
    const after = await hydrationSoFar(admin,userId,dateInZone(new Date(),"UTC"),"UTC",new Date().toISOString());
    assert.equal(after.drinksMl-before.drinksMl,570); assert.equal(after.foodMl,before.foodMl);
    const card = await read(`/api/intake/post?post_id=${ids[1]}&tz=UTC`); assert.equal(card.drink.caffeineMg,95);
  } finally {
    if (ids.length) {
      const {data: media} = await admin.from("post_media").select("storage_path").in("post_id",ids);
      await admin.from("intake_logs").delete().in("post_id",ids);
      await admin.from("posts").delete().in("id",ids);
      if (media?.length) await admin.storage.from("media").remove(media.map(row=>row.storage_path));
    }
  }
});
