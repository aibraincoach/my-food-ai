import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {searchPosts} from "@/lib/search/query";
export async function GET(request:Request) {
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const query=new URL(request.url).searchParams.get("q")?.trim();
  if(!query||query.length>500) return NextResponse.json({error:"Enter a search of up to 500 characters."},{status:400});
  try{return NextResponse.json({posts:await searchPosts(db,query)},{headers:{"Cache-Control":"private, no-store"}});}
  catch{return NextResponse.json({error:"Search could not be completed."},{status:503});}
}
