"use client";

import {dayTotalRefreshDates} from "@/lib/posts/day-total-changes";

import {createDayTotalsRefresh} from "@/lib/posts/day-totals-refresh";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEED_PAGE_SIZE, readFeedDiscovery, hasUnavailableFields, retainCompleteItems, getPostCard, getPendingItems, type FeedPost } from "@/lib/posts/feed";
import { tokens } from "@/lib/theme/tokens";
import DayHeader from "@/components/DayHeader";
import { dateInZone, shiftDay, getDayTotals, type FeedDayTotal } from "@/lib/posts/days";
import {useUploads} from "@/components/useUploads";
import {uploadManager,type UploadState} from "@/lib/posts/upload-manager";
import {uploadTargetsPost} from "@/lib/posts/upload-target";
import PostCard from "@/components/PostCard";
import RealtimePost from "@/components/RealtimePost";
import { mergeFeedPosts, discoveryLostOverlap } from "@/lib/posts/feed-order";

import {claimFeedCacheEvents} from "@/lib/posts/feed-cache-mutations";
import {readFeedCache} from "@/lib/posts/feed-cache";
import {useDeviceTimeZone} from "@/components/LocalTime";
import {useCachedFeed} from "@/components/useCachedFeed";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; posts: FeedPost[]; days: FeedDayTotal[] };
const noServerSeed = () => false;
const hasServerSeed = () => typeof document !== 'undefined' && Boolean(document.querySelector('[data-server-feed-ready], [data-feed-client-ready]'));
function subscribeServerSeed(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document, {childList: true, subtree: true});
  return () => observer.disconnect();
}
// Outside the server Suspense boundary so cache hydration never waits for a
// server request. Retire its DOM as soon as the real seed arrives, including
// keyboard-selectable rows; CSS alone would leave hidden duplicates behind.
export function CachedFeedFallback() {
  const ready = useSyncExternalStore(subscribeServerSeed, hasServerSeed, noServerSeed);
  return ready ? null : <Feed fallbackOnly />;
}

