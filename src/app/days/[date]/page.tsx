import { connection } from "next/server";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import LocalTimeZone from "@/components/LocalTimeZone";
import PostReadinessListener from "@/components/PostReadinessListener";
import StoryPlayer from "@/components/StoryPlayer";
import { getDays, shiftDay, validDate, validZone } from "@/lib/posts/days";
import { sumNutrition } from "@/lib/nutrition/totals";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DayPage({ params, searchParams }: { params: Promise<{ date: string }>; searchParams: Promise<{ tz?: string }> }) {
  await connection();
  const { date } = await params;
  if (!validDate(date)) notFound();
  const query = await searchParams;
  const zone = validZone(query.tz || (await cookies()).get("time-zone")?.value);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const days = await getDays(supabase, user.id, zone, date, date);
  const day = days[0] ?? { date, posts: [], totals: sumNutrition([]) };
  // Stories live outside the tabs layout, so they need their own readiness observer.
  return <><PostReadinessListener /><LocalTimeZone zone={zone} explicit={Boolean(query.tz)} /><StoryPlayer key={`${date}:${zone}`} day={day} zone={zone} previous={shiftDay(date, -1)} next={shiftDay(date, 1)} /></>;
}
