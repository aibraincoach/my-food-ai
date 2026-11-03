import type {SupabaseClient} from '@supabase/supabase-js';
export type PendingItem={name:string;kcal:number|null};
export async function writePendingNames(admin:SupabaseClient,postId:string,names:string[],jobId?:string):Promise<void>{
 const {error}=await admin.rpc('write_pending_names',{p_post_id:postId,p_job_id:jobId??null,p_names:names.map(name=>({name,kcal:null}))});
 if(error)console.error('Analysis progress could not be saved.');
}
export async function writePendingKcal(admin:SupabaseClient,postId:string,index:number,kcal:number|null,jobId?:string):Promise<void>{
 const {error}=await admin.rpc('write_pending_kcal',{p_post_id:postId,p_job_id:jobId??null,p_index:index,p_kcal:typeof kcal==='number'&&Number.isFinite(kcal)?kcal:null});
 if(error)console.error('Analysis progress could not be saved.');
}
export function readPendingItems(value:unknown):PendingItem[]{
 if(!Array.isArray(value))return [];
 return value.flatMap(row=>row&&typeof row.name==='string'&&row.name.trim()?[{name:row.name,kcal:typeof row.kcal==='number'&&Number.isFinite(row.kcal)&&row.kcal>=0?row.kcal:null}]:[]);
}
