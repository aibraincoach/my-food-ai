import type { FeedPost } from "./feed";

const PREFIX = "mfa-feed:";
const RESET_KEY = "mfa-feed-reset";
const CHANGE_EVENT = "mfa-feed-cache-changed";
const MAX_POSTS = 6;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_BYTES = 1024 * 1024;
type CachedFeed = { version: 1; userId: string; savedAt: number; posts: FeedPost[] };
const snapshots = new Map<string, { raw: string; value: CachedFeed }>();
let generation = 0;

// The reset marker also invalidates callbacks retained by another open tab.
export function feedCacheGeneration(): string {
  try { return `${generation}:${localStorage.getItem(RESET_KEY) ?? ""}`; }
  catch { return String(generation); }
}

function validPost(value: unknown): value is FeedPost {
  if (!value || typeof value !== "object") return false;
  const post = value as FeedPost;
  return typeof post.id === "string" && typeof post.caption === "string" &&
    typeof post.created_at === "string" && typeof post.eaten_at === "string" &&
    ["queued", "processing", "needs_input", "ready", "failed"].includes(post.status) &&
    (post.photoUrl === null || typeof post.photoUrl === "string") &&
    Array.isArray(post.slides) && post.slides.every(slide => slide && typeof slide.url === "string") &&
    Array.isArray(post.items) && post.items.every(item => item && typeof item.id === "string" && typeof item.name === "string");
}

// Signed card URLs last an hour (feed.ts) but the cache lasts a day; drop slides whose token has expired.
function withLiveSlides(post: FeedPost, savedAt: number, now: number): FeedPost {
  const slides = post.slides.filter(slide => {
    if (!slide.url.includes("/storage/v1/object/sign/")) return true;
    try {
      const token = new URL(slide.url).searchParams.get("token") ?? "";
      const exp = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp;
      return typeof exp === "number" ? exp * 1000 > now + 120_000 : now - savedAt < 50 * 60_000;
    } catch { return now - savedAt < 50 * 60_000; }
  });
  return slides.length === post.slides.length ? post : { ...post, slides, photoUrl: slides[0]?.url ?? null };
}

// Local storage can be disabled, full, stale or corrupt. None may stop Home.
export function readFeedCache(userId: string, now = Date.now()): CachedFeed | null {
  try {
    const raw = localStorage.getItem(PREFIX + userId);
    if (!raw || raw.length > MAX_BYTES) return null;
    const prior = snapshots.get(userId);
    const value: CachedFeed = prior?.raw === raw ? prior.value : JSON.parse(raw);
    if (value.version !== 1 || value.userId !== userId || !Number.isFinite(value.savedAt) ||
      value.savedAt > now + 60_000 || now - value.savedAt > MAX_AGE_MS ||
      !Array.isArray(value.posts) || value.posts.length > MAX_POSTS || !value.posts.every(validPost)) return null;
    if (prior?.raw !== raw) { value.posts = value.posts.map(post => withLiveSlides(post, value.savedAt, now)); snapshots.set(userId, { raw, value }); }
    return value;
  } catch { return null; }
}

export function writeFeedCache(userId: string, { posts, savedAt }: { posts: FeedPost[]; savedAt: number }): void {
  try {
    const value: CachedFeed = { version: 1, userId, savedAt, posts: posts.slice(0, MAX_POSTS) };
    if (!value.posts.every(validPost)) return;
    const raw = JSON.stringify(value);
    if (raw.length > MAX_BYTES) return;
    localStorage.setItem(PREFIX + userId, raw);
    snapshots.set(userId, { raw, value });
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch { /* An optional cache must never fail a successful feed read. */ }
}

export function clearFeedCache(): void {
  generation++;
  snapshots.clear();
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
    localStorage.setItem(RESET_KEY, `${Date.now()}:${Math.random()}`);
  } catch { /* Storage may be unavailable during sign-out. */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeFeedCache(listener: () => void): () => void {
  const changed = (event: Event) => {
    if (event.type === "storage") {
      const key = (event as StorageEvent).key;
      if (key !== null && key !== RESET_KEY && !key.startsWith(PREFIX)) return;
    }
    listener();
  };
  window.addEventListener("storage", changed);
  window.addEventListener(CHANGE_EVENT, changed);
  return () => {
    window.removeEventListener("storage", changed);
    window.removeEventListener(CHANGE_EVENT, changed);
  };
}
