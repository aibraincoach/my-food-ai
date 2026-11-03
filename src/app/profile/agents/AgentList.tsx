'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDeviceTimeZone } from '@/components/LocalTime';
import { Icon } from '@/components/ui/Icon';
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
  return <main className="mx-auto flex min-h-dvh w-full max-w-phone flex-col bg-surface text-text desktop:my-8 desktop:min-h-[640px] desktop:max-w-[480px] desktop:rounded-[24px] desktop:border desktop:border-line desktop:shadow-lg">
    <TopBar title={<h1>Agents</h1>} left={<Link href="/profile" className="flex h-tap items-center text-[15px]"><Icon name="back" size={22}/>Profile</Link>} right={<span className="w-[70px]"/>} />
    <div className="flex flex-col gap-5 px-inset pt-3 pb-8">
      {tokens.map(token => <section key={token.id} className={`flex flex-col gap-3 ${token.revoked_at ? 'text-muted' : ''}`}>
        <div className="flex flex-col gap-[6px] rounded-[14px] border border-line bg-white p-4">
        <h2 className="flex items-center gap-[10px] break-words text-[16px] font-semibold"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/></svg>{token.name}</h2>
        <p className="text-meta text-muted">Connected {stamp(token.created_at)} · token ending {token.token_last4}</p>
        {token.last_used_at && <p className="text-meta text-muted">Last used {stamp(token.last_used_at, true)}</p>}
        {token.revoked_at && <p className="text-meta text-muted">Revoked {stamp(token.revoked_at, true)}</p>}
        </div>
        <p className="pt-2 text-[14px] font-semibold">Activity</p>
        {!activity.some(row=>row.token_id===token.id)&&<p className="text-meta text-muted">No activity yet.</p>}
        <ul className="flex flex-col">{activity.filter(row => row.token_id === token.id).map(row => {
          const caption = row.caption ? ` · ${row.caption}` : '';
          const label = row.action === 'posted' ? `Posted a meal${caption}` : row.action === 'read' ? `Read a meal${caption}` : row.action === 'corrected' ? `Corrected a meal${caption}` : `Read ${row.meal_count ?? 0} ${(row.meal_count ?? 0) === 1 ? 'meal' : 'meals'}`;
          return <li key={row.id} className="flex min-h-[48px] items-center justify-between gap-3 border-b border-hairline text-[14px]"><span className="min-w-0 break-words">{row.action === 'posted' && row.post_id ? <Link href={`/posts/${row.post_id}`} className="underline underline-offset-2">{label}</Link> : label}</span><time dateTime={row.created_at} className="shrink-0 text-[12px] text-muted">{local ? stamp(row.created_at,true) : ''}</time></li>;
        })}</ul>
        {!token.revoked_at && <button className="flex min-h-[52px] items-center gap-3 text-[15px] font-medium" style={{ color: 'oklch(0.52 0.17 25)' }} onClick={() => setSelected(token)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>Revoke token</button>}
      </section>)}
      <Link href="/profile/agents/new" className="flex h-[52px] items-center gap-3 border-b border-hairline text-[15px] font-medium"><Icon name="plus" size={20}/>Connect another agent</Link>
    </div>
    {selected && <RevokeSheet id={selected.id} name={selected.name} open onClose={() => setSelected(null)} onRevoked={() => { setSelected(null); setToast(true); router.refresh(); }} />}
    {toast && <div role="status" className="fixed inset-x-6 bottom-6 mx-auto flex h-[52px] max-w-phone items-center justify-center rounded-[14px] bg-text text-surface">Token revoked</div>}
  </main>;
}
