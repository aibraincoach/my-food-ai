/* eslint-disable @next/next/no-img-element -- Private signed photos bypass paid optimization. */
import { verifiedUserId } from "@/lib/auth/verified-user";
import CleanFreshMarker from "@/components/CleanFreshMarker";
import DesktopToday from '@/components/DesktopToday';
import DesktopWorkspace from '@/components/DesktopWorkspace';
import PostDetail from '@/components/PostDetail';
import PostOpenFrame from '@/components/PostOpenFrame';
import SavedMealsButton from '@/components/SavedMealsButton';
import { connection } from "next/server";
import { cache, Suspense } from "react";
import {preload} from "react-dom";
import Link from "next/link";
import {getFeed, getFirstFeedPhoto} from "@/lib/posts/feed";
import NeedsInputStrip from "@/components/NeedsInputStrip";
import Feed, {CachedFeedFallback} from "@/components/Feed";
import DayHeader from "@/components/DayHeader";
import DayRings from "@/components/DayRings";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dateInZone, getDayTotals, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";

// React's server cache is request-scoped: all Home streams share one Auth
// check and one cancellable owner client, never another visitor's session.
const homeReader = cache(async () => {
  const db=await createClient(AbortSignal.timeout(8000));
  const verified = await verifiedUserId();
  const user = verified ? {id: verified} : (await db.auth.getUser()).data.user;
  return {db,user};
});

async function homeDeadline<T>(read: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([read, new Promise<T>((_, reject) => {timer = setTimeout(() => reject(new Error('Home read timed out.')), 8000);})]); }
  finally { if (timer) clearTimeout(timer); }
}

// Both streams await the same request-scoped totals promise. Failed optional
// totals remain unavailable and are not cached across visitors or navigations.
const homeDayTotals = cache(async () => {
  const zone = validZone((await cookies()).get("time-zone")?.value);
  const today = dateInZone(new Date(), zone);
  const {db, user} = await homeReader();
  if (!user) return [];
  const started = Date.now();
  try {
    return await homeDeadline(getDayTotals(db, user.id, zone, Array.from({length: 5}, (_, index) => shiftDay(today, -index))));
  } finally { console.info(`feed read day-totals ${Date.now() - started}`); }
});

async function HomeDays() {
  await connection();
  const cookieZone = (await cookies()).get("time-zone")?.value;
  const zone = validZone(cookieZone);
  const today = dateInZone(new Date(), zone);
  let days: {date: string}[] = [];
  let totals: import("@/lib/posts/days").FeedDayTotal[] = [];
  let ownerId: string | null = null;
  try {
    [days, totals, ownerId] = await homeDeadline((async () => {
      const {db:supabase,user} = await homeReader();
      const [logged,readTotals] = user ? await Promise.all([
        getLoggedDates(supabase, user.id, zone, shiftDay(today, -4), today),
        homeDayTotals(),
      ]) : [[], []] as [{date: string}[], import('@/lib/posts/days').FeedDayTotal[]];
      return [logged,readTotals,user?.id??null] as [{date:string}[],import('@/lib/posts/days').FeedDayTotal[],string|null];
    })());
  } catch { /* Optional day reads must not take down Home. */ }
  return <DayRings ownerId={ownerId} days={days} totals={totals} today={today} zone={zone} zoneKnown={Boolean(cookieZone)} />;
}

