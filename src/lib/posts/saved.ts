import type { SupabaseClient } from '@supabase/supabase-js';
import { renderResultsCard } from '@/lib/pipeline/results-card';
import { validEatenAt } from './eaten-at';
export type SavedNutrition = {calories:number|null;protein_g:number|null;carbs_g:number|null;fat_g:number|null};
export type SavedItem = {name:string;portion_grams:number|null;portion_text:string|null;nutrition:SavedNutrition};
export type SavedMeal = {id:string;name:string;source_post_id:string|null;items:SavedItem[];last_logged_at:string|null;thumbnail?:string|null};
export function savedName(value:unknown):string {
 if(typeof value!=='string'||!value.trim()||value.trim().length>80||value.includes('\0'))throw new Error('Enter a name up to 80 characters.');
 return value.trim();
}
export async function listSaved(db:SupabaseClient):Promise<SavedMeal[]> {
 const {data,error}=await db.from('saved_meals').select('id,name,source_post_id,items,last_logged_at').order('created_at',{ascending:false});
 if(error)throw new Error('Saved meals could not be loaded.');
 return Promise.all((data??[]).map(async row=>{
  let thumbnail:string|null=null;
  if(row.source_post_id){
   const {data:media}=await db.from('post_media').select('storage_path,kind').eq('post_id',row.source_post_id).order('position').limit(1).maybeSingle();
   if(media){const path=media.kind==='card'?media.storage_path:media.storage_path.replace(/\.[^.]+$/,'.feed.jpg'); const signed=await db.storage.from('media').createSignedUrl(path,3600);thumbnail=signed.data?.signedUrl??null;}
  }
  return {...row,thumbnail} as SavedMeal;
 }));
}
export async function savePost(db:SupabaseClient,postId:string) {
 const {data:post,error:postError}=await db.from('posts').select('caption').eq('id',postId).maybeSingle();
 if(postError||!post)throw new Error('Meal not found.');
 const {data:first}=await db.from('current_post_items').select('name').eq('post_id',postId).order('created_at').limit(1).maybeSingle();
 const name=(post.caption.trim()||first?.name||'Meal').slice(0,80);
 const {data,error}=await db.rpc('save_meal_from_post',{p_post_id:postId,p_name:name});
 if(error||typeof data!=='string')throw new Error('The meal could not be saved.');
 return {id:data,name};
}
export async function logMeal(db:SupabaseClient,admin:SupabaseClient,id:string,eatenAt:unknown,saved:boolean) {
 const time=validEatenAt(eatenAt);
 if(!time)throw new Error('Choose a valid time eaten.');
 const {data,error}=await db.rpc(saved?'log_saved_meal':'log_post_again',saved?{p_id:id,p_eaten_at:time}:{p_post_id:id,p_eaten_at:time});
 if(error||typeof data!=='string')throw new Error('The meal could not be logged.');
 // The function already committed an exact nutrition copy; card rendering cannot undo it.
 try{await renderResultsCard(admin,data);}catch{console.error('Copied meal card could not be rendered.');}
 return {postId:data};
}
