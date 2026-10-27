import { createClient } from '@supabase/supabase-js';

// Run: node --env-file=.env.local scripts/create-test-user.mjs [--second]
// Admin creation confirms locally; it sends no confirmation or reset mail.
async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--second') || args.length > 1) {
    throw new Error('Usage: create-test-user.mjs [--second]');
  }
  const second = args.includes('--second');
  const prefix = second ? 'TEST_USER2' : 'TEST_USER';
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY', `${prefix}_EMAIL`, `${prefix}_PASSWORD`];
  for (const name of required) {
    if (!process.env[name]?.trim()) throw new Error(`Missing ${name}`);
  }
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  const handle = second ? 'testkitchen2' : 'testkitchen';
  const expectedEmail = second ? 'my-food-ai-test2@example.com' : 'my-food-ai-test@example.com';
  if (email !== expectedEmail) throw new Error('Only the designated test account may be provisioned.');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const created = await client.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { handle },
  });
  let user = created.data.user;
  if (created.error) {
    if (!['email_exists', 'user_already_exists'].includes(created.error.code)) {
      throw new Error(`Test account creation failed (${created.error.code ?? created.error.status ?? 'unknown'}).`);
    }
    for (let page = 1; !user; page++) {
      const listed = await client.auth.admin.listUsers({ page, perPage: 100 });
      if (listed.error) throw new Error('Could not find the existing test account.');
      user = listed.data.users.find((candidate) => candidate.email?.toLowerCase() === email);
      if (!user && listed.data.users.length < 100) throw new Error('Existing test account was not found.');
    }
    const updated = await client.auth.admin.updateUserById(user.id, {
      password, email_confirm: true, user_metadata: { handle },
    });
    if (updated.error) throw new Error('Could not update the test account password.');
  }
  if (!user) throw new Error('No test account was returned.');
  // Auth has no profile trigger; ordinary signup explicitly creates this row too.
  // Omit role so the same database default and RLS apply as for ordinary users.
  const profile = await client.from('profiles').upsert({ id: user.id, handle }, { onConflict: 'id' });
  if (profile.error) throw new Error('Could not provision the ordinary test profile.');
  console.log(user.id);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Test account provisioning failed.');
  process.exitCode = 1;
});
