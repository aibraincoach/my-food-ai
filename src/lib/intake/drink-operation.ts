import {createHash} from 'node:crypto';
import type {SupabaseClient} from '@supabase/supabase-js';
export function tileDrinkKey(body:Record<string,unknown>,zone:string):string {
 return createHash('sha256').update(JSON.stringify({tile:body.tile??null,ml:body.ml??null,kind:body.kind??null,custom:body.custom??null,eaten_at:body.eaten_at??null,zone})).digest('hex');
}
export function photoDrinkKey(body:Record<string,unknown>):string {
 return createHash('sha256').update(JSON.stringify({upload_id:body.upload_id,caption:body.caption,eaten_at:body.eaten_at??null,save_as_meal:body.save_as_meal,location:body.location??null,readings:body.readings})).digest('hex');
}
export type DrinkReceipt = {postId:string}|{status:number;error:string};
export async function readDrinkReceipt(admin:SupabaseClient,userId:string,operationId:string,key:string,kind:'tile'|'photo'):Promise<DrinkReceipt|null>{
 const {data,error}=await admin.from('drink_post_operations').select('user_id,kind,request_key,post_id,cancelled').eq('operation_id',operationId).maybeSingle();
 if(error)return{status:503,error:'The drink operation could not be confirmed. Your selection is kept.'};
 if(!data)return null;
 if(data.user_id!==userId)return{status:404,error:'Drink operation not found.'};
 if(data.kind!==kind)return{status:409,error:'This drink intent changed.'};
 if(data.cancelled)return{status:410,error:'This pending drink was removed.'};
 if(data.request_key!==key)return{status:409,error:'This drink selection changed. Start a new drink post.'};
 const result=data.post_id?await admin.from('posts').select('id').eq('id',data.post_id).eq('user_id',userId).is('deleted_at',null).maybeSingle():{data:null,error:null};
 if(result.error)return{status:503,error:'The saved drink could not be confirmed. Your selection is kept.'};
 return result.data?{postId:result.data.id}:{status:410,error:'This drink post was removed.'};
}
export function drinkErrorStatus(code?:string):number{return code==='42501'?404:code?.startsWith('PT')?Number(code.slice(2)):code?.startsWith('22')?400:503;}
