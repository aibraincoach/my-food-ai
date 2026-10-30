import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueStagedPhotoCleanup } from "@/lib/media/staged-photo";
import { signShotUploads } from "@/lib/media/storage";

interface ShotSpec {
  position: number;
  width: number;
  height: number;
}

// POST { postId, shots: [{ position, width, height }] } ->
// { uploads: [{ position, originalPath, feedPath, signedUrls... }] }.
// Verifies the post belongs to the caller, records the post_media rows,
// and returns signed upload URLs for both JPEGs of every shot.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { postId?: string; staged?: boolean; shots?: ShotSpec[] };
  if (body.staged === true) {
    // A scanned food must upload before the ready post is inserted; it never creates an analyze job.
    const stageId = crypto.randomUUID();
    try {
      // Persist cleanup before issuing either upload capability, including partial uploads.
      await queueStagedPhotoCleanup(createAdminClient(), user.id, stageId);
      const uploads = await signShotUploads(supabase, user.id, stageId, [0]);
      return NextResponse.json({ uploads });
    } catch {
      return NextResponse.json({ error: "Signing upload URLs failed." }, { status: 500 });
    }
  }
  if (!body.postId || !Array.isArray(body.shots) || body.shots.length === 0) {
    return NextResponse.json({ error: "postId and shots are required." }, { status: 400 });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", body.postId)
    .single();
  if (postError || !post) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const { error: mediaError } = await supabase.from("post_media").insert(
    body.shots.map((s) => ({
      post_id: body.postId,
      storage_path: `${user.id}/${body.postId}/${s.position}.jpg`,
      position: s.position,
      width: s.width,
      height: s.height,
    }))
  );
  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 400 });
  }

  try {
    const uploads = await signShotUploads(
      supabase,
      user.id,
      body.postId,
      body.shots.map((s) => s.position)
    );
    return NextResponse.json({ uploads });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signing upload URLs failed." },
      { status: 500 }
    );
  }
}
