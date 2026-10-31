import test from 'node:test';
import assert from 'node:assert/strict';
import {formatLocalTime,formatLocalDate} from '../src/lib/time/local.ts';

test('one instant is formatted in each viewing zone without a UTC suffix',()=>{
 const instant='2026-10-29T08:20:00Z';
 assert.match(formatLocalTime(instant,'Asia/Tokyo'),/5:20\s*PM/);
 assert.match(formatLocalTime(instant,'America/Edmonton'),/2:20\s*AM/);
 assert.doesNotMatch(formatLocalTime(instant,'Asia/Tokyo'),/UTC/);
});
test('local midnight changes its display date without mutating the instant',()=>{
 const instant='2026-10-30T15:30:00Z';
 assert.match(formatLocalDate(instant,'Asia/Tokyo'),/Oct 31/);
 assert.match(formatLocalDate(instant,'America/Edmonton'),/Oct 30/);
 assert.equal(instant,'2026-10-30T15:30:00Z');
});
test('DST repeated hour maps distinct instants to the correct local clock',()=>{
 assert.match(formatLocalTime('2026-11-01T07:30:00Z','America/Edmonton'),/1:30\s*AM/);
 assert.match(formatLocalTime('2026-11-01T08:30:00Z','America/Edmonton'),/1:30\s*AM/);
 assert.match(formatLocalTime('2026-11-01T09:30:00Z','America/Edmonton'),/2:30\s*AM/);
});
test('invalid instants never print an invalid clock',()=>{
 assert.equal(formatLocalTime('bad','Asia/Tokyo'),'');assert.equal(formatLocalDate('bad','Asia/Tokyo'),'');
});
