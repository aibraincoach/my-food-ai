import type {SupabaseClient} from '@supabase/supabase-js';
export type DeletedPost={id:string;caption:string;eaten_at:string;deleted_at:string;thumbnail_path:string|null;thumbnail:string|null};
export async function softDeletePost(db:SupabaseClient,userId:string,postId:string){
 const owned=await db.from('posts').select('id').eq('id',postId).eq('user_id',userId).is('deleted_at',null).maybeSingle();
 if(owned.error)return {ok:false,error:owned.error.message};
 if(!owned.data)return {ok:false};
 const {data,error}=await db.rpc('delete_post',{p_post_id:postId,p_paths:[]});
 return {ok:data===true,error:error?.message};
}
export async function restorePost(db:SupabaseClient,userId:string,postId:string){
 const {data:{user},error:authError}=await db.auth.getUser();
 if(authError||user?.id!==userId)return {ok:false};
 const {data,error}=await db.rpc('restore_post',{p_post_id:postId});
 return {ok:data===true,error:error?.message};
}
export async function listDeleted(db:SupabaseClient,userId:string):Promise<DeletedPost[]>{
 const {data,error}=await db.rpc('list_deleted_posts',{p_user_id:userId});
 if(error)throw new Error('Deleted posts could not be loaded.');
 const rows=(data??[]) as Omit<DeletedPost,'thumbnail'>[];
 const paths=[...new Set(rows.flatMap(row=>row.thumbnail_path?[row.thumbnail_path.replace(/\.[^/.]+$/,'.feed.jpg')]:[]))];
 const urls=new Map<string,string>();
 if(paths.length){const signed=await db.storage.from('media').createSignedUrls(paths,3600);if(!signed.error)for(const entry of signed.data??[])if(entry.path&&entry.signedUrl&&!entry.error)urls.set(entry.path,entry.signedUrl);}
 return rows.map(row=>({...row,thumbnail:row.thumbnail_path?urls.get(row.thumbnail_path.replace(/\.[^/.]+$/,'.feed.jpg'))??null:null}));
}
