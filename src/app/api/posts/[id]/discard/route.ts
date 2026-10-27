import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {isUuid} from "@/lib/posts/items";
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}) {
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
    // Listing is read-only. Do not remove media until the conditional delete
    // confirms this is still the owner's unanswered clarification post.
    const removed=await admin.from("posts").delete().eq("id",id).eq("user_id",user.id).eq("status","needs_input").select("id").maybeSingle();
    if(removed.error)throw removed.error;
    if(!removed.data)return NextResponse.json({error:"Meal changed before it could be discarded."},{status:409});
    for(let i=0;i<paths.length;i+=100){const {error}=await bucket.remove(paths.slice(i,i+100));if(error)throw error;}
    return new Response(null,{status:204});
  }catch{return NextResponse.json({error:"Meal could not be discarded."},{status:500});}
}
