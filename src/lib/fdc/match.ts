import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods, type FdcFood } from "./client";
import { gramBasis, hasNutrition } from "./nutrients";
import { createResponse, MetaApiError } from "@/lib/meta/client";
import { recordCall } from "@/lib/trace/record";
import { nutritionBudgetMs, NUTRITION_MAX_MS } from "@/lib/worker/budget";
import { FOOD_MATCH_VERSION } from "./version";

export const NUTRITION_RESOLUTION_MS = NUTRITION_MAX_MS;
export const nutritionResolutionBudget = () => AbortSignal.timeout(nutritionBudgetMs());

export type MatchChoice = { id: number | null; query: string | null; query_food?: string | null; reason: string };
export type MatchDependencies = { search: (query: string) => Promise<FdcFood[]>; choose: (name: string, caption: string, foods: FdcFood[], retry: boolean, currentQuery: string) => Promise<MatchChoice> };

const MATCH_INSTRUCTIONS = `Select a USDA nutrition reference for the ONE target food and its preparation. The caption supplies context; other foods in it are not part of this item's search or portion.
Prefer a compatible generic Foundation, Survey (FNDDS), or SR Legacy record. These are food references, not exact recipe or origin certificates: a collection setting such as restaurant and unspecified variety alone do not disqualify an otherwise compatible reference. A geographic descriptor can be omitted ONLY when the record is the same generic food and preparation; it cannot justify choosing a different regional recipe that merely shares ingredients. A generic or NFS whole-dish record is acceptable only as a broader version of the target, with compatible known ingredients, cooking process and physical form (mixed versus assembled, raw versus cooked, and coated versus uncoated matter); state that it is a generic reference in the reason. Do not require the culinary name to appear verbatim.
Branded data is a fallback for the same plain food/preparation when no compatible generic record exists. Do not require a brand merely because a record was collected in a restaurant; reject identifiable proprietary recipes or extra ingredients not supported by the meal.
Reject a different food category, a different named species, incompatible preparation, a condiment in place of its dish, or an isolated topping in place of a compound dish. Prefer a whole-dish reference that includes its main components. Do not treat ingredient overlap as recipe compatibility. A combination of different foods cannot be represented by just one member applied to the entire combined portion. Never invent nutrients or assume a mass-to-volume density. Return null if all candidates are incompatible.
On first rejection, propose ONE distinct, short English search for the target food alone. Translate culinary names into the base food and preparation used in USDA records; omit portion adjectives, geographic descriptors and other meal foods. USDA uses 'coated' for batter/breading: retain the coating and cooking process rather than searching only the bare ingredient. Use the rejected candidate descriptions and categories to diagnose the retrieval failure. If a culinary subtype retrieves only other foods or incompatible compound recipes, search its broader compatible food category with the target preparation instead; the database may index the plain food under that category rather than the subtype. Do not merely remove the preparation and repeat the same subtype noun that dominates the rejected results. The new query must differ from current_query. Also return query_food: the ONE English food-category noun in that query that every hit must contain. For an assembled or mixed dish, require the WHOLE-DISH category, not an isolated filling, topping or ingredient; otherwise the search can never retrieve an appropriate whole-dish reference. For a prepared single ingredient use its base food noun. Do not require a cooking process, geographic descriptor or untranslated culinary word. On retry return no further query.
Return only an id from the supplied candidates or null, a new query or null, query_food (null when query is null), and a specific reason.`;

// Item names are food text, not USDA query syntax. Model punctuation must not
// turn an otherwise valid item into an unmatched-parenthesis HTTP 400.
export function foodSearchQuery(value: string): string {
  return value.replace(/\b(breaded|battered|breading)\b/gi,"coated").replace(/[^\p{L}\p{N}\s]/gu," ").replace(/\s+/g," ").trim().slice(0,240);
}

export function requiredFoodSearchQuery(value: string, food: string): string {
  const query=foodSearchQuery(value),required=foodSearchQuery(food).toLowerCase();
  const words=query.split(" ");
  if(!required||required.includes(" ")||!words.some(word=>word.toLowerCase()===required))throw new MetaApiError(502,"Food search omitted its required food term.");
  return words.map(word=>word.toLowerCase()===required?`+${word}`:word).join(" ");
}

// Spark counts internal reasoning against max_output_tokens, before emitting schema JSON.
// Thirty-candidate real decisions frequently need 2–4K reasoning tokens.
// Start at 4096 to avoid paying for a truncated 2048 call before escalating.
const MATCH_OUTPUT_TOKENS = [4096, 8192] as const;

