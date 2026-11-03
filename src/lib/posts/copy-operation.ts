import type {SupabaseClient} from '@supabase/supabase-js';
import {isUuid} from './items';
import {validEatenAt} from './eaten-at';
export class CopyOperationError extends Error {
 constructor(message:string,readonly status:number){super(message);}
}
export function readCopyOperation(body:unknown,ownerId:string,required=false):string|undefined {
 const value=body as {owner_id?:unknown;operation_id?:unknown}|null;
 if(value?.owner_id!==undefined&&value.owner_id!==ownerId)throw new CopyOperationError('Sign-in changed. The selection belongs to its original account.',403);
 if(value?.operation_id===undefined&&!required)return undefined;
 if(!isUuid(value?.operation_id))throw new CopyOperationError('Invalid copy operation.',400);
 if(value?.owner_id!==ownerId)throw new CopyOperationError('The copy owner is required.',403);
 return value.operation_id;
}
function failed(code?:string):never {
 if(code==='PT409')throw new CopyOperationError('The copy selection changed. Start a new copy.',409);
 if(code==='PT410')throw new CopyOperationError('This pending copy was removed.',410);
 if(code==='42501')throw new CopyOperationError('Meal not found.',404);
 if(code==='22023')throw new CopyOperationError('Choose a valid time eaten.',400);
 throw new CopyOperationError('The copy could not be confirmed. Your selection is kept.',503);
}
export async function copyOperation(db:SupabaseClient,operationId:string,sourceId:string,saved:boolean,eatenAt:unknown,cancel=false):Promise<string|null>{
 const time=validEatenAt(eatenAt);if(!time)throw new CopyOperationError('Choose a valid time eaten.',400);
 const {data,error}=await db.rpc(cancel?'cancel_copy_operation':'publish_copy_operation',{p_operation_id:operationId,p_source_id:sourceId,p_saved:saved,p_eaten_at:time});
 if(error)failed(error.code);
 if(data===null&&cancel)return null;
 if(typeof data!=='string'||!isUuid(data))failed();
 return data;
}
