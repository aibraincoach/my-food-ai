import { createClient } from '@supabase/supabase-js';
export const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
export async function user(which = 1) {
  const prefix = which === 1 ? 'TEST_USER' : 'TEST_USER2';
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.signInWithPassword({ email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] });
  if (error || !data.user) throw new Error('Test sign-in failed.');
  return { client, user: data.user, session: data.session };
}
export function checked(result) { if (result.error) throw new Error(result.error.message); return result.data; }
