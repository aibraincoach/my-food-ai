import {CaptureFailureError} from '@/lib/posts/capture-failure';
import {CopyOperationError,copyOperation} from './copy-operation';
import { syncItemDrinks } from '@/lib/intake/drinks-from-items';
import type { SupabaseClient } from '@supabase/supabase-js';
import {saveCaptureZone,CaptureZoneConflictError} from '@/lib/pipeline/capture-zone';
import { renderResultsCard } from '@/lib/pipeline/results-card';
import { validEatenAt } from './eaten-at';
export type SavedNutrition = {calories:number|null;protein_g:number|null;carbs_g:number|null;fat_g:number|null;food_category?:string|null;micronutrients?:import('@/lib/nutrition/totals').StoredNutrient[]};
export type SavedItem = {name:string;portion_grams:number|null;portion_text:string|null;nutrition:SavedNutrition};
export type SavedDrink = {kind:"water"|"caffeine";amount:number;ml:number|null;label:string|null;source?:"sheet"|"item";item_name?:string|null};
export type SavedMeal = {id:string;name:string;source_post_id:string|null;items:SavedItem[];drinks?:SavedDrink[];last_logged_at:string|null;thumbnail?:string|null};
export function savedName(value:unknown):string {
 if(typeof value!=='string'||!value.trim()||value.trim().length>80||value.includes('\0'))throw new CaptureFailureError({code:"route_580d430e99ac"});
 return value.trim();
}
export async function listSaved(db:SupabaseClient):Promise<SavedMeal[]> {
 const {data,error}=await db.from('saved_meals').select('id,name,source_post_id,items,drinks,last_logged_at').order('created_at',{ascending:false});
 if(error)throw new CaptureFailureError({code:"route_f113aa0fb999"});
 const rows=data??[];
 const ids=rows.map(row=>row.source_post_id).filter((id):id is string=>typeof id==='string');
 const firstMedia=new Map<string,{storage_path:string;kind:string}>();
 if(ids.length){
  const {data:media,error:mediaError}=await db.from('post_media').select('post_id,storage_path,kind').in('post_id',ids).order('position');
  if(mediaError)throw new CaptureFailureError({code:"route_31241db47d6f"});
  for(const entry of media??[])if(!firstMedia.has(entry.post_id))firstMedia.set(entry.post_id,entry);
 }
 const paths=[...new Set([...firstMedia.values()].map(entry=>entry.kind==='card'?entry.storage_path:entry.storage_path.replace(/\.[^.]+$/,'.feed.jpg')))];
 const urls=new Map<string,string>();
 if(paths.length){const signed=await db.storage.from('media').createSignedUrls(paths,3600);if(signed.error)throw new CaptureFailureError({code:"route_2a211b374d22"});for(const entry of signed.data??[])if(entry.path&&entry.signedUrl)urls.set(entry.path,entry.signedUrl);}
 return rows.map(row=>{const media=firstMedia.get(row.source_post_id);const path=media?(media.kind==='card'?media.storage_path:media.storage_path.replace(/\.[^.]+$/,'.feed.jpg')):null;return {...row,thumbnail:path?urls.get(path)??null:null} as SavedMeal;});
}
export async function savePost(db:SupabaseClient,postId:string) {
 const {data:post,error:postError}=await db.from('posts').select('caption').is("deleted_at", null).eq('id',postId).maybeSingle();
 if(postError||!post)throw new CaptureFailureError({code:"route_6798c08ac231"});
 const {data:first}=await db.from('current_post_items').select('name').eq('post_id',postId).order('created_at').limit(1).maybeSingle();
 const name=(post.caption.trim()||first?.name||'Meal').slice(0,80);
 const {data,error}=await db.rpc('save_meal_from_post',{p_post_id:postId,p_name:name});
 if(error||typeof data!=='string')throw Object.assign(new CaptureFailureError({code:error?.code==='42501'?"route_c3a1756aac70":error?.code==='22023'?"route_8181b1c27406":"error_0795a0b4a0a6"}),{code:error?.code});
 return {id:data,name};
}
export async function logMeal(db:SupabaseClient,admin:SupabaseClient,id:string,eatenAt:unknown,saved:boolean,timeZone:string,operationId:string) {
 const time=validEatenAt(eatenAt);
 if(!time)throw new CopyOperationError("route_6572182f4064",400);
 const data=await copyOperation(db,operationId,id,saved,time);
 if(typeof data!=='string')throw new CaptureFailureError({code:"route_35d40f66fffa"});
 try{await saveCaptureZone(admin,data,timeZone);}catch(error){if(error instanceof CaptureZoneConflictError)throw new CopyOperationError("route_4b150ec62015",409);throw error;}
 // Sheet intake commits atomically with its copy. Item copies also retain a
 // durable drink_sync repair job.
 // Never turn a failed follow-up into a failed copy that the user repeats.
 try{await syncItemDrinks(admin,data);await renderResultsCard(admin,data,undefined,undefined,timeZone);}catch{console.error('Copied meal hydration/card repair remains queued.');}
 return {postId:data};
}
