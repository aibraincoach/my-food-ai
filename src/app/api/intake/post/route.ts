import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseDrinkInput, postDrink } from "@/lib/intake/post-drink";
import { drinksForDay, getDrinkCardData, getDrinkCardsData } from "@/lib/intake/hydration";
import { dateInZone, validZone } from "@/lib/posts/days";
import { isUuid } from "@/lib/posts/items";

export async function GET(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const zone = validZone(params.get("tz") ?? (await cookies()).get("time-zone")?.value);
  try {
    const postIds = params.get("post_ids");
    if (postIds !== null) {
      const ids = [...new Set(postIds.split(","))];
      if (!ids.length || ids.length > 50 || ids.some(id => !isUuid(id))) return NextResponse.json({ error: "Invalid posts." }, { status: 400 });
      return NextResponse.json({ drinks: await getDrinkCardsData(db, user.id, ids, zone) });
    }
    const postId = params.get("post_id");
    if (postId) {
      if (!isUuid(postId)) return NextResponse.json({ error: "Invalid post." }, { status: 400 });
      return NextResponse.json({ drink: await getDrinkCardData(db, user.id, postId, zone) });
    }
    return NextResponse.json({ rows: await drinksForDay(db, user.id, dateInZone(new Date(), zone), zone) });
  } catch { return NextResponse.json({ error: "Drinks could not be read." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const input = parseDrinkInput(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: "Choose a whole amount from 1 to 5000 ml (coffee up to 1000 mg caffeine)." }, { status: 400 });
  const zone = validZone((await cookies()).get("time-zone")?.value);
  try {
    const result = await postDrink(createAdminClient(), user.id, input, zone);
    return NextResponse.json({ post_id: result.postId, drink: result.drink }, { status: 201 });
  } catch { return NextResponse.json({ error: "The drink could not be saved." }, { status: 502 }); }
}
