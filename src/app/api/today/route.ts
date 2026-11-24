import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validZone } from "@/lib/posts/days";
import { homeToday } from "@/lib/posts/home-today";

export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const zone = validZone(params.get("tz") || (await cookies()).get("time-zone")?.value);
  const headers = { "Cache-Control": "private, no-store" };
  try {
    return NextResponse.json(await homeToday(db, user.id, zone), { headers });
  } catch {
    return NextResponse.json({ message_code: "route_fb95eda95779" }, { status: 503, headers });
  }
}
