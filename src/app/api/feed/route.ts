import { cookies } from "next/headers";
import { validZone } from "@/lib/posts/days";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeed } from "@/lib/posts/feed";
import { parseFeedCursor } from "@/lib/posts/feed-cursor";
export async function GET(request: Request) {
  const db = await createClient();
  const {data:{user}} = await db.auth.getUser();
  if(!user) return NextResponse.json({error:"Sign in required."},{status:401});
  const params = new URL(request.url).searchParams;
  // Keep the old parameter name for clients holding a newly issued opaque cursor.
  // Timestamp-only cursors cannot preserve ties and must start a fresh page.
  const before = params.get("cursor") ?? params.get("before");
  try { if (before !== null) parseFeedCursor(before); }
  catch { return NextResponse.json({error:"Invalid cursor."},{status:400}); }
  const zone = validZone(params.get("tz") ?? (await cookies()).get("time-zone")?.value);
  return NextResponse.json(await getFeed(db,user.id,before,zone),{headers:{"Cache-Control":"private, no-store"}});
}
