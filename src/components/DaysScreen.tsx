import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LocalTimeZone from "@/components/LocalTimeZone";
import DaysView from "@/components/DaysView";
import { createClient } from "@/lib/supabase/server";
import { dateInZone, getDays, getEarliestPostDate, getMonthSummary, shiftMonth, validZone, type MonthSummary } from "@/lib/posts/days";
import { sumNutrition } from "@/lib/nutrition/totals";
import { emptyIntake } from "@/lib/intake/intake";

export default async function DaysScreen({ tz, date }: { tz?: string; date?: string }) {
  const cookieZone = (await cookies()).get("time-zone")?.value;
  const zone = validZone(tz || cookieZone);
  const today = dateInZone(new Date(), zone);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const earliestPosted = await getEarliestPostDate(supabase, user.id, zone);
  const earliest = [earliestPosted ?? today, date ?? today, today].sort()[0];
  const currentMonth = today.slice(0, 7), previousMonth = shiftMonth(currentMonth, -1);
  const initialMonths: Record<string, MonthSummary> = {};
  const names = [currentMonth, ...(previousMonth >= earliest.slice(0, 7) ? [previousMonth] : [])];
  await Promise.all(names.map(async month => { initialMonths[month] = await getMonthSummary(supabase, user.id, zone, month); }));
  const initialDay = date ? (await getDays(supabase, user.id, zone, date, date))[0] ?? { date, posts: [], totals: sumNutrition([]), intake: emptyIntake() } : undefined;
  return <><LocalTimeZone zone={zone} explicit={Boolean(tz)} /><DaysView key={zone} initialMonths={initialMonths} earliest={earliest} today={today} zone={zone} initialDay={initialDay} /></>;
}
