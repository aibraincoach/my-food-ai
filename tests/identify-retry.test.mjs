// node --import tsx --test tests/identify-retry.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

const ok = () => new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({ items: [] }) }] }] }), { status: 200 });

async function withFetch(sequence, run) {
  const original = globalThis.fetch;
  const originalKey = process.env.MODEL_API_KEY;
  process.env.MODEL_API_KEY = "test-key";
  let calls = 0;
  const requests = [];
  // Only model calls follow the scripted sequence; anything else (the trace insert) just succeeds.
  globalThis.fetch = async (input, init) => { if (!String(input instanceof Request ? input.url : input).includes('/v1/responses')) return new Response(null, { status: 201 }); const body = JSON.parse(init?.body ?? "{}"); requests.push(body); const next = sequence[calls++]; return next(body); };
  try { return await run(() => calls, requests); } finally { globalThis.fetch = original; if (originalKey === undefined) delete process.env.MODEL_API_KEY; else process.env.MODEL_API_KEY = originalKey; }
}

test("a transient empty-body 404 is retried: the second response is the one that gets parsed", { timeout: 20000 }, async () => {
  const { identifyItems } = await import("../src/lib/meta/spark.ts");
  await withFetch([() => new Response("", { status: 404 }), ok], async (calls) => {
    // The retry reached the second (completed) response; its minimal body then fails schema validation,
    // which proves the 404 was not terminal.
    await assert.rejects(identifyItems(null, "image/jpeg", "rice", []), /failed validation/);
    assert.equal(calls(), 2);
  });
});

test("a 400 is terminal at once and is not retried here", { timeout: 20000 }, async () => {
  const { identifyItems } = await import("../src/lib/meta/spark.ts");
  await withFetch([() => new Response("bad", { status: 400 }), ok], async (calls) => {
    await assert.rejects(identifyItems(null, "image/jpeg", "rice", []), (error) => error.status === 400);
    assert.equal(calls(), 1);
  });
});

const validMeal = {items:[{region_index:0,name:"rice",portion_text:"one serving",portion_grams:100,confidence:0.8}],summary:"Consumed rice",needs_input:null};
const identifyResponse = (status, value=validMeal) => Response.json({status,output:[{type:"message",content:[{type:"output_text",text:JSON.stringify(value)}]}]});
test("identification gets completion capacity on its first low-effort request",async()=>{
 const {identifyItems}=await import("../src/lib/meta/spark.ts");
 await withFetch([()=>identifyResponse("completed")],async(calls,requests)=>{
  const meal=await identifyItems(null,"image/jpeg","rice",[{index:0,box:{left:0,top:0,right:10,bottom:10},areaFraction:1}]);
  assert.equal(meal.items[0].name,"rice");assert.equal(meal.items[0].regionIndex,0);
  assert.deepEqual(requests.map(r=>r.max_output_tokens),[8192]);assert.equal(requests[0].reasoning.effort,"low");assert.equal(calls(),1);
 });
});
test("parseable truncated identification is never accepted at the final ceiling",async()=>{
 const {identifyItems}=await import("../src/lib/meta/spark.ts");
 await withFetch([()=>identifyResponse("incomplete"),()=>identifyResponse("incomplete")],async(calls)=>{
  await assert.rejects(identifyItems(null,"image/jpeg","rice",[]),/status incomplete/);assert.equal(calls(),1);
 });
});

test('independently portioned additions sharing a region survive identification without a duplicate combined item',async()=>{
 const {identifyMeal}=await import('../src/lib/pipeline/analyze.ts');
 const items=[{region_index:0,name:'cooked beef tenderloin steak',portion_text:'one steak, excluding topping',portion_grams:170,confidence:0.85},{region_index:0,name:'butter',portion_text:'one pat',portion_grams:10,confidence:0.8}];
 const box={left:0,top:0,right:10,bottom:10};
 await withFetch([()=>identifyResponse('completed',{items,summary:'Steak with butter',needs_input:null,nutrition_label:false})],async(calls)=>{
  const meal=await identifyMeal(null,'image/jpeg','steak topped with butter',{postId:'test',userId:'owner',photoWidth:10,photoHeight:10,regions:[{index:0,box,areaFraction:1,maskPath:'mask'}]});
  assert.equal(calls(),1,'decomposition uses the existing identify call');
  assert.deepEqual(meal.regions.map(r=>[r.item.name,r.item.portionGrams]),[['cooked beef tenderloin steak',170]]);
  assert.deepEqual(meal.captionOnly.map(item=>[item.name,item.portionGrams]),[['butter',10]]);
  assert.equal(meal.regions.length+meal.captionOnly.length,2,'no food is dropped or duplicated');
 });
});
