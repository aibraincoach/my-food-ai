import type {SupabaseClient} from '@supabase/supabase-js';
import {ApiError,ioError} from '@/lib/worker/errors';

// Initial analysis may be in delayed retry while a newer comment is runnable.
// Do not consume comments against the empty pre-analysis meal snapshot.
export async function waitForInitialAnalysis(admin: SupabaseClient,postId:string):Promise<void>{
 const {data:post,error:postError,status:postStatus}=await admin.from('posts').select('analysis_initialized_at').eq('id',postId).maybeSingle();
 if(postError)throw ioError('Initial analysis marker could not be read.',postError,postStatus);
 if(!post)throw new ApiError(404,'','Meal not found.');
 if(post.analysis_initialized_at)return;
 const {data,error,status}=await admin.from('jobs').select('id').eq('post_id',postId)
  .eq('kind','analyze').in('status',['queued','running']).limit(1).maybeSingle();
 if(error)throw ioError('Initial analysis state could not be read.',error,status);
 if(data)throw new ApiError(503,'','Waiting for initial meal analysis.');
 throw new ApiError(409,'','Initial meal analysis has not completed. Retry the meal analysis first.');
}
