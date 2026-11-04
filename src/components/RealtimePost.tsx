"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPostCard, isSettled, hasUnavailableFields, retainCompleteItems, type FeedPost } from "@/lib/posts/feed";

import {readPendingItems,type PendingItem} from '@/lib/pipeline/pending-items';
type PendingFeedPost=FeedPost&{pendingItems?:PendingItem[];fail_reason?:string|null};

const POLL_START_MS = 2000;
const POLL_MAX_MS = 30000;
const CARD_FAST_WINDOW_MS = 30_000;
const CARD_POLL_BUDGET_MS = 120_000;
const pageVisible = () => document.visibilityState !== "hidden";

export default function RealtimePost({ initial, renderCard }: {
  initial: FeedPost;
  renderCard: (post: FeedPost) => ReactNode;
}) {
  const [removed,setRemoved]=useState(false);
  const [snapshot, setSnapshot] = useState({ seed: initial, current: initial });
  const post = snapshot.seed === initial ? snapshot.current : initial;
  const awaitingItems = hasUnavailableFields(post);
  const awaitingCard = post.status === "ready" && post.items.length > 0
    && !post.slides.some((slide) => slide.kind === "card");

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
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let pollBackoffMs = POLL_START_MS;
    const needsPolling = () => !isSettled(post.status) || awaitingCard || awaitingItems;
    const retire = (reason:"deleted"|"needs_input") => {
      if(!live)return;live=false;again=false;
      clearTimeout(pollTimer);
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
if(!isSettled(fresh.status)||fresh.status==='failed'){
            const {data}=await supabase.from('posts').select('pending_items,fail_reason').eq('id',initial.id).abortSignal(AbortSignal.timeout(8000)).maybeSingle();
            if(!live)return;
            (fresh as PendingFeedPost).pendingItems=readPendingItems(data?.pending_items);
            (fresh as PendingFeedPost).fail_reason=data?.fail_reason??null;
          }
          setSnapshot(previous => ({ seed: initial, current: retainCompleteItems(previous.seed.id === fresh.id ? previous.current : undefined, fresh) }));
        } while (live && again && pageVisible());
      } catch {
        // Preserve the last good card; polling retries unsettled posts.
      } finally { inFlight = false; }
    };
    const schedulePoll = () => {
      clearTimeout(pollTimer);
      if (!live || !needsPolling() || document.hidden) return;
      if (awaitingCard && !awaitingItems) {
        const now = Date.now(), state = cardPolling.current;
        const elapsed = now - state.started;
        if (elapsed >= CARD_POLL_BUDGET_MS) return;
        if (now < state.next) {
          pollTimer = setTimeout(() => schedulePoll(), state.next - now);
          return;
        }
        state.next = now + (elapsed < CARD_FAST_WINDOW_MS ? POLL_START_MS : 15_000);
      }
      pollTimer = setTimeout(() => {
        void refresh().finally(() => {
          if (live && needsPolling() && pageVisible()) {
            pollBackoffMs = Math.min(pollBackoffMs * 2, POLL_MAX_MS);
            schedulePoll();
          }
        });
      }, pollBackoffMs);
    };
    const channel = supabase.channel(`post-${initial.id}`).on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${initial.id}`,
    }, () => { pollBackoffMs = POLL_START_MS; void refresh(); }).on("postgres_changes", {
      event:"DELETE",schema:"public",table:"posts",filter:`id=eq.${initial.id}`,
    },(payload)=>{if((payload.old as {id?:string}).id===initial.id)retire("deleted");}).subscribe();
    void refresh();
    pollBackoffMs = POLL_START_MS;
    schedulePoll();
    const changed=(event:Event)=>{if((event as CustomEvent<{id:string}>).detail?.id===initial.id){pollBackoffMs = POLL_START_MS; void refresh();}};
    window.addEventListener('media-removed',changed);window.addEventListener('correction-reverted',changed);
    const visible = () => { if (pageVisible() && needsPolling()) schedulePoll(); else clearTimeout(pollTimer); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    return () => {
      live = false;
      clearTimeout(pollTimer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      window.removeEventListener('media-removed',changed);window.removeEventListener('correction-reverted',changed);
      void supabase.removeChannel(channel);
    };
  }, [initial, post.status, awaitingCard, awaitingItems]);

  return removed || post.status === "needs_input" ? null : <>{renderCard(post)}</>;
}
