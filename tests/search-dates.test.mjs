// node --import tsx --test tests/search-dates.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {localDateStart,parseSearchDates,searchZone} from '../src/lib/search/dates.ts';

test('Saturday includes the user\'s evening after UTC has crossed into Sunday', () => {
  const query=parseSearchDates('what did I eat on Saturday','America/Edmonton',new Date('2026-10-25T01:00:00Z'));
  assert.equal(query.from,'2026-10-24T06:00:00.000Z');
  assert.equal(query.to,'2026-10-25T06:00:00.000Z');
  assert.ok(query.from<'2026-10-25T01:00:00.000Z' && query.to>'2026-10-25T01:00:00.000Z');
});
test('today follows the local calendar in a positive-offset zone', () => {
  const query=parseSearchDates('today','Asia/Tokyo',new Date('2026-10-24T23:30:00Z'));
  assert.equal(query.from,'2026-10-24T15:00:00.000Z');
  assert.equal(query.to,'2026-10-25T15:00:00.000Z');
});
test('local day bounds retain the DST spring and autumn day lengths', () => {
  const start=localDateStart('2026-03-08','America/Edmonton');
  const end=localDateStart('2026-03-09','America/Edmonton');
  assert.equal((Date.parse(end)-Date.parse(start))/3600000,23);
  const autumn=localDateStart('2026-11-01','America/Edmonton');
  const next=localDateStart('2026-11-02','America/Edmonton');
  assert.equal((Date.parse(next)-Date.parse(autumn))/3600000,25);
});
test('model local date bounds and invalid zones are handled explicitly', () => {
  assert.equal(localDateStart('2026-10-24','America/Edmonton'),'2026-10-24T06:00:00.000Z');
  assert.throws(()=>localDateStart('2026-02-30','UTC'));
  assert.throws(()=>localDateStart('2026-10-24T00:00:00Z','UTC'));
  assert.equal(searchZone('not/a-zone'),'UTC');
  assert.equal(searchZone('America%2FEdmonton'),'America/Edmonton');
});