async function choose(name: string, caption: string, foods: FdcFood[], retry: boolean, signal?:AbortSignal, currentQuery = name): Promise<MatchChoice> {
  let result: Awaited<ReturnType<typeof createResponse>> | undefined;
  for (const maxOutputTokens of MATCH_OUTPUT_TOKENS) {
    if (signal?.aborted) throw new MetaApiError(503,"Food resolution budget was exhausted.");
    result = await createResponse({model:"muse-spark-1.3",instructions:MATCH_INSTRUCTIONS,input:[{role:"user",content:[{type:"input_text",text:JSON.stringify({name,caption,retry,current_query:currentQuery,candidates:foods.map(f=>({id:f.fdcId,description:f.description,dataType:f.dataType,category:f.foodCategory,brand:f.brandOwner,unit:f.servingSizeUnit??"g"}))})}]}],text:{format:{type:"json_schema",name:"search_query",strict:true,schema:{type:"object",additionalProperties:false,properties:{id:{type:["integer","null"]},query:{type:["string","null"]},query_food:{type:["string","null"],description:"Whole-dish category for an assembled or mixed food, otherwise its base food; one English word present in query, or null when query is null"},reason:{type:"string"}},required:["id","query","query_food","reason"]}}},max_output_tokens:maxOutputTokens},{signal});
    if (result.status!=="incomplete" || result.refusal) break;
  }
  if(!result||result.status!=="completed"||!result.outputText||result.refusal)throw new MetaApiError(502,"Food match decision did not complete.");
  let parsed:unknown;
  try { parsed=JSON.parse(result.outputText); } catch { throw new MetaApiError(502,"Food match decision was invalid."); }
  if(typeof parsed!=="object"||parsed===null||Array.isArray(parsed))throw new MetaApiError(502,"Food match decision was invalid.");
  const value=parsed as MatchChoice;
  if((value.id!==null&&(!Number.isSafeInteger(value.id)||!foods.some(f=>f.fdcId===value.id)))||(value.query!==null&&typeof value.query!=="string")||typeof value.reason!=="string")throw new MetaApiError(502,"Food match decision was invalid.");
  if(value.query!==null){if(typeof value.query_food!=="string")throw new MetaApiError(502,"Food search omitted its required food term.");requiredFoodSearchQuery(value.query,value.query_food);}
  return value;
}

// At most two searches. A valid rejection stays unknown; provider errors remain retryable errors.
export async function matchFood(name: string, caption: string, dependencies: MatchDependencies, signal?:AbortSignal): Promise<{food:FdcFood|null; reason:string; searches:number}> {
  let query=foodSearchQuery(name);
  if(!query)return {food:null,reason:"The item has no searchable food name.",searches:0};
  for(let attempt=0;attempt<2;attempt++){
    if(signal?.aborted)throw new MetaApiError(503,"Food resolution budget was exhausted.");
    const candidates=(await dependencies.search(query)).filter(f=>gramBasis(f)&&hasNutrition(f));
    const decision=await dependencies.choose(name,caption,candidates,attempt===1,query);
    const food=decision.id===null?null:candidates.find(f=>f.fdcId===decision.id)??null;
    if(decision.id!==null&&!food)throw new Error("Food decision selected an ineligible candidate.");
    if(food)return {food,reason:decision.reason,searches:attempt+1};
    const improved=decision.query?(decision.query_food?requiredFoodSearchQuery(decision.query,decision.query_food):foodSearchQuery(decision.query)):null;
    if(attempt===1||!improved||improved.toLowerCase()===query.toLowerCase())return {food:null,reason:decision.reason,searches:attempt+1};
    query=improved;
  }
  throw new Error("Unreachable match state.");
}

export async function resolveFoodMatch(admin:SupabaseClient,name:string,caption="",signal:AbortSignal=nutritionResolutionBudget()):Promise<FdcFood|null>{
  try {
    const result=await recordCall("fdc",{event:"food_resolution",name,matcherVersion:FOOD_MATCH_VERSION},()=>matchFood(name,caption,{search:query=>searchFoods(admin,query,signal),choose:(item,context,foods,retry,query)=>choose(item,context,foods,retry,signal,query)},signal),r=>({text:{source:r.food?"selected":"unavailable",reason:r.reason,searches:r.searches},fdcId:r.food?.fdcId??null}));
    return result.food;
  } catch(error) {
    if(signal.aborted)throw new MetaApiError(503,"Food resolution budget was exhausted.");
    throw error;
  }
}

export async function traceNutritionReuse<T extends {source_ref?:unknown;matcher_version?:unknown}>(name:string,nutrition:T,source:string,sourceItem?:string){
  await recordCall("fdc",{event:"nutrition_reuse",name,source,sourceItem:sourceItem??null,...(source==="copied"&&nutrition.matcher_version===FOOD_MATCH_VERSION?{matcherVersion:FOOD_MATCH_VERSION}:{})},async()=>nutrition,n=>({text:{source,source_ref:n.source_ref??null},fdcId:Number(n.source_ref)||null}));
}
