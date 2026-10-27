// Run once after migration 0008 and this code deploy, never before merge.
// node --env-file=.env.local scripts/backfill-cards.mjs
import { createClient } from '@supabase/supabase-js';
async function main() {
  for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'APP_URL']) {
    if (!process.env[name]) throw new Error(`Missing ${name}`);
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.rpc('enqueue_card_backfill');
  if (error) throw new Error('Could not enqueue card backfill. Check migration and deployment.');
  console.log(`Enqueued ${data} missing cards.`);
  const response = await fetch(new URL('/api/jobs/tick', process.env.APP_URL), { signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new Error('Worker tick failed; queued jobs remain available for the next tick.');
  console.log('Worker tick accepted; rendering continues asynchronously.');
}
main().catch(() => { console.error('Card backfill failed; check configuration, migration and deployment.'); process.exitCode = 1; });
