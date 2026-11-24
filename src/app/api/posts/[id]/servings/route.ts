import { capUser } from "@/lib/limits/user-cap";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/posts/items";
import { validServings } from "@/lib/posts/servings";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
 const capped = await capUser(user.id, "correct"); if (capped) return capped;
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ message_code: "route_9c5ac1fe3dd7" }, { status: 404 });
  const body = await request.json().catch(() => null) as { servings?: unknown } | null;
  if (!validServings(body?.servings)) return NextResponse.json({ message_code: "route_45eeb6b96d35" }, { status: 400 });
  const { data, error } = await createAdminClient().rpc("set_post_servings", { p_post_id: id, p_user_id: user.id, p_servings: body!.servings });
  if (error) {
    const status = error.code === "42501" ? 404 : error.code === "55000" ? 409 : error.code?.startsWith("22") ? 400 : 500;
    return NextResponse.json({ message_code: status === 409 ? "route_3b13500a7317" : status === 404 ? "route_9c5ac1fe3dd7" : status === 400 ? "route_45eeb6b96d35" : "route_bbb2ee989003" }, { status });
  }
  after(async () => {
    try { await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { /* the queued job is picked up by the next tick */ }
  });
  return NextResponse.json({ servings: Number(data) });
}
