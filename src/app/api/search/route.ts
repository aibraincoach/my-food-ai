import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {searchPosts} from "@/lib/search/query";
export async function GET(request:Request) {
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const params=new URL(request.url).searchParams;
  const query=params.get("q")?.trim();
  const cookieZone=request.headers.get("cookie")?.split(";").map(value=>value.trim()).find(value=>value.startsWith("time-zone="))?.slice("time-zone=".length);
  const zone=params.get("tz")??cookieZone;
  if(!query||query.length>500) return NextResponse.json({error:"Enter a search of up to 500 characters."},{status:400});
  try{return NextResponse.json(await searchPosts(db,query,zone),{headers:{"Cache-Control":"private, no-store"}});}
  catch{return NextResponse.json({error:"Search could not be completed."},{status:503});}
}
