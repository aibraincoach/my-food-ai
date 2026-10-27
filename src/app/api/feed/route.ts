import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeed } from "@/lib/posts/feed";
export async function GET(request: Request) {
  const db = await createClient();
  const {data:{user}} = await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const before = new URL(request.url).searchParams.get("before");
  if(before && !Number.isFinite(Date.parse(before))) return NextResponse.json({error:"Invalid cursor."},{status:400});
  return NextResponse.json(await getFeed(db,user.id,before),{headers:{"Cache-Control":"private, no-store"}});
}
