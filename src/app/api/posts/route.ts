import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signShotUploads } from "@/lib/media/storage";

import { UPLOAD_PARK_MS } from "@/lib/media/upload-window";
import { releaseParkedAnalyze } from "@/lib/queue/release";

// POST creates the posts row (status queued), the post_media rows and the
// analyze job in one go, and returns signed upload URLs. Caption-only posts
// skip the uploads. PUT (the complete step) ticks the queue once uploads
// finish; the post stays queued until the worker (item 7) claims it.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as {
    location?: { lat: number; lng: number; accuracy_m?: number | null } | null;
    caption?: string;
    eaten_at?: string;
    shots?: { position: number; width: number; height: number; phash?: string }[];
  };
  for(const shot of body.shots??[]) {
    if(shot.phash !== undefined) {
      if(typeof shot.phash!=="string" || !/^-?\d{1,20}$/.test(shot.phash) || BigInt(shot.phash)<-(BigInt(1)<<BigInt(63)) || BigInt(shot.phash)>=(BigInt(1)<<BigInt(63)))
        return NextResponse.json({error:"Invalid photo hash."},{status:400});
    }
  }
  const location = body.location;
  if (location != null && (
    typeof location !== "object" || !Number.isFinite(location.lat) || !Number.isFinite(location.lng) ||
    Math.abs(location.lat) > 90 || Math.abs(location.lng) > 180 ||
    (location.accuracy_m != null && (!Number.isFinite(location.accuracy_m) || location.accuracy_m < 0))
  )) return NextResponse.json({ error: "Invalid location." }, { status: 400 });
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      caption: body.caption ?? "",
      eaten_at: body.eaten_at ?? new Date().toISOString(),
      status: "queued",
    })
    .select("id")
    .single();
  if (postError || !post) {
    return NextResponse.json({ error: postError?.message ?? "Post insert failed." }, { status: 400 });
  }

  if (location) {
    const { error } = await supabase.from("post_locations").insert({
      post_id: post.id, lat: location.lat, lng: location.lng,
      accuracy_m: location.accuracy_m ?? null,
    });
    if (error) {
      const cleanup = await supabase.from("posts").delete().eq("id", post.id);
      if (cleanup.error) {
        console.error("Post cleanup failed after location insertion failure.");
        return NextResponse.json({ error: "Post could not be completed. Please check Home before trying again." }, { status: 500 });
      }
      return NextResponse.json({ error: "Could not save post location." }, { status: 400 });
    }
  }
  const shots = body.shots ?? [];
  if (shots.length > 0) {
    const { error: mediaError } = await supabase.from("post_media").insert(
      shots.map((s) => ({
        post_id: post.id,
        storage_path: `${user.id}/${post.id}/${s.position}.jpg`,
        position: s.position,
        phash: s.phash ?? null,
        width: s.width,
        height: s.height,
      }))
    );
    if (mediaError) {
      // No orphan posts: media belongs to the post, so drop the post and
      // let the cascade take the media rows with it.
      await supabase.from("posts").delete().eq("id", post.id);
      return NextResponse.json({ error: mediaError.message }, { status: 400 });
    }
  }

  // jobs has no client insert policy (service-role only), so the enqueue
  // uses the admin client; the secret key never leaves the server.
  const { error: jobError } = await createAdminClient()
    .from("jobs")
    .insert({ post_id: post.id, kind: "analyze", priority: 100, status: "queued", ...(shots.length > 0 ? { run_after: new Date(Date.now() + UPLOAD_PARK_MS).toISOString() } : {}) });
  if (jobError) {
    // A post must never exist without its job: drop the post (media rows
    // follow through the cascade) and report the enqueue failure.
    await supabase.from("posts").delete().eq("id", post.id);
    return NextResponse.json({ error: jobError.message }, { status: 400 });
  }

  const uploads =
    shots.length > 0
      ? await signShotUploads(
          supabase,
          user.id,
          post.id,
          shots.map((s) => s.position)
        ).catch((e: unknown) => {
          return { error: e instanceof Error ? e.message : "Signing upload URLs failed." };
        })
      : [];
  if ("error" in (uploads as object) && (uploads as { error?: string }).error) {
    return NextResponse.json({ error: (uploads as { error: string }).error }, { status: 500 });
  }
  // Caption-only posts have no upload-complete request to wait for. Keep
  // the kickoff alive after this response; the tick route owns the worker lease.
  if (shots.length === 0) after(async () => {
    const response = await fetch(new URL("/api/jobs/tick", request.url), {
      cache: "no-store", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Post worker kickoff failed: ${response.status}`);
  });
  return NextResponse.json({ postId: post.id, uploads });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { postId } = (await request.json()) as { postId?: string };
  if (!postId) return NextResponse.json({ error: "postId is required." }, { status: 400 });

  const { data: post } = await supabase.from("posts").select("id").eq("id", postId).eq("user_id", user.id).single();
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  // The uploads are done: release the parked analyze job now (the admin client; jobs has no client policy).
  const release = await releaseParkedAnalyze(createAdminClient(), postId);
  if (release.error) return NextResponse.json({ error: "Post could not be released for analysis." }, { status: 500 });
  // Best-effort tick; the route lands with item 7.
  try {
    await fetch(new URL("/api/jobs/tick", request.url));
  } catch {
    // The worker picks the job up on the next request tick.
  }
  return NextResponse.json({ ok: true });
}
