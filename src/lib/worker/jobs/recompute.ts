import { approximationLabels } from "@/lib/fdc/approximation-metadata";
import { nutritionUnavailable } from "@/lib/nutrition/available";
import { resolvePortionNutrition } from "@/lib/nutrition/portion";
import { ioError } from "@/lib/worker/errors";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobRow } from "@/lib/queue/claim";
import { resolveNutritionItems } from "@/lib/fdc/resolve-items";
import { resolveFoodMatchDetailed, traceNutritionReuse, nutritionResolutionBudget } from "@/lib/fdc/match";
import { scaleNutrition } from "@/lib/fdc/nutrients";
import { markReady } from "@/lib/pipeline/persist";
import { toNumber, type CurrentItem, type NutritionLike, type StoredNutrient } from "@/lib/nutrition/totals";

export default async function recompute(admin: SupabaseClient, job: JobRow): Promise<void> {
  if (!job.post_id) throw new Error("recompute: post is required.");
  if(job.payload.reason==='media_removed'||job.payload.reason==='correction_reverted'){await rebuildRemoved(admin,job);return;}
  if (job.payload.reason === "drink_sync") {
    // Copies already hold exact nutrition. This durable repair must not resolve
    // food again, send another push, or save another meal.
    await markReady(job.post_id, admin, job.id, { notify: false, saveMeal: false });
    return;
  }
  const { data: items, error, status: itemsStatus } = await admin.from("current_post_items")
    .select("id,name,portion_grams,portion_text,supersedes").eq("post_id", job.post_id);
  if (error) throw ioError(`recompute items: ${error.message}`, error, itemsStatus);
 const resolutionBudget=nutritionResolutionBudget();
  const {data:context,error:contextError,status:contextStatus}=await admin.from("posts").select("caption").eq("id",job.post_id).abortSignal(resolutionBudget).single();
  if(contextError)throw ioError("Recompute context could not be read.",contextError,resolutionBudget.aborted?503:contextStatus);
  if (items?.length) {
    const { data: existing, error: nutritionError, status: nutritionStatus } = await admin.from("item_nutrition")
      .select("post_item_id,source_ref,calories,protein_g,carbs_g,fat_g").in("post_item_id", items.map((item) => item.id)).abortSignal(resolutionBudget);
    if (nutritionError) throw ioError(`recompute nutrition: ${nutritionError.message}`, nutritionError, nutritionStatus);
    const complete = new Map((existing ?? []).map((row) => [row.post_item_id,row]));
    const resolved = await resolveNutritionItems(items,resolutionBudget,async (item,_index,signal) => {
      const prior = complete.get(item.id);
      if (prior && !nutritionUnavailable(prior)) {
        await traceNutritionReuse(item.name,prior,"existing_item",item.id);
        return null;
      }
      // Resolve all item data before issuing the one atomic nutrition write.
      const retained = await resolvePortionNutrition(admin, job.post_id!, item.supersedes, item.name, item.portion_grams, item.portion_text,signal);
      if (retained && !nutritionUnavailable(retained)) return {...retained,post_item_id:item.id};
      const match = await resolveFoodMatchDetailed(admin,item.name,context.caption??"",signal,{approximate:true});
      const n = scaleNutrition(match.food, item.portion_grams == null ? null : toNumber(item.portion_grams), match.unavailable);
      return {
        post_item_id: item.id, calories: n.calories, protein_g: n.proteinG,
        carbs_g: n.carbsG, fat_g: n.fatG, fibre_g: n.fibreG, sugar_g: n.sugarG,
        sodium_mg: n.sodiumMg, micronutrients: n.micronutrients, source_ref: n.sourceRef, food_category: n.foodCategory ?? null,
      };
    });
    const writes=resolved.filter(row=>row!==null);
    if(writes.length){
      const {error:writeError,status:writeStatus}=await admin.from("item_nutrition")
        .upsert(writes,{onConflict:"post_item_id",ignoreDuplicates:true});
      if(writeError)throw ioError(`recompute save: ${writeError.message}`,writeError,writeStatus);
    }
  }
  {
    const {getCurrentItems,sumNutrition}=await import('@/lib/nutrition/totals');
    const {safeSummary}=await import('@/lib/pipeline/wording');
    const current=await getCurrentItems(admin,job.post_id,{requireNutrition:true});
    const labels=approximationLabels(current);
    const body=await safeSummary('',sumNutrition(current),labels,current.map(item=>({name:item.name,sourceRef:item.source_ref})));
    // Post lock, job ownership and current source refs are rechecked together.
    const {error:summaryError,status:summaryStatus}=await admin.rpc('refresh_owned_approximation_summary',{
      p_post_id:job.post_id,p_job_id:job.id,p_summary:body,
      p_expected:current.map(item=>({id:item.id,source_ref:item.source_ref})),
    });
    if(summaryError)throw ioError('Nutrition summary could not be saved.',summaryError,summaryStatus);
  }
  await markReady(job.post_id, admin,job.id);
}


