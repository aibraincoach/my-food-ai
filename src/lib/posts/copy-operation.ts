import {CaptureFailureError} from '@/lib/posts/capture-failure';
import type {CaptureMessageCode} from './capture-failure';
import type {SupabaseClient} from '@supabase/supabase-js';
import {isUuid} from './items';
import {validEatenAt} from './eaten-at';
export class CopyOperationError extends CaptureFailureError {
 constructor(messageCode:CaptureMessageCode,readonly status:number){super({code:messageCode});}
}
export function readCopyOperation(body:unknown,ownerId:string,required=false):string|undefined {
 const value=body as {owner_id?:unknown;operation_id?:unknown}|null;
 if(value?.owner_id!==undefined&&value.owner_id!==ownerId)throw new CopyOperationError("route_0b8ac49fa994",403);
 if(value?.operation_id===undefined&&!required)return undefined;
 if(!isUuid(value?.operation_id))throw new CopyOperationError("route_440bd4fc27f4",400);
 if(value?.owner_id!==ownerId)throw new CopyOperationError("route_62c98a4a0da4",403);
 return value.operation_id;
}
function failed(code?:string):never {
 if(code==='PT409')throw new CopyOperationError("route_4b150ec62015",409);
 if(code==='PT410')throw new CopyOperationError("route_eae035551b2d",410);
 if(code==='42501')throw new CopyOperationError("route_6798c08ac231",404);
 if(code==='22023')throw new CopyOperationError("route_6572182f4064",400);
 throw new CopyOperationError("copySaveFailed",503);
}
export async function copyOperation(db:SupabaseClient,operationId:string,sourceId:string,saved:boolean,eatenAt:unknown,cancel=false):Promise<string|null>{
 const time=validEatenAt(eatenAt);if(!time)throw new CopyOperationError("route_6572182f4064",400);
 const {data,error}=await db.rpc(cancel?'cancel_copy_operation':'publish_copy_operation',{p_operation_id:operationId,p_source_id:sourceId,p_saved:saved,p_eaten_at:time});
 if(error)failed(error.code);
 if(data===null&&cancel)return null;
 if(typeof data!=='string'||!isUuid(data))failed();
 return data;
}
