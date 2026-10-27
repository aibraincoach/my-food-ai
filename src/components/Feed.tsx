"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getFeed,
  getPostCard,
  type FeedPost,
} from "@/lib/posts/feed";
import PostCard from "@/components/PostCard";
import AnalysisBlock from "@/components/AnalysisBlock";
import RealtimePost from "@/components/RealtimePost";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; posts: FeedPost[] };

// The user's own posts, newest first. Loads client-side so the page stays
// statically prerenderable under cacheComponents; RLS limits every query
// to the signed-in owner's rows.
export default function Feed() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const supabase = createClient();
    let live = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!live) return;
      if (!user) {
        router.push("/sign-in");
        return;
      }
      try {
        const posts = await getFeed(supabase, user.id);
        if (live) setState({ kind: "ready", posts });
      } catch {
        if (live) setState({ kind: "error" });
      }
    };

    void load();

    // A post created on this device appears at the top without a reload.
    const channel = supabase
      .channel("feed-inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const id = (payload.new as { id?: string }).id;
          if (!id) return;
          getPostCard(supabase, id)
            .then((card) => {
              if (!live || !card) return;
              setState((prev) => {
                if (prev.kind !== "ready") return prev;
                if (prev.posts.some((post) => post.id === card.id)) {
                  return prev;
                }
                return { kind: "ready", posts: [card, ...prev.posts] };
              });
            })
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      live = false;
      void supabase.removeChannel(channel);
    };
  }, [router]);

  if (state.kind === "loading") {
    return <p className="text-sm text-neutral-500">Loading feed…</p>;
  }
  if (state.kind === "error") {
    return <p className="text-sm text-neutral-500">Could not load meals.</p>;
  }
  if (state.posts.length === 0) {
    return <p className="text-sm text-neutral-500">Post your first meal</p>;
  }
  return (
    <div className="flex flex-col gap-6">
      {state.posts.map((post) => (
        <RealtimePost
          key={post.id}
          initial={post}
          renderCard={(fresh) => (
            <PostCard
              post={fresh}
              analysis={
                fresh.status === "ready" && fresh.items.length > 0 ? (
                  <AnalysisBlock post={fresh} />
                ) : undefined
              }
            />
          )}
        />
      ))}
    </div>
  );
}
