import {cookies} from "next/headers";
import {validZone} from "@/lib/posts/days";
import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signShotUploads } from "@/lib/media/storage";
import { validEatenAt } from "@/lib/posts/eaten-at";
import { isUuid } from "@/lib/posts/items";
import { publishUpload, validUploadShots } from "@/lib/posts/upload-draft";

function kickoff(request: Request) {
  after(async () => {
    const response = await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) console.error("Published post worker kickoff failed.");
  });
}

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.caption !== "string" || body.caption.length > 2000 || body.caption.includes("\u0000")) return NextResponse.json({ error: "Invalid caption." }, { status: 400 });
  if(body.save_as_meal!==undefined&&typeof body.save_as_meal!=='boolean')return NextResponse.json({error:'Invalid save choice.'},{status:400});
  const shots = body.shots ?? [];
  if (!validUploadShots(shots) || (body.capture_intent !== undefined && !["photo", "text"].includes(body.capture_intent)) || (body.capture_intent === "photo" && shots.length === 0) || (shots.length === 0 && !body.caption.trim())) return NextResponse.json({ error: "The selected photo is not ready. Your draft was kept." }, { status: 400 });
  const notEatenPosition=body.not_eaten_position??null;
  if(notEatenPosition!==null&&(!Number.isInteger(notEatenPosition)||notEatenPosition<1||notEatenPosition>=shots.length))return NextResponse.json({error:'Only a photo after the first can be marked Not eaten.'},{status:400});
  const operationId = body.operation_id ?? randomUUID();
  if (!isUuid(operationId)) return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  const eatenAt = body.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body.eaten_at);
  if (!eatenAt) return NextResponse.json({ error: "Invalid time eaten." }, { status: 400 });
  const location = body.location ?? null;
  if (location !== null && (typeof location !== "object" || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) || Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180 || (location.accuracy_m != null && (!Number.isFinite(location.accuracy_m) || location.accuracy_m < 0)))) return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_post_upload_with_options", { p_operation_id: operationId, p_user_id: user.id, p_caption: body.caption, p_eaten_at: eatenAt, p_shots: shots, p_location: location, p_not_eaten_position:notEatenPosition,p_save_as_meal:body.save_as_meal===true,p_render_zone:validZone((await cookies()).get("time-zone")?.value) });
  if (error || !data) {
    const expired = /expired/i.test(error?.message ?? "");
    return NextResponse.json({ error: expired ? "The upload draft expired. Your photos were kept; try again." : "The post draft could not be reserved. Your photos were kept; try again." }, { status: expired ? 410 : 409 });
  }
  if (data.published) { kickoff(request); return NextResponse.json({ postId: operationId, uploads: [], completed: true }); }
  if (shots.length === 0) {
    try { await publishUpload(admin, user.id, operationId); kickoff(request); return NextResponse.json({ postId: operationId, uploads: [], completed: true }); }
    catch { return NextResponse.json({ error: "The post could not be completed. Your draft was kept; try again." }, { status: 409 }); }
  }
  try {
    const uploads = await signShotUploads(db, user.id, operationId, shots.map(s => s.position));
    return NextResponse.json({ postId: operationId, uploads, completed: false });
  } catch { return NextResponse.json({ error: "Upload could not be prepared. Your draft was kept; try again." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.postId)) return NextResponse.json({ error: "Invalid draft." }, { status: 400 });
  try {
    const postId = await publishUpload(createAdminClient(), user.id, body.postId);
    kickoff(request);
    return NextResponse.json({ ok: true, postId });
  } catch (error) {
    const expired = error instanceof Error && error.name === "UploadExpiredError";
    return NextResponse.json({ error: expired ? "The upload draft expired. Your photos were kept; try again." : "The photo upload could not be completed. Your draft was kept; try again." }, { status: expired ? 410 : 409 });
  }
}
