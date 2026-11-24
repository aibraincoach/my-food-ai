import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/posts/items";
// Dismiss the question beside a published meal (#615). The meal, its items and its card are untouched.
export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}) {
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({message_code: "route_ac6a88b19530"},{status:401});
  const {id}=await params;if(!isUuid(id))return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
  const {data:post,error}=await db.from("posts").select("id").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(error)return NextResponse.json({message_code: "route_86ae9d4b581e"},{status:500});if(!post)return NextResponse.json({message_code: "route_6798c08ac231"},{status:404});
  const cleared=await createAdminClient().from("posts").update({question:null}).eq("id",id).eq("user_id",user.id);
  if(cleared.error)return NextResponse.json({message_code: "route_86ae9d4b581e"},{status:500});
  return new Response(null,{status:204});
}
