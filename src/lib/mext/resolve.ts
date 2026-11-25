import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createResponse,MetaApiError} from '../meta/client';
import {recordCall} from '../trace/record';
import {resolveFoodMatchDetailed,nutritionResolutionBudget} from '../fdc/match';
import {scaleNutrition} from '../fdc/nutrients';
import type {UnavailableReason} from '../fdc/unavailable';
import {FOOD_MATCH_VERSION} from '../fdc/version';
import {matchMext,type MextDecision,type NutritionReference,type SourceContext} from './match';
import {searchMextFoods} from './client';
import {mextSourceRef,type MextRecord} from './record';
import {scaleMextNutrition} from './nutrients';

async function chooseMext(name:string,caption:string,candidates:MextRecord[],signal:AbortSignal):Promise<MextDecision>{
 const response=await createResponse({model:'muse-spark-1.3',reasoning:{effort:'low'},
  instructions:'Select one MEXT reference for the one target food and its preparation. Candidates contain official English names whose identity is proved against the current Japanese table. Do not translate or invent a name or nutrient. Require the same food, species, components, cooking process and physical form. A single ingredient cannot represent a compound dish. Choose null if none is compatible. A broader compatible reference must be marked closest; explain the specific difference. Return only a supplied foodNumber or null, closest, and reason.',
  input:[{role:'user',content:[{type:'input_text',text:JSON.stringify({name,caption,candidates:candidates.map(food=>({foodNumber:food.foodNumber,nameEn:food.nameEn,nameJa:food.nameJa,group:food.foodGroup}))})}]}],
  text:{format:{type:'json_schema',name:'mext_reference',strict:true,schema:{type:'object',additionalProperties:false,properties:{foodNumber:{type:['string','null']},closest:{type:'boolean'},reason:{type:'string'}},required:['foodNumber','closest','reason']}}},max_output_tokens:4096},{signal});
 if(response.status!=='completed'||response.refusal||!response.outputText)throw new MetaApiError(502,'MEXT match decision did not complete.');
 let choice:unknown;try{choice=JSON.parse(response.outputText);}catch{throw new MetaApiError(502,'MEXT match decision is invalid.');}
 if(!choice||typeof choice!=='object'||!('foodNumber'in choice)||!(choice.foodNumber===null||typeof choice.foodNumber==='string')||!('closest'in choice)||typeof choice.closest!=='boolean'||!('reason'in choice)||typeof choice.reason!=='string')throw new MetaApiError(502,'MEXT match decision is invalid.');
 return choice as MextDecision;
}
export async function resolveFoodReference(admin:SupabaseClient,name:string,context:SourceContext,caption='',signal:AbortSignal=nutritionResolutionBudget(),options:{approximate?:boolean}={}):Promise<{reference:NutritionReference|null;unavailable:UnavailableReason|null}>{
 const mext=await matchMext(name,caption,context,{search:(ja,en)=>searchMextFoods(admin,ja,en,signal),choose:(n,c,foods)=>chooseMext(n,c,foods,signal)});
 if(mext.food){
  const food=mext.food;
  await recordCall('mext',{event:'food_resolution',name,matcherVersion:FOOD_MATCH_VERSION},async()=>food,
   selected=>({text:{source:'selected'},referenceRef:mextSourceRef(selected.foodNumber)}),{model:null,host:'postgres'});
  return {reference:{source:'mext',food},unavailable:null};
 }
 const result=await resolveFoodMatchDetailed(admin,name,caption,signal,{...options,...(mext.step?{sourceSteps:[mext.step]}:{})});
 return {reference:result.food?{source:'usda',food:result.food}:null,unavailable:result.unavailable};
}
export function scaleFoodReference(reference:NutritionReference|null,grams:number|null,unavailable:UnavailableReason|null){
 return reference?.source==='mext'?scaleMextNutrition(reference.food,grams):scaleNutrition(reference?.food??null,grams,unavailable);
}
