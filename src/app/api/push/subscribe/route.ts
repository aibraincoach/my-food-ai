import { validSubscription } from "@/lib/push/send";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  let subscription;
  try { subscription = await request.json(); } catch { return NextResponse.json({ error: "Invalid subscription." }, { status: 400 }); }
  // Revalidate again at send time because authenticated users can also insert
  // their own subscription rows through RLS.
  if (!validSubscription(subscription)) return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  // The endpoint identifies this browser installation; authenticated registration
  // replaces its owner so a shared device cannot keep an earlier account's push.
  const { error } = await createAdminClient().from("push_subscriptions").upsert({
    user_id: user.id, endpoint: subscription.endpoint,
    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Subscription could not be saved." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid endpoint." }, { status: 400 }); }
  if (!body || typeof body.endpoint !== "string" || !body.endpoint || body.endpoint.length > 4096) return NextResponse.json({ error: "Invalid endpoint." }, { status: 400 });
  // RLS plus both predicates limit logout to this account on this device.
  const { error } = await client.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.endpoint);
  if (error) return NextResponse.json({ error: "Device could not be detached." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
