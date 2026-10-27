"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FEED_PAGE_SIZE, getFeed, getPostCard, type FeedPost } from "@/lib/posts/feed";
import { tokens } from "@/lib/theme/tokens";
import PostCard from "@/components/PostCard";
import AnalysisBlock from "@/components/AnalysisBlock";
import RealtimePost from "@/components/RealtimePost";
import { mergeFeedPosts, discoveryLostOverlap } from "@/lib/posts/feed-order";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; posts: FeedPost[] };
const DISCOVERY_INTERVAL_MS = 2000;
const RETRY_INTERVAL_MS = 1000;

// Home discovers new rows independently of the optional Realtime connection.
// Per-card refreshes remain in RealtimePost, so discovery fetches only IDs.
export default function Feed() {
  const router = useRouter();
  const sentinel = useRef<HTMLDivElement>(null);
  const loadMore = useRef<() => void>(()=>{});
  const [state, setState] = useState<State>({ kind: "loading" });
  const [pageError, setPageError] = useState(false);

  useEffect(() => {
    const supabase = createClient();
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
    const cards = new Map<string, FeedPost>();
    const newest: string[] = [];
    const pending = new Map<string, { again: boolean; retries: number }>();
    const timers = new Set<ReturnType<typeof setTimeout>>();

    const publish = () => {
      if (!live) return;
      // A late initial load must not erase cards received while it was in flight.
      const promoted = newest.flatMap((id) => cards.has(id) ? [cards.get(id)!] : []);
      const posts = mergeFeedPosts(baseline, promoted).filter(post=>!unavailable.has(post.id)&&post.status!=="needs_input");
      if (loaded || promoted.length) setState({ kind: "ready", posts });
    };

    const removeCard = (id:string) => {
      unavailable.add(id);generation++;
      baseline=baseline.filter(post=>post.id!==id);cards.delete(id);
      const index=newest.indexOf(id);if(index>=0)newest.splice(index,1);
      // Invalidate every in-flight read before publishing removal. Discovery
      // retries interrupted IDs; old pages cannot resurrect a hidden card.
      pending.clear();for(const retry of timers)clearTimeout(retry);timers.clear();
      loadingMore=false;publish();
    };
    const unavailableEvent=(event:Event)=>{
      const id=(event as CustomEvent<{id?:unknown}>).detail?.id;
      if(typeof id==="string"&&id)removeCard(id);
    };
    window.addEventListener("post-unavailable",unavailableEvent);

    const requestCard = (id: string, local = false) => {
      if (!live) return;
      if (local || !newest.includes(id)) {
        const index = newest.indexOf(id);
        if (index >= 0) newest.splice(index, 1);
        newest.unshift(id);
      }
      const active = pending.get(id);
      if (active) { active.again = true; return; }
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
          unavailable.delete(id);
          cards.set(id, card);
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
            pending.delete(id); // ID discovery can retry a missed row later.
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
    window.addEventListener("post-updated", created);

    const load = async () => {
      initialLoading = true;
      const loadGeneration=generation;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!live) return;
        if (!user) { router.replace("/sign-in"); return; }
        userId = user.id;
        const page = await getFeed(supabase,user.id);
        if(!live||loadGeneration!==generation)return;
        baseline = page.posts.filter(post=>!unavailable.has(post.id));
        cursor = page.nextCursor;
        loaded = true;
        publish();
      } catch {
        if (live && !cards.size) setState({ kind: "error" });
      } finally { initialLoading = false; }
    };

    loadMore.current = () => {
      if(!cursor || loadingMore || !live) return;
      loadingMore=true;
      const pageGeneration = generation;
      setPageError(false);
      void fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`).then(async response=>{
        if(!response.ok) throw new Error("Feed page failed.");
        const page = await response.json() as {posts:FeedPost[];nextCursor:string|null};
        if(!live || pageGeneration !== generation) return;
        baseline.push(...page.posts.filter(post=>!unavailable.has(post.id)&&!baseline.some(existing=>existing.id===post.id)));
        cursor=page.nextCursor;
        publish();
      }).catch(()=>{if(live && pageGeneration === generation)setPageError(true);}).finally(()=>{if(pageGeneration === generation)loadingMore=false;});
    };
    const discover = async () => {
      if (!live || initialLoading || discovering || document.hidden) return;
      discovering = true;
      const discoveryGeneration=generation;
      try {
        if (!loaded) { await load(); return; }
        if (!userId) return;
        const { data, error } = await supabase.from("posts").select("id")
          .eq("user_id", userId).neq("status", "needs_input").order("created_at", { ascending: false })
          .order("id", { ascending: false }).limit(FEED_PAGE_SIZE);
        if (!live || error || discoveryGeneration!==generation) return;
        // A full discovery window without any baseline overlap can hide a
        // gap larger than one page after an outage (or an initially empty feed).
        // Restart pagination from the fresh first page; the old cursor would
        // otherwise skip that gap forever. In-flight old reads cannot restore it.
        if (discoveryLostOverlap(baseline, data ?? [], FEED_PAGE_SIZE)) {
          const page = await getFeed(supabase, userId);
          if (!live || discoveryGeneration!==generation) return;
          generation++;
          for(const post of page.posts)if(post.status!=="needs_input")unavailable.delete(post.id);
          baseline = page.posts.filter(post=>!unavailable.has(post.id));
          cursor = page.nextCursor;
          cards.clear(); newest.length = 0; pending.clear();
          loadingMore = false;
          setPageError(false);
          publish();
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
    const focus = () => { void discover(); };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    const channel = supabase.channel("feed-inserts").on("postgres_changes",
      { event: "INSERT", schema: "public", table: "posts" },
      (payload) => { const id = (payload.new as { id?: string }).id; if (id) requestCard(id); }
    ).subscribe();

    return () => {
      live = false;
      clearInterval(timer);
      for (const retry of timers) clearTimeout(retry);
      window.removeEventListener("post-created", created);
      window.removeEventListener("post-updated", created);
      window.removeEventListener("post-unavailable",unavailableEvent);
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

  if (state.kind === "loading") return <p className="px-screen-x text-detail text-muted" role="status">Loading feed…</p>;
  if (state.kind === "error") return <p className="px-screen-x text-detail text-muted" role="alert">Could not load meals.</p>;
  if (!state.posts.length) return <div className="flex flex-1 items-center justify-center" style={{ paddingBottom: tokens.spacing['sheet-bottom'] * 3 }}>
    <p className="text-sheet-title font-normal text-muted">Post your first meal</p>
  </div>;
  return <div className="flex flex-col gap-card-gap">
    {state.posts.map((post) => <RealtimePost key={post.id} initial={post} renderCard={(fresh) => <PostCard post={fresh}
      analysis={fresh.status === "ready" && fresh.items.length > 0 ? <AnalysisBlock post={fresh} /> : undefined}
    />} />)}
    {pageError ? <div className="px-screen-x text-detail text-muted" role="alert">
      <p>More meals could not be loaded.</p>
      <button type="button" className="min-h-tap text-text" onClick={() => loadMore.current()}>Try again</button>
    </div> : null}
    <div ref={sentinel} className="h-tap" aria-hidden="true" />
  </div>;
}
