#!/usr/bin/env node
// Run LAST in production acceptance, never against a demo or test-account login.
// node --env-file=.env.local scripts/auth-hammer.mjs --signups 35 --signins 35
import { randomBytes, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

export async function runHammer({ signups, signins, env = process.env, fetcher = fetch, report = console.log }) {
  const origin = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  const ref = origin.hostname.split('.')[0];
  const configResponse = await fetcher(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!configResponse.ok) throw new Error('Cannot confirm Auth email settings; no probes run.');
  const config = await configResponse.json();
  if (config.mailer_autoconfirm !== true) throw new Error('Auto-confirm is not enabled; no sign-up probes run.');
  const admin = createClient(origin.href, env.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetcher },
  });
  const run = randomUUID();
  const prefix = `run8-hammer-${run}-`;
  const known = new Set();
  let created = 0;
  let deleted = 0;
  let failedCleanup = 0;
  const summary = { signups: null, signins: null };
  const probe = async (kind, count, bodyFor) => {
    for (let index = 1; index <= count; index++) {
      const response = await fetcher(new URL(kind === 'signups' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password', origin), {
        method: 'POST',
        headers: { apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyFor(index)),
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json().catch(() => ({}));
      if (kind === 'signups' && body.user?.id && typeof body.user.email === 'string' && body.user.email.startsWith(prefix)) {
        if (!known.has(body.user.id)) created++;
        known.add(body.user.id);
      }
      const code = typeof body.error_code === 'string' ? body.error_code : typeof body.code === 'string' ? body.code : null;
      report(JSON.stringify({ kind, request: index, status: response.status, code }));
      // Wrong-password invalid_credentials is the expected baseline, not an
      // anti-hammering refusal. Stop sign-ins only when a limit/CAPTCHA refuses
      // them (or an unexpected error makes the observation invalid).
      const refused = !response.ok && !(kind === 'signins' && response.status === 400 && code === 'invalid_credentials');
      if (refused) {
        summary[kind] = { request: index, status: response.status, code };
        return;
      }
    }
    summary[kind] = { notRefusedWithin: count };
  };
  try {
    const email = `${prefix}signin@example.com`;
    const password = `${randomBytes(24).toString('base64url')}Aa1!`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user?.id) throw new Error('Could not create the isolated sign-in fixture.');
    known.add(data.user.id); created++;
    await probe('signups', signups, (i) => ({ email: `${prefix}${i}@example.com`, password }));
    await probe('signins', signins, () => ({ email, password: `${password}-wrong` }));
  } finally {
    // Reconcile only this run's random namespace, including a signup whose
    // response timed out after the server created the account.
    try {
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error('Cannot reconcile probe fixtures.');
        for (const user of data.users) {
          if (user.email?.startsWith(prefix) && user.email.endsWith('@example.com')) {
            if (!known.has(user.id)) created++;
            known.add(user.id);
          }
        }
        if (data.users.length < 1000) break;
      }
    } catch {
      failedCleanup++;
    }
    for (const id of known) {
      try {
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) failedCleanup++; else deleted++;
      } catch { failedCleanup++; }
    }
    report(JSON.stringify({ summary, cleanup: { created, deleted, failures: failedCleanup } }));
    if (failedCleanup) throw new Error('Probe fixture cleanup incomplete; inspect private run evidence before continuing.');
  }
  return { summary, created, deleted };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== '--signups' || args[2] !== '--signins') throw new Error('Usage: auth-hammer.mjs --signups <1..35> --signins <1..35>');
  const [signups, signins] = [Number(args[1]), Number(args[3])];
  if (![signups, signins].every(n => Number.isInteger(n) && n >= 1 && n <= 35)) throw new Error('Each probe count must be an integer from 1 to 35.');
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_ACCESS_TOKEN']) {
    if (!process.env[name]) throw new Error(`Missing ${name}.`);
  }
  await runHammer({ signups, signins });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
