import {formatNumber} from '@/i18n/format';
import {getTranslations,getLocale} from 'next-intl/server';
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getQueueStats } from "@/lib/admin/stats";
import { font } from "@/lib/theme/font";

export default function AdminPage() {
  return <Suspense fallback={null}><AdminPageContent /></Suspense>;
}

async function AdminPageContent() {
  const { connection } = await import("next/server");
  await connection();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) notFound();
  const { data: profile, error } = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "admin") notFound();
  // No service-role query runs before the user's authenticated role check.
  const support=await getTranslations('support'),t=await getTranslations('admin'),locale=await getLocale();
  const number=(value:number)=>formatNumber(locale,value,{useGrouping:false});
  const stats = await getQueueStats(createAdminClient());
  return <main className={`${font.className} mx-auto w-full max-w-phone bg-surface px-screen-x py-card-gap text-detail text-text`}>
    <h1 className="mb-card-gap text-title">{t('title')}</h1>
    <Link href="/admin/freeze-reports" className="flex min-h-tap items-center underline">{support('adminTitle')}</Link>
    <h2 className="mb-sheet-top text-sheet-title">{t('app')}</h2>
    <table className="mb-card-gap w-full tabular-nums"><thead><tr className="text-left"><th scope="col">{t('count')}</th><th scope="col" className="text-right">{t('allTime')}</th><th scope="col" className="text-right">{t('last24h')}</th></tr></thead>
      <tbody>
        <tr className="h-table-row border-b border-hairline"><td>{t('accounts')}</td><td className="text-right">{number(stats.app.users)}</td><td className="text-right">—</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>{t('mealsPosted')}</td><td className="text-right">{number(stats.app.posts)}</td><td className="text-right">{number(stats.app.postsDay)}</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>{t('modelCalls')}</td><td className="text-right">{number(stats.app.modelCalls)}</td><td className="text-right">{number(stats.app.modelCallsDay)}</td></tr>
        <tr className="h-table-row border-b border-hairline"><td>{t('failedCalls')}</td><td className="text-right">{number(stats.app.failedCalls)}</td><td className="text-right">{number(stats.app.failedCallsDay)}</td></tr>
      </tbody>
    </table>
    <h2 className="mb-sheet-top text-sheet-title">{t('queue')}</h2>
    <dl className="space-y-sheet-top tabular-nums">
      <div className="flex justify-between"><dt>{t('queuedJobs')}</dt><dd>{number(stats.depth)}</dd></div>
      <div className="flex justify-between"><dt>{t('oldestWaiting')}</dt><dd>{stats.oldestAgeSeconds === null ? t('none') : t('seconds',{amount:number(stats.oldestAgeSeconds)})}</dd></div>
      <div className="flex justify-between"><dt>{t('failures24h')}</dt><dd>{number(stats.failures)}</dd></div>
    </dl>
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">{t('jobsPerMinute')}</h2>
    <p className="mb-sheet-top text-muted">{t('lastHourUtc')}</p>
    <table className="w-full tabular-nums"><thead><tr className="text-left"><th scope="col">{t('minuteStarting')}</th><th scope="col" className="text-right">{t('finished')}</th></tr></thead>
      <tbody>{stats.perMinute.map((minute) => <tr key={minute.from} className="h-table-row border-b border-hairline"><td><time dateTime={minute.from}>{minute.from.slice(11, 19)}</time></td><td className="text-right">{number(minute.count)}</td></tr>)}</tbody>
    </table>
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">{t('lastTenErrors')}</h2>
    {stats.errors.length === 0 ? <p className="text-muted">{t('noErrors')}</p> : <ol className="space-y-sheet-top">{stats.errors.map((entry) => <li key={entry.id} className="border-b border-hairline pb-sheet-top">
      <time className="text-meta text-muted" dateTime={entry.finished_at ?? entry.started_at ?? undefined}>{entry.finished_at ?? entry.started_at ?? t('timeUnavailable')}</time>
      <pre className="whitespace-pre-wrap break-words font-sans text-detail">{entry.error}</pre>
    </li>)}</ol>}
    <h2 className="mt-card-gap mb-sheet-top text-sheet-title">{t('recentPosts')}</h2>
    <ol className="space-y-sheet-top">{stats.posts.map((post) => <li key={post.id} className="break-words border-b border-hairline pb-sheet-top">
      <Link href={`/admin/posts/${post.id}`} className="underline">{post.id}</Link><br /><time className="text-meta text-muted" dateTime={post.created_at}>{post.created_at}</time>
    </li>)}</ol>
  </main>;
}
