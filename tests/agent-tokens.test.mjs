// Pure gates: node --import tsx --env-file=.env.local --test tests/agent-tokens.test.mjs
// SQL/access gate (isolated DB only): node --env-file=.env.local --test tests/db/agent-tokens.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { randomToken, hashToken, createToken, authenticateBearer, revokeToken } from '../src/lib/agents/tokens.ts';
import { mealInput, getMeal, correctMeal } from '../src/lib/agents/ops.ts';
const request = token => new Request('http://localhost/mcp', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
test('tokens have 32 random base62 characters, persist a digest and suffix only', async () => {
  const tokens = new Set(Array.from({ length: 100 }, randomToken)); assert.equal(tokens.size, 100);
  for (const token of tokens) { assert.match(token, /^mfa_live_[A-Za-z0-9]{32}$/); assert.match(hashToken(token), /^[0-9a-f]{64}$/); }
  let written;
  const db = { from(table) { assert.equal(table, 'agent_tokens'); return { insert(row) { written = row; return { select() { return { single: async () => ({ data: { id: 'token-id', name: row.name }, error: null }) }; } }; } }; } };
  const created = await createToken('owner', ' Agent 1 ', db);
  assert.equal(written.token_hash, hashToken(created.token)); assert.equal(written.token_last4, created.token.slice(-4));
  assert.equal(written.name, 'Agent 1'); assert.equal(written.user_id, 'owner'); assert.ok(!JSON.stringify(written).includes(created.token));
  for (const name of ['', ' ', 'x'.repeat(41), 'bad\0name']) await assert.rejects(createToken('owner', name, db));
});
function authDb(row, limit = 60) {
  let calls = 0, writes = 0, hash;
  const chain = { select() { return chain; }, eq(_, value) { hash = value; return chain; }, maybeSingle: async () => ({ data: row, error: null }), update() { writes++; return chain; }, is() { return chain; } };
  return { from: () => chain, rpc: async (name, args) => { assert.equal(name, 'agent_hit'); assert.equal(args.p_limit, 60); return { data: ++calls <= limit, error: null }; }, stats: () => ({ calls, writes, hash }) };
}
test('Bearer authentication refuses missing, unknown and revoked tokens and caps the 61st call', async () => {
  const token = randomToken(); const row = { id: 'token-id', user_id: 'owner', revoked_at: null };
  const db = authDb(row);
  await assert.rejects(authenticateBearer(request(), 1, db), e => e.status === 401);
  await assert.rejects(authenticateBearer(request(token), 1, authDb(null)), e => e.status === 401);
  await assert.rejects(authenticateBearer(request(token), 1, authDb({ ...row, revoked_at: new Date().toISOString() })), e => e.status === 401);
  for (let i = 0; i < 60; i++) assert.deepEqual(await authenticateBearer(request(token), 1, db), { userId: 'owner', tokenId: 'token-id' });
  assert.equal(db.stats().writes, 60);
  await assert.rejects(authenticateBearer(request(token), 1, db), e => e.status === 429);
  assert.equal(db.stats().writes, 60);
});
test('JSON-RPC batches consume a hit for every call and refuse the whole over-limit batch', async () => {
  const token = randomToken(); const db = authDb({ id: 'id', user_id: 'owner', revoked_at: null }, 2);
  await assert.rejects(authenticateBearer(request(token), 3, db), e => e.status === 429);
  assert.equal(db.stats().calls, 3); assert.equal(db.stats().writes, 0);
});
test('meal input preserves a past eaten-at and rejects future times and invalid captions', () => {
  const now = Date.parse('2026-11-02T12:00:00Z'); const eaten = '2026-11-02T11:00:00.000Z';
  assert.deepEqual(mealInput({ caption: 'coffee', eaten_at: eaten }, now), { caption: 'coffee', eaten_at: eaten });
  for (const data of [null, {}, { caption: '' }, { caption: 'x'.repeat(2001) }, { caption: 'coffee', eaten_at: '2026-11-02T12:00:01Z' }, { caption: 'coffee', eaten_at: '2026-11-02T11:00:00' }]) assert.throws(() => mealInput(data, now));
});
test('a second owner cannot get or correct another owner meal through the service', async () => {
  const constraints = [];
  const chain = { select() { return chain; }, eq(key, value) { constraints.push([key, value]); return chain; }, maybeSingle: async () => ({ data: null, error: null }) };
  const db = { from(table) { assert.equal(table, 'posts'); return chain; }, rpc() { throw new Error('No write after an ownership refusal'); } };
  const identity = { userId: 'second-owner', tokenId: 'second-token' }; const id = '11111111-1111-4111-8111-111111111111';
  await assert.rejects(getMeal(identity, id, db), e => e.status === 404 && e.message === 'Not found');
  await assert.rejects(correctMeal(identity, id, 'correction', db), e => e.status === 404);
  assert.ok(constraints.some(([key, value]) => key === 'user_id' && value === identity.userId));
});
test('0031 restricts token writes, activity and rate counters', () => {
  const sql = readFileSync(new URL('../supabase/migrations/0031_agent_tokens.sql', import.meta.url), 'utf8');
  for (const name of ['agent_tokens', 'agent_activity', 'agent_token_hits']) {
    assert.match(sql, new RegExp(`create table public\\.${name}\\(`));
    assert.match(sql, new RegExp(`alter table public\\.${name} enable row level security`));
  }
  for (const text of ['only_revoked_at_changes', 'agent_hit', 'agent_log_meal', 'protect_agent_attribution', "to_jsonb(new)-'revoked_at'", 'from public,anon,authenticated', 'token_hash text not null unique']) assert.ok(sql.includes(text), text);
});
