import type { FeedPost } from "./feed";
// The feed's last copy of each card, so a meal's first frame (design 7b)
// paints from memory in the tick of the tap. Memory only; nothing persists.
const posts = new Map<string, FeedPost>();
export function rememberPost(post: FeedPost): void { posts.delete(post.id); posts.set(post.id, post); }
export function clearRememberedPosts():void { posts.clear(); }
export function recallPost(id: string): FeedPost | null { return posts.get(id) ?? null; }
