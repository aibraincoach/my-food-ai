"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getPostCard,
  isSettled,
  type FeedPost,
} from "@/lib/posts/feed";

const POLL_INTERVAL_MS = 3000;

// Owns one card's data: subscribes to postgres_changes on the post row,
// refreshes the card in place on change, and polls every 3 s while the
// post is not settled (the polling fallback when realtime does not deliver).
export default function RealtimePost({
  initial,
  renderCard,
}: {
  initial: FeedPost;
  renderCard: (post: FeedPost) => ReactNode;
}) {
  const [post, setPost] = useState<FeedPost>(initial);

  useEffect(() => {
    const supabase = createClient();
    let live = true;

    const refresh = async () => {
      try {
        const fresh = await getPostCard(supabase, initial.id);
        if (live && fresh) setPost(fresh);
      } catch {
        // Keep the last good card; the next poll retries.
      }
    };

    const channel = supabase
      .channel(`post-${initial.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `id=eq.${initial.id}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    // Poll only while unsettled; the effect re-runs when the status
    // settles and the timer is cleared.
    const timer = isSettled(post.status)
      ? null
      : setInterval(() => {
          void refresh();
        }, POLL_INTERVAL_MS);

    return () => {
      live = false;
      if (timer) clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [initial.id, post.status]);

  return <>{renderCard(post)}</>;
}
