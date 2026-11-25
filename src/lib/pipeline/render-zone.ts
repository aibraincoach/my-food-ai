import {readCardData} from './read-card-data';
import {cardTranslator} from '@/i18n/card';
import {nutritionTranslator} from '@/i18n/nutrition';
import type {SupabaseClient} from '@supabase/supabase-js';
import {validZone} from '@/lib/posts/days';
import {ioError} from '@/lib/worker/errors';
import {cardDataFromRow,type CardItem} from './card-data';
import type {DrinkCardData} from '@/lib/intake/hydration';

/** A stored PNG records the day in the capture zone. Keep that first zone on
 * retries and later corrections; live cards continue using the viewing device. */
export async function renderTimeZone(db:SupabaseClient,postId:string):Promise<string>{
 const {data,error,status}=await db.from('posts').select('render_time_zone').eq('id',postId).maybeSingle();
 if(error)throw ioError('The card time zone could not be read.',error,status);
 // A legacy post never recorded its capture zone. Do not invent one from the worker's machine.
 return validZone(data?.render_time_zone);
}

export async function readStoredCardData(db:SupabaseClient,userId:string,post:{id:string;eaten_at:string;items:CardItem[]},variant?:DrinkCardData){
 const zone=await renderTimeZone(db,post.id);
 // Stored PNG text stays English until #1219.
 return variant?cardDataFromRow({...post,drink:variant},'en',{t:cardTranslator('en'),tn:nutritionTranslator('en')}):readCardData(db,userId,post,zone);
}
