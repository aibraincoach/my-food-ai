import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('feed variant fallback redirect is not long-cache immutable', () => {
  const source = readFileSync(
    new URL('../src/app/api/media/feed/[owner]/[post]/[media]/[variant]/route.ts', import.meta.url),
    'utf8'
  );
  assert.match(source, /status: 302, headers: \{\.\.\.headers, Location:/);
  assert.doesNotMatch(source, /302, headers: \{\.\.\.cacheHeaders, Location:/);
});
