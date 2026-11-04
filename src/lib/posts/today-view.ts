import { dateInZone } from "./days";
import { sumNutrition, type MealTotals } from "@/lib/nutrition/totals";
import type { FeedPost } from "./feed";
export interface TodayView { date: string; posts: { id: string; caption: string; eatenAt: string; photoUrl: string | null; items: { name: string }[]; totals: { calories: number | null } }[]; totals: MealTotals }
// Today's column from the feed's first page, so Home does not query today's
// totals a second time. Null when today's posts may run past the page: the
// page is ordered by eaten_at descending, so a post eaten before today, or
// no next page, proves the page holds every post eaten today.
export function todayFromPage(page: { posts: FeedPost[]; nextCursor: string | null }, zone: string, now = new Date()): TodayView | null {
  const today = dateInZone(now, zone);
  const complete = page.nextCursor === null || page.posts.some(post => dateInZone(post.eaten_at, zone) < today);
  if (!complete) return null;
  const todays = page.posts.filter(post => post.status === "ready" && dateInZone(post.eaten_at, zone) === today);
  if(todays.some(post=>post.itemsUnavailable))return null;
  return { date: today, posts: todays.map(post => ({ id: post.id, caption: post.caption, eatenAt: post.eaten_at, photoUrl: post.photoUrl, items: post.items.map(item => ({ name: item.name })), totals: sumNutrition(post.items) })), totals: sumNutrition(todays.flatMap(post => post.items)) };
}
