import { createServerClient } from '@supabase/ssr';

// Let the installed SSR package own cookie naming, encoding and chunking.
export async function signInAsTestUser(which = 1) {
  if (![1, 2].includes(which)) throw new Error('Test account must be 1 or 2.');
  const prefix = which === 1 ? 'TEST_USER' : 'TEST_USER2';
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => { for (const { name, value } of cookies) jar.set(name, value); },
    },
  });
  const { error } = await client.auth.signInWithPassword({ email: process.env[`${prefix}_EMAIL`], password: process.env[`${prefix}_PASSWORD`] });
  if (error) throw new Error(`Test account ${which} sign-in failed.`);
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}
