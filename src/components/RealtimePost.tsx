"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPostCard, isSettled, type FeedPost } from "@/lib/posts/feed";

const POLL_INTERVAL_MS = 2000;
const CARD_FAST_WINDOW_MS = 30_000;
const CARD_POLL_BUDGET_MS = 120_000;
const pageVisible = () => document.visibilityState !== "hidden";

export default function RealtimePost({ initial, renderCard }: {
  initial: FeedPost;
  renderCard: (post: FeedPost) => ReactNode;
}) {
  const [removed,setRemoved]=useState(false);
  const [snapshot, setSnapshot] = useState({ seed: initial, current: initial });
  // A fresh local-create read supersedes an earlier INSERT snapshot, including
  // its signed photo URL. Never retain the old mount-only initial state.
  const post = snapshot.seed === initial ? snapshot.current : initial;
  // Initial analysis publishes ready before the stored card finishes rendering.
  // A bounded fallback covers missed publication events without repeatedly
  // hydrating a ready meal forever when optional card maintenance failed.
  const awaitingCard = post.status === "ready" && post.items.length > 0
    && !post.slides.some((slide) => slide.kind === "card");

  // Preserve the budget across fresh server props for the same meal.
  const cardPolling = useRef({ id: initial.id, started: 0, next: 0 });
  const lastReady = useRef(post.status === "ready" ? JSON.stringify([post.id, post.items]) : "");
  useEffect(() => {
    if (post.status !== "ready") return;
    const signature = JSON.stringify([post.id, post.items]);
    if (lastReady.current === signature) return;
    lastReady.current = signature;
    window.dispatchEvent(new CustomEvent("post-ready", { detail: { id: post.id } }));
  }, [post]);

  useEffect(() => {
    const supabase = createClient();
    let live = true;
    let inFlight = false;
    let again = false;
    let timer:ReturnType<typeof setInterval>|null=null;
    const retire = (reason:"deleted"|"needs_input") => {
      if(!live)return;live=false;again=false;
      if(timer)clearInterval(timer);
      setRemoved(true);
      window.dispatchEvent(new CustomEvent("post-unavailable",{detail:{id:initial.id,reason}}));
    };
    if (cardPolling.current.id !== initial.id || !awaitingCard) cardPolling.current = { id: initial.id, started: 0, next: 0 };
    if (awaitingCard && !cardPolling.current.started) cardPolling.current.started = Date.now();
    const refresh = async () => {
      if (!live || !pageVisible()) return;
      if (inFlight) { again = true; return; }
      inFlight = true;
      try {
        do {
          again = false;
          const fresh = await getPostCard(supabase, initial.id);
          if(!live)return;
          if(!fresh||fresh.status==="needs_input"){retire(fresh?"needs_input":"deleted");return;}
          setSnapshot({ seed: initial, current: fresh });
        } while (live && again && pageVisible());
      } catch {
        // Preserve the last good card; polling retries unsettled posts.
      } finally { inFlight = false; }
    };
    const channel = supabase.channel(`post-${initial.id}`).on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${initial.id}`,
    }, () => { void refresh(); }).on("postgres_changes", {
      event:"DELETE",schema:"public",table:"posts",filter:`id=eq.${initial.id}`,
    },(payload)=>{if((payload.old as {id?:string}).id===initial.id)retire("deleted");}).subscribe();
    // Close the window between the initial read and subscription becoming live.
    void refresh();
    timer = isSettled(post.status) && !awaitingCard ? null : setInterval(() => {
      if (!live || !pageVisible()) return;
      if (awaitingCard) {
        const now = Date.now(), state = cardPolling.current;
        const elapsed = now - state.started;
        if (elapsed >= CARD_POLL_BUDGET_MS || now < state.next) return;
        state.next = now + (elapsed < CARD_FAST_WINDOW_MS ? POLL_INTERVAL_MS : 15_000);
      }
      void refresh();
    }, POLL_INTERVAL_MS);
    // Realtime remains subscribed after the card-only polling budget expires.
    // A deliberate return to the page also gets one fresh read, without
    // restarting the automatic budget for a permanently missing card.
    const visible = () => { if (pageVisible()) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    return () => {
      live = false;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      void supabase.removeChannel(channel);
    };
  }, [initial, post.status, awaitingCard]);

  return removed || post.status === "needs_input" ? null : <>{renderCard(post)}</>;
}
