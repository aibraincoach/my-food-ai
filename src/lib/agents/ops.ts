import { createAdminClient } from '@/lib/supabase/admin';
import { getPostCard, getPostCards, type FeedPost } from '@/lib/posts/feed';
import { getPostDetail, isUuid } from '@/lib/posts/items';
import { summaryLine } from '@/lib/posts/summary-line';
import { sumNutrition } from '@/lib/nutrition/totals';
import { validEatenAt } from '@/lib/posts/eaten-at';
import { AgentError, type AgentIdentity } from './tokens';
import type { SupabaseClient } from '@supabase/supabase-js';
export type AgentArgs = Record<string, unknown>;
type MealRecord = Pick<FeedPost, 'id' | 'caption' | 'eaten_at' | 'status' | 'items'> & Partial<FeedPost>;
const record = (post: MealRecord) => ({ id: post.id, caption: post.caption, eaten_at: post.eaten_at, status: post.status,
  ...(post.status === 'ready' ? { totals: sumNutrition(post.items), summary: summaryLine(post as FeedPost, post.drink) } : {}) });
export function mealInput(input: AgentArgs, now = Date.now()): { caption: string; eaten_at: string } {
  if (!input || typeof input !== 'object' || typeof input.caption !== 'string' || !input.caption.trim() || input.caption.length > 2000 || input.caption.includes('\0')) throw new AgentError("route_c88c8ae8515e");
  if (input.eaten_at !== undefined && (typeof input.eaten_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(input.eaten_at))) throw new AgentError("route_9ab6fd52348f");
  const eaten_at = input.eaten_at === undefined ? new Date(now).toISOString() : validEatenAt(input.eaten_at, now);
  if (!eaten_at || Date.parse(eaten_at) > now) throw new AgentError("route_f6ff28f5e782");
  return { caption: input.caption.trim(), eaten_at };
}
async function owned(db: SupabaseClient, identity: AgentIdentity, id: unknown) {
  if (!isUuid(id)) throw new AgentError("route_e3ebaa16dd9d", 404);
  const { data, error } = await db.from('posts').select('id').is("deleted_at", null).eq('id', id).eq('user_id', identity.userId).maybeSingle();
  if (error) throw new AgentError("route_1e0443a0f2c1", 503);
  if (!data) throw new AgentError("route_e3ebaa16dd9d", 404);
  return id as string;
}
async function activity(db: SupabaseClient, identity: AgentIdentity, action: 'read' | 'listed' | 'corrected', postId?: string, count?: number) {
  const { error } = await db.from('agent_activity').insert({ token_id: identity.tokenId, user_id: identity.userId, action, post_id: postId ?? null, meal_count: count ?? null });
  if (error) throw new AgentError("route_a5adf0a4e619", 503);
}
export async function logMeal(identity: AgentIdentity, input: AgentArgs, db: SupabaseClient = createAdminClient()) {
  const meal = mealInput(input);
  const { data: id, error } = await db.rpc('agent_log_meal', { p_user_id: identity.userId, p_token_id: identity.tokenId, p_caption: meal.caption, p_eaten_at: meal.eaten_at });
  if (error || typeof id !== 'string') throw new AgentError(error?.code === '42501' ? "route_9ebe5656058e" : "route_c31449d6d045", error?.code === '42501' ? 401 : 503);
  return { id, ...meal, status: 'queued' };
}
export async function listMeals(identity: AgentIdentity, input: AgentArgs, db: SupabaseClient = createAdminClient()) {
  const limit = input.limit ?? 20;
  if (!Number.isInteger(limit) || Number(limit) < 1 || Number(limit) > 50) throw new AgentError("route_644b13e9d68e");
  const date = (value: unknown) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value) || !Number.isFinite(Date.parse(value))) throw new AgentError("route_9588923e9714");
    return new Date(value).toISOString();
  };
  const from = input.from === undefined ? undefined : date(input.from);
  const to = input.to === undefined ? undefined : date(input.to);
  if (from && to && from > to) throw new AgentError("route_9588923e9714");
  let query = db.from('posts').select('id,caption,eaten_at,status').is("deleted_at", null).eq('user_id', identity.userId).order('eaten_at', { ascending: false }).order('id', { ascending: false }).limit(Number(limit));
  if (from) query = query.gte('eaten_at', from);
  if (to) query = query.lt('eaten_at', to);
  const { data, error } = await query;
  if (error) throw new AgentError("route_077b160e9e33", 503);
  const posts = await getPostCards(db, (data ?? []).map(row => row.id), 'UTC');
  const byId = new Map(posts.map(post => [post.id, post]));
  const meals = (data ?? []).map(row => record(byId.get(row.id) ?? { ...row, items: [] }));
  await activity(db, identity, 'listed', undefined, meals.length);
  return { meals };
}
export async function getMeal(identity: AgentIdentity, id: unknown, db: SupabaseClient = createAdminClient()) {
  const postId = await owned(db, identity, id);
  const [post, detail, thread] = await Promise.all([getPostCard(db, postId, 'UTC'), getPostDetail(db, postId, 'UTC'),
    db.from('post_comments').select('id,author,body,created_at').eq('post_id', postId).order('created_at')]);
  if (!detail) throw new AgentError("route_e3ebaa16dd9d", 404);
  if (thread.error) throw new AgentError("route_430f651d1ea0", 503);
  await activity(db, identity, 'read', postId);
  const meal = post ?? { ...detail.post, items: detail.items, drink: detail.drink, kind: detail.kind, dayHydration: detail.dayHydration, foodWaterMl: detail.foodWaterMl };
  return { ...record(meal), items: detail.items, thread: thread.data };
}
export async function correctMeal(identity: AgentIdentity, id: unknown, text: unknown, db: SupabaseClient = createAdminClient()) {
  const postId = await owned(db, identity, id);
  if (typeof text !== 'string' || !text.trim() || text.length > 4000 || text.includes('\0')) throw new AgentError("route_8d4ba958c623");
  const { data, error } = await db.rpc('append_post_comment', { p_post_id: postId, p_user_id: identity.userId, p_text: text.trim() });
  if (error) throw new AgentError("route_57691a365e05", error.code === '42501' ? 404 : 503);
  await activity(db, identity, 'corrected', postId);
  return { id: postId, comment: data, status: 'queued' };
}
export async function callTool(identity: AgentIdentity, name: unknown, args: AgentArgs) {
  switch (name) {
    case 'log_meal': return logMeal(identity, args);
    case 'list_meals': return listMeals(identity, args);
    case 'get_meal': return getMeal(identity, args.id);
    case 'correct_meal': return correctMeal(identity, args.id, args.text);
    default: throw new AgentError("route_31ddb0abd2ff");
  }
}
