import {getTranslations,getLocale} from 'next-intl/server';
import {formatNumber} from '@/i18n/format';
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/posts/items";
import { font } from "@/lib/theme/font";

type Call = { id: string; kind: string; started_at: string; duration_ms: number; input_tokens: number | null; output_tokens: number | null; request_text: string | null; response_text: string | null; fdc_id: number | null; reference_ref:string|null; error: string | null };

export default function PostTrace({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={null}><PostTraceContent params={params} /></Suspense>;
}

async function PostTraceContent({ params }: { params: Promise<{ id: string }> }) {
  const { connection } = await import("next/server");
  const t=await getTranslations('admin'),locale=await getLocale();
  const number=(value:number|null)=>value===null?'—':formatNumber(locale,value,{useGrouping:false});
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
    if (error) throw new Error(t('modelCallsLoadFailed'));
    calls.push(...data as Call[]);
    if (data.length < 100) break;
  }
  return <main className={`${font.className} mx-auto min-h-dvh w-full max-w-phone bg-surface px-screen-x py-card-gap text-detail text-text`}>
    <Link href="/admin" className="mb-sheet-top inline-flex min-h-tap items-center text-muted">{t('backToQueue')}</Link>
    <h1 className="text-title">{t('modelCalls')}</h1><p className="my-sheet-top break-all text-meta text-muted">{id}</p>
    {calls.length === 0 ? <p>{t('noCalls')}</p> : <ol className="space-y-card-gap">{calls.map((call) => <li key={call.id} className="border-b border-hairline pb-card-gap">
      <h2 className="text-sheet-title">{call.kind==='mext'?t('mextCallKind'):call.kind}</h2><time dateTime={call.started_at} className="text-meta text-muted">{call.started_at}</time>
      <dl className="mt-sheet-top space-y-grid tabular-nums">
        <div>{t('duration',{amount:number(call.duration_ms)})}</div><div>{t('tokensInOut',{input:number(call.input_tokens),output:number(call.output_tokens)})}</div>
        <div>{call.kind==='mext'?(call.reference_ref??'—'):t('fdcId',{id:call.fdc_id??'—'})}</div>
      </dl>
      <h3 className="mt-sheet-top font-semibold">{t('request')}</h3><pre className="whitespace-pre-wrap break-words font-sans">{call.request_text ?? "—"}</pre>
      <h3 className="mt-sheet-top font-semibold">{t('response')}</h3><pre className="whitespace-pre-wrap break-words font-sans">{call.response_text ?? "—"}</pre>
      {call.error && <p className="mt-sheet-top">{t('error',{error:call.error})}</p>}
    </li>)}</ol>}
  </main>;
}
