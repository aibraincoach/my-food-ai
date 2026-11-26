import type {ApiMessageCode} from '@/i18n/api-codes';
import {createHash} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
export function tileDrinkKey(body:Record<string,unknown>,zone:string):string {
 return createHash('sha256').update(JSON.stringify({tile:body.tile??null,ml:body.ml??null,kind:body.kind??null,custom:body.custom??null,eaten_at:body.eaten_at??null,zone,...(Object.hasOwn(body,'tea_id')?{tea_id:body.tea_id}:{})})).digest('hex');
}
export function photoDrinkKey(body:Record<string,unknown>):string {
 return createHash('sha256').update(JSON.stringify({time_zone:body.time_zone,upload_id:body.upload_id,caption:body.caption,eaten_at:body.eaten_at??null,save_as_meal:body.save_as_meal,location:body.location??null,readings:body.readings})).digest('hex');
}
export type DrinkReceipt = {postId:string}|{status:number;message_code:ApiMessageCode};
export async function readDrinkReceipt(admin:SupabaseClient,userId:string,operationId:string,key:string,kind:'tile'|'photo'):Promise<DrinkReceipt|null>{
 const {data,error}=await admin.from('drink_post_operations').select('user_id,kind,request_key,post_id,cancelled').eq('operation_id',operationId).maybeSingle();
 if(error)return{status:503,message_code:"route_68e3d124f8a5"};
 if(!data)return null;
 if(data.user_id!==userId)return{status:404,message_code:"route_b57f3ec3ba46"};
 if(data.kind!==kind)return{status:409,message_code:"route_26d8c2e230c5"};
 if(data.cancelled)return{status:410,message_code:"route_cd303598164e"};
 if(data.request_key!==key)return{status:409,message_code:"route_73da0d100358"};
 const result=data.post_id?await admin.from('posts').select('id').eq('id',data.post_id).eq('user_id',userId).is('deleted_at',null).maybeSingle():{data:null,error:null};
 if(result.error)return{status:503,message_code:"route_7b5714a8578a"};
 return result.data?{postId:result.data.id}:{status:410,message_code:"route_10c2e5d8b96a"};
}
export function drinkErrorStatus(code?:string):number{return code==='42501'?404:code?.startsWith('PT')?Number(code.slice(2)):code?.startsWith('22')?400:503;}
