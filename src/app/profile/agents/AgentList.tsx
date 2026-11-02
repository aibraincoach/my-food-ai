'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceTimeZone } from '@/components/LocalTime';
import { TopBar } from '@/components/ui/TopBar';
import RevokeSheet from './RevokeSheet';
export type AgentListToken = { id: string; name: string; token_last4: string; created_at: string; last_used_at: string | null; revoked_at: string | null };
export type AgentActivity = { id: string; token_id: string; action: string; post_id: string | null; caption: string | null; meal_count: number | null; created_at: string };
export default function AgentList({ tokens, activity }: { tokens: AgentListToken[]; activity: AgentActivity[] }) {
  const router = useRouter(); const [selected, setSelected] = useState<AgentListToken | null>(null); const [toast, setToast] = useState(false); const local = Boolean(useDeviceTimeZone());
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(false), 3000); return () => clearTimeout(timer); } }, [toast]);
  const stamp = (value: string, withTime = false) => {
    if (!local) return '';
    const date = new Date(value), today = date.toDateString() === new Date().toDateString();
    const day = today && withTime ? 'today' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `${day}${withTime ? `, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : ''}`;
  };
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text">
    <TopBar title="" left={<Link href="/profile" className="text-detail">‹ Profile</Link>} />
    <div className="flex flex-col gap-5 px-screen-x pb-8"><h1 className="text-title">Agents</h1>
      {tokens.map(token => <section key={token.id} className={`flex flex-col gap-3 rounded-[14px] border border-hairline p-4 ${token.revoked_at ? 'text-muted' : ''}`}>
        <h2 className="text-body font-semibold">{token.name}</h2>
        <p className="text-meta text-muted">Connected {stamp(token.created_at)} · token ending {token.token_last4}</p>
        {token.last_used_at && <p className="text-meta text-muted">Last used {stamp(token.last_used_at, true)}</p>}
        {token.revoked_at && <p className="text-meta text-muted">Revoked {stamp(token.revoked_at, true)}</p>}
        <p className="pt-2 text-meta tracking-wider text-muted">Activity</p>
        <ul className="flex flex-col gap-3">{activity.filter(row => row.token_id === token.id).map(row => {
          const caption = row.caption ? ` · ${row.caption}` : '';
          const label = row.action === 'posted' ? `Posted a meal${caption}` : row.action === 'read' ? `Read a meal${caption}` : row.action === 'corrected' ? `Corrected a meal${caption}` : `Read ${row.meal_count ?? 0} ${(row.meal_count ?? 0) === 1 ? 'meal' : 'meals'}`;
          return <li key={row.id} className="flex items-baseline justify-between gap-2 text-meta"><span className="min-w-0">{row.action === 'posted' && row.post_id ? <Link href={`/posts/${row.post_id}`} className="underline underline-offset-2">{label}</Link> : label}</span><time dateTime={row.created_at} className="shrink-0 text-[12px] text-muted">{local ? new Date(row.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}</time></li>;
        })}</ul>
        {!token.revoked_at && <button className="min-h-tap self-start text-detail" style={{ color: 'oklch(0.52 0.17 25)' }} onClick={() => setSelected(token)}>Revoke token</button>}
      </section>)}
      <Link href="/profile/agents/new" className="flex h-field-h items-center justify-center rounded-field border border-line bg-white text-body font-semibold">Connect another agent</Link>
    </div>
    {selected && <RevokeSheet id={selected.id} name={selected.name} open onClose={() => setSelected(null)} onRevoked={() => { setSelected(null); setToast(true); router.refresh(); }} />}
    {toast && <div role="status" className="fixed inset-x-6 bottom-6 mx-auto flex h-[52px] max-w-phone items-center justify-center rounded-[14px] bg-text text-surface">Token revoked</div>}
  </main>;
}
