import {after,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/posts/items";
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Sign in required."},{status:401});
  const {id}=await params;if(!isUuid(id))return new Response(null,{status:404});
  const {data:post,error}=await db.from("posts").select("id").eq("id",id).eq("user_id",user.id).eq("status","needs_input").maybeSingle();
  if(error)return new Response(null,{status:500});if(!post)return new Response(null,{status:404});
  const admin=createAdminClient(),bucket=admin.storage.from("media");
  try{
    const paths:string[]=[];
    const walk=async(prefix:string)=>{
      for(let offset=0;;offset+=100){
        const {data,error}=await bucket.list(prefix,{limit:100,offset,sortBy:{column:"name",order:"asc"}});
        if(error)throw error;
        for(const entry of data??[]){const path=`${prefix}/${entry.name}`;if(entry.id)paths.push(path);else await walk(path);}
        if(!data||data.length<100)break;
      }
    };
    await walk(`${user.id}/${id}`);
    // The detached cleanup job and conditional post deletion commit together.
    // Its NULL post_id keeps the durable paths alive after cascading deletion.
    const removed=await admin.rpc("discard_post",{p_post_id:id,p_user_id:user.id,p_paths:paths});
    if(removed.error)throw removed.error;
    if(!removed.data)return NextResponse.json({error:"Meal changed before it could be discarded."},{status:409});
    after(async()=>{try{await fetch(new URL("/api/jobs/tick",request.url),{cache:"no-store",signal:AbortSignal.timeout(10_000)});}catch{/* The durable job remains available to the next tick. */}});
    return new Response(null,{status:204});
  }catch{return NextResponse.json({error:"Meal could not be discarded."},{status:500});}
}
