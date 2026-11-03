import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
export default async function ConnectAgentRow({ userId,desktopButton=false }: { userId: string;desktopButton?:boolean }) {
  const db = await createClient();
  const { count, error } = await db.from('agent_tokens').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('revoked_at', null);
  if (error) throw new Error('Agents could not be loaded.');
  const connected = (count ?? 0) > 0;
  if(desktopButton)return <Link href={connected?'/profile/agents':'/profile/agents/new'} className="flex h-9 items-center gap-2 rounded-[10px] bg-field px-[14px] text-[14px] font-semibold"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/></svg>{connected?'Agents':'Connect an agent'}</Link>;
  return <Link data-agent-row href={connected ? '/profile/agents' : '/profile/agents/new'} className="mx-inset mt-[10px] mb-4 flex min-h-[64px] items-center gap-[14px] rounded-[14px] border border-line bg-white px-[14px]">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/></svg>
    <span className="flex min-w-0 flex-1 flex-col"><span className="text-[15px] font-semibold">{connected ? 'Agents' : 'Connect an agent'}</span><span className="text-[13px] text-muted">{connected ? `${count} connected` : 'Lets an assistant post and read your meals'}</span></span>
    <span aria-hidden="true">›</span>
  </Link>;
}
