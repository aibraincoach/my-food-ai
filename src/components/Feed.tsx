"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEED_PAGE_SIZE, VISIBLE_MEAL_FILTER, getPostCard, type FeedPost } from "@/lib/posts/feed";
import { tokens } from "@/lib/theme/tokens";
import DayHeader from "@/components/DayHeader";
import { dateInZone, shiftDay, getDayTotals, type FeedDayTotal } from "@/lib/posts/days";
import {useUploads} from "@/components/useUploads";
import {uploadManager,type UploadState} from "@/lib/posts/upload-manager";
import PostCard from "@/components/PostCard";
import RealtimePost from "@/components/RealtimePost";
import { mergeFeedPosts, discoveryLostOverlap } from "@/lib/posts/feed-order";

import {useCachedFeed} from "@/components/useCachedFeed";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; posts: FeedPost[]; days: FeedDayTotal[] };
const DISCOVERY_INTERVAL_MS = 2000;
const RETRY_INTERVAL_MS = 1000;

// Home discovers new rows independently of the optional Realtime connection.
// Per-card refreshes remain in RealtimePost, so discovery fetches only IDs.
export default function Feed() {
  const router = useRouter();
  const [cacheUserId, setCacheUserId] = useState<string | null>(null);
  const cache = useCachedFeed(cacheUserId);
  const cacheRef = useRef(cache);
  useEffect(() => { cacheRef.current = cache; }, [cache]);
  const retryInitial = useRef<() => void>(() => {});
  const cachedListener = useRef<(posts: FeedPost[]) => void>(() => {});
  useEffect(() => { if (cache.cached) cachedListener.current(cache.cached); }, [cache.cached]);
  const uploads=useUploads().filter(upload=>upload.posted);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = useRef<() => void>(()=>{});
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pageError, setPageError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayTotals = new Map<string, FeedDayTotal>();
    const uploadDaysToRead=new Set(uploadManager.list().filter(upload=>upload.posted).map(upload=>dateInZone(upload.eatenAt,zone)));
    let totalsGeneration = 0;
    const mergeDays = (days: FeedDayTotal[]) => { for (const day of days) dayTotals.set(day.day, day); };
    let live = true;
    let userId: string | null = null;
    let discovering = false;
    let baseline: FeedPost[] = [];
    let loaded = false;
    let initialLoading = true;
    let cursor: string | null = null;
    let loadingMore = false;
    let generation = 0;
    const unavailable = new Set<string>();
    const answered = new Set<string>();
    const cards = new Map<string, FeedPost>();
    const newest: string[] = [];
    const pending = new Map<string, { again: boolean; retries: number }>();
    const deferred = new Map<string, number>();
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const publish = () => {
      if (!live) return;
      // A late initial load must not erase cards received while it was in flight.
      const promoted = newest.flatMap((id) => cards.has(id) ? [cards.get(id)!] : []);
      const posts = mergeFeedPosts(baseline, promoted).filter(post=>!unavailable.has(post.id)&&post.status!=="needs_input"&&(!answered.has(post.id)||post.status==="ready"||post.status==="failed"));
      if (loaded || promoted.length) setState({ kind: "ready", posts, days: [...dayTotals.values()] });
    };

    const refreshTotals = async (dates: string[]) => {
      if (!userId) return;
      const version = ++totalsGeneration;
      try {
        const days = await getDayTotals(supabase, userId, zone, dates);
        if (!live || version !== totalsGeneration) return;
        mergeDays(days); publish();
      } catch { /* Keep the last complete totals; the next readiness event retries. */ }
    };
    const uploading=(event:Event)=>{const detail=(event as CustomEvent<UploadState>).detail;if(detail.posted){const day=dateInZone(detail.eatenAt,zone);if(!uploadDaysToRead.has(day)){uploadDaysToRead.add(day);void refreshTotals([day]);}}};
    window.addEventListener('upload-started',uploading);
    const readyEvent = (event:Event) => { const id=(event as CustomEvent<{id?:string}>).detail?.id;if(id)requestCard(id); };
    window.addEventListener("post-ready", readyEvent);
    const removeCard = (id:string) => {
      const interrupted=[...pending.keys()].filter(other=>other!==id);
      const removed = cards.get(id) ?? baseline.find(post => post.id === id);
      deferred.delete(id);
      unavailable.add(id);generation++;
      baseline=baseline.filter(post=>post.id!==id);cards.delete(id);
      const index=newest.indexOf(id);if(index>=0)newest.splice(index,1);
      // Old pages cannot resurrect a hidden card. Restart unrelated reads:
      // settled meals may be older than the bounded discovery window.
      pending.clear();for(const retry of timers)clearTimeout(retry);timers.clear();
      loadingMore=false;publish();if(removed)void refreshTotals([dateInZone(removed.eaten_at,zone)]);
      for(const other of interrupted)requestCard(other);
    };
    const unavailableEvent=(event:Event)=>{
      const id=(event as CustomEvent<{id?:unknown}>).detail?.id;
      if(typeof id==="string"&&id)removeCard(id);
    };
    window.addEventListener("post-unavailable",unavailableEvent);
    window.addEventListener("post-deleted",unavailableEvent);

    const restore = (event: Event) => {
      const detail = (event as CustomEvent<{id?: string; post?: FeedPost}>).detail;
      if (!detail?.id) return;
      if (!detail.post) { unavailable.delete(detail.id); requestCard(detail.id); return; }
      if (detail.id !== detail.post.id) return;
      unavailable.delete(detail.id); cards.set(detail.id, detail.post);
      baseline = mergeFeedPosts(baseline, [detail.post]); publish();
      void refreshTotals([dateInZone(detail.post.eaten_at, zone)]);
    };
    window.addEventListener('post-restore', restore);

    const requestCard = (id: string, local = false) => {
      if (!live) return;
      if (local || !newest.includes(id)) {
        const index = newest.indexOf(id);
        if (index >= 0) newest.splice(index, 1);
        newest.unshift(id);
      }
      const active = pending.get(id);
      if (active) { active.again = true; return; }
      deferred.delete(id);
      const requestGeneration = generation;
      const request = { again: false, retries: 0 };
      pending.set(id, request);
      const fetchCard = async () => {
        if (!live || requestGeneration !== generation) return;
        request.again = false;
        try {
          const card = await getPostCard(supabase, id);
          if (!live || requestGeneration !== generation) return;
          if(!card||card.status==="needs_input"){removeCard(id);return;}
          if(answered.has(id)&&card.status!=="ready"&&card.status!=="failed"){
            pending.delete(id);deferred.set(id,Date.now()+15_000);return;
          }
          if(card.status==="ready"||card.status==="failed")answered.delete(id);
          unavailable.delete(id);
          card.day = dateInZone(card.eaten_at, zone);
          const previous = cards.get(id) ?? baseline.find(post => post.id === id);
          cards.set(id, card);
          void refreshTotals([...new Set([card.eaten_at, ...(previous ? [previous.eaten_at] : [])].map(value => dateInZone(value, zone)))]);
          publish();
          // A local completion event can arrive while the INSERT read still
          // sees unuploaded media. Always read again after that event.
          if (request.again) { void fetchCard(); return; }
          pending.delete(id);
        } catch {
          if (!live || requestGeneration !== generation) return;
          if (request.retries++ < 3) {
            const timer = setTimeout(() => { timers.delete(timer); void fetchCard(); }, RETRY_INTERVAL_MS);
            timers.add(timer);
          } else {
            pending.delete(id);
            // Older settled meals may never reappear in the discovery window.
            deferred.set(id,Date.now()+15_000);
          }
        }
      };
      void fetchCard();
    };

    const created = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string" && id) requestCard(id, true);
    };
    // Register before starting the initial asynchronous load.
    window.addEventListener("post-created", created);
    const finished=(event:Event)=>{const detail=(event as CustomEvent<UploadState>).detail;if(detail.postId)requestCard(detail.postId,true);};
    window.addEventListener("upload-finished",finished);
    window.addEventListener("post-updated", created);
    window.addEventListener("media-removed",created);
    window.addEventListener("correction-reverted",created);
    const resume=(event:Event)=>{
      const id=(event as CustomEvent<{id?:unknown}>).detail?.id;
      if(typeof id==="string"&&id){answered.add(id);removeCard(id);}
    };
    window.addEventListener("post-answer-resume",resume);
    window.addEventListener("post-settled",created);

    const readPage = async (before: string | null, limit = FEED_PAGE_SIZE) => {
      const params = new URLSearchParams({tz: zone, limit: String(limit)});
      if (before) params.set('cursor', before);
      const response = await fetch(`/api/feed?${params}`, {signal: AbortSignal.timeout(15000), cache: 'no-store'});
      if (response.status === 401) { router.replace('/sign-in'); throw new Error('Sign in required.'); }
      if (!response.ok) throw new Error('Feed could not be loaded.');
      return await response.json() as {posts: FeedPost[]; nextCursor: string | null; days: FeedDayTotal[]};
    };
    cachedListener.current = posts => {
      if (!live || loaded || !userId) return;
      baseline = posts; loaded = true; publish();
      // Cached cards are visible, but the fresh first load still owns pagination.
      loaded = false;
    };
    const load = async () => {
      initialLoading = true;
      const loadGeneration=generation;
      try {
        const { data: {session} } = await supabase.auth.getSession();
        userId = session?.user.id ?? null;
        setCacheUserId(userId);
        const user = session?.user;
        if (!live) return;
        if (!user) { router.replace("/sign-in"); return; }
        userId = user.id;
        const page = await readPage(null,6);
        if(!live||loadGeneration!==generation)return;
        mergeDays(page.days);
        baseline = page.posts.filter(post=>!unavailable.has(post.id));
        cacheRef.current.save(baseline);
        cursor = page.nextCursor;
        loaded = true;
        publish();
        if(uploadDaysToRead.size)void refreshTotals([...uploadDaysToRead]);
      } catch {
        if (live && !cards.size && !baseline.length) setState({ kind: "error" });
      } finally { initialLoading = false; }
    };

    retryInitial.current = () => { void load(); };
    loadMore.current = () => {
      if(!cursor || loadingMore || !live) return;
      loadingMore=true;
      const pageGeneration = generation;
      setPageError(false);
      void readPage(cursor).then(page=>{
        if(!live || pageGeneration !== generation) return;
        mergeDays(page.days);
        baseline = mergeFeedPosts(baseline, page.posts.filter(post=>!unavailable.has(post.id)));
        cursor=page.nextCursor;
        publish();
      }).catch(()=>{if(live && pageGeneration === generation)setPageError(true);}).finally(()=>{if(pageGeneration === generation)loadingMore=false;});
    };
    const discover = async (retryNow=false) => {
      if (!live || initialLoading || discovering || document.hidden) return;
      discovering = true;
      const discoveryGeneration=generation;
      try {
        for(const [id,due] of deferred)if(retryNow||due<=Date.now())requestCard(id);
        if (!loaded) { await load(); return; }
        if (!userId) return;
        const { data, error } = await supabase.from("posts").select("id")
          .eq("user_id", userId).neq("status", "needs_input").or(VISIBLE_MEAL_FILTER).order("created_at", { ascending: false })
          .order("id", { ascending: false }).limit(FEED_PAGE_SIZE);
        if (!live || error || discoveryGeneration!==generation) return;
        // A full discovery window without any baseline overlap can hide a
        // gap larger than one page after an outage (or an initially empty feed).
        // Restart pagination from the fresh first page; the old cursor would
        // otherwise skip that gap forever. In-flight old reads cannot restore it.
        // Discovery lists the newest-created meals while the baseline is ordered by when they were eaten, so a
        // hydrated back-dated card counts as known: overlap is judged against baseline and cards together.
        if (discoveryLostOverlap([...baseline, ...cards.values()], data ?? [], FEED_PAGE_SIZE)) {
          const page = await readPage(null,6);
          if (!live || discoveryGeneration!==generation) return;
          // A promoted read may have completed while the page was loading.
          // Refresh it after installing the page too, even outside this window.
          // Newly created meals (possibly back-dated beyond this page) are hydrated by id, never skipped.
          const interrupted=[...new Set([...pending.keys(),...newest,...(data ?? []).map((row)=>row.id)])];
          generation++;
          for(const post of page.posts)if(post.status!=="needs_input")unavailable.delete(post.id);
          // Keep what the reader has already loaded; only the traversal restarts.
          mergeDays(page.days);
          baseline = mergeFeedPosts(baseline.filter(post=>!unavailable.has(post.id)), page.posts.filter(post=>!unavailable.has(post.id)));
          cursor = page.nextCursor;
          cards.clear(); newest.length = 0; pending.clear();
          loadingMore = false;
          setPageError(false);
          publish();
          for(const id of interrupted)requestCard(id);
          return;
        }
        // Visit oldest first: newly discovered rows are prepended in order.
        for (const row of [...(data ?? [])].reverse()) {
          unavailable.delete(row.id);
          if (!cards.has(row.id) && !baseline.some((post) => post.id === row.id) && !pending.has(row.id)) {
            requestCard(row.id);
          }
        }
      } catch {
        // A transient discovery failure is retried on the next visible tick.
      } finally { discovering = false; }
    };
    void load();
    const timer = setInterval(() => { void discover(); }, DISCOVERY_INTERVAL_MS);
    const focus = () => { void discover(true); };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const channel = supabase.channel("feed-inserts").on("postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload) => { const id = (payload.new as { id?: string }).id; if (id) requestCard(id); }
    ).subscribe();

    return () => {
      live = false;
      cachedListener.current = () => {};
      window.removeEventListener("post-restore", restore);
      window.removeEventListener("post-ready", readyEvent);
      window.removeEventListener('upload-started',uploading);
      clearInterval(timer);
      for (const retry of timers) clearTimeout(retry);
      window.removeEventListener("post-created", created);
      window.removeEventListener("upload-finished",finished);
      window.removeEventListener("post-updated", created);
      window.removeEventListener("media-removed",created);
      window.removeEventListener("correction-reverted",created);
      window.removeEventListener("post-answer-resume",resume);
      window.removeEventListener("post-settled",created);
      window.removeEventListener("post-unavailable",unavailableEvent);
      window.removeEventListener("post-deleted",unavailableEvent);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    const publish = () => window.dispatchEvent(new CustomEvent("feed-state", {
      detail: { empty: state.kind === "ready" && state.posts.length === 0 },
    }));
    window.addEventListener("feed-state-request", publish);
    publish();
    return () => window.removeEventListener("feed-state-request", publish);
  }, [state]);

  useEffect(()=>{
    if(!sentinel.current) return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)) loadMore.current();});
    observer.observe(sentinel.current);
    return ()=>observer.disconnect();
  },[state]);

  const uploadDays=new Set<string>();
  const localCards=uploads.map(upload=>{const server=state.kind==='ready'?state.posts.find(post=>post.id===upload.postId):undefined;const seed:FeedPost=server??{id:upload.postId??upload.operationId,caption:upload.caption,eaten_at:upload.eatenAt,created_at:upload.eatenAt,status:"queued",photoUrl:upload.previewUrl,slides:[],items:[]};const zone=Intl.DateTimeFormat().resolvedOptions().timeZone;const day=dateInZone(seed.eaten_at,zone);const header=!uploadDays.has(day);const measured=state.kind==='ready'?state.days.find(value=>value.day===day):undefined;const measuredTotal=measured?{...measured,ready:measured.ready||measured.kcal===0}:undefined;if(header)uploadDays.add(day);return <UploadHydratedCard key={upload.operationId} post={seed} upload={upload} header={header?<DayHeader day={day} zone={zone} empty={false} total={measuredTotal}/>:null}/>;});
  if (state.kind === "loading"&&localCards.length)return <div>{localCards}{null}</div>;
  if (state.kind === "loading") return <p className="px-screen-x text-detail text-muted" role="status">Loading feed…</p>;
  if (state.kind === "error") return <div>{localCards}<p className="px-screen-x text-detail text-muted" role="alert">The feed could not be loaded.</p><button type="button" className="min-h-tap px-screen-x text-text" onClick={() => retryInitial.current()}>Try again</button></div>;
  if (!state.posts.length&&localCards.length)return <div>{localCards}{null}</div>;
  if (!state.posts.length) return <div className="flex flex-1 items-center justify-center" style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 3 }}>
    <p className="text-sheet-title font-normal text-muted">Post your first meal</p>
  </div>;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const groups = new Map<string, FeedPost[]>();
  for (const post of state.posts.filter(post=>!uploads.some(upload=>upload.postId===post.id))) {
    const day = dateInZone(post.eaten_at, zone);
    groups.set(day, [...(groups.get(day) ?? []), post]);
  }
  const listed = [...groups.keys()].sort().reverse();
  const days: string[] = [];
  if(listed.length)for (let day = listed[0]; day >= listed.at(-1)!; day = shiftDay(day, -1)) days.push(day);
  const totals = new Map(state.days.map(day => [day.day, day]));
  return <div className="flex flex-col">
    {localCards}
    {days.map(day => <section key={day} aria-label={day} className="relative pb-card-gap">
      {!uploadDays.has(day)&&<DayHeader day={day} zone={zone} empty={!groups.has(day)} total={totals.get(day)} />}
      {groups.has(day) ? <div className="flex flex-col gap-card-gap pt-sheet-top">{groups.get(day)!.map((post) => <div key={uploads.find(upload=>upload.postId===post.id)?.operationId??post.id} data-desktop-post={post.id} tabIndex={-1}><RealtimePost initial={post} renderCard={(fresh) => <PostCard priority={state.posts[0]?.id === post.id} post={fresh} upload={uploads.find(upload=>upload.postId===post.id)}
         />} /></div>)}</div> : null}
    </section>)}
    {pageError ? <div className="px-screen-x text-detail text-muted" role="alert">
      <p>More meals could not be loaded.</p>
      <button type="button" className="min-h-tap text-text" onClick={() => loadMore.current()}>Try again</button>
    </div> : null}
    <div ref={sentinel} className="h-tap" aria-hidden="true" />
  </div>;
}

