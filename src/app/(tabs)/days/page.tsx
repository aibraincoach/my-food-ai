import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LocalTimeZone from "@/components/LocalTimeZone";
import MonthGrid from "@/components/MonthGrid";
import { dateInZone, getDays, validZone } from "@/lib/posts/days";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function DaysPage({ searchParams }: { searchParams: Promise<{ month?: string; tz?: string }> }) {
  await connection();
  const params = await searchParams;
  const zone = validZone(params.tz || (await cookies()).get("time-zone")?.value);
  const today = dateInZone(new Date(), zone);
  const month = params.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month) ? params.month : today.slice(0, 7);
  const last = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0)).getUTCDate();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const days = await getDays(supabase, user.id, zone, `${month}-01`, `${month}-${last}`);
  return <main className="flex flex-1 flex-col"><LocalTimeZone zone={zone} explicit={Boolean(params.tz)} /><MonthGrid month={month} days={days} today={today} zone={zone} /></main>;
}
