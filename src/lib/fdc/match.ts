import type { SupabaseClient } from "@supabase/supabase-js";
import { searchFoods, type FdcFood } from "./client";
import { gramBasis, hasNutrition } from "./nutrients";
import { createResponse, MetaApiError } from "@/lib/meta/client";
import { recordCall } from "@/lib/trace/record";

export type MatchChoice = { id: number | null; query: string | null; reason: string };
export type MatchDependencies = { search: (query: string) => Promise<FdcFood[]>; choose: (name: string, caption: string, foods: FdcFood[], retry: boolean) => Promise<MatchChoice> };

async function choose(name: string, caption: string, foods: FdcFood[], retry: boolean): Promise<MatchChoice> {
  const result = await createResponse({model:"muse-spark-1.3",instructions:"Select the USDA record for the actual food identity and preparation, not a shared adjective or country name. Select null when every candidate is wrong. Reject incompatible food categories, processing and preparation; do not substitute restaurant-specific or branded preparations unless the caption identifies them. Do not guess nutrition. On the first rejection propose one improved English food search using the item and caption; on retry propose no further query. Return only an id from the supplied candidates or null.",input:[{role:"user",content:[{type:"input_text",text:JSON.stringify({name,caption,retry,candidates:foods.map(f=>({id:f.fdcId,description:f.description,dataType:f.dataType,unit:f.servingSizeUnit??"g"}))})}]}],text:{format:{type:"json_schema",name:"search_query",strict:true,schema:{type:"object",additionalProperties:false,properties:{id:{type:["integer","null"]},query:{type:["string","null"]},reason:{type:"string"}},required:["id","query","reason"]}}},max_output_tokens:256});
  if(result.status!=="completed"||!result.outputText||result.refusal)throw new MetaApiError(502,"Food match decision did not complete.");
  const value=JSON.parse(result.outputText) as MatchChoice;
  if((value.id!==null&&(!Number.isSafeInteger(value.id)||!foods.some(f=>f.fdcId===value.id)))||(value.query!==null&&typeof value.query!=="string")||typeof value.reason!=="string")throw new MetaApiError(502,"Food match decision was invalid.");
  return value;
}

// At most two searches. A valid rejection stays unknown; provider errors remain retryable errors.
export async function matchFood(name: string, caption: string, dependencies: MatchDependencies): Promise<{food:FdcFood|null; reason:string; searches:number}> {
  let query=name.trim();
  for(let attempt=0;attempt<2;attempt++){
    const candidates=(await dependencies.search(query)).filter(f=>gramBasis(f)&&hasNutrition(f));
    const decision=await dependencies.choose(name,caption,candidates,attempt===1);
    const food=decision.id===null?null:candidates.find(f=>f.fdcId===decision.id)??null;
    if(decision.id!==null&&!food)throw new Error("Food decision selected an ineligible candidate.");
    if(food)return {food,reason:decision.reason,searches:attempt+1};
    const improved=decision.query?.trim().slice(0,240);
    if(attempt===1||!improved||improved.toLowerCase()===query.toLowerCase())return {food:null,reason:decision.reason,searches:attempt+1};
    query=improved;
  }
  throw new Error("Unreachable match state.");
}

export async function resolveFoodMatch(admin:SupabaseClient,name:string,caption=""):Promise<FdcFood|null>{
  const result=await recordCall("fdc",{event:"food_resolution",name},()=>matchFood(name,caption,{search:query=>searchFoods(admin,query),choose}),r=>({text:{source:r.food?"selected":"unavailable",reason:r.reason,searches:r.searches},fdcId:r.food?.fdcId??null}));
  return result.food;
}

export async function traceNutritionReuse<T extends {source_ref?:unknown}>(name:string,nutrition:T,source:string,sourceItem?:string){
  await recordCall("fdc",{event:"nutrition_reuse",name,source,sourceItem:sourceItem??null},async()=>nutrition,n=>({text:{source,source_ref:n.source_ref??null},fdcId:Number(n.source_ref)||null}));
}
