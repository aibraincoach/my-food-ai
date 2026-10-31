import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/posts/items";
import { saveCaption, validCaption } from "@/lib/posts/caption";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Meal not found." }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body || Object.keys(body).some(key => key !== "caption") || !validCaption(body.caption)) return NextResponse.json({ error: "Invalid caption." }, { status: 400 });
  const result = await saveCaption(db, user.id, id, body.caption);
  return NextResponse.json(result.status === 200 ? { caption: result.caption } : { error: result.error }, { status: result.status });
}
