import {cache} from 'react';
import {notFound} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

/** Verify the session and role before an admin consumer creates a service client.
 * React cache shares this check only within the current server render/request. */
export const requireOwner = cache(async () => {
  const client = await createClient();
  const {data: {user}, error: authError} = await client.auth.getUser();
  if (authError || !user) notFound();
  const {data: profile, error} = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error || profile?.role !== 'admin') notFound();
  return {client, user};
});
