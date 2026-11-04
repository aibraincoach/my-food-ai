import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('drain route requires an active worker lease before runWorker', () => {
  const route = readFileSync(new URL('../src/app/api/jobs/drain/route.ts', import.meta.url), 'utf8');
  const lease = readFileSync(new URL('../src/lib/queue/lease.ts', import.meta.url), 'utf8');
  assert.match(route, /holdsActiveLease/);
  assert.match(route, /Not the lease holder/);
  assert.match(route, /409/);
  assert.match(lease, /export async function holdsActiveLease/);
});