// Home discovers new rows on events and focus; failed channels never start a poll.
// Per-card refreshes remain in RealtimePost, so discovery fetches only IDs.
export default function Feed({initialPage, initialUserId, initialZone = "UTC", fallbackOnly = false}: {initialZone?: string; fallbackOnly?: boolean; initialPage?: {posts: FeedPost[]; days: FeedDayTotal[]; nextCursor: string | null; discoveryIds?: string[]}; initialUserId?: string} = {}) {
  const router = useRouter();
  const deviceZone=useDeviceTimeZone();
  const renderZone=deviceZone||initialZone;
  const [cacheUserId, setCacheUserId] = useState<string | null>(initialUserId ?? null);
  const [freshResponse,setFreshResponse]=useState(Boolean(initialPage));
  const cache = useCachedFeed(cacheUserId);
  const cacheRef = useRef(cache);
  useEffect(() => { cacheRef.current = cache; }, [cache]);
  const retryInitial = useRef<() => void>(() => {});
  const cachedListener = useRef<(posts: FeedPost[], ownerId: string | null) => void>(() => {});
  useEffect(() => { if (cache.cached) cachedListener.current(cache.cached, cache.userId); }, [cache.cached, cache.userId]);
  const [fallbackRetired, setFallbackRetired] = useState<Set<string>>(new Set());
  const draftUploads=useUploads();
  const lostDraft=draftUploads.find(upload=>upload.lostNotice);
  const lostNotice=!fallbackOnly && lostDraft ? <LostDraftNotice key={lostDraft.operationId} upload={lostDraft}/> : null;
  const allUploads=draftUploads.filter(upload=>upload.posted);
  const uploads=allUploads.filter(upload=>!upload.attachment);
  const attachmentUploads=allUploads.filter(upload=>upload.attachment);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = useRef<() => void>(()=>{});
  const kept = useRef<{userId: string | null; posts: FeedPost[]; cursor: string | null}>({userId: null, posts: [], cursor: null});
  const [state, setState] = useState<State>(initialPage ? {kind: "ready", posts: initialPage.posts, days: initialPage.days} : { kind: "loading" });
  const [pageError, setPageError] = useState(false);
  const [cardReadFailed,setCardReadFailed] = useState(false);
  const [reconnectFailed,setReconnectFailed] = useState(false);
  const retryCards = useRef<() => void>(()=>{});

  useEffect(() => {
    if (fallbackOnly) {
      let live = true;
      const retire = (event: Event) => {
        const id = (event as CustomEvent<{id?: unknown}>).detail?.id;
        if (typeof id === 'string') setFallbackRetired(previous => new Set([...previous, id]));
      };
      const restore = (event: Event) => {
        const id = (event as CustomEvent<{id?: unknown}>).detail?.id;
        if (typeof id === 'string') setFallbackRetired(previous => {const next = new Set(previous); next.delete(id); return next;});
      };
      for (const name of ['post-deleted','post-unavailable','post-answer-resume']) window.addEventListener(name,retire);
      window.addEventListener('post-restore',restore);
      void createClient().auth.getSession().then(({data: {session}}) => {
        if (live) setCacheUserId(session?.user.id ?? null);
      }).catch(() => {});
      return () => {
        live = false; cachedListener.current = () => {};
        for (const name of ['post-deleted','post-unavailable','post-answer-resume']) window.removeEventListener(name,retire);
        window.removeEventListener('post-restore',restore);
      };
    }
    const supabase = createClient();
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayTotals = new Map<string, FeedDayTotal>((initialZone === zone ? initialPage?.days ?? [] : []).map(day => [day.day, day]));
    const uploadDaysToRead=new Set(uploadManager.list().filter(upload=>upload.posted&&!upload.attachment).map(upload=>dateInZone(upload.eatenAt,zone)));
    const mergeDays = (days: FeedDayTotal[]) => { for (const day of days) dayTotals.set(day.day, day); };
    let live = true;
    let userId: string | null = initialUserId ?? null;
    let claimedUser: string | null = null;
    let releaseCacheOwner: (()=>void) | undefined;
    if (userId) {claimedUser=userId;releaseCacheOwner=claimFeedCacheEvents(userId);}
    let discovering = false;
    // A re-rendered server page or a revalidation carries only the newest rows; keep the older rows already loaded below it (#688).
    const withOlder = (owner: string | null, page: {posts: FeedPost[]; nextCursor: string | null}) => {
      const last = page.posts.at(-1), prior = kept.current;
      const tail = last && page.nextCursor && owner && prior.userId === owner ? prior.posts.filter(post => post.eaten_at < last.eaten_at || (post.eaten_at === last.eaten_at && post.id < last.id)) : [];
      return tail.length ? {posts: [...page.posts, ...tail], nextCursor: prior.cursor} : {posts: page.posts, nextCursor: page.nextCursor};
    };
    const seeded = initialPage ? withOlder(initialUserId ?? null, initialPage) : null;
    let baseline: FeedPost[] = seeded?.posts ?? [];
    let loaded = Boolean(initialPage);
    let usedServerPage = false;
    let initialLoading = true;
    let cursor: string | null = seeded?.nextCursor ?? null;
    let loadingMore = false;
    let generation = 0;
    let hasFreshPage = false;
    let discoveryKnown: Set<string> | null = null;
    let cacheDirty = false;
    let channelReady = false;
    let lastReconnectRead = -Infinity;
    const failedCards = new Set<string>();
    const cacheInvalidated = new Set<string>();
    const unavailable = new Set<string>();
    const answered = new Set<string>();
    const cards = new Map<string, FeedPost>();
    const newest: string[] = [];
    const pending = new Map<string, { again: boolean }>();
    const deferred = new Map<string, number>();

    const reportTotals = () => { if(live&&userId)window.dispatchEvent(new CustomEvent("feed-day-totals",{detail:{userId,days:[...dayTotals.values()],fresh:hasFreshPage||Boolean(initialPage&&initialUserId===userId)}})); };
    window.addEventListener("feed-day-totals-request",reportTotals);
    const publish = () => {
      if (!live) return;
      if (loaded) kept.current = {userId, posts: baseline, cursor};
      // A late initial load must not erase cards received while it was in flight.
      const promoted = newest.flatMap((id) => cards.has(id) ? [cards.get(id)!] : []);
      const posts = mergeFeedPosts(baseline, promoted).filter(post=>!unavailable.has(post.id)&&post.status!=="needs_input"&&(!answered.has(post.id)||post.status==="ready"||post.status==="failed"));
      if (loaded || promoted.length) {
        setState({ kind: "ready", posts, days: [...dayTotals.values()] });
        reportTotals();
        if (userId && (hasFreshPage || cacheDirty)) {
          const prior = new Map((readFeedCache(userId)?.posts ?? (cacheRef.current.userId===userId?cacheRef.current.cached:null) ?? []).map(post=>[post.id,post]));
          const cachePosts = posts.filter(post=>!cacheInvalidated.has(post.id)).flatMap(post=>{
            if (!hasUnavailableFields(post) && !post.summariesDeferred) return [post];
            const old=prior.get(post.id);
            const sameRevision=post.status!=='ready'||Boolean(post.analysisFingerprint&&post.analysisFingerprint===old?.analysisFingerprint);
            const sameMedia=!post.expectedMediaIds||JSON.stringify(post.expectedMediaIds)===JSON.stringify(old?.slides.map(slide=>slide.id));
            return old&&old.status===post.status&&old.caption===post.caption&&old.eaten_at===post.eaten_at&&sameRevision&&sameMedia?[old]:[];
          });
          if(cacheRef.current.userId===userId&&(cachePosts.length||!posts.length))cacheRef.current.save(cachePosts); cacheDirty = false;
        }
      }
    };

    const makeTotalsRefresh = () => createDayTotalsRefresh<FeedDayTotal>({
      read: dates => userId ? getDayTotals(supabase, userId, zone, dates) : Promise.resolve([]),
      commit: days => { if (live) { mergeDays(days); publish(); } },
    });
    let totalsRefresh = makeTotalsRefresh();
    const refreshTotals = (dates: string[]) => {
      if (userId) totalsRefresh.request(dates);
    };
    const totalReceipts = () => new Map([...dayTotals.values()].flatMap(day => (day.posts ?? []).map(post => [post.id,post] as const)));
    const uploading=(event:Event)=>{const detail=(event as CustomEvent<UploadState>).detail;if(detail.posted){const day=dateInZone(detail.eatenAt,zone);if(!uploadDaysToRead.has(day)){uploadDaysToRead.add(day);void refreshTotals([day]);}}};
    window.addEventListener('upload-started',uploading);
    const readyEvent = (event:Event) => { const id=(event as CustomEvent<{id?:string}>).detail?.id;if(id)requestCard(id); };
    window.addEventListener("post-ready", readyEvent);
    const removeCard = (id:string) => {
      const interrupted=[...pending.keys()].filter(other=>other!==id);
      const removed = cards.get(id) ?? baseline.find(post => post.id === id);
      deferred.delete(id);failedCards.delete(id);setCardReadFailed(failedCards.size>0);
      unavailable.add(id);cacheInvalidated.delete(id);cacheDirty=true;generation++;
      baseline=baseline.filter(post=>post.id!==id);cards.delete(id);
      const index=newest.indexOf(id);if(index>=0)newest.splice(index,1);
      // Old pages cannot resurrect a hidden card. Restart unrelated reads:
      // settled meals may be older than the bounded discovery window.
      pending.clear();
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
      unavailable.delete(detail.id); cacheInvalidated.delete(detail.id);cacheDirty=true;cards.set(detail.id, detail.post);
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
      const request = { again: false };
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
          if(!hasUnavailableFields(card)){cacheInvalidated.delete(id);cacheDirty=true;failedCards.delete(id);setCardReadFailed(failedCards.size>0);}
          cards.set(id, retainCompleteItems(previous, card));
          void refreshTotals(dayTotalRefreshDates(previous, card, zone, new Set(dayTotals.keys()), local, totalReceipts()));
          publish();
          // A local completion event can arrive while the INSERT read still
          // sees unuploaded media. Always read again after that event.
          if (hasUnavailableFields(card)) throw new Error('Meal details are unavailable.');
          if (request.again) { void fetchCard(); return; }
          pending.delete(id);
        } catch {
          if (!live || requestGeneration !== generation) return;
          pending.delete(id);deferred.set(id,0);
          failedCards.add(id);setCardReadFailed(true);
          // A queued event earns one read; a failed read never schedules another.
          if (request.again) requestCard(id);
        }
      };
      void fetchCard();
    };

    retryCards.current = () => { for (const id of [...failedCards]) requestCard(id); };
    const created = (event: Event) => {
      const id = (event as CustomEvent<{ id?: unknown }>).detail?.id;
      if (typeof id === "string" && id) {
        if (cards.has(id)||baseline.some(post=>post.id===id)) {cacheInvalidated.add(id);cacheDirty=true;publish();}
        requestCard(id, true);
      }
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
      const knownDays = [...dayTotals.keys()].slice(-120);
      if (knownDays.length) params.set('known_days', knownDays.join(','));
      const response = await fetch(`/api/feed?${params}`, {signal: AbortSignal.timeout(15000), cache: 'no-store'});
      if (response.status === 401) { router.replace('/sign-in'); throw new Error('Sign in required.'); }
      if (!response.ok) throw new Error('Feed could not be loaded.');
      return await response.json() as {posts: FeedPost[]; nextCursor: string | null; days: FeedDayTotal[]; discoveryIds?: string[]};
    };
    cachedListener.current = (posts, ownerId) => {
      if (!live || loaded || !userId || ownerId!==userId) return;
      baseline = posts; loaded = true; publish();
      // Display is loaded; hasFreshPage separately controls HTTP revalidation.
    };
    const load = async () => {
      initialLoading = true;
      let loadGeneration=generation;
      try {
        const { data: {session} } = await supabase.auth.getSession();
        if (!live) return;
        const nextUserId = session?.user.id ?? null;
        if(nextUserId!==userId){
          generation++;loadGeneration=generation;
          releaseCacheOwner?.();releaseCacheOwner=undefined;claimedUser=null;
          baseline=[];dayTotals.clear();cards.clear();newest.length=0;
          pending.clear();deferred.clear();unavailable.clear();answered.clear();cacheInvalidated.clear();uploadDaysToRead.clear();
          failedCards.clear();setCardReadFailed(false);setReconnectFailed(false);
          totalsRefresh.cancel();totalsRefresh=makeTotalsRefresh();
          cursor=null;loadingMore=false;discovering=false;loaded=false;hasFreshPage=false;discoveryKnown=null;cacheDirty=false;usedServerPage=true;
          setState({kind:"loading"});setPageError(false);setFreshResponse(false);
        }
        userId=nextUserId;
        subscribeInserts(userId);
        setCacheUserId(userId);
        if (!userId) { router.replace("/sign-in"); return; }
        // A cache notification can precede user initialization. Consume the
        // current owner snapshot explicitly instead of waiting for another event.
        const cached = readFeedCache(userId)?.posts ?? (cacheRef.current.userId===userId?cacheRef.current.cached:null);
        if (cached) {
          if (!loaded) cachedListener.current(cached,userId);
          else if (baseline.some(hasUnavailableFields)) {baseline=baseline.map(post=>retainCompleteItems(cached.find(old=>old.id===post.id),post));publish();}
        }
        if (claimedUser!==userId) {releaseCacheOwner?.();claimedUser=userId;releaseCacheOwner=claimFeedCacheEvents(userId);}
        const page = !usedServerPage && initialPage && initialUserId===userId && initialZone === zone ? (usedServerPage = true, initialPage) : await readPage(null,6);
        if(!live||loadGeneration!==generation)return;
        mergeDays(page.days);
        // A fresh page can reveal an external edit even when its day was
        // already supplied by SSR. Compare revisions before replacing seeds.
        for (const post of page.posts) {
          const previous = cards.get(post.id) ?? baseline.find(prior => prior.id === post.id);
          if (!page.days.some(day => day.day === dateInZone(post.eaten_at, zone))) {
            refreshTotals(dayTotalRefreshDates(previous, post, zone, new Set(dayTotals.keys()), false, totalReceipts()));
          }
        }
        const merged = withOlder(userId, page);
        baseline = merged.posts.filter(post=>!unavailable.has(post.id)).map(post=>retainCompleteItems(baseline.find(prior=>prior.id===post.id),post));
        if(discoveryKnown===null&&page.discoveryIds)discoveryKnown=new Set(page.discoveryIds);
        hasFreshPage = true; setFreshResponse(true);
        cursor = merged.nextCursor;
        loaded = true;
        publish();
        for (const post of baseline) if (hasUnavailableFields(post)) requestCard(post.id);
        if(uploadDaysToRead.size)void refreshTotals([...uploadDaysToRead]);
      } catch {
        if (live && loadGeneration===generation && !cards.size && !baseline.length) setState({ kind: "error" });
      } finally { if(loadGeneration===generation)initialLoading = false; }
    };

    retryInitial.current = () => { void load(); };
    const revalidate=()=>{if(!initialLoading)void load();};
    window.addEventListener('feed-revalidate',revalidate);
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
      if (!live || initialLoading || discovering || document.hidden) return false;
      discovering = true;
      const discoveryGeneration=generation;
      try {
        for(const [id,due] of deferred)if(retryNow||due<=Date.now())requestCard(id);
        if (!hasFreshPage) { await load(); return hasFreshPage; }
        if (!userId) return false;
        const {data:discovered,error}=await readFeedDiscovery(supabase,userId);
        if (!live || error || discoveryGeneration!==generation) return false;
        // The initial server ID window already belongs to pagination. An ID
        // absent from that window remains discoverable regardless of its dates.
        const data=(discovered??[]).filter(row=>baseline.some(post=>post.id===row.id)||cards.has(row.id)||discoveryKnown===null||!discoveryKnown.has(row.id));
        // A full discovery window without any baseline overlap can hide a
        // gap larger than one page after an outage (or an initially empty feed).
        // Restart pagination from the fresh first page; the old cursor would
        // otherwise skip that gap forever. In-flight old reads cannot restore it.
        // Discovery lists the newest-created meals while the baseline is ordered by when they were eaten, so a
        // hydrated back-dated card counts as known: overlap is judged against baseline and cards together.
        if (discoveryLostOverlap([...baseline, ...cards.values()], data ?? [], FEED_PAGE_SIZE)) {
          const page = await readPage(null,6);
          if (!live || discoveryGeneration!==generation) return false;
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
          return true;
        }
        // Visit oldest first: newly discovered rows are prepended in order.
        for (const row of [...(data ?? [])].reverse()) {
          unavailable.delete(row.id);
          if (!cards.has(row.id) && !baseline.some((post) => post.id === row.id) && !pending.has(row.id)) {
            requestCard(row.id);
          }
        }
        return true;
      } catch {
        return false;
      } finally { discovering = false; }
    };
    void load();
    const focus = () => {
      if (!document.hidden) void discover(true).then(ok => { if (live) setReconnectFailed(!ok || !channelReady); });
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let channelUser: string | null = null;
    const subscribeInserts = (ownerId: string | null) => {
      if (!live || ownerId === channelUser) return;
      if (channel) void supabase.removeChannel(channel);
      channel = null; channelUser = ownerId;
      channelReady = false;
      setReconnectFailed(false);
      if (!ownerId) return;
      let connectedOnce = false, disconnected = false;
      channel = supabase.channel("feed-inserts").on("postgres_changes",
      { event: "INSERT", schema: "public", table: "posts", filter: `user_id=eq.${ownerId}` },
      (payload) => { const id = (payload.new as { id?: string }).id; if (live && userId === ownerId && id) requestCard(id); }
    ).subscribe((status) => {
      if (!live || userId !== ownerId) return;
      if (status === "SUBSCRIBED") {
        channelReady = true;
        if (!connectedOnce) { connectedOnce = true;disconnected = false;setReconnectFailed(false);return; }
        if (!disconnected) return;
        disconnected = false;
        if (Date.now()-lastReconnectRead < 30_000) { setReconnectFailed(false);return; }
        lastReconnectRead = Date.now();
        void discover(true).then(ok => { if (live && channelUser === ownerId) setReconnectFailed(!ok); });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        channelReady = false;disconnected = true;setReconnectFailed(true);
      }
    });
    };

    return () => {
      live = false;retryCards.current=()=>{};
      window.removeEventListener('feed-revalidate',revalidate);
      totalsRefresh.cancel();
      window.removeEventListener("feed-day-totals-request",reportTotals);
      cachedListener.current = () => {};
      releaseCacheOwner?.();
      window.removeEventListener("post-restore", restore);
      window.removeEventListener("post-ready", readyEvent);
      window.removeEventListener('upload-started',uploading);
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
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router, initialPage, initialUserId, initialZone, fallbackOnly]);

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

  const visibleState: State = fallbackOnly ? cache.cached ? {kind: 'ready', posts: cache.cached.filter(post=>!fallbackRetired.has(post.id)), days: []} : {kind: 'loading'} : state;
  const uploadDays=new Set<string>();
  const localDay=uploads.map(upload=>dateInZone((visibleState.kind==='ready'?visibleState.posts.find(post=>post.id===upload.postId)?.eaten_at:undefined)??upload.eatenAt,renderZone));
  const localCards=uploads.map(upload=>{const server=visibleState.kind==='ready'?visibleState.posts.find(post=>post.id===upload.postId):undefined;const seed:FeedPost=server??{id:upload.postId??upload.operationId,caption:upload.caption,eaten_at:upload.eatenAt,created_at:upload.eatenAt,status:"queued",photoUrl:upload.previewUrl,slides:[],items:[]};const zone=renderZone;const day=dateInZone(seed.eaten_at,zone);const header=!uploadDays.has(day);const measured=visibleState.kind==='ready'?visibleState.days.find(value=>value.day===day):undefined;const measuredTotal=measured?{...measured,ready:measured.ready||measured.kcal===0}:undefined;if(header)uploadDays.add(day);return <UploadHydratedCard key={upload.operationId} post={seed} upload={upload} attachment={upload.postId?attachmentUploads.find(attached=>uploadTargetsPost(attached,upload.postId!)):undefined} header={header?<DayHeader day={day} zone={zone} empty={false} total={measuredTotal}/>:null}/>;});
  if (visibleState.kind === "loading"&&localCards.length)return <div>{lostNotice}{localCards}{null}</div>;
  if (visibleState.kind === "loading") return <div>{lostNotice}<p className="px-screen-x text-detail text-muted" role="status">Loading feed…</p></div>;
  if (visibleState.kind === "error") return <div data-feed-error>{lostNotice}{localCards}<p className="px-screen-x text-detail text-muted" role="alert">The feed could not be loaded.</p><button type="button" className="min-h-tap px-screen-x text-text" onClick={() => retryInitial.current()}>Try again</button></div>;
  if (!visibleState.posts.length&&localCards.length)return <div>{lostNotice}{localCards}{null}</div>;
  if (!visibleState.posts.length) return <div data-feed-source={fallbackOnly||!freshResponse?"cache":"fresh"} data-feed-client-ready={!fallbackOnly ? true : undefined} data-cached-feed-ready={fallbackOnly ? true : undefined} className="flex w-full flex-1 flex-col">
    {lostNotice}
    <div className="flex flex-1 items-center justify-center" style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 3 }}>
    <p className="text-sheet-title font-normal text-muted">Post your first meal</p>
    </div>
  </div>;
  const firstPhotoId=visibleState.posts.find(post=>post.photoUrl)?.id;
  const zone = renderZone;
  const groups = new Map<string, FeedPost[]>();
  for (const post of visibleState.posts.filter(post=>!uploads.some(upload=>upload.postId===post.id))) {
    const day = dateInZone(post.eaten_at, zone);
    groups.set(day, [...(groups.get(day) ?? []), post]);
  }
  const listed = [...groups.keys()].sort().reverse();
  const days: string[] = [];
  if(listed.length)for (let day = listed[0]; day >= listed.at(-1)!; day = shiftDay(day, -1)) days.push(day);
  const totals = new Map(visibleState.days.map(day => [day.day, day]));
  return <div data-feed-source={fallbackOnly||!freshResponse?"cache":"fresh"} data-feed-client-ready={!fallbackOnly ? true : undefined} data-cached-feed-ready={fallbackOnly ? true : undefined} className="flex flex-col">
    {lostNotice}
    {reconnectFailed?<p role="status" className="px-screen-x text-detail text-muted">Meal updates could not reconnect. Refresh to try again.</p>:null}
    {localCards.filter((_,index)=>!days.includes(localDay[index]))}
    {days.map(day => <section key={day} aria-label={day} className="relative pb-card-gap">
      {!uploadDays.has(day)&&<DayHeader day={day} zone={zone} empty={!groups.has(day)} total={totals.get(day)} />}
      {localCards.filter((_,index)=>localDay[index]===day)}
      {groups.has(day) ? <div className="flex flex-col gap-card-gap pt-sheet-top">{groups.get(day)!.map((post) => <div key={attachmentUploads.find(upload=>uploadTargetsPost(upload,post.id))?.operationId??uploads.find(upload=>upload.postId===post.id)?.operationId??post.id} data-desktop-post={post.id} tabIndex={-1}>{fallbackOnly ? <PostCard priority={firstPhotoId === post.id} post={post} upload={attachmentUploads.find(upload=>uploadTargetsPost(upload,post.id))} /> : <RealtimePost initial={post} renderCard={(fresh) => <PostCard priority={firstPhotoId === post.id} post={fresh} upload={attachmentUploads.find(upload=>uploadTargetsPost(upload,post.id))??uploads.find(upload=>upload.postId===post.id)}
         />} />}</div>)}</div> : null}
    </section>)}
    {pageError || cardReadFailed ? <div className="px-screen-x text-detail text-muted" role="alert">
      <p>More meals could not be loaded.</p>
      <button type="button" className="min-h-tap text-text" onClick={() => { if(cardReadFailed)retryCards.current();else loadMore.current(); }}>Try again</button>
    </div> : null}
    <div ref={sentinel} className="h-tap" aria-hidden="true" />
  </div>;
}

