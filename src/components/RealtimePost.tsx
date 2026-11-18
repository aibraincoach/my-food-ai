"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPostCard, isSettled, hasUnavailableFields, retainCompleteItems, type FeedPost } from "@/lib/posts/feed";

import {readPendingItems,type PendingItem} from '@/lib/pipeline/pending-items';
type PendingFeedPost=FeedPost&{pendingItems?:PendingItem[];fail_reason?:string|null};

const pageVisible = () => document.visibilityState !== "hidden";

export default function RealtimePost({ initial, renderCard }: {
  initial: FeedPost;
  renderCard: (post: FeedPost) => ReactNode;
}) {
  const [removed,setRemoved]=useState(false);
  const [snapshot, setSnapshot] = useState({ seed: initial, current: initial });
  const post = snapshot.seed === initial ? snapshot.current : initial;
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
    const retire = (reason:"deleted"|"needs_input") => {
      if(!live)return;live=false;again=false;
      setRemoved(true);
      window.dispatchEvent(new CustomEvent("post-unavailable",{detail:{id:initial.id,reason}}));
    };
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
        // Keep the visible card until a new event or focus requests another read.
      } finally { inFlight = false; }
    };
    const channel = supabase.channel(`post-${initial.id}`).on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${initial.id}`,
    }, () => { void refresh(); }).on("postgres_changes", {
      event:"DELETE",schema:"public",table:"posts",filter:`id=eq.${initial.id}`,
    },(payload)=>{if((payload.old as {id?:string}).id===initial.id)retire("deleted");}).subscribe();
    // A finished card drawn from the server's page is already current; re-reading every card on mount doubled the first feed read.
    const needsInitialRead = !isSettled(initial.status) || hasUnavailableFields(initial)
      || (initial.status === "ready" && initial.items.length > 0 && !initial.slides.some(slide => slide.kind === "card"));
    if (needsInitialRead) void refresh();
    const changed=(event:Event)=>{if((event as CustomEvent<{id:string}>).detail?.id===initial.id){void refresh();}};
    window.addEventListener('media-removed',changed);window.addEventListener('correction-reverted',changed);
    const visible = () => { if (pageVisible()) void refresh(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("focus", visible);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("focus", visible);
      window.removeEventListener('media-removed',changed);window.removeEventListener('correction-reverted',changed);
      void supabase.removeChannel(channel);
    };
  }, [initial]);

  return removed || post.status === "needs_input" ? null : <>{renderCard(post)}</>;
}
