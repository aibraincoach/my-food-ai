import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleMonth} from '../src/lib/posts/visible-month.ts';
const starts=[{month:'2026-09',top:-300},{month:'2026-10',top:50},{month:'2026-11',top:350}];
test('month starts above the header keep the last preceding month',()=>assert.equal(visibleMonth(starts,122,'2026-11'),'2026-10'));
test('a month starting exactly at the header is current',()=>assert.equal(visibleMonth(starts,350,'2026-10'),'2026-11'));
test('with no preceding start, the nearest start wins',()=>assert.equal(visibleMonth([{month:'2026-10',top:123},{month:'2026-11',top:363}],122,'2026-11'),'2026-10'));
test('an empty calendar uses its given fallback',()=>assert.equal(visibleMonth([],122,'2026-11'),'2026-11'));