// #570: a photo added to a meal posted in this session shows on this card at once, as it does on a server card.
function UploadHydratedCard({post,upload,attachment,header}:{post:FeedPost;upload:UploadState;attachment?:UploadState;header:import("react").ReactNode}) {
  const [fresh,setFresh]=useState<FeedPost|null>(null);
  const lastStatus=useRef(post.status);
  useEffect(()=>{
    const id=upload.postId;
    if(!id)return;
    const db=createClient();
    let live=true,inFlight=false,again=false,missing=0;
    const read=async()=>{
      if(!live)return;
      if(inFlight){again=true;return;}
      inFlight=true;
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
          missing=0;
          if(card.status!=='ready'){
            const pending=await getPendingItems(db,id).catch(()=>null);
            if(!live)return;
            if(pending)Object.assign(card,{pendingItems:pending.pendingItems,fail_reason:pending.fail_reason??card.fail_reason});
          }
          setFresh(card);
          if(card.status==='ready'&&lastStatus.current!=='ready')window.dispatchEvent(new CustomEvent('post-ready',{detail:{id}}));
          lastStatus.current=card.status;
        }
      } catch { /* Keep the last visible card; a new event or focus can read again. */ }
      finally {
        inFlight=false;
        if(live){
          if(again){again=false;void read();}
        }
      }
    };
    const refresh=()=>{void read();};
    const visible=()=>{if(!document.hidden)refresh();};
    const changed=(event:Event)=>{if((event as CustomEvent<{id?:string}>).detail?.id===id)refresh();};
    // #1095: the tab's one Realtime channel announces this post's changes as post-readiness.
    window.addEventListener('online',refresh);window.addEventListener('focus',refresh);
    window.addEventListener('post-readiness',changed);window.addEventListener('post-updated',changed);document.addEventListener('visibilitychange',visible);
    void read();
    return()=>{
      live=false;
      window.removeEventListener('online',refresh);window.removeEventListener('focus',refresh);
      window.removeEventListener('post-readiness',changed);window.removeEventListener('post-updated',changed);document.removeEventListener('visibilitychange',visible);
    };
  },[post.id,upload.postId,upload.operationId]);
  return <div data-desktop-post={upload.postId??upload.operationId} tabIndex={-1}>{header}<PostCard post={fresh??post} upload={attachment??upload}/></div>;
}

// Only the main Feed renders this durable draft notice.
function LostDraftNotice({upload}: {upload: UploadState}) {
  const [failed,setFailed]=useState(false);
  const [saving,setSaving]=useState(false);
  const acknowledge=async()=>{
    setSaving(true);setFailed(false);
    try { await uploadManager.acknowledgeLost(upload.operationId); }
    catch { setFailed(true); }
    finally { setSaving(false); }
  };
  return <div data-lost-draft-notice className="px-screen-x text-detail text-muted" role="status">
    <p>{upload.caption.trim() ? "An unposted photo couldn’t be recovered, but your caption is saved." : "An unposted photo couldn’t be recovered."}</p>
    <button type="button" className="min-h-tap text-text" disabled={saving} onClick={()=>void acknowledge()}>OK</button>
    {failed?<p role="alert">This could not be saved. Try again.</p>:null}
  </div>;
}
