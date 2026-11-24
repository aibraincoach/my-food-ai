import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/posts/items";
// #1095: discarding a meal that waits for an answer is a soft delete (0074). Its media stay until the daily purge,
// exactly as for the owner's delete, so there is nothing to list or clean up here.
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
  const {id}=await params;if(!isUuid(id))return Response.json({message_code:"unknownFailure"},{status:404});
  const {data:post,error}=await db.from("posts").select("id").eq("id",id).eq("user_id",user.id).eq("status","needs_input").maybeSingle();
  if(error)return Response.json({message_code:"unknownFailure"},{status:500});if(!post)return Response.json({message_code:"unknownFailure"},{status:404});
  const removed=await createAdminClient().rpc("discard_post",{p_post_id:id,p_user_id:user.id});
  if(removed.error)return NextResponse.json({message_code: "route_8ee082391014"},{status:500});
  if(!removed.data)return NextResponse.json({message_code: "route_c61db205cdf6"},{status:409});
  return new Response(null,{status:204});
}
