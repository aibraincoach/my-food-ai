// node --import tsx --test tests/card-io.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { renderResultsCard } from '../src/lib/pipeline/results-card.tsx';
import { createRequire } from 'node:module';
const backfill = createRequire(import.meta.url)('../src/lib/worker/jobs/card_backfill.ts').default;
import { isRetriable } from '../src/lib/worker/errors.ts';

test('card snapshot and backfill reads retain database retry classification', async () => {
  for (const status of [503, 400]) {
    const db = createClient('https://fixture.invalid', 'fixture-key', { global: { fetch: async () =>
      new Response(JSON.stringify({ message: 'database unavailable', code: '' }), { status }) } });
    for (const call of [() => renderResultsCard(db, 'fixture'), () => backfill(db, { post_id: 'fixture' })]) {
      await assert.rejects(call(), error => {
        assert.equal(isRetriable(error), status === 503);
        return true;
      });
    }
  }
});
