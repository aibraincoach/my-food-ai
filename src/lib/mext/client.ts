import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {recordCall} from '../trace/record';
import {ioError} from '../worker/errors';
import {parseMextRecord,mextFoodNumber,type MextRecord} from './record';

async function failedRead(error:unknown,status?:number):Promise<never>{
 return recordCall('mext',{event:'food_reference_read'},async()=>{throw ioError('MEXT reference could not be read.',error,status);},()=>{throw new Error('Unreachable successful failed-read trace.');},{model:null,host:'postgres'});
}
export async function searchMextFoods(admin:SupabaseClient,japaneseName:string,englishName:string,signal?:AbortSignal):Promise<MextRecord[]>{
 const query=admin.rpc('search_mext_foods',{p_name_ja:japaneseName,p_name_en:englishName});
 if(signal)query.abortSignal(signal);
 let result;
 try{result=await query;}catch(error){return failedRead(error);}
 if(result.error)return failedRead(result.error,result.status);
 if(!Array.isArray(result.data))throw new Error('MEXT search returned invalid records.');
 return result.data.map(parseMextRecord);
}
export async function readMextFood(admin:SupabaseClient,sourceRef:string,signal?:AbortSignal):Promise<MextRecord>{
 const number=mextFoodNumber(sourceRef);if(number===null)throw new Error('MEXT source reference is invalid.');
 const query=admin.from('jp_foods').select('*').eq('food_number',number);
 if(signal)query.abortSignal(signal);
 let result;
 try{result=await query.maybeSingle();}catch(error){return failedRead(error);}
 if(result.error)return failedRead(result.error,result.status);
 if(!result.data)throw new Error('Stored MEXT reference is missing.');
 return parseMextRecord(result.data);
}
