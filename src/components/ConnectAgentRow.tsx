import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
export default async function ConnectAgentRow({ userId }: { userId: string }) {
  const db = await createClient();
  const { count, error } = await db.from('agent_tokens').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('revoked_at', null);
  if (error) throw new Error('Agents could not be loaded.');
  const connected = (count ?? 0) > 0;
  return <Link href={connected ? '/profile/agents' : '/profile/agents/new'} className="flex min-h-[64px] items-center gap-3 border-y border-hairline px-inset">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3v5m8-5v5M6 8h12v3a6 6 0 0 1-6 6v4m-6-13h12"/></svg>
    <span className="flex min-w-0 flex-1 flex-col"><span className="text-detail font-semibold">{connected ? 'Agents' : 'Connect an agent'}</span><span className="text-meta text-muted">{connected ? `${count} connected` : 'Lets an assistant post and read your meals'}</span></span>
    <span aria-hidden="true">›</span>
  </Link>;
}
