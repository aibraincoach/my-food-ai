import { Suspense } from 'react';
import NewAgentForm from './NewAgentForm';

export default function NewAgentPage() {
  return <Suspense fallback={null}><NewAgentPageContent /></Suspense>;
}

async function NewAgentPageContent() {
  const { connection } = await import('next/server');
  const { redirect } = await import('next/navigation');
  const { createClient } = await import('@/lib/supabase/server');
  await connection();
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect('/sign-in');
  return <NewAgentForm />;
}