function UploadHydratedCard({post,upload,header}:{post:FeedPost;upload:UploadState;header:import("react").ReactNode}) {
  const [fresh,setFresh]=useState<FeedPost|null>(null);
  const lastStatus=useRef(post.status);
  useEffect(()=>{
    const id=upload.postId;
    if(!id)return;
    const db=createClient();
    let live=true,inFlight=false,again=false,missing=0,step=0;
    let timer:ReturnType<typeof setTimeout>|null=null;
    const delays=[2000,5000,10000,30000];
    const read=async()=>{
      if(!live)return;
      if(inFlight){again=true;return;}
      if(timer){clearTimeout(timer);timer=null;}
      inFlight=true;
      let unsettled=true;
      try {
        const card=await getPostCard(db,id);
        if(!live)return;
        if(!card||card.status==='needs_input'){
          if(card||++missing>=3){
            live=false;
            void uploadManager.remove(upload.operationId);
            window.dispatchEvent(new CustomEvent('post-unavailable',{detail:{id}}));
            return;
          }
        } else {
          missing=0;setFresh(card);
          if(card.status==='ready'&&lastStatus.current!=='ready')window.dispatchEvent(new CustomEvent('post-ready',{detail:{id}}));
          lastStatus.current=card.status;
          unsettled=!((card.status==='ready'&&card.slides.some(slide=>slide.kind==='card'))||card.status==='failed');
        }
      } catch { /* Realtime or the bounded-rate fallback retries a transient read. */ }
      finally {
        inFlight=false;
        if(live){
          if(again){again=false;void read();}
          else if(unsettled)timer=setTimeout(()=>{void read();},delays[Math.min(step++,delays.length-1)]);
        }
      }
    };
    const refresh=()=>{step=0;void read();};
    const visible=()=>{if(!document.hidden)refresh();};
    const changed=(event:Event)=>{if((event as CustomEvent<{id?:string}>).detail?.id===id)refresh();};
    const channel=db.channel(`upload-post-${id}`).on('postgres_changes',{
      event:'UPDATE',schema:'public',table:'posts',filter:`id=eq.${id}`,
    },refresh).subscribe();
    window.addEventListener('online',refresh);window.addEventListener('focus',refresh);
    window.addEventListener('post-updated',changed);document.addEventListener('visibilitychange',visible);
    void read();
    return()=>{
      live=false;if(timer)clearTimeout(timer);
      window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);
      window.removeEventListener('post-updated',changed);document.removeEventListener('visibilitychange',visible);
      void db.removeChannel(channel);
    };
  },[post.id,upload.postId,upload.operationId]);
  return <div data-desktop-post={upload.postId??upload.operationId} tabIndex={-1}>{header}<PostCard post={fresh??post} upload={upload}/></div>;
}
