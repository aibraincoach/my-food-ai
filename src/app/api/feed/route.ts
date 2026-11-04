import { cookies } from "next/headers";
import { validDate, validZone } from "@/lib/posts/days";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeed, getPostCards, FEED_PAGE_SIZE } from "@/lib/posts/feed";
import { parseFeedCursor } from "@/lib/posts/feed-cursor";
export const maxDuration = 20;
export async function GET(request: Request) {
  const started = Date.now();
  const headers = {"Cache-Control":"private, no-store"};
  try {
    const db = await createClient(AbortSignal.timeout(12000));
    let authTimer: ReturnType<typeof setTimeout> | undefined;
    let auth;
    try { auth = await Promise.race([db.auth.getUser(), new Promise<never>((_,reject)=>{authTimer=setTimeout(()=>reject(new Error('Authentication timed out.')),8000);})]); }
    finally { if (authTimer) clearTimeout(authTimer); }
    console.info("auth verify api/feed");
    const {data:{user}, error} = auth;
    console.info(`feed read auth ${Date.now() - started}`);
    if(error || !user) return NextResponse.json({error:"Sign in required."},{status:401,headers});
    const params = new URL(request.url).searchParams;
    const before = params.get("cursor") ?? params.get("before");
    try { if (before !== null) parseFeedCursor(before); }
    catch { return NextResponse.json({error:"Invalid cursor."},{status:400,headers}); }
    const rawLimit = params.get('limit');
    const limit = rawLimit === null ? FEED_PAGE_SIZE : Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1 || limit > FEED_PAGE_SIZE) return NextResponse.json({error:'Invalid page size.'},{status:400,headers});
    const zone = validZone(params.get("tz") ?? (await cookies()).get("time-zone")?.value);
    const rawIds=params.get('ids');
    if(rawIds!==null){
      const ids=[...new Set(rawIds.split(','))];
      if(!ids.length||ids.length>50||ids.some(id=>!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)))return NextResponse.json({error:'Invalid meal IDs.'},{status:400,headers});
      return NextResponse.json({posts:await getPostCards(db,ids,zone)},{headers});
    }
    const knownDays = params.has('known_days') ? [...new Set(params.get('known_days')!.split(','))] : [];
    if (knownDays.length > 120 || knownDays.some(day => !validDate(day))) return NextResponse.json({error:'Invalid known dates.'},{status:400,headers});
    // These dates only omit optional totals already held by this browser.
    // Ownership and all meal/hydration reads remain authenticated as above.
    return NextResponse.json(await getFeed(db,user.id,before,zone,limit,{knownDays}),{headers});
  } catch {
    return NextResponse.json({error:'The feed could not be loaded.'},{status:503,headers});
  } finally { console.info(`feed read total ${Date.now() - started}`); }
}
