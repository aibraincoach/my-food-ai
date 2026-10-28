import assert from 'node:assert/strict';
import test from 'node:test';
import { user, checked } from './helpers.mjs';
test('ordinary account signs in and reads its profile', async () => {
  const account = await user();
  try {
    assert.ok(account.session?.access_token);
    const profile = checked(await account.client.from('profiles').select('id,role').eq('id',account.user.id).single());
    assert.equal(profile.id, account.user.id);
    assert.equal(profile.role, 'user');
  } finally { await account.client.auth.signOut({scope:'local'}); }
});
