import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isUuid} from '@/lib/posts/items';
import {softDeletePost} from '@/lib/posts/deleted';
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
 const {id}=await params;if(!isUuid(id))return Response.json({message_code:"unknownFailure"},{status:404});
 const result=await softDeletePost(db,user.id,id);
 if(result.error)return NextResponse.json({message_code: "route_da83feb531bf"},{status:500});
 return (result.ok?new Response(null,{status:204}):Response.json({message_code:"unknownFailure"},{status:404}));
}
