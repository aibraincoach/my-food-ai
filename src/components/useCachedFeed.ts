"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { connectMediaSession } from "@/lib/posts/media-session";
import type { FeedPost } from "@/lib/posts/feed";
import { feedCacheGeneration, readFeedCache, subscribeFeedCache, writeFeedCache } from "@/lib/posts/feed-cache";

const noCache = () => null;
export function useCachedFeed(userId: string | null): { userId: string | null; cached: FeedPost[] | null; save(posts: FeedPost[]): void } {
  useEffect(connectMediaSession, []);
  const currentUser = useRef<string | null>(null);
  useLayoutEffect(() => {
    currentUser.current = userId;
    return () => { currentUser.current = null; };
  }, [userId]);
  const snapshot = useCallback(() => userId ? readFeedCache(userId)?.posts ?? null : null, [userId]);
  const cached = useSyncExternalStore(subscribeFeedCache, snapshot, noCache);
  const generation = useMemo(() => {
    // A clear invalidates this authenticated mount until its account changes.
    void userId;
    return feedCacheGeneration();
  }, [userId]);
  const save = useCallback((posts: FeedPost[]) => {
    // Never revive a signed-out cache or write a response for a previous account.
    if (!userId || currentUser.current !== userId || generation !== feedCacheGeneration()) return;
    writeFeedCache(userId, { posts, savedAt: Date.now() });
  }, [userId, generation]);
  return { userId, cached, save };
}
