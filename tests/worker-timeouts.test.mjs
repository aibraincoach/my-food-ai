// node --import tsx --test tests/worker-timeouts.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { ApiError, isRetriable } from '../src/lib/worker/errors.ts';

test('fetch timeout causes remain retryable through SDK wrappers', () => {
  for (const code of ['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'ETIMEDOUT']) {
    const cause = Object.assign(new Error('transport timed out'), { code });
    const fetchError = new TypeError('fetch failed', { cause });
    assert.equal(isRetriable(fetchError), true, code);
    assert.equal(isRetriable(new Error('provider request failed', { cause: fetchError })), true, code);
  }
  assert.equal(isRetriable(new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } })), false);
  assert.equal(isRetriable(new ApiError(400, 'invalid request')), false);
  assert.equal(isRetriable(new SyntaxError('invalid provider JSON')), false);
  const cyclic = new Error('not a timeout');
  cyclic.cause = cyclic;
  assert.equal(isRetriable(cyclic), false);
});

test('native fetch AbortSignal timeout is retryable', async () => {
  const server = createServer(() => {});
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await assert.rejects(fetch(`http://127.0.0.1:${server.address().port}`, { signal: AbortSignal.timeout(30) }), error => {
      assert.equal(error.name, 'TimeoutError');
      assert.equal(isRetriable(error), true);
      return true;
    });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('pipeline preserves real Supabase Storage HTTP and timeout metadata', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const { loadFirstPhoto } = await import('../src/lib/pipeline/analyze.ts');
  for (const scenario of [503, 429, 404, 'timeout']) {
    const db = createClient('https://fixture.invalid', 'fixture-key', { global: { fetch: async input => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.includes('/rest/v1/post_media')) return new Response(JSON.stringify({ storage_path: 'fixture.jpg', width: 10, height: 10 }));
      assert.ok(url.pathname.includes('/storage/v1/object/'));
      if (scenario === 'timeout') throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
      return new Response(JSON.stringify({ message: 'storage failure', statusCode: String(scenario) }), { status: scenario });
    } } });
    await assert.rejects(loadFirstPhoto(db, 'fixture-post'), error => {
      assert.match(error.message, /photo download failed/);
      assert.equal(isRetriable(error), scenario !== 404, String(scenario));
      return true;
    });
  }
});

test('database HTTP and serialized transport errors survive persist and finish boundaries', async () => {
  const { createClient } = await import('@supabase/supabase-js');
  const { persistAnalysis } = await import('../src/lib/pipeline/persist.ts');
  const { finishJob } = await import('../src/lib/queue/claim.ts');
  for (const scenario of [503, 400, 'timeout']) {
    const db = createClient('https://fixture.invalid', 'fixture-key', { global: { fetch: async () => {
      if (scenario === 'timeout') throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_HEADERS_TIMEOUT' } });
      return new Response(JSON.stringify({ message: 'database failure', code: '' }), { status: scenario });
    } } });
    for (const call of [() => persistAnalysis(db, { postId: 'fixture', regions: [], captionOnly: [], summary: '' }), () => finishJob(db, 'fixture')]) {
      await assert.rejects(call(), error => {
        assert.equal(isRetriable(error), scenario !== 400, `${scenario}: ${error.message}`);
        return true;
      });
    }
  }
});
