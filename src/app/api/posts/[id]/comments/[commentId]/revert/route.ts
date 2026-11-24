import {after,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
export async function POST(request:Request,{params}:{params:Promise<{id:string;commentId:string}>}){
 const client=await createClient();const {data:{user}}=await client.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const {id,commentId}=await params;
 if(!isUuid(id)||!isUuid(commentId))return Response.json({message_code:"unknownFailure"},{status:404});
 const {data:comment,error:readError}=await client.from('post_comments').select('id').eq('id',commentId).eq('post_id',id).maybeSingle();
 if(readError)return NextResponse.json({message_code: "route_53ad241e5728"},{status:503});
 if(!comment)return Response.json({message_code:"unknownFailure"},{status:404});
 const {data,error}=await client.rpc('revert_correction',{p_comment_id:commentId});
 if(error)return NextResponse.json({message_code: "route_acd9377bdda4"},{status:503});
 if(!data)return Response.json({message_code:"unknownFailure"},{status:404});
 after(async()=>{try{await fetch(new URL('/api/jobs/tick',request.url),{cache:'no-store',signal:AbortSignal.timeout(10000)});}catch{/* Durable wake retries. */}});
 return new Response(null,{status:204});
}
