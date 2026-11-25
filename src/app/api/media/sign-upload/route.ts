import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueStagedPhotoCleanup } from "@/lib/media/staged-photo";
import { signShotUploads } from "@/lib/media/storage";

// The pack-photo flow uploads to a fresh cleanup-backed write-once stage.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message_code: "route_ac6a88b19530" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (body?.staged !== true) return NextResponse.json({message_code: "route_8752bd7a7233"}, {status: 400});
  const stageId = crypto.randomUUID();
  try {
    // Persist cleanup before issuing either upload capability, including partial uploads.
    await queueStagedPhotoCleanup(createAdminClient(), user.id, stageId);
    const uploads = await signShotUploads(supabase, user.id, stageId, [0], {upsert: false});
    return NextResponse.json({uploads});
  } catch {
    return NextResponse.json({message_code: "route_df3e655d054f"}, {status: 500});
  }
}
