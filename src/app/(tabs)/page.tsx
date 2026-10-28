import { connection } from "next/server";
import { Suspense } from "react";
import Feed from "@/components/Feed";
import DayBubbles from "@/components/DayBubbles";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { dateInZone, getLoggedDates, shiftDay, validZone } from "@/lib/posts/days";

async function HomeDays() {
  await connection();
  const zone = validZone((await cookies()).get("time-zone")?.value);
  const today = dateInZone(new Date(), zone);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const days = user ? await getLoggedDates(supabase, user.id, zone, shiftDay(today, -6), today) : [];
  return <DayBubbles days={days} today={today} zone={zone} />;
}

export default function Home() {
  return <main className="flex flex-1 flex-col">
    <header className="flex h-top-h items-center px-screen-x"><h1 className="text-title">My Food AI</h1></header>
    <Suspense fallback={<div className="h-bar-h" />}><HomeDays /></Suspense>
    <Suspense fallback={<p className="px-screen-x text-detail text-muted">Loading feed…</p>}>
      <Feed />
    </Suspense>
  </main>;
}
