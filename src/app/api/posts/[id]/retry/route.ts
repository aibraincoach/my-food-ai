import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retryKind } from "@/lib/posts/retry-kind";
export async function POST(request: Request, {params}:{params:Promise<{id:string}>}) {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const {id}=await params;
  const owned = await db.from("posts").select("id,status").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(owned.error)return NextResponse.json({error:"Could not retry."},{status:500});
  if(!owned.data||owned.data.status!=="failed")return NextResponse.json({error:"Failed post not found."},{status:409});
  const admin=createAdminClient();
  const failed=await admin.from("jobs").select("kind").eq("post_id",id).eq("status","error")
    .order("finished_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
  if(failed.error)return NextResponse.json({error:"Could not identify failed work."},{status:500});
  const kind=retryKind(failed.data?.kind);
  if(!kind)return NextResponse.json({error:"The failed work could not be identified."},{status:409});
  // Compare-and-set prevents two clicks from enqueueing duplicate retries.
  const {data:post,error}=await admin.from("posts").update({status:"queued",fail_reason:null}).eq("id",id).eq("user_id",user.id).eq("status","failed").select("id").maybeSingle();
  if(error) return NextResponse.json({error:"Could not retry."},{status:500});
  if(!post) return NextResponse.json({error:"Failed post not found."},{status:409});
  // Re-running analyze after an edit would discard the user's corrected items.
  // A fresh correction job reads its durable applied-message cursor itself.
  const queued=await admin.from("jobs").insert({post_id:id,kind,status:"queued",priority:100});
  if(queued.error) {
    await admin.from("posts").update({status:"failed",fail_reason:"Could not queue retry."}).eq("id",id).eq("status","queued");
    return NextResponse.json({error:"Could not queue retry."},{status:500});
  }
  after(async()=>{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10000)});});
  return new Response(null,{status:204});
}
