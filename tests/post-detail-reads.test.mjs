import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { getPostDetail } from '../src/lib/posts/items.ts';

test('getPostDetail signs photos and masks in one batch and keeps shape', async () => {
  const owner = '11111111-1111-4111-8111-111111111111';
  const id = '22222222-2222-4222-8222-222222222222';
  const itemId = '55555555-5555-4555-8555-555555555555';
  const photoPath = `${owner}/${id}/0.jpg`;
  const maskPath = `${owner}/${id}/masks/${itemId}.png`;
  const signed = [];
  const db = createClient('https://fixture.invalid', 'offline', {
    global: {
      fetch: async (input, init) => {
        const u = new URL(input instanceof Request ? input.url : String(input));
        if (u.pathname.endsWith('/posts') && !u.searchParams.has('id')) return Response.json([]);
        if (u.pathname.endsWith('/posts')) {
          return Response.json({
            id, user_id: owner, caption: 'Meal', status: 'ready', eaten_at: '2026-11-04T01:00:00Z',
            created_at: '2026-11-04T01:00:00Z', needs_input: null,
          });
        }
        if (u.pathname.endsWith('/post_media')) {
          return Response.json([{ id: '33333333-3333-4333-8333-333333333333', post_id: id, kind: 'photo', storage_path: photoPath, not_eaten: false, width: 100, height: 100 }]);
        }
        if (u.pathname.includes('/current_post_items')) {
          return Response.json([{ id: itemId, name: 'Rice', portion_text: null, portion_grams: 100, box: null, mask_path: maskPath, source: 'model', supersedes: null, not_eaten_grams: null }]);
        }
        if (u.pathname.endsWith('/item_nutrition')) {
          return Response.json([{ post_item_id: itemId, calories: 100, protein_g: 2, carbs_g: 20, fat_g: 1, fibre_g: null, sugar_g: null, sodium_mg: null, micronutrients: [], source_ref: '1' }]);
        }
        if (u.pathname.endsWith('/rpc/feedback_revision')) return Response.json({ modelCommentId: 'c1', fingerprint: 'fp' });
        if (u.pathname.endsWith('/saved_meals')) return Response.json(null);
        if (u.pathname.endsWith('/object/sign/media')) {
          const paths = JSON.parse(init.body).paths;
          signed.push(paths);
          return Response.json(paths.map(path => ({ path, signedURL: `/signed/${path}` })));
        }
        return Response.json([]);
      },
    },
  });
  const detail = await getPostDetail(db, id);
  assert.equal(detail?.post.id, id);
  assert.equal(detail?.items.length, 1);
  assert.match(detail?.items[0].maskUrl ?? '', /masks/);
  assert.equal(signed.length, 1);
  assert.deepEqual(signed[0].sort(), [photoPath, maskPath].sort());
});
