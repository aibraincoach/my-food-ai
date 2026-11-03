import { capUser } from "@/lib/limits/user-cap";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { retryKind } from "@/lib/posts/retry-kind";
import { enqueueRetry } from "@/lib/posts/retry";
export async function POST(request: Request, {params}:{params:Promise<{id:string}>}) {
  const db=await createClient();
  const {data:{user}}=await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
 const capped = await capUser(user.id, "correct"); if (capped) return capped;
  const {id}=await params;
  const owned = await db.from("posts").select("id,status,analysis_initialized_at").eq("id",id).eq("user_id",user.id).maybeSingle();
  if(owned.error)return NextResponse.json({error:"Could not retry."},{status:500});
  if(!owned.data||owned.data.status!=="failed")return NextResponse.json({error:"Failed post not found."},{status:409});
  const admin=createAdminClient();
  const failed=await admin.from("jobs").select("kind,payload").eq("post_id",id).eq("status","error")
    .order("finished_at",{ascending:false,nullsFirst:false}).order("created_at",{ascending:false}).order("id",{ascending:false}).limit(1).maybeSingle();
  if(failed.error)return NextResponse.json({error:"Could not identify failed work."},{status:500});
  const kind=retryKind(failed.data?.kind, owned.data.analysis_initialized_at != null);
  if(!kind)return NextResponse.json({error:"The failed work could not be identified."},{status:409});
  // Re-running analyze after an edit would discard the user's corrected items.
  // A fresh correction job reads its durable applied-message cursor itself.
  const previous=failed.data?.payload;
  const removal=kind==='recompute'&&(previous?.reason==='media_removed'||previous?.reason==='correction_reverted')?{
    reason:previous.reason,...(typeof previous.comment_id==='string'?{comment_id:previous.comment_id}:{}),
    ...(typeof previous.media_position==='number'?{media_position:previous.media_position}:{}),
    ...(previous.removal_rebuilt===true?{removal_rebuilt:true}:{}),
  }:undefined;
  const result=await enqueueRetry(admin,{postId:id,userId:user.id,kind,payload:removal});
  if(result==="conflict") return NextResponse.json({error:"Failed post not found."},{status:409});
  if(result==="error") return NextResponse.json({error:"Could not queue retry."},{status:500});
  after(async()=>{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10000)});});
  return new Response(null,{status:204});
}
