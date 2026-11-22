import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

async function authenticateTestClient(client, which) {
  if (![1, 2].includes(which)) throw new Error('Test account must be 1 or 2.');
  const prefix = which === 1 ? 'TEST_USER' : 'TEST_USER2';
  const email = process.env[`${prefix}_EMAIL`];
  const result = await client.auth.signInWithPassword({ email, password: process.env[`${prefix}_PASSWORD`] });
  if (result.error && (result.error.code === 'captcha_failed' || /captcha/i.test(result.error.message))) {
    throw new Error(`Test account ${which} sign-in failed: the project requires a CAPTCHA, and this helper signs in with a password only.`);
  }
  if (result.error || !result.data.user) throw new Error(`Test account ${which} sign-in failed.`);
  return result.data.user;
}

// Non-browser probes share the same password-only authentication without
// changing their Supabase query client or tracing fetch contract.
export async function signInTestClient(which = 1, { fetch: fetcher = fetch } = {}) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher },
  });
  const user = await authenticateTestClient(client, which);
  return { client, user };
}

// Let the installed SSR package own cookie naming, encoding and chunking.
export async function signInAsTestUser(which = 1) {
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => { for (const { name, value } of cookies) jar.set(name, value); },
    },
  });
  await authenticateTestClient(client, which);
  return [...jar].map(([name, value]) => `${name}=${value}`).join('; ');
}
