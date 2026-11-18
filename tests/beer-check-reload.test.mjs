// node --test tests/beer-check-reload.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// #1082: the question strip has no timer since Fleet 47, so the beer check reloads Home once the database shows the
// question, and waits a short bound for each row. It never waits out a polling interval.
const check=readFileSync(new URL('../scripts/run17-checks.mjs',import.meta.url),'utf8');
test('each strip row is awaited only after a reload of Home, within 15 seconds',()=>{
  assert.doesNotMatch(check,/70000/);
  assert.match(check,/await navigate\('\/'\);\n\s*await until\(`!!\$\{ownQuestion\}`,15000\)/);
  assert.match(check,/await navigate\('\/'\);\n\s*await until\(`\$\{ownRow\}\.length===1`,15000\)/);
});
test('the second row is matched by its own photo, not by question text',()=>{
  assert.match(check,/photoNeedles=\[dismissId,\.\.\.media\.map\(x=>x\.id\)\]/);
  assert.doesNotMatch(check,/b\.parentElement\?\.textContent\?\.includes\(\$\{JSON\.stringify\(asked\)\}\)/);
});
