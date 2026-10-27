"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPostCard, isSettled, type FeedPost } from "@/lib/posts/feed";

const POLL_INTERVAL_MS = 2000;

export default function RealtimePost({ initial, renderCard }: {
  initial: FeedPost;
  renderCard: (post: FeedPost) => ReactNode;
}) {
  const [snapshot, setSnapshot] = useState({ seed: initial, current: initial });
  // A fresh local-create read supersedes an earlier INSERT snapshot, including
  // its signed photo URL. Never retain the old mount-only initial state.
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
    const refresh = async () => {
      if (inFlight) { again = true; return; }
      inFlight = true;
      try {
        do {
          again = false;
          const fresh = await getPostCard(supabase, initial.id);
          if (live && fresh) setSnapshot({ seed: initial, current: fresh });
        } while (live && again);
      } catch {
        // Preserve the last good card; polling retries unsettled posts.
      } finally { inFlight = false; }
    };
    const channel = supabase.channel(`post-${initial.id}`).on("postgres_changes", {
      event: "UPDATE", schema: "public", table: "posts", filter: `id=eq.${initial.id}`,
    }, () => { void refresh(); }).subscribe();
    // Close the window between the initial read and subscription becoming live.
    void refresh();
    const timer = isSettled(post.status) ? null : setInterval(() => { void refresh(); }, POLL_INTERVAL_MS);
    return () => {
      live = false;
      if (timer) clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [initial, post.status]);

  return <>{renderCard(post)}</>;
}
