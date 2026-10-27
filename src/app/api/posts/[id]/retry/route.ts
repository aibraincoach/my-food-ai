import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(request: Request, {params}:{params:Promise<{id:string}>}) {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const {id}=await params;
  const admin=createAdminClient();
  // Compare-and-set prevents two clicks from enqueueing duplicate retries.
  const {data:post,error}=await admin.from("posts").update({status:"queued",fail_reason:null}).eq("id",id).eq("user_id",user.id).eq("status","failed").select("id").maybeSingle();
  if(error) return NextResponse.json({error:"Could not retry."},{status:500});
  if(!post) return NextResponse.json({error:"Failed post not found."},{status:409});
  const queued=await admin.from("jobs").insert({post_id:id,kind:"analyze",status:"queued",priority:100});
  if(queued.error) {
    await admin.from("posts").update({status:"failed",fail_reason:"Could not queue retry."}).eq("id",id).eq("status","queued");
    return NextResponse.json({error:"Could not queue retry."},{status:500});
  }
  after(async()=>{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10000)});});
  return new Response(null,{status:204});
}
