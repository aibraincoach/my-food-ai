import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('tick route does not import the worker drain module', () => {
  const source = readFileSync(new URL('../src/app/api/jobs/tick/route.ts', import.meta.url), 'utf8');
  assert.equal(/from\s+["']@\/lib\/worker\/drain["']/.test(source), false);
  assert.match(source, /\/api\/jobs\/drain/);
});
