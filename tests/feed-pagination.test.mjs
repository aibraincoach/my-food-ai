// node --import tsx --test tests/feed-pagination.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { getFeed } from '../src/lib/posts/feed.ts';
import { encodeFeedCursor, parseFeedCursor } from '../src/lib/posts/feed-cursor.ts';
import { mergeFeedPosts } from '../src/lib/posts/feed-order.ts';
import { retryKind } from '../src/lib/posts/retry-kind.ts';

const timestamp = '2026-10-27T12:00:00.123456+00:00';
const uuid = n => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

test('retrying edited meals does not restart the initial analysis', () => {
  assert.equal(retryKind('analyze'), 'analyze');
  assert.equal(retryKind('correct'), 'correct');
  assert.equal(retryKind('recompute'), 'recompute');
  assert.equal(retryKind('card_backfill'), 'recompute');
  assert.equal(retryKind(undefined), null);
  assert.equal(retryKind('unknown'), null);
});

test('refreshing or retrying an older meal preserves chronological order', () => {
  const recent = { id: uuid(2), created_at: timestamp, status: 'ready' };
  const older = { id: uuid(1), created_at: '2026-10-26T12:00:00.123456+00:00', status: 'failed' };
  const retried = { ...older, status: 'queued' };
  const newest = { id: uuid(3), created_at: '2026-10-27T12:00:00.123457+00:00', status: 'queued' };
  const result = mergeFeedPosts([recent, older], [retried, newest]);
  assert.deepEqual(result.map(post => post.id), [newest.id, recent.id, older.id]);
  assert.equal(result[2].status, 'queued');
});

test('21 posts created together all appear once across pages', async () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({ id: uuid(i + 1), created_at: timestamp, eaten_at: timestamp, caption: '', status: 'queued' }));
  const db = createClient('https://fixture.invalid', 'fixture-key', {
    global: { fetch: async input => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.pathname.endsWith('/post_media')) return new Response('[]');
      assert.ok(url.pathname.endsWith('/posts'));
      // Model PostgREST's requested sort/filter, rather than hard-code a page.
      const order = url.searchParams.get('order').split(',');
      let selected = [...rows].sort((a, b) => {
        for (const term of order) {
          const [column, direction] = term.split('.');
          const comparison = a[column].localeCompare(b[column]);
          if (comparison) return direction === 'desc' ? -comparison : comparison;
        }
        return 0;
      });
      const filter = url.searchParams.get('or');
      if (filter) {
        const boundary = /created_at\.lt\.([^,]+),and\(created_at\.eq\.([^,]+),id\.lt\.([^)]*)\)/.exec(filter);
        assert.ok(boundary, 'valid composite PostgREST boundary');
        selected = selected.filter(row => row.created_at < boundary[1] || (row.created_at === boundary[2] && row.id < boundary[3]));
      }
      if (url.searchParams.has('created_at')) selected = selected.filter(row => row.created_at < url.searchParams.get('created_at').slice(3));
      return new Response(JSON.stringify(selected.slice(0, Number(url.searchParams.get('limit')))));
    } },
  });
  const first = await getFeed(db, uuid(99));
  assert.equal(first.posts.length, 20);
  assert.equal(parseFeedCursor(first.nextCursor).created_at, timestamp, 'microseconds survive');
  const second = await getFeed(db, uuid(99), first.nextCursor);
  assert.equal(second.posts.length, 1);
  assert.equal(second.nextCursor, null);
  assert.deepEqual([...first.posts, ...second.posts].map(p => p.id), rows.map(p => p.id).reverse());
});

test('invalid cursor data is rejected before any database request', async () => {
  let requests = 0;
  const db = createClient('https://fixture.invalid', 'fixture-key', { global: { fetch: async () => { requests++; throw new Error('must not query'); } } });
  for (const cursor of ['', '0', timestamp, 'not-json', encodeFeedCursor({ created_at: '0', id: uuid(1) }), encodeFeedCursor({ created_at: '2026-02-30T00:00:00Z', id: uuid(1) }), encodeFeedCursor({ created_at: timestamp, id: 'bad),id.gt.0' })]) {
    await assert.rejects(getFeed(db, uuid(99), cursor), /Invalid cursor/);
  }
  assert.equal(requests, 0);
});
