import { readPostComments, readCorrectionProgress } from '@/lib/posts/timeline';
import { resolvePortionNutrition } from "@/lib/nutrition/portion";
import recompute from "./recompute";
import { loadCorrectionItems, waitForInitialAnalysis } from "@/lib/pipeline/correction-ready";
import { ioError } from "@/lib/worker/errors";
import type { JobHandler } from '@/lib/worker/handlers';
import { toNumber } from '@/lib/nutrition/totals';
import { createResponse, MetaApiError } from '@/lib/meta/client';
import { correctPrompt } from '@/lib/prompts/spark/correct';
import schema from '@/lib/prompts/spark/correct.schema.json';
import { searchFoods } from '@/lib/fdc/client';
import { chooseBestMatch, scaleNutrition } from '@/lib/fdc/nutrients';
import { safeSummary, type ConsumedTotals } from '@/lib/pipeline/wording';
import { correctionWindow, correctionReply } from '@/lib/pipeline/correction-state';
import { markReady } from '@/lib/pipeline/persist';

type Correction = {name:string;portion_text:string|null;portion_grams:number|null;region_index:number|null;keep:string|null};
function parse(text:string):{items:Correction[];reply:string} {
 let result;
 try {result=JSON.parse(text);}catch{throw new MetaApiError(500,'Invalid correction JSON.');}
 if(!result||!Array.isArray(result.items)||result.items.length>100||typeof result.reply!=='string'||!result.reply.trim())throw new MetaApiError(500,'Invalid correction response.');
 for(const i of result.items) {
  if(!i||typeof i.name!=='string'||!i.name.trim()||i.name.length>160||!(i.portion_text===null||typeof i.portion_text==='string')||
   !(i.portion_grams===null||(typeof i.portion_grams==='number'&&Number.isFinite(i.portion_grams)&&i.portion_grams>0&&i.portion_grams<=100000))||
   !(i.region_index===null||Number.isInteger(i.region_index))||!(i.keep===null||typeof i.keep==='string'))throw new MetaApiError(500,'Invalid correction item.');
 }
 return result;
}
const correct:JobHandler=async(admin,job)=>{
 if(!job.post_id)throw new Error('Correction requires a post.');
 await waitForInitialAnalysis(admin,job.post_id);
 if(job.payload.correction_applied===true){await markReady(job.post_id,admin,job.id);return;}
 const items=await loadCorrectionItems(admin,job.post_id,()=>recompute(admin,job));
 const [thread,completed]=await Promise.all([readPostComments(admin,job.post_id),readCorrectionProgress(admin,job.post_id)]);
 let window;
 try{window=correctionWindow(thread??[],completed??[]);}catch{throw new MetaApiError(503,'Correction history changed while loading.');}
 const latest=window.pending.at(-1);
 if(!latest){
  const {data:completed,error,status}=await admin.rpc('complete_empty_correction',{p_post_id:job.post_id,p_job_id:job.id});
  if(error)throw ioError('Correction completion could not be saved.',error,status);
  if(!completed)throw new MetaApiError(503,'A correction arrived while completing this attempt.');
  await markReady(job.post_id,admin,job.id);return;
 }
 const {data:prepared,error:prepareError,status:prepareStatus}=await admin.from('jobs').update({payload:{...job.payload,correction_from_sequence:window.sequence,correction_pending_ids:window.pending.map(comment=>comment.id)}}).eq('id',job.id).eq('status','running').select('id').maybeSingle();
 if(prepareError)throw ioError('Correction snapshot could not be saved.',prepareError,prepareStatus);
 if(!prepared)throw new MetaApiError(503,'Correction snapshot could not be saved.');
 const {data:media,error:mediaError,status:mediaStatus}=await admin.from('post_media').select('storage_path').eq('post_id',job.post_id).eq('kind','photo').order('position').limit(1).maybeSingle();
 if(mediaError)throw ioError('Correction photo could not be read.',mediaError,mediaStatus);
 const content:Record<string,unknown>[]=[{type:'input_text',text:JSON.stringify({items:items.map((i,index)=>({id:i.id,name:i.name,portion_text:i.portion_text,portion_grams:i.portion_grams,calories:i.calories,region_index:index,box:i.box})),history:window.history,pending_messages:window.pending})}];
 if(media){
  const {data,error}=await admin.storage.from('media').download(media.storage_path);
  if(error)throw ioError('Correction photo could not be opened.',error);
  if(!data)throw new Error('Correction photo could not be opened.');
  content.push({type:'input_image',image_url:`data:${data.type||'image/jpeg'};base64,${Buffer.from(await data.arrayBuffer()).toString('base64')}`});
 }
 const response=await createResponse({model:'muse-spark-1.3',instructions:correctPrompt,input:[{type:'message',role:'user',content}],text:{format:{type:'json_schema',name:'correct',schema,strict:true}},max_output_tokens:4096});
 if(response.status!=='completed'||!response.outputText||response.refusal)throw new MetaApiError(500,'Correction did not finish.');
 const result=parse(response.outputText);
 const kept=new Set<string>();
 const rows=[];
 for(const item of result.items){
  const old=item.keep?items.find(i=>i.id===item.keep):undefined;
  if(item.keep&&(!old||kept.has(item.keep)||old.name!==item.name||old.portion_text!==item.portion_text||(old.portion_grams==null?null:toNumber(old.portion_grams))!==item.portion_grams))throw new MetaApiError(500,'Correction changed an item marked unchanged.');
  if(item.keep)kept.add(item.keep);
  if(item.region_index!==null&&(item.region_index<0||item.region_index>=items.length))throw new MetaApiError(500,'Invalid source item index.');
  const named=items.filter(prior=>prior.name===item.name);
  const region=item.region_index===null?(named.length===1?named[0]:undefined):items[item.region_index];
  let nutrition;
  if(old)nutrition={calories:old.calories,protein_g:old.protein_g,carbs_g:old.carbs_g,fat_g:old.fat_g,fibre_g:old.fibre_g,sugar_g:old.sugar_g,sodium_mg:old.sodium_mg,micronutrients:old.micronutrients,source_ref:old.source_ref};
  else {
   const retained=region?.name===item.name?await resolvePortionNutrition(admin,job.post_id,region.id,item.name,item.portion_grams):null;
   if(retained)nutrition=retained;
   else {
   const n=scaleNutrition(chooseBestMatch(await searchFoods(admin,item.name)),item.portion_grams);
   nutrition={calories:n.calories,protein_g:n.proteinG,carbs_g:n.carbsG,fat_g:n.fatG,fibre_g:n.fibreG,sugar_g:n.sugarG,sodium_mg:n.sodiumMg,micronutrients:n.micronutrients,source_ref:n.sourceRef};
   }
  }
  rows.push({name:item.name,portion_text:item.portion_text,portion_grams:item.portion_grams,box:old?old.box:region?.box??null,mask_path:old?old.mask_path:region?.mask_path??null,supersedes:old?.id??region?.id??null,nutrition});
 }
 const totals={} as ConsumedTotals;
 for(const key of ['calories','protein_g','carbs_g','fat_g'] as const)totals[key]=rows.some(r=>r.nutrition[key]==null)?null:rows.reduce((n,r)=>n+toNumber(r.nutrition[key]),0);
 const reply=await safeSummary(correctionReply(items,rows,totals),totals);
 const {error,status}=await admin.rpc('persist_correction',{p_post_id:job.post_id,p_job_id:job.id,p_expected:items.map(i=>i.id),p_through:latest.id,p_items:rows,p_reply:reply});
 if(error)throw ioError('Correction transaction failed.',error,status);
 await markReady(job.post_id,admin,job.id);
};
export default correct;
