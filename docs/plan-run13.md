# Fleet 13 plan: the defects Fleet 12 does not cover (and what it already covers)

Written against `origin/main` `3b95a32503756e8ed617a4eace8d20ed9aaac1fd`, following `docs/planner-contract.md`. The owner pasted 49 backlog issues. Fleet 12 (`docs/plan-run12.md` on branch `run12/docs`, PR #501) is already dispatched and has 10 open code PRs plus 2 merged. This plan builds ONLY what Fleet 12 omits. Everything else is mapped in the coverage table so the coder builds nothing twice.

**Stops: zero. No legal halts. No waiting.** One prompt to the end: build, review, fix to zero blockers, merge, move on. Where a find-text does not occur exactly once, the coder re-reads the current file and applies the same change to the current text; it never stops.

**Merge authority.** This plan is the merge order for its code PRs, the same as Fleet 11 and Fleet 12 (owner ruling). Each code PR merges at the exact head that holds a counting review (below) with green checks, in ascending PR number. Migration `0050` is applied to production after its review passes and before its PR merges, then read back. A defect found after a merge goes on the backlog; the merge is not reverted. Docs PRs are not covered by this order.

## What the investigation found (checked this session; the coder does not re-check facts, only the find-texts)

Production database queries were read-only (`psql "$SUPABASE_DB_URL"` with `default_transaction_read_only=on`).

- **F1 (#523, endemic).** 94 of 590 current food items created in the last 14 days (16%) have every nutrition value null. They are not only exotic dishes: plain cooked spaghetti (x8), toasted bread (x5), toast, black coffee, coffee, ham, salami, green salad, tonkatsu, fried tempeh. Most are repeated load-test items, so the real-user share is unknown (premise P5). Query: `select lower(i.name),count(*) from post_items i join item_nutrition n on n.post_item_id=i.id where i.superseded_at is null and i.created_at>now()-interval '14 days' and n.calories is null group by 1 order by 2 desc`.
- **F2 (#523 cause).** For post `86634d46-b0e3-421a-9b67-1a4e8f5e8e78` the `model_calls` trace shows matcher `fdc-reference-v7` ran searches "spicy Indonesian fried macaroni snack", "fried +macaroni", "fried +pasta", then the model returned `id:null` with reason "No compatible generic fried-pasta snack record is present." The bare name "macaroni" was never searched. Cause in code (`src/lib/fdc/match.ts`, `matchFood`): the next query is `[improved, ...(attempt>0?[baseQuery]:[])].find(...)`, so the model's own refinement always takes the slot before the bare food, and `attempt===2` returns unavailable. The Run 10 fix for #272 ("a third search tries the base food") has the same ordering flaw, which is why it did not cure this. Every unavailable reason in the last 14 days is the model declaring "incompatible"; there is no step that accepts the closest generic food. The existing unit test `tests/fdc-reference-search.test.mjs` lines 70-81 only passes when the model gives no refinement.
- **F3 (#524).** `src/lib/fdc/nutrients.ts` reads sugar from nutrient 2000 only. `src/lib/fdc/barcode-product.ts:20` already uses `[2000, 1063]`. In production, 77 current rows have calories but no sugar; only 6 rows (including superseded ones: pineapple chunks x3, scrambled egg with ketchup x2, rolled chicken ham slices) hold nutrient 1063 and no 2000. The other 71 hold neither, so the fix is real but small. Trigger `lock_nutrition_feedback_revision` only locks the post row, so an UPDATE is safe.
- **F4 (#525, asked three times).** `src/components/OutlineOverlay.tsx` draws the photo with `object-cover` and cover math (`Math.max`) at lines 99, 108 and 151. The phone frame is 230 px tall until tapped (line 98), then a square. This is the design: `docs/plan.md:70` says "the photo at 230 px tall (cover)". The owner's request contradicts the frame, which is why three asks did not land. For the macaroni photo (480x640 portrait, `post_media`) the phone default shows 44% of the photo's height (56% cut off); the desktop pane 640x680 shows 80% (20% cut off). Stored first-photo ratios across all posts: 1.33 (47), 0.98 (37), 1.00 (32), 0.75 (31). Masks use `frame` (stored width/height times scale), so they follow the math automatically.
- **F5 (#452).** Production `label_readings` holds two readings; the 2026-11-03 13:33 UTC one is `is_label: true`, `per_serving` filled (130 kcal, fat 4.5, carbs 20), `serving: null`. `src/components/CaptureSheet.tsx:270` treats any reading without `serving` as "missing" and shows "No nutrition label found". So a readable label whose serving weight is not printed (e.g. "1 bungkus") is reported as no label. This is the likely cause of the Goldfish failure but the owner's photo is not in the database (premise P3).
- **F6 (#451).** Before PR #480 the resolver asked USDA FDC Branded only, which holds US packs, so every non-US pack returned null and "Not in the database". After #480 the only Open Food Facts calls in `model_calls` (6, all 2026-11-04 00:21-00:22 UTC) are the coder's own and all succeeded, so no owner scan after the fix has been recorded. `curl` of `https://world.openfoodfacts.org/api/v2/product/7622300761363.json` returns the Oreo with 489 kcal/100 g (HTTP 200). OFF also normalises leading zeros: `049000028911`, `0049000028911`, `49000028911`, `00049000028911` all resolve to the same product, so the zero-strip regex in `open-food-facts.ts:41` is NOT a defect (an agent report said it was; I tested it and it is not). The real remaining defect: `barcode-resolver.ts` line 21 swallows every OFF failure (`catch { base = null; }`) and `open-food-facts.ts:44` returns null on any non-OK status, so an OFF outage, 429 or timeout shows the owner "Not in the database" for a product that exists. No log says which source answered for the FDC step.
- **F7 (verified fine).** Migrations 0048 and 0049 are applied in production (indexes `post_media_post_id_idx`, `post_comments_post_id_idx` and function `feedback_revisions` exist). #377's two "Coca-Cola, can" posts each have an intake row (linked by post). Fleet 12's `docs/run12-report.md` marks items 1-22 "not done" except 5 and 9, so most Fleet 12 PRs are awaiting review and merge.

## Premises (unchecked; the report states which were false)

- **P1.** A USDA search for the bare food noun returns at least one Foundation / SR Legacy / FNDDS record for most of the 94 failing items. Step 1.8 measures it before any code is trusted.
- **P3.** The Goldfish failure is the `serving: null` case (F5). Not observable without the owner's photo.
- **P4.** `lock_feedback_revision` does not block the 0050 update (read in this session; confirm on the disposable stack).
- **P5.** Most of the 94 failing items are load-test or test-account fixtures. Step 1.8 splits them by account.

## Dependencies and shared files

Every PR branches from the then-current `origin/main`; nothing is stacked. Fleet 12 changes `OutlineOverlay.tsx` (lanes H and J), `NutritionTable.tsx` (none), `CaptureSheet.tsx` (lanes B and H), `match.ts` (none). Item 3 touches `OutlineOverlay.tsx`: whichever of Fleet 12 lane J and item 3 merges second brings main in by merge commit and keeps both changes. After lane J merges, the `<img ... object-cover>` line no longer exists inline; the same class lives in `DetailImage` and the coder changes it there. Item 5 touches `CaptureSheet.tsx` the same way (lane B).

## Review (owner ruling, current: speed over ceremony)

What counts as a review, and nothing else is required:
- **PPLX on ChatGPT counts.** Run `tools/pplx-review.mjs` (`skills/pplx-review/SKILL.md`); an answer from ChatGPT is a valid review. No model-proof line is required.
- **A Muse zero-blocker review on the exact head counts.**
- **The coder also runs its own review subagent** beside the build on every PR, and fixes what it finds.

Build all code first; reviews run beside the build and never block building. Per PR: one review pass on the head, fix the blockers, move on at zero. If one reviewer cannot run, use another from the list; there are no legal halts and nothing waits. A separate agent will code-review everything later; that review is not a gate for this run.

## Lanes (each in its own worktree under `../my-food-ai-wt/run13-<lane>`, cut from the current `origin/main`)

| Lane | Item | Branch | Service (the how) · boundary (the caller) |
|---|---|---|---|
| A | 1 | `run13/food-fallback` | `fdc/approximate.ts` · `resolveFoodMatch`, `persist.ts` |
| B | 2 | `run13/sugar-total` | `scaleNutrition` · all nutrition writers |
| C | 3 | `run13/whole-photo` | frame math in `OutlineOverlay` · `PostDetail` |
| D | 4 | `run13/barcode-errors` | `lookupOpenFoodFacts` · `resolveProduct` |
| E | 5 | `run13/label-serving` | `labelPrompt`, `parseLabelReading` · `CaptureSheet` |

## 1. Never leave a food blank when a close USDA record exists (Lane A): #523

**Owner ruling (this session):** after the strict searches fail, use the closest generic USDA record, labelled with its name. **Model-made estimates are NOT built:** the owner has not ruled on them, so a food with no close USDA record stays "unavailable", as today.

**Problem.** See F1, F2. The matcher cannot accept a close-but-not-exact record, and the model's refinement crowds out the bare food name.

**Service that owns the how:** new file `src/lib/fdc/approximate.ts`. **Boundary that calls it:** `resolveFoodMatch` in `match.ts`, with `{approximate:true}` from `persist.ts`, `correct.ts` and `recompute.ts`. `identify-drinks.ts` keeps exact matching only.

1. `src/lib/fdc/client.ts`: find `  portions?: FoodPortion[];\n}` (inside `interface FdcFood`). Replace with:
   ```ts
     portions?: FoodPortion[];
     // Set only when the numbers come from a similar food, not an exact reference.
     approximation?: {kind: "closest"; basis: string};
   }
   ```
2. `src/lib/fdc/version.ts`: replace `"fdc-reference-v7"` with `"fdc-reference-v8"`.
3. `src/lib/fdc/match.ts`:
   - Replace the signature tail `Promise<{food:FdcFood|null; reason:string; searches:number}> {` of `matchFood` with `Promise<{food:FdcFood|null; reason:string; searches:number; baseFood:string|null}> {`.
   - Replace `return {food:null,reason:"The item has no searchable food name.",searches:0};` with `return {food:null,reason:"The item has no searchable food name.",searches:0,baseFood:null};`.
   - Replace `if(food)return {food,reason:decision.reason,searches:attempt+1};` with `if(food)return {food,reason:decision.reason,searches:attempt+1,baseFood:baseQuery};`.
   - Replace `if(attempt===2||!next)return {food:null,reason:decision.reason,searches:attempt+1};` with `if(attempt===2||!next)return {food:null,reason:decision.reason,searches:attempt+1,baseFood:baseQuery};`.
   - Every return of `matchFood` now carries `baseFood`; `baseQuery` is the model's first `query_food` (for the macaroni, "macaroni"), already cleaned by `foodSearchQuery`.
   - Replace the whole `resolveFoodMatch` function with:
     ```ts
     export async function resolveFoodMatch(admin:SupabaseClient,name:string,caption="",signal:AbortSignal=nutritionResolutionBudget(),options:{approximate?:boolean}={}):Promise<FdcFood|null>{
       try {
         const result=await recordCall("fdc",{event:"food_resolution",name,matcherVersion:FOOD_MATCH_VERSION},()=>matchFood(name,caption,{search:query=>searchFoods(admin,query,signal),choose:(item,context,foods,retry,query,remaining)=>choose(item,context,foods,retry,signal,query,remaining)},signal),r=>({text:{source:r.food?"selected":"unavailable",reason:r.reason,searches:r.searches},fdcId:r.food?.fdcId??null}));
         if(result.food||!options.approximate||!result.baseFood)return result.food;
         return await closestGenericFood(admin,name,caption,result.baseFood,signal);
       } catch(error) {
         if(signal.aborted)throw new MetaApiError(503,"Food resolution budget was exhausted.");
         throw error;
       }
     }
     ```
     and add `import { closestGenericFood } from "./approximate";` below the existing `./version` import. (`approximate.ts` must not import from `match.ts`.)
4. Create `src/lib/fdc/approximate.ts`:
   ```ts
   import type { SupabaseClient } from "@supabase/supabase-js";
   import { searchFoods, type FdcFood } from "./client";
   import { gramBasis, hasNutrition } from "./nutrients";
   import { createResponse, MetaApiError } from "@/lib/meta/client";
   import { recordCall } from "@/lib/trace/record";

   // Generic USDA record types only; Branded stays out so a manufacturer is never presented as a plain food.
   const GENERIC = new Set(["Foundation", "SR Legacy", "Survey (FNDDS)"]);
   const OUTPUT_TOKENS = [4096, 8192] as const;

   const CLOSEST_INSTRUCTIONS = `The exact preparation of a food is not in USDA data. Pick the ONE candidate that is the closest generic version of the target food, even if the cooking method or a seasoning differs (for example boiled pasta for a fried pasta snack). Prefer the plain food over a compound recipe. Reject a candidate that is a different kind of food (seafood, vegetable, dessert for a pasta, and so on) or that adds substantial ingredients the target does not have (cheese, meat, sauce). Return id null only when every candidate is a different kind of food. The reason must say how the chosen record differs from the target.`;

   async function choose(name: string, caption: string, found: FdcFood[], signal?: AbortSignal): Promise<{ id: number | null; reason: string }> {
     let result: Awaited<ReturnType<typeof createResponse>> | undefined;
     for (const maxOutputTokens of OUTPUT_TOKENS) {
       if (signal?.aborted) throw new MetaApiError(503, "Food resolution budget was exhausted.");
       result = await createResponse({ model: "muse-spark-1.3", reasoning: { effort: "low" }, instructions: CLOSEST_INSTRUCTIONS,
         input: [{ role: "user", content: [{ type: "input_text", text: JSON.stringify({ name, caption, candidates: found.map(f => ({ id: f.fdcId, description: f.description, additionalDescriptions: f.additionalDescriptions, dataType: f.dataType, category: f.foodCategory })) }) }] }],
         text: { format: { type: "json_schema", name: "closest_food", strict: true, schema: { type: "object", additionalProperties: false, properties: { id: { type: ["integer", "null"] }, reason: { type: "string" } }, required: ["id", "reason"] } } },
         max_output_tokens: maxOutputTokens }, { signal });
       if (result.status !== "incomplete" || result.refusal) break;
     }
     if (!result || result.status !== "completed" || !result.outputText || result.refusal) throw new MetaApiError(502, "Closest-food decision did not complete.");
     let parsed: unknown;
     try { parsed = JSON.parse(result.outputText); } catch { throw new MetaApiError(502, "Closest-food decision was invalid."); }
     const value = parsed as { id?: unknown; reason?: unknown };
     if (typeof parsed !== "object" || parsed === null || (value.id !== null && !Number.isSafeInteger(value.id)) || typeof value.reason !== "string") throw new MetaApiError(502, "Closest-food decision was invalid.");
     return value as { id: number | null; reason: string };
   }

   // Searches the bare food noun among generic USDA records and accepts the closest one, labelled with its name.
   // Null leaves the food unavailable, as before.
   export async function closestGenericFood(admin: SupabaseClient, name: string, caption: string, baseFood: string, signal?: AbortSignal): Promise<FdcFood | null> {
     return recordCall("fdc", { event: "food_approximation", name, query: baseFood }, async () => {
       const found = (await searchFoods(admin, baseFood, signal)).filter(f => GENERIC.has(f.dataType) && gramBasis(f) && hasNutrition(f)).slice(0, 30);
       if (!found.length) return null;
       const decision = await choose(name, caption, found, signal);
       if (decision.id === null) return null;
       const food = found.find(f => f.fdcId === decision.id);
       if (!food) throw new Error("Closest-food decision selected an ineligible candidate.");
       return { ...food, approximation: { kind: "closest" as const, basis: food.description } };
     }, food => ({ text: { source: food ? "closest" : "unavailable", basis: food?.description ?? null }, fdcId: food?.fdcId ?? null }));
   }
   ```
   `searchFoods` takes `(admin, query, signal?)` exactly as `match.ts` already calls it; if `npx tsc --noEmit` reports another parameter list, adapt only that call.
5. Pass the option and carry the label to the summary:
   - `persist.ts`: replace `const food=copied?null:await resolveFoodMatch(admin,row.name,context.caption??"",signal);` with `const food=copied?null:await resolveFoodMatch(admin,row.name,context.caption??"",signal,{approximate:true});\n    if(food?.approximation)approximations.push({name:row.name,basis:food.approximation.basis});`; replace ` const resolutionBudget=nutritionResolutionBudget();` with ` const resolutionBudget=nutritionResolutionBudget();\n const approximations:{name:string;basis:string}[]=[];`; replace `const summary = await safeSummary(named.summary, totals);` with `const summary = await safeSummary(named.summary, totals, approximations);`.
   - `correct.ts`: replace `resolveFoodMatch(admin,item.name,context.caption??'',signal)` with `resolveFoodMatch(admin,item.name,context.caption??'',signal,{approximate:true})`.
   - `recompute.ts`: replace `resolveFoodMatch(admin,item.name,context.caption??"",signal)` with `resolveFoodMatch(admin,item.name,context.caption??"",signal,{approximate:true})`.
   - `wording.ts`: replace `export function plainConsumed(totals: ConsumedTotals): string {` with `export function plainConsumed(totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): string {`; in that function's returned template, replace the tail `Nutrition unavailable: ${missing.join(", ")}.`:""}` + closing backtick with `Nutrition unavailable: ${missing.join(", ")}.`:""}${approximations.map(a=>` Nutrition for ${a.name} is taken from the closest USDA record, ${a.basis}.`).join("")}` + closing backtick (everything before `Nutrition unavailable` stays unchanged); replace `export async function safeSummary(_text: string, totals: ConsumedTotals): Promise<string> {\n  return plainConsumed(totals);` with `export async function safeSummary(_text: string, totals: ConsumedTotals, approximations: {name:string;basis:string}[] = []): Promise<string> {\n  return plainConsumed(totals, approximations);`.
   - Wording rule: `checkWording` bans "plan", "target", "left", "remaining", "goal", "should" and similar; the added sentence contains none. A food or USDA record name containing a banned word is an existing risk of the current summary and is unchanged.
6. Closest-record items keep their real USDA id in `source_ref`, so every existing reader (portion rescaling, edits, totals) works unchanged. Prior-nutrition reuse (`prior-nutrition.ts`) trusts only traces with `source === "selected"`, so these items are re-resolved on a re-analysis. This is intended.
7. Tests: none new (the contract allows tests only for money, access, mail, migrations and data rules). `npm test` must still pass; `tests/fdc-reference-search.test.mjs` is unchanged because the matcher's search order is untouched.
8. **Measure before trusting (P1, P5).** `scripts/real-food-match-smoke.mjs` reads `scripts/fixtures/food-matching.json`. Append a fixture entry `{"name":"spicy Indonesian fried macaroni snack","caption":"Spicy Indonesian macaroni","requires":[["macaroni","pasta"]],"rejects":["chili","cheese","salad","shrimp"]}` and run the script with the real providers (`.env.local`, the invocation in the script's header). Separately, read-only, list the 94 failing names by account (`select i.name,p.user_id,count(*) ... group by 1,2`) and report how many belong to the designated test accounts. Both results go in `docs/run13-report.md`. If many real-user names still come back null, that is a finding to report; the run moves on.

**Blast radius.** Every new or re-analysed food that previously showed "unavailable" and has a close generic USDA record now carries that record's numbers. Day totals, cards and the Today column include them. A wrong "closest" choice shows wrong numbers for that food, with the record named in the meal's first comment. Drink identification is untouched. Old rows are unchanged. Cost: one more USDA search and one more model call per unavailable food only. **Done:** the smoke script returns a closest generic record for the macaroni; a re-analysed post of that food shows nutrition and the comment "Nutrition for … is taken from the closest USDA record, …"; `npm test` passes.

## 2. Sugar is read from Sugars, Total too (Lane B): #524

1. `src/lib/fdc/nutrients.ts`: replace `const SUGAR_ID = 2000;` with `const SUGAR_IDS = [2000, 1063];` and replace `sugarG: scale([SUGAR_ID], unitToGrams),` with `sugarG: scale(SUGAR_IDS, unitToGrams),` (`scale` takes the first id that exists, so 2000 still wins when both are present). Count each find-text; each must occur once.
2. `src/lib/nutrition/table.ts`: replace `const macroIds = new Set([1008,1062,2047,2048,1003,1004,1005,1079,2000,1093]);` with `const macroIds = new Set([1008,1062,2047,2048,1003,1004,1005,1079,2000,1063,1093]);` so sugar is not also listed as a micronutrient row.
3. `supabase/migrations/0050_sugar_total_backfill.sql`:
   ```sql
   -- Fill sugar from USDA 1063 "Sugars, Total" for rows that hold it but not 2000. Fills nulls only.
   update public.item_nutrition n
   set sugar_g = (select (m->>'value')::numeric from jsonb_array_elements(n.micronutrients) m
                  where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G' and m->>'basis' = 'portion' and m->>'value' is not null limit 1)
   where n.sugar_g is null and n.calories is not null
     and exists (select 1 from jsonb_array_elements(n.micronutrients) m where (m->>'nutrientId')::int = 1063 and m->>'unitName' = 'G' and m->>'basis' = 'portion' and m->>'value' is not null)
     and not exists (select 1 from jsonb_array_elements(n.micronutrients) m where (m->>'nutrientId')::int = 2000);
   ```
   `supabase/rollbacks/0050_sugar_total_backfill.down.sql`: the same `update` setting `sugar_g = null` where `sugar_g` equals the 1063 value and there is no 2000 entry.
4. `tests/nutrition-scaling.test.mjs`: add a case with a food holding `{nutrientId:1063,nutrientName:'Sugars, Total',unitName:'G',value:8.55}` and no 2000, scaled to 50 g, expecting `sugarG` 4.275; and a food with both 2000 (5) and 1063 (8) expecting 2000's value. `tests/db/sugar-backfill.test.mjs` (pattern of `tests/db/feed-indexes.test.mjs`): inside a transaction, insert one item with only 1063, run the migration statement, assert sugar equals the value, rollback.
5. Apply to the disposable stack, then to production after review (read the six rows back: `select name,sugar_g from item_nutrition n join post_items i on i.id=n.post_item_id where n.micronutrients @> '[{"nutrientId":1063}]' and n.sugar_g is not null`).

**Blast radius.** Sugar totals only; six production rows gain a value, no calories change. Stored card images keep the old text. **Done:** tests pass, migration applied and read back.

## 3. The meal detail shows the whole photo (Lane C): #525

**Design disagreement the owner has now settled:** the frames say 230 px cover; the owner asks for the whole image. This plan follows the owner. Feed cards stay square (cover) as designed.

In `src/components/OutlineOverlay.tsx` (re-count every find-text on current main first):
1. After `const drink = useDrinkCard(postId, status, eatenAt, initialDrink);` add `const wholePhoto = Boolean(photo) && !desktopModal && (!drink || drink.source === 'item');`.
2. Replace `const [frameHeight,setFrameHeight]=useState(640);` with `const [frameHeight,setFrameHeight]=useState(photo?Math.round(tokens.spacing.phone*photo.height/photo.width):640);`.
3. In the ResizeObserver callback replace `if(desktopModal&&entry.contentRect.height)setFrameHeight(entry.contentRect.height);` with `if((desktopModal||wholePhoto)&&entry.contentRect.height)setFrameHeight(entry.contentRect.height);` and replace the effect's dependency list `[desktopModal]);` (the one after `observer.disconnect();`) with `[desktopModal,wholePhoto]);`.
4. Replace `const height=desktopModal?frameHeight:photo&&(!drink||drink.source==='item')?(expandedPhoto?width:230):width;` with `const height=desktopModal||wholePhoto?frameHeight:width;`.
5. Replace `const scale = photo ? Math.max(width / photo.width, height / photo.height) : 1;` with `const scale = photo ? Math.min(width / photo.width, height / photo.height) : 1;` and replace `const ratio = Math.max(rect.width / photo.width, rect.height / photo.height);` with `const ratio = Math.min(rect.width / photo.width, rect.height / photo.height);`.
6. On the photo container replace `style={{ height, touchAction: drawing ? "none" : "auto" }}` with ``style={{ ...(wholePhoto&&photo?{aspectRatio:`${photo.width} / ${photo.height}`,maxHeight:"80dvh"}:{height}), touchAction: drawing ? "none" : "auto" }}``.
7. Photo class: replace `className="h-full w-full object-cover"` on the detail photo image (inline `<img src={photo.url}` on current main, or the `<img>` inside `DetailImage` once Fleet 12 lane J has merged) with `className="h-full w-full object-contain"`. Replace the desktop extra-slide `className="size-full object-cover"` with `className="size-full object-contain"`.
8. Remove the now-meaningless expansion: delete `const [expandedPhoto,setExpandedPhoto]=useState(false);`; replace `if(readOnly || !initialized || !outlines){setExpandedPhoto(value=>!value);return;}` with `if(readOnly || !initialized || !outlines)return;`; delete the line `        else setExpandedPhoto(value=>!value);` (leave `if (hit) setSelection({ item: hit, key: Date.now() });`). `npx tsc --noEmit` must report no remaining `expandedPhoto`.

**Blast radius.** The detail photo on phone and desktop, outline masks, the draw-a-box editor (`point()` uses the same math), tap-to-select. A tall photo on a phone is limited to 80% of the viewport height and letterboxed (masks follow because they use the measured box). Items without a photo, drink and card slides keep their square. **Done (one page look, contract "The page look"; no images stored, no Playwright):** on a local production build, open a portrait (0.75), square and landscape (1.33) meal on a 390x844 viewport and a 1280x800 desktop dialog: the whole photo is visible with nothing cut off, outline masks sit on the same food parts, and tapping an outline still opens its editor. Record the measured frame and photo sizes in `docs/run13-report.md` (the issue's "observe first").

## 4. A barcode lookup that fails says so, not "Not in the database" (Lane D): #451

1. `src/lib/fdc/open-food-facts.ts` (re-count): replace `      if (!response.ok) return null;` with `      if (!response.ok) throw new Error(\`open food facts: lookup failed with ${response.status}\`);`.
2. `src/lib/fdc/barcode-resolver.ts`: replace `if (!base) { try { base = await lookupOpenFoodFacts(gtin); } catch { base = null; } }` with `if (!base) { try { base = await lookupOpenFoodFacts(gtin); } catch (error) { if (!(own?.source === "label" && own.per_100)) throw error; } }`. A thrown error becomes the route's existing 502 "Barcode lookup is temporarily unavailable." and the sheet's existing "Try again" state; only a real 404 reaches "Not in the database".
3. `tests/open-food-facts.test.mjs`: add a test that stubs `globalThis.fetch` for `lookupOpenFoodFacts('7622300761363')` to return status 500 and expects a rejection, and status 404 for every candidate expects `null`.

**Blast radius.** Barcode scans only; a product OFF lacks still shows "Not in the database". An OFF outage now shows "temporarily unavailable". **Done:** the test passes. The owner's check remains: scan the Oreo (7 622300 76136 3) and a second pack on the three phones (#379). Report in `docs/run13-report.md` which source answered, from `model_calls` (`select request_text,error,started_at from model_calls where kind='fdc' and request_text like '%open_food_facts%' order by started_at desc`), and that before #480 the lookup asked USDA FDC Branded only, which holds US packs (F6).

## 5. A readable label with no printed serving weight is not "no label" (Lane E): #452

1. `src/lib/prompts/spark/label.ts`: find `If the table states only per 100 g or per 100 ml, set serving to 100 with that unit and transcribe the per-100 amounts.` (count 1; if Fleet 12 PR #530 has merged, the sentence continues; keep what follows) and insert directly after the period: ` If the serving is given only as a count ("1 bungkus", "1 pack", "1 piece") and a weight or volume for that serving or the whole pack is printed anywhere on the label, use that weight or volume as the serving. If no weight or volume is printed for the serving, set serving to null but still transcribe the per-serving amounts.`
2. `src/components/CaptureSheet.tsx`: replace `if(!result.reading.is_label||!result.reading.serving||!result.reading.per_serving){setLabelState("missing");return;}` with `if(!result.reading.is_label||!result.reading.per_serving){setLabelState("missing");return;}\n      if(!result.reading.serving){setLabelState("noServing");return;}`; replace `useState<"idle"|"reading"|"read"|"missing"|"failed">("idle")` with `useState<"idle"|"reading"|"read"|"missing"|"noServing"|"failed">("idle")`; replace `labelState==="missing"||labelState==="failed"?<>` with `labelState==="missing"||labelState==="noServing"||labelState==="failed"?<>`; replace `{labelState==="failed"?"The label could not be read. Try again.":"No nutrition label found"}` with `{labelState==="failed"?"The label could not be read. Try again.":labelState==="noServing"?"The serving size is not printed on this label":"No nutrition label found"}`.
3. Real-provider check, `scripts/real-label-smoke.mjs` (the real-label gate): run it on the three existing fixtures and the Fleet 12 synthetic per-100 case; record results in `docs/run13-report.md`. The Goldfish photo itself is the owner's (P3).

**Blast radius.** Label reads only. A label with a serving weight is unchanged. **Done:** the smoke results are recorded; a label with numbers but no serving weight says "The serving size is not printed on this label" with the same two exits ("Take the photo again", "Type it instead").

## 6. Coverage of every pasted issue (checked `gh pr list` and `gh issue view` this session)

States as of this check; "Fleet 12 item n" is in `docs/plan-run12.md`.

| Issue | Where it is handled |
|---|---|
| #523, #524, #525 | This plan, items 1-3 |
| #451 | Item 4; PR #480 merged earlier; owner phones remain |
| #452 | Item 5, plus Fleet 12 item 14 (PR #530) for per-100 layouts; owner phones remain |
| #509 | Fleet 12 item 14 (PR #530) |
| #510 | Fleet 12 item 15 (PR #531) |
| #468, #473 | Fleet 12 item 1 (PR #526) |
| #469, #470 | Fleet 12 item 2 (PR #504) |
| #370 | Fleet 12 item 3 (PR #505) |
| #222 | Fleet 12 items 4, 5, 9, 11, 12; phones remain |
| #281, #521 | Fleet 12 items 6 (PR #507), 10 |
| #294 | Fleet 12 item 7 |
| #348, #351 | Fleet 12 item 8 (PR #527) |
| #494, #495, #496, #497 | Fleet 12 item 10; #494 stays open for the owner's iPhone |
| #498 | Fleet 12 item 9 (merged #503) |
| #520 | Fleet 12 item 11 (PR #528) |
| #519 | Fleet 12 item 12 (PR #529) |
| #508, #518, #522, #449 | Fleet 12 item 13 |
| #511 | Fleet 12 item 16 |
| #512, #517, #454 | Fleet 12 item 17 |
| #513, #515, #456, #457 | Fleet 12 item 18 |
| #471 | Fleet 12 item 19 |
| #514 | Fleet 12 item 20 |
| #322 | Fleet 12 item 21 (cold-start header only; a production cold timing stays open) |
| #516 | Fleet 12 item 22 |
| #373, #375, #323, #324 | Fleet 12 item 27 measurements |
| #499 | Fleet 12 records the premise as false (`export const instant` is read by Next under `cacheComponents`); keep |
| #368 | The probe is withdrawn by the owner; nothing built |
| #377 | Verified in production this session (two cola posts have intake rows); owner accounts remain |
| #372, #306, #455, #458, #453 | Merged work (PRs #485, #483, #479, #491); owner phone checks (#379) |

## 7. Closures and the report

- Close after the PR merges and the stated check passes: #524.
- Comment with commit-pinned evidence, leave open: #523 (until the owner's macaroni re-analysis), #525 (until the owner sees it on a phone), #451, #452.
- `docs/run13-report.md`: items 1-5 done or not done, each PR with its reviewed head, receipt kind and merge commit, P1-P5 outcomes, the 94-item split by account, the F6 source answer, and one line per anything noticed and left unfixed. **List every backlog issue this run created** (standing instruction from the PM memory rule), or state that none were created.
- Docs-only changes (this report) go on one docs branch and need no review.

## Cleanup and exit

Remove each worktree and local branch once its PR is pushed; delete each remote branch after its merge; stop local servers and the disposable stack; run `scripts/cleanup.sh`; only the main checkout remains with its untracked files (`docs/reviews/mfa-pplx-pr311-e7ece5c.md`) as found. The run ends.

---

## For the owner (read from the bottom)

**Functionality this plan removes**
- Tapping the detail photo to expand it (it is whole already).

**Behaviour this plan changes (default the plan takes)**
- A food with no exact USDA record shows numbers from the closest generic USDA record, named in the meal's first comment. These count in day totals. A food with no close record stays "unavailable". **No model-made estimate is built** (you have not ruled on it); say so if you want it added.
- The detail photo shows whole, letterboxed, never cropped; masks and the outline editor follow it.
- A barcode lookup that fails because Open Food Facts is down says "temporarily unavailable" instead of "Not in the database".
- A label whose serving weight is not printed says so instead of "No nutrition label found".
- Sugar shows when USDA holds it as Sugars, Total (six old rows are backfilled by migration 0050).

**Places where the design and the product's function disagree**
- The Round 3 frames fix the detail photo at 230 px, cropped to fill. Default: the owner's request wins; the frames are out of date for this screen.
- The label for a "closest record" lives in the meal's first comment and the model trace, not in the nutrition table (that would need a new column and changes to six database functions). Default: comment only.
- A closest-record meal is re-resolved on every re-analysis (never reused as "trusted"), so it costs one extra USDA search and one extra model call each time. Default: accepted.

**Yours, outside this plan**
- Re-analyse the macaroni post and say whether the closest-record numbers are acceptable.
- Scan the Oreo and a second pack, and photograph the Goldfish label, on the three phones (#379).
- Say when recording starts and when it is over (the recording hold stops merges and migrations).