import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {nutritionTranslator} from '@/i18n/nutrition';
import {commentText} from './comment-message';
import {readPostComments} from './timeline';
/** Model context is a declared English protocol; human readers format separately. */
export async function readWorkerComments(client:SupabaseClient,postId:string){
 const t=nutritionTranslator('en');
 return (await readPostComments(client,postId)).map(({message,...row})=>({...row,body:commentText({...row,message},t,'en')}));
}