// A separately streamed owner snapshot paints before the full nutrition
// read; a later page reconciles newer posts without mixing their nutrition.
async function HomeFirstPhoto() {
  await connection();
  let first: Awaited<ReturnType<typeof getFirstFeedPhoto>> = null;
  try {
    first = await homeDeadline((async () => {
      const {db,user}=await homeReader();
      return user?getFirstFeedPhoto(db,user.id):null;
    })());
  } catch { /* The normal feed boundary and cache remain available. */ }
  if(!first)return null;
  const zone=validZone((await cookies()).get('time-zone')?.value);
  if(first.photoUrl)preload(first.photoUrl,{as:'image',fetchPriority:'high',crossOrigin:'anonymous'});
  return <div data-fast-feed-seed className="relative pb-card-gap">
    <DayHeader day={dateInZone(first.eaten_at,zone)} zone={zone} empty={false}/><div className="pt-sheet-top">
    <div className="flex h-[52px] items-center gap-[10px] px-inset" aria-hidden="true"><span className="size-8 rounded-circle bg-card"/><span className="h-3 w-24 rounded-field bg-card"/></div>
    {first.photoUrl?<Link href={`/posts/${first.id}`} aria-label="Open meal details" className="block aspect-square">
      <img crossOrigin="anonymous" src={first.photoUrl} width={1080} height={1080} fetchPriority="high" loading="eager" decoding="async" alt={first.caption||'Meal photo'} className="size-full object-cover"/>
    </Link>:null}
    <div className="px-inset py-sheet-top">{first.caption?<p className="text-body">{first.caption}</p>:null}<p className="text-detail text-muted" role="status">Loading meal details…</p></div></div>
  </div>;
}

// Stream real first-card markup before downloading and hydrating the client
// bundle. Optional day/hydration summaries are filled by the HTTP revalidation.
async function HomeFeed() {
  await connection();
  let initialPage: Awaited<ReturnType<typeof getFeed>> | undefined;
  let initialUserId: string | undefined;
  let initialZone = "UTC";
  try {
    const seed = await homeDeadline((async () => {
      const {db,user} = await homeReader();
      if (!user) return undefined;
      const zone = validZone((await cookies()).get('time-zone')?.value);
      const [page, days] = await Promise.all([
        getFeed(db, user.id, null, zone, 6, {knownDays: Array.from({length: 5}, (_, index) => shiftDay(dateInZone(new Date(), zone), -index)), onFirstPhoto: url => preload(url, {as:'image',fetchPriority:'high',crossOrigin:'anonymous'})}),
        homeDayTotals().catch(() => []),
      ]);
      page.days = [...days, ...page.days];
      return {page, userId: user.id, zone};
    })());
    initialPage = seed?.page;
    initialUserId = seed?.userId;
    initialZone = seed?.zone ?? "UTC";
  } catch { /* The client boundary can retry while the shell stays visible. */ }
  return <div data-server-feed-ready={initialPage ? true : undefined}><Feed key={initialUserId ?? 'anonymous'} initialPage={initialPage} initialUserId={initialUserId} initialZone={initialZone} /></div>;
}

async function HomeToday(){await connection();const zone=(await cookies()).get('time-zone')?.value;return <DesktopToday zone={zone}/>;}

export default async function Home({searchParams}:{searchParams:Promise<{post?:string}>}) {
  const {post}=await searchParams;
  return <DesktopWorkspace width={844} detail={post?<Suspense key={post} fallback={<PostOpenFrame id={post} desktopModal/>}><PostDetail id={post} desktopModal/></Suspense>:undefined}><div className="desktop-home-layout desktop:flex desktop:items-start"><main className="flex flex-1 flex-col desktop:w-[500px] desktop:min-w-0 desktop:flex-none"><CleanFreshMarker />
    <header className="desktop:hidden sticky top-0 z-20 flex h-top-safe items-center bg-surface px-inset"><h1 className="flex-1 text-title">My Food AI</h1><SavedMealsButton/></header>
    <NeedsInputStrip />
    <Suspense fallback={<div className="h-bar-h" />}><HomeDays /></Suspense>
    <div data-home-feed>
      <style>{`[data-home-feed]:has([data-server-feed-ready], [data-feed-client-ready]) > [data-cached-feed] { display: none; }
[data-home-feed]:has([data-server-feed-ready], [data-feed-client-ready], [data-cached-feed-ready], [data-feed-error]) [data-fast-feed-seed] { display: none; }
[data-home-feed]:has([data-fast-feed-seed]) > [data-cached-feed]:not(:has([data-cached-feed-ready])) { display: none; }`}</style>
      <div data-cached-feed><CachedFeedFallback /></div>
      <Suspense fallback={null}><HomeFirstPhoto /></Suspense>
      <Suspense fallback={null}><HomeFeed /></Suspense>
    </div>
  </main><Suspense fallback={null}><HomeToday/></Suspense></div></DesktopWorkspace>;
}
