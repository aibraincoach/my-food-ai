import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NewAgentForm from './NewAgentForm';
export const instant = false;
export default async function NewAgentPage() {
  await connection();
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect('/sign-in');
  return <NewAgentForm />;
}
