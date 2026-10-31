import {ioError,isRetriable} from "@/lib/worker/errors";
import type {SupabaseClient} from "@supabase/supabase-js";
import {confirmSameMeal} from "@/lib/meta/same-meal";
import {priorNutritionTrusted} from "./prior-nutrition";
import {loadFirstPhoto, type NamedPost} from "./analyze";
// Preserve the planned relative weights, normalized over available signals.
// Missing caption/photo/location must not penalize supported photo-only meals.
export const PRIOR = {textWeight:0.5,photoWeight:0.3,placeWeight:0.2,placeMetres:150,copyThreshold:0.85,hintThreshold:0.55} as const;
export function priorScore(row: { text_score: number | null; photo_score: number | null; distance_m: number | null }): number {
  const signals = [[row.text_score, PRIOR.textWeight], [row.photo_score, PRIOR.photoWeight],
    [row.distance_m === null ? null : row.distance_m <= PRIOR.placeMetres ? 1 : 0, PRIOR.placeWeight]];
  let score = 0, weight = 0;
  for (const [value, importance] of signals) {
    if (value === null || importance === null) continue;
    score += value * importance; weight += importance;
  }
  return weight ? score / weight : 0;
}
export async function findPrior(admin:SupabaseClient,postId:string):Promise<{hint:string; named?:NamedPost; nutrition?:Record<string,unknown>[]}|null> {
  const {data,error,status}=await admin.rpc("meal_prior_candidates",{p_post_id:postId});
  if(error) throw ioError(`Meal prior lookup failed: ${error.message}`,error,status);
  const candidates=(data??[]).map((row:{post_id:string;text_score:number|null;photo_score:number|null;distance_m:number|null})=>({...row,
    score:priorScore(row)})).sort((a:{score:number},b:{score:number})=>b.score-a.score);
  // A ready meal can have no current items (the user removed them all). Skip such candidates and
  // take the best of the next few that still have a usable analysis.
  let best: (typeof candidates)[number] | undefined;
  let items: { id: string; name: string; portion_text: string | null; portion_grams: number | null; confidence: number | null; item_nutrition: unknown }[] | null = null;
  for(const candidate of candidates.filter((row:{score:number})=>row.score>=PRIOR.hintThreshold).slice(0,3)){
    const {data:rows,error:itemError,status:itemStatus}=await admin.from("post_items").select("id,name,portion_text,portion_grams,confidence,item_nutrition(*)").eq("post_id",candidate.post_id).is("superseded_at",null).order("created_at");
    if(itemError) throw ioError(itemError.message,itemError,itemStatus);
    if(rows?.length){best=candidate;items=rows;break;}
  }
  if(!best||!items) return null;
  // Historical reference only: the current caption and photo always win, and a changed caption (for
  // example "two bowls") changes the portion. Never an instruction to repeat the earlier amounts.
  const hint=`Historical reference only (unconfirmed): this user logged this meal before as: ${items.map(item=>`${item.name}, ${item.portion_grams??"unknown"} g`).join("; ")}. Use these names or portions only when the current caption and photo support them. A changed caption takes precedence; never assume the previous portion.`;
  if(best.score<PRIOR.copyThreshold) return {hint};
  const {data:decisions,error:traceError,status:traceStatus}=await admin.from("model_calls")
    .select("request_text,response_text,fdc_id,error,started_at").eq("post_id",best.post_id).eq("kind","fdc").order("started_at",{ascending:false}).limit(200);
  if(traceError) throw ioError("Prior nutrition provenance could not be read.",traceError,traceStatus);
  if(!priorNutritionTrusted(items,decisions??[])) return {hint};
  const {data:post,error:postError,status:postStatus}=await admin.from("posts").select("user_id,caption").eq("id",postId).single();
  if(postError) throw ioError(postError.message,postError,postStatus);
  const {data:past,error:pastError,status:pastStatus}=await admin.from("posts").select("caption").eq("id",best.post_id).eq("user_id",post.user_id).single();
  if(pastError) throw ioError(pastError.message,pastError,pastStatus);
  let photos;
  try {photos=await Promise.all([loadFirstPhoto(admin,postId),loadFirstPhoto(admin,best.post_id)]);}
  catch(error) {
    // A missing or unreadable photo is expected (caption-only meals) and leaves the neutral hint; a
    // retryable database or transport failure must reach the worker's retry handling instead.
    if(isRetriable(error)) throw error;
    return {hint};
  }
  const confirmed=await confirmSameMeal(photos.map(photo=>photo.bytes),{prior:hint,currentCaption:post.caption,pastCaption:past.caption});
  if(!confirmed) return {hint:""};
  const nutrition=items.map(item=>{const row=Array.isArray(item.item_nutrition)?item.item_nutrition[0]:item.item_nutrition;return row??{};});
  return {hint,nutrition,named:{postId,userId:post.user_id,photoWidth:photos[0].width,photoHeight:photos[0].height,regions:[],
    captionOnly:items.map(item=>({name:item.name,portionText:item.portion_text,portionGrams:item.portion_grams,confidence:item.confidence,regionIndex:null})),
    summary:items.map(item=>`${item.name} ${item.portion_grams??""} g`).join(" · ")}};
}
