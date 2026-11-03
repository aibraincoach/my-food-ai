import DesktopWorkspace from '@/components/DesktopWorkspace';
import PostDetail from '@/components/PostDetail';
import SavedMealsButton from '@/components/SavedMealsButton';
import { connection } from "next/server";
import { Suspense } from "react";
import {preload} from "react-dom";
import {getFeed} from "@/lib/posts/feed";
import NeedsInputStrip from "@/components/NeedsInputStrip";
import Feed from "@/components/Feed";
import DayRings from "@/components/DayRings";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";

async function HomeDays() {
  await connection();
  const cookieZone = (await cookies()).get("time-zone")?.value;
  const zone = validZone(cookieZone);
  const today = dateInZone(new Date(), zone);
  let days: {date: string}[] = [];
  let totals: import("@/lib/posts/days").FeedDayTotal[] = [];
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    [days, totals] = user ? await Promise.all([
      getLoggedDates(supabase, user.id, zone, shiftDay(today, -4), today),
      getDayTotals(supabase,user.id,zone,Array.from({length:5},(_,index)=>shiftDay(today,-index))),
    ]) : [[], []];
  } catch { /* Optional day reads must not take down Home. */ }
  return <DayRings days={days} totals={totals} today={today} zone={zone} zoneKnown={Boolean(cookieZone)} />;
}

// Stream real first-card markup before downloading and hydrating the client
// bundle. Optional day/hydration summaries are filled by the HTTP revalidation.
async function HomeFeed() {
  await connection();
  let initialPage: Awaited<ReturnType<typeof getFeed>> | undefined;
  let initialUserId: string | undefined;
  try {
    const db = await createClient();
    const {data: {user}} = await db.auth.getUser();
    if (user) {
      initialUserId = user.id;
      const zone = validZone((await cookies()).get('time-zone')?.value);
      initialPage = await getFeed(db, user.id, null, zone, 6, {summaries: false});
      const photo = initialPage.posts[0]?.photoUrl;
      if (photo) preload(photo, {as: 'image', fetchPriority: 'high'});
    }
  } catch { /* The client boundary can retry while the shell stays visible. */ }
  return <Feed initialPage={initialPage} initialUserId={initialUserId} />;
}

export default async function Home({searchParams}:{searchParams:Promise<{post?:string}>}) {
  const {post}=await searchParams;
  return <DesktopWorkspace detail={post?<PostDetail id={post}/>:undefined}><main className="flex flex-1 flex-col">
    <header className="desktop:hidden sticky top-0 z-20 flex h-top-safe items-center bg-surface px-inset"><h1 className="flex-1 text-title">My Food AI</h1><SavedMealsButton/></header>
    <NeedsInputStrip />
    <Suspense fallback={<div className="h-bar-h" />}><HomeDays /></Suspense>
    <Suspense fallback={<p className="px-screen-x text-detail text-muted">Loading feed…</p>}>
      <HomeFeed />
    </Suspense>
  </main></DesktopWorkspace>;
}