async function rebuildRemoved(admin:SupabaseClient,job:JobRow){
 const postId=job.post_id!;
 if(job.payload.removal_rebuilt===true){await markReady(postId,admin,job.id);return;}
 // Import dynamically: ordinary corrections can use recompute to repair missing
 // nutrition, while removal replay shares the exact correction implementation.
 const {replayCorrection}=await import('./correct');
 const {replayRemainder}=await import('./remainder');
 const {readPostComments}=await import('@/lib/posts/timeline');
 const {getCurrentItems,normalizeStoredNutrition,formatConsumed,sumNutrition}=await import('@/lib/nutrition/totals');
 const {checkWording}=await import('@/lib/pipeline/wording-check');
 const current=await getCurrentItems(admin,postId,{requireNutrition:true});
 const {data:original,error:originalError,status:originalStatus}=await admin.from('post_items').select('*,item_nutrition(*)').eq('post_id',postId).eq('source','model').order('created_at').order('id');
 if(originalError)throw ioError('Original meal could not be read.',originalError,originalStatus);
 // Initial analysis inserts all its items in one transaction. Later model
 // revisions share source=model, so use the earliest revision timestamp.
 const thread=await readPostComments(admin,postId);
 const first=thread.find(comment=>comment.author==='model')?.created_at??original?.[0]?.created_at;
 if(!first&&current.length)throw Error('Original meal revision is unavailable.');
 let items:import('@/lib/nutrition/totals').CurrentItem[]=(original??[]).filter(row=>row.created_at===first).map(row=>{
  const nutrition=Array.isArray(row.item_nutrition)?row.item_nutrition[0]:row.item_nutrition;
  if(!nutrition)throw Error('Original meal nutrition is unavailable.');
  return {...row,...normalizeStoredNutrition(nutrition,row.portion_grams),id:row.id,not_eaten_grams:null,not_eaten_calories:null,not_eaten_count_text:null};
 });
 const comments=thread.filter(row=>row.author==='user'&&!row.reverted_at);
 const {data:photos,error:photoError,status:photoStatus}=await admin.from('post_media').select('id,storage_path').eq('post_id',postId).eq('kind','photo').eq('not_eaten',true).order('position').order('id');
 if(photoError)throw ioError('Leftovers photos could not be read.',photoError,photoStatus);
 const {data:post,error:postError}=await admin.from('posts').select('user_id').eq('id',postId).single();
 if(postError)throw ioError('Meal owner could not be read.',postError);
 const {isOwnedPhotoPath}=await import('@/lib/media/paths');
 type RebuiltRow=Pick<CurrentItem,'name'|'portion_text'|'portion_grams'|'box'|'mask_path'> & Partial<Pick<CurrentItem,'gtin'|'not_eaten_grams'|'not_eaten_calories'|'count_text'|'not_eaten_count_text'>> & {supersedes?:string|null;nutrition:NutritionLike & {micronutrients:StoredNutrient[];source_ref:string|null}};
 let rows:RebuiltRow[]=items.map(item=>({...item,nutrition:{...item}}));
 const install=(next:RebuiltRow[])=>{rows=next;items=next.map(row=>({...row,...row.nutrition,id:typeof row.supersedes==='string'?row.supersedes:crypto.randomUUID(),source:'model' as const,name:row.name,portion_text:row.portion_text??null,portion_grams:row.portion_grams??null,box:row.box??null,mask_path:row.mask_path??null,micronutrients:row.nutrition.micronutrients??[],source_ref:row.nutrition.source_ref??null}));};
 for(const [index,comment] of comments.entries()){
  const result=await replayCorrection(admin,postId,items,[comment],comments.slice(0,index),false,true);
  if(result.result.needs_input)throw Error('The remaining correction needs clarification before the meal can be rebuilt.');
  install(result.rows as unknown as RebuiltRow[]);
 }
 for(const photo of photos??[]){
  if(!isOwnedPhotoPath(photo.storage_path,post.user_id,postId))throw Error('Leftovers photo does not belong to this meal.');
  install(await replayRemainder(admin,photo.storage_path,items) as unknown as RebuiltRow[]);
 }
 const labels=approximationLabels(items);
 const summary=[formatConsumed(sumNutrition(items)),...labels.map(label=>label.kind==='estimate'?`Nutrition for ${label.name} is a model estimate, ${label.basis}`:`Nutrition for ${label.name} is taken from the closest USDA record, ${label.basis}`)].join('. ');
 const removed=thread.find(comment=>comment.id===job.payload.comment_id);
 const reply=job.payload.reason==='media_removed'?`${job.payload.media_unmarked===true?'Unmarked the leftovers photo.':'Removed the leftovers photo.'} ${summary}.`:`Removed the correction "${(removed?.body??'').slice(0,60)}". ${summary}.`;
 // Quoted user words are retained verbatim; only generated commentary makes
 // claims. A user's 'remaining half' must not prevent removing a correction.
 const generated=job.payload.reason==='media_removed'?reply:`Removed the correction. ${summary}.`;
 if(!checkWording(generated).ok)throw Error('Removal reply contained unsupported wording.');
 const {error,status}=await admin.rpc('persist_removed_rebuild',{p_post_id:postId,p_job_id:job.id,p_expected:current.map(item=>item.id),p_comments:comments.map(comment=>comment.id),p_photos:(photos??[]).map(photo=>photo.id),p_items:rows.map(row=>{const matches=current.filter(item=>item.name===row.name);return {...row,supersedes:matches.length===1?matches[0].id:null};}),p_reply:reply});
 if(error)throw ioError('Rebuilt meal could not be saved.',error,status);
 await markReady(postId,admin,job.id);
}
