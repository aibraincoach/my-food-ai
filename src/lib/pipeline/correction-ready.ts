import type {SupabaseClient} from '@supabase/supabase-js';
import {ApiError,ioError} from '@/lib/worker/errors';

// Initial analysis may be in delayed retry while a newer comment is runnable.
// Do not consume comments against the empty pre-analysis meal snapshot.
export async function waitForInitialAnalysis(admin: SupabaseClient,postId:string):Promise<void>{
 const {data,error,status}=await admin.from('jobs').select('id').eq('post_id',postId)
  .eq('kind','analyze').in('status',['queued','running']).limit(1).maybeSingle();
 if(error)throw ioError('Initial analysis state could not be read.',error,status);
 if(data)throw new ApiError(503,'','Waiting for initial meal analysis.');
}
