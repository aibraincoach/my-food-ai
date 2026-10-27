import { after, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { editPostItem, isUuid, parseItemEdit } from "@/lib/posts/items";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  // Authorize with the user's RLS-scoped client before constructing an admin
  // write. The RPC repeats ownership under its transaction's post lock.
  const { data: post, error: readError } = await supabase.from("posts").select("id").eq("id", id).maybeSingle();
  if (readError) return NextResponse.json({ error: "Meal could not be loaded." }, { status: 500 });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  let edit;
  try { edit = parseItemEdit(await request.json()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid edit." }, { status: 400 }); }
  const result = await editPostItem(createAdminClient(), id, user.id, edit);
  if (result.error) {
    const code = result.error.code;
    const status = code === "42501" ? 404 : (code === "40001" || code === "55000") ? 409 : code?.startsWith("22") ? 400 : 500;
    const message = code === "55000" ? "Wait for the initial meal analysis before editing." : status === 409 ? "This item changed. Reload and try again." : status === 400 ? "Invalid item details." : status === 404 ? "Post not found." : "The item could not be saved.";
    return NextResponse.json({ error: message }, { status });
  }
  after(async () => {
    // The committed job remains queued if the best-effort tick fails.
    try { await fetch(new URL("/api/jobs/tick", request.url), { cache: "no-store", signal: AbortSignal.timeout(10_000) }); } catch { /* picked up by the next tick */ }
  });
  return NextResponse.json({ item_id: result.itemId });
}
