import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/posts/items";
import { validEatenAt } from "@/lib/posts/eaten-at";

// Change when a meal was eaten. The session client keeps row-level security in force; the owner filter is explicit too.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ message_code: "route_6798c08ac231" }, { status: 404 });
  const body = await request.json().catch(() => null) as { eaten_at?: unknown } | null;
  const eatenAt = validEatenAt(body?.eaten_at);
  if (!eatenAt) return NextResponse.json({ message_code: "route_d983523f85b4" }, { status: 400 });
  const { data, error } = await supabase.from("posts").update({ eaten_at: eatenAt }).eq("id", id).eq("user_id", user.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ message_code: "route_6f4458352e2c" }, { status: 500 });
  if (!data) return NextResponse.json({ message_code: "route_6798c08ac231" }, { status: 404 });
  return NextResponse.json({ eaten_at: eatenAt });
}
