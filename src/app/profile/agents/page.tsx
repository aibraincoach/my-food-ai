import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AgentList, { type AgentActivity } from './AgentList';
export const instant = false;
export default async function AgentsPage() {
  await connection(); const db = await createClient();
  const { data: { user } } = await db.auth.getUser(); if (!user) redirect('/sign-in');
  const [{ data: tokens, error }, { data: rows, error: activityError }] = await Promise.all([
    db.from('agent_tokens').select('id,name,token_last4,created_at,last_used_at,revoked_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    db.from('agent_activity').select('id,token_id,action,post_id,meal_count,created_at,posts(caption)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
  ]);
  if (error || activityError) throw new Error('Agents could not be loaded.');
  const activity = (rows ?? []).map(row => ({ ...row, caption: (Array.isArray(row.posts) ? row.posts[0] : row.posts)?.caption ?? null })) as AgentActivity[];
  return <AgentList tokens={tokens ?? []} activity={activity} />;
}
