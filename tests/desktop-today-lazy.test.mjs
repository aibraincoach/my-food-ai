import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('the hidden Today-column thumbnail loads lazily',()=>assert.match(readFileSync(new URL('../src/components/DesktopToday.tsx',import.meta.url),'utf8'),/<img\b(?=[^>]*\bloading="lazy")[^>]*\bsrc=\{post\.photoUrl\}/));
