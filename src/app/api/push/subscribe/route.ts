import { validSubscription } from "@/lib/push/send";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ message_code: "route_3ece34837224" }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  let subscription;
  try { subscription = await request.json(); } catch { return NextResponse.json({ message_code: "route_2f3a0aee1dcb" }, { status: 400 }); }
  // Revalidate again at send time because authenticated users can also insert
  // their own subscription rows through RLS.
  if (!validSubscription(subscription)) return NextResponse.json({ message_code: "route_2f3a0aee1dcb" }, { status: 400 });
  // The endpoint identifies this browser installation; authenticated registration
  // replaces its owner so a shared device cannot keep an earlier account's push.
  const { error } = await createAdminClient().from("push_subscriptions").upsert({
    user_id: user.id, endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ message_code: "route_0f95528cf124" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ message_code: "route_3ece34837224" }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ message_code: "route_7023df8907de" }, { status: 400 }); }
  if (!body || typeof body.endpoint !== "string" || !body.endpoint || body.endpoint.length > 4096) return NextResponse.json({ message_code: "route_7023df8907de" }, { status: 400 });
  // RLS plus both predicates limit logout to this account on this device.
  const { error } = await client.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ message_code: "route_66afdc3f8a16" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
