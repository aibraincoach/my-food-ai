import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dateInZone, getDays, getMonthSummary, getPostedMonthCounts, MonthIntakeError, validDate, validMonth, validZone } from "@/lib/posts/days";
import { emptyIntake } from "@/lib/intake/intake";
import { sumNutrition } from "@/lib/nutrition/totals";

export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const zone = validZone(params.get("tz") || (await cookies()).get("time-zone")?.value);
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (params.get("months") === "1") return NextResponse.json({ months: await getPostedMonthCounts(db, user.id, zone) }, { headers });
    const date = params.get("date");
    if (date !== null) {
      if (!validDate(date) || date > dateInZone(new Date(), zone)) return NextResponse.json({ message_code: "route_2ae3494d1554" }, { status: 400 });
      const days = await getDays(db, user.id, zone, date, date);
      return NextResponse.json({ day: days[0] ?? { date, posts: [], totals: sumNutrition([]), intake: emptyIntake(), pending: 0 } }, { headers });
    }
    const month = params.get("month") ?? undefined;
    if (!validMonth(month)) return NextResponse.json({ message_code: "route_fe962c38e95b" }, { status: 400 });
    return NextResponse.json(await getMonthSummary(db, user.id, zone, month), { headers });
  } catch (failure) {
    if (failure instanceof MonthIntakeError) return NextResponse.json({ message_code: failure.failure.code, month: failure.month, summary: failure.summary }, { status: 503, headers });
    return NextResponse.json({ message_code: "route_2ba8b96ebf24" }, { status: 503, headers });
  }
}
