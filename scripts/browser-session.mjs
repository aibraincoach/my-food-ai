#!/usr/bin/env node
// Sensitive output: consume locally in the browser driver, never paste into logs.
import { createClient } from '@supabase/supabase-js';
import { signInAsTestUser } from './lib/session.mjs';

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--link', '--user=1', '--user=2'].includes(arg))) throw new Error('Usage: browser-session.mjs [--link] [--user=1|--user=2]');
  const which = args.includes('--user=2') ? 2 : 1;
  const app = new URL(process.env.APP_URL);
  if (!['http:', 'https:'].includes(app.protocol) || app.username || app.password) throw new Error('APP_URL must be an HTTP origin.');
  if (args.includes('--link')) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const email = process.env[which === 2 ? 'TEST_USER2_EMAIL' : 'TEST_USER_EMAIL'];
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email, options: { redirectTo: `${app.origin}/auth/callback` } });
    if (error || !data?.properties?.hashed_token) throw new Error('Sign-in link generation failed.');
    // No mail is sent. The existing callback completes the server cookie session.
    const link = new URL('/auth/callback', app.origin);
    link.searchParams.set('token_hash', data.properties.hashed_token);
    link.searchParams.set('type', 'magiclink');
    process.stdout.write(`${link.href}\n`);
    return;
  }
  const cookie = await signInAsTestUser(which);
  const entries = cookie.split('; ').map(pair => {
    const index = pair.indexOf('=');
    return { name: pair.slice(0, index), value: pair.slice(index + 1), domain: app.hostname, path: '/', secure: app.protocol === 'https:', httpOnly: false, sameSite: 'Lax' };
  });
  // Preserve every chunk when Supabase's session exceeds a single cookie.
  process.stdout.write(`${JSON.stringify(entries)}\n`);
}
main().catch(() => { console.error('Browser session setup failed; check the configured test account and service credentials.'); process.exitCode = 1; });
