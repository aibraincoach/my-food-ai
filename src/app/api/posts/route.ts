import { capUser } from "@/lib/limits/user-cap";
import {cookies} from "next/headers";
import {validZone} from "@/lib/posts/days";
import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validEatenAt } from "@/lib/posts/eaten-at";
import { isUuid } from "@/lib/posts/items";
import { publishUpload, validUploadShots, reserveUpload, UploadReservationError } from "@/lib/posts/upload-draft";

function kickoff(request: Request) {
  after(async () => {
    const response = await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!response.ok) console.error("Published post worker kickoff failed.");
  });
}

export async function POST(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.caption !== "string" || body.caption.length > 2000 || body.caption.includes("\u0000")) return NextResponse.json({ message_code: "route_277df75eda6a" }, { status: 400 });
  if(body.save_as_meal!==undefined&&typeof body.save_as_meal!=='boolean')return NextResponse.json({message_code: "route_f4094c5e9670"},{status:400});
  const shots = body.shots ?? [];
  if (!validUploadShots(shots) || (body.capture_intent !== undefined && !["photo", "text"].includes(body.capture_intent)) || (body.capture_intent === "photo" && shots.length === 0) || (shots.length === 0 && !body.caption.trim())) return NextResponse.json({ message_code: "route_97d26acf361a" }, { status: 400 });
  const notEatenPositions=body.not_eaten_positions??(body.not_eaten_position==null?[]:[body.not_eaten_position]);
  if(!Array.isArray(notEatenPositions)||new Set(notEatenPositions).size!==notEatenPositions.length||notEatenPositions.some((position:unknown)=>!Number.isInteger(position)||Number(position)<1||Number(position)>=shots.length))return NextResponse.json({message_code: "route_4a0a2e1567cf"}, {status:400});
  const operationId = body.operation_id ?? randomUUID();
  if (!isUuid(operationId)) return NextResponse.json({ message_code: "route_fbbb6b3433e9" }, { status: 400 });
  const eatenAt = body.eaten_at === undefined ? new Date().toISOString() : validEatenAt(body.eaten_at);
  if (!eatenAt) return NextResponse.json({ message_code: "route_22819daf8128" }, { status: 400 });
  const location = body.location ?? null;
  if (location !== null && (typeof location !== "object" || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) || Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180 || (location.accuracy_m != null && (!Number.isFinite(location.accuracy_m) || location.accuracy_m < 0)))) return NextResponse.json({ message_code: "route_f6ebe8b9d706" }, { status: 400 });
  const admin = createAdminClient();
  // #471: the hourly cap counts meals, not requests. The composer re-sends the same reservation when a
  // photo is picked, on each staged change and at Post; only a new reservation spends a hit. A failed
  // read counts the hit, as before.
  const [knownDraft, knownPost] = await Promise.all([
    admin.from("post_upload_drafts").select("id").eq("id", operationId).eq("user_id", user.id).maybeSingle(),
    admin.from("posts").select("id").eq("id", operationId).eq("user_id", user.id).maybeSingle(),
  ]);
  if (!knownDraft.data && !knownPost.data) { const capped = await capUser(user.id, "post"); if (capped) return capped; }
  let reservation: Awaited<ReturnType<typeof reserveUpload>>;
  try {
    reservation = await reserveUpload(admin, db, user.id, {
      operationId, caption: body.caption, eatenAt, shots, location,
      notEatenPositions, saveAsMeal: body.save_as_meal === true,
      renderZone: validZone((await cookies()).get("time-zone")?.value),
    });
  } catch (error) {
    if (error instanceof UploadReservationError) return NextResponse.json({  message_code: error.failure.code }, { status: error.status });
    throw error;
  }
  if (reservation.published) { kickoff(request); return NextResponse.json({ postId: operationId, uploads: [], completed: true }); }
  if (shots.length === 0) {
    try { await publishUpload(admin, user.id, operationId); kickoff(request); return NextResponse.json({ postId: operationId, uploads: [], completed: true }); }
    catch { return NextResponse.json({ message_code: "route_d5d777dc2a65" }, { status: 409 }); }
  }
  return NextResponse.json({ postId: operationId, uploads: reservation.uploads, completed: false });
}

export async function PUT(request: Request) {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!isUuid(body?.postId)) return NextResponse.json({ message_code: "route_fbbb6b3433e9" }, { status: 400 });
  try {
    const postId = await publishUpload(createAdminClient(), user.id, body.postId);
    kickoff(request);
    return NextResponse.json({ ok: true, postId });
  } catch (error) {
    const expired = error instanceof Error && error.name === "UploadExpiredError";
    return NextResponse.json({  message_code: expired ? "uploadExpired" : "route_e1c684489cf3" }, { status: expired ? 410 : 409 });
  }
}
