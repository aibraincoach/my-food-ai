import type {SupabaseClient} from '@supabase/supabase-js';
import {validZone} from '@/lib/posts/days';
import {ioError} from '@/lib/worker/errors';
import {cardDataFromRow,readCardData,type CardItem} from './card-data';
import type {DrinkCardData} from '@/lib/intake/hydration';

/** A stored PNG records the day in the capture zone. Keep that first zone on
 * retries and later corrections; live cards continue using the viewing device. */
export async function renderTimeZone(db:SupabaseClient,postId:string,explicitZone?:string):Promise<string>{
 if(explicitZone!==undefined){
  const zone=validZone(explicitZone);
  const {data,error,status}=await db.from('posts').update({render_time_zone:zone}).eq('id',postId).is('render_time_zone',null).select('render_time_zone').maybeSingle();
  if(error)throw ioError('The card time zone could not be saved.',error,status);
  if(data)return validZone(data.render_time_zone);
 }
 const {data,error,status}=await db.from('posts').select('render_time_zone').eq('id',postId).maybeSingle();
 if(error)throw ioError('The card time zone could not be read.',error,status);
 // A legacy post never recorded its capture zone. Do not invent one from the worker's machine.
 return validZone(data?.render_time_zone);
}

export async function readStoredCardData(db:SupabaseClient,userId:string,post:{id:string;eaten_at:string;items:CardItem[]},explicitZone?:string,variant?:DrinkCardData){
 const zone=await renderTimeZone(db,post.id,explicitZone);
 return variant?cardDataFromRow({...post,drink:variant}):readCardData(db,userId,post,zone);
}
