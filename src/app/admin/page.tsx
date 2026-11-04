import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQueueStats } from "@/lib/admin/stats";
import { font } from "@/lib/theme/font";

export const instant = false;

export default async function AdminPage() {
  await connection();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) notFound();
  const { data: profile, error } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "admin") notFound();
  // No service-role query runs before the user's authenticated role check.
  const stats = await getQueueStats(createAdminClient());
  return <main className={`${font.className} mx-auto w-full max-w-phone bg-surface px-screen-x py-card-gap text-detail text-text`}>
    <h1 className="mb-card-gap text-title">Admin</h1>
    <h2 className="mb-sheet-top text-sheet-title">App</h2>
    <table className="mb-card-gap w-full tabular-nums"><thead><tr className="text-left"><th scope="col">Count</th><th scope="col" className="text-right">All time</th><th scope="col" className="text-right">Last 24 h</th></tr></thead>
      <tbody>
        <tr className="h-table-row border-b border-hairline"><td>Accounts</td><td className="text-right">{stats.app.users}</td><td className="text-right">—</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>Meals posted</td><td className="text-right">{stats.app.posts}</td><td className="text-right">{stats.app.postsDay}</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>Model calls</td><td className="text-right">{stats.app.modelCalls}</td><td className="text-right">{stats.app.modelCallsDay}</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>Failed model calls</td><td className="text-right">{stats.app.failedCalls}</td><td className="text-right">{stats.app.failedCallsDay}</td></tr>
      </tbody>
    </table>
    <h2 className="mb-sheet-top text-sheet-title">Queue</h2>
    <dl className="space-y-sheet-top tabular-nums">
      <div className="flex justify-between"><dt>Queued jobs</dt><dd>{stats.depth}</dd></div>
      <div className="flex justify-between"><dt>Oldest waiting job</dt><dd>{stats.oldestAgeSeconds === null ? "None" : `${stats.oldestAgeSeconds} s`}</dd></div>
      <div className="flex justify-between"><dt>Failures in 24 hours</dt><dd>{stats.failures}</dd></div>
    </dl>
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">Jobs finished per minute</h2>
    <p className="mb-sheet-top text-muted">Last hour · UTC</p>
    <table className="w-full tabular-nums"><thead><tr className="text-left"><th scope="col">Minute starting</th><th scope="col" className="text-right">Finished</th></tr></thead>
      <tbody>{stats.perMinute.map((minute) => <tr key={minute.from} className="h-table-row border-b border-hairline"><td><time dateTime={minute.from}>{minute.from.slice(11, 19)}</time></td><td className="text-right">{minute.count}</td></tr>)}</tbody>
    </table>
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">Last ten job errors</h2>
    {stats.errors.length === 0 ? <p className="text-muted">No errors</p> : <ol className="space-y-sheet-top">{stats.errors.map((entry) => <li key={entry.id} className="border-b border-hairline pb-sheet-top">
      <time className="text-meta text-muted" dateTime={entry.finished_at ?? entry.started_at ?? undefined}>{entry.finished_at ?? entry.started_at ?? "Time unavailable"}</time>
      <pre className="whitespace-pre-wrap break-words font-sans text-detail">{entry.error}</pre>
    </li>)}</ol>}
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">Recent posts</h2>
    <ol className="space-y-sheet-top">{stats.posts.map((post) => <li key={post.id} className="break-words border-b border-hairline pb-sheet-top">
      <Link href={`/admin/posts/${post.id}`} className="underline">{post.id}</Link><br /><time className="text-meta text-muted" dateTime={post.created_at}>{post.created_at}</time>
    </li>)}</ol>
  </main>;
}
