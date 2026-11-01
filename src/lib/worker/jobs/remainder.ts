import type {JobHandler} from '@/lib/worker/handlers';
import {readRemainder} from '@/lib/meta/remainder';
import {remainderRule} from '@/lib/pipeline/remainder-rule';
import {getCurrentItems,normalizeStoredNutrition,rescaleStoredNutrition,sumNutrition,toNumber,NUTRIENT_KEYS,type NutritionRow} from '@/lib/nutrition/totals';
import {checkWording} from '@/lib/pipeline/wording-check';
import {markReady} from '@/lib/pipeline/persist';
import {ioError,ApiError} from '@/lib/worker/errors';
import {isOwnedPhotoPath} from '@/lib/media/paths';

const remainder:JobHandler=async(admin,job)=>{
 if(!job.post_id)throw Error('Not-eaten estimate requires a post.');
 if(job.payload.remainder_applied===true){await markReady(job.post_id,admin,job.id);return;}
 const {data:photo,error:photoError,status:photoStatus}=await admin.from('post_media').select('id,storage_path').eq('post_id',job.post_id).eq('kind','photo').eq('not_eaten',true).maybeSingle();
 if(photoError)throw ioError('Not-eaten photo could not be read.',photoError,photoStatus);
 const {data:post,error:postError,status:postStatus}=await admin.from('posts').select('user_id,analysis_initialized_at').eq('id',job.post_id).maybeSingle();
 if(postError)throw ioError('Meal could not be read.',postError,postStatus);
 if(!post||!photo||!isOwnedPhotoPath(photo.storage_path,post.user_id,job.post_id))throw Error('Not-eaten photo does not belong to this meal.');
 if(!post.analysis_initialized_at)throw new ApiError(503,'','The meal estimate is still being prepared.');
 const items=await getCurrentItems(admin,job.post_id,{requireNutrition:true});
 if(!items.length)throw Error('No foods were available for the not-eaten estimate.');
 if(items.some(item=>item.portion_grams==null))throw Error('A meal portion was unavailable for the not-eaten estimate.');
 const {data:blob,error:downloadError}=await admin.storage.from('media').download(photo.storage_path);
 if(downloadError||!blob)throw ioError('Not-eaten photo could not be opened.',downloadError);
 const estimates=await readRemainder(new Uint8Array(await blob.arrayBuffer()),items.map((item,index)=>({index,name:item.name,grams:toNumber(item.portion_grams)})));
 const rows=items.map((item,index)=>{
  const estimate=estimates.find(row=>row.index===index)!;
  const rule=remainderRule(toNumber(item.portion_grams),estimate);
  const original={...item,post_item_id:item.id} as NutritionRow;
  const normalized=normalizeStoredNutrition(original,item.portion_grams);
  const nutrition=rescaleStoredNutrition(normalized,item.portion_grams,rule.consumedGrams);
  if(rule.consumedGrams===0){for(const key of NUTRIENT_KEYS)nutrition[key]=normalized[key]==null?null:0;nutrition.micronutrients=normalized.micronutrients.map(entry=>({...entry,value:entry.value==null?null:0,basis:'portion'}));}
  const ratio=toNumber(item.portion_grams)>0?rule.notEatenGrams/toNumber(item.portion_grams):0;
  return {old_id:item.id,name:item.name,portion_grams:rule.consumedGrams,portion_text:rule.consumedText,box:item.box,mask_path:item.mask_path,gtin:item.gtin??null,not_eaten_grams:rule.notEatenGrams,count_text:rule.countText,not_eaten_count_text:rule.notEatenCountText,nutrition,notEatenKcal:item.calories==null?null:toNumber(item.calories)*ratio,notEatenText:rule.notEatenText,consumedText:rule.consumedText};
 });
 const kcal=sumNutrition(rows.map(row=>({...row.nutrition,name:row.name}))).calories;
 const omitted=rows.some(row=>row.notEatenKcal===null)?null:rows.reduce((total,row)=>total+(row.notEatenKcal??0),0);
 const describe=(values:string[])=>values.length===1?values[0]:values.join(', ');
 const reply=`Not eaten: ${describe(rows.map(row=>row.notEatenText))} · ${omitted===null?'unavailable':Math.round(omitted).toLocaleString('en-US')} kcal. Consumed: ${describe(rows.map(row=>row.consumedText))} · ${kcal===null?'unavailable':Math.round(kcal).toLocaleString('en-US')} kcal.`;
 if(!checkWording(reply).ok)throw Error('Not-eaten reply contained unsupported wording.');
 const {error,status}=await admin.rpc('apply_post_remainder',{p_post_id:job.post_id,p_job_id:job.id,p_photo_id:photo.id,p_expected:items.map(item=>item.id),p_items:rows,p_reply:reply});
 if(error)throw ioError('Not-eaten estimate could not be saved.',error,status);
 await markReady(job.post_id,admin,job.id);
};
export default remainder;
