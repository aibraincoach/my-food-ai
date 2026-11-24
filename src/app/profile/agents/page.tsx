import {getTranslations} from 'next-intl/server';
import { Suspense } from 'react';
import AgentList, { type AgentActivity } from './AgentList';

export default function AgentsPage() {
  return <Suspense fallback={null}><AgentsPageContent /></Suspense>;
}

async function AgentsPageContent() {
  const { connection } = await import('next/server');
  const { redirect } = await import('next/navigation');
  const { createClient } = await import('@/lib/supabase/server');
  const t=await getTranslations('agents');
  await connection(); const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  const ownerId = user?.id;
  if (!ownerId) redirect('/welcome');
  const [{ data: tokens, error }, { data: rows, error: activityError }] = await Promise.all([
    db.from('agent_tokens').select('id,name,token_last4,created_at,last_used_at,revoked_at').eq('user_id', ownerId).order('created_at', { ascending: false }),
    db.from('agent_activity').select('id,token_id,action,post_id,meal_count,created_at,posts(caption)').eq('user_id', ownerId).order('created_at', { ascending: false }).limit(500),
  ]);
  if (error || activityError) throw new Error(t('loadFailed'));
  const activity = (rows ?? []).map(row => ({ ...row, caption: (Array.isArray(row.posts) ? row.posts[0] : row.posts)?.caption ?? null })) as AgentActivity[];
  return <AgentList tokens={tokens ?? []} activity={activity} />;
}
