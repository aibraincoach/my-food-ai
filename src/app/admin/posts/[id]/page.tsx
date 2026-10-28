import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/posts/items";
import { font } from "@/lib/theme/font";

export const instant = false;

type Call = { id: string; kind: string; started_at: string; duration_ms: number; input_tokens: number | null; output_tokens: number | null; request_text: string | null; response_text: string | null; fdc_id: number | null; error: string | null };

export default async function PostTrace({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) notFound();
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") notFound();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  // Use the admin-select RLS policy through the session client, never a service
  // read. Page through every call so long correction histories stay visible.
  const calls: Call[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client.from("model_calls").select("*").eq("post_id", id)
      .order("started_at").order("id").range(offset, offset + 99);
    if (error) throw new Error("Model calls could not be loaded.");
    calls.push(...data as Call[]);
    if (data.length < 100) break;
  }
  return <main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface px-screen-x py-card-gap text-detail text-text`}>
    <Link href="/admin" className="mb-sheet-top inline-flex min-h-tap items-center text-muted">Back to queue</Link>
    <h1 className="text-title">Model calls</h1><p className="my-sheet-top break-all text-meta text-muted">{id}</p>
    {calls.length === 0 ? <p>No calls recorded.</p> : <ol className="space-y-card-gap">{calls.map((call) => <li key={call.id} className="border-b border-hairline pb-card-gap">
      <h2 className="text-sheet-title">{call.kind}</h2><time dateTime={call.started_at} className="text-meta text-muted">{call.started_at}</time>
      <dl className="mt-sheet-top space-y-grid tabular-nums">
        <div>Duration: {call.duration_ms} ms</div><div>Tokens in / out: {call.input_tokens ?? "—"} / {call.output_tokens ?? "—"}</div>
        <div>FDC id: {call.fdc_id ?? "—"}</div>
      </dl>
      <h3 className="mt-sheet-top font-semibold">Request</h3><pre className="whitespace-pre-wrap break-words font-sans">{call.request_text ?? "—"}</pre>
      <h3 className="mt-sheet-top font-semibold">Response</h3><pre className="whitespace-pre-wrap break-words font-sans">{call.response_text ?? "—"}</pre>
      {call.error && <p className="mt-sheet-top">Error: {call.error}</p>}
    </li>)}</ol>}
  </main>;
}
