import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('feed variant failure has no redirect or immutable success headers', () => {
  const source = readFileSync(
    new URL('../src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(source, /status:\s*302|Location:|createSignedUrl/);
  assert.match(source, /const headers = \{'Cache-Control': 'private, no-store',/);
  assert.match(source, /if \(!release\) return fail\(503\)/);
  assert.match(source, /catch \{ return fail\(503\); \}/);
});
