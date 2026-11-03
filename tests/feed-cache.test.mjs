// node --import tsx --test tests/feed-cache.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFeedCache, writeFeedCache, clearFeedCache, feedCacheGeneration } from '../src/lib/posts/feed-cache.ts';

const entries = new Map();
globalThis.localStorage = {
 get length() { return entries.size; }, key(index) { return [...entries.keys()][index] ?? null; },
 getItem(key) { return entries.get(key) ?? null; }, setItem(key, value) { entries.set(key, value); }, removeItem(key) { entries.delete(key); },
};
globalThis.window = new EventTarget();
const now = Date.now();
const post = id => ({id, caption:'meal', created_at:'2026-11-03T00:00:00Z', eaten_at:'2026-11-03T00:00:00Z', status:'ready', photoUrl:null, slides:[], items:[]});

test('account cache is isolated, bounded to the first page, and stable for React snapshots', () => {
 clearFeedCache();
 writeFeedCache('first', { posts:Array.from({length:20}, (_,i)=>post(String(i))), savedAt:now });
 assert.equal(readFeedCache('first',now).posts.length,6);
 assert.equal(readFeedCache('second',now),null);
 assert.equal(readFeedCache('first',now),readFeedCache('first',now));
 entries.set('mfa-feed:second',entries.get('mfa-feed:first'));
 assert.equal(readFeedCache('second',now),null);
});

test('expired, future, oversized and malformed data cannot become a feed', () => {
 clearFeedCache();
 writeFeedCache('first',{posts:[post('1')],savedAt:now});
 assert.equal(readFeedCache('first',now+24*60*60*1000+1),null);
 assert.equal(readFeedCache('first',now-60001),null);
 for (const raw of ['{', JSON.stringify({version:1,userId:'first',savedAt:now,posts:[{id:'broken'}]}), ' '.repeat(1024*1024+1)]) {
  entries.set('mfa-feed:first',raw); assert.equal(readFeedCache('first',now),null);
 }
});

test('sign-out clears every account cache, leaves unrelated storage, and invalidates old saves', () => {
 writeFeedCache('first',{posts:[post('1')],savedAt:now});
 writeFeedCache('second',{posts:[post('2')],savedAt:now});
 entries.set('other-setting','retained');
 const generation=feedCacheGeneration();
 clearFeedCache();
 assert.notEqual(feedCacheGeneration(),generation);
 assert.equal(readFeedCache('first'),null); assert.equal(readFeedCache('second'),null);
 assert.equal(entries.get('other-setting'),'retained');
});

test('disabled storage cannot block reading, saving or clearing the feed', () => {
 const prior=globalThis.localStorage;
 Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw Error('disabled');}});
 assert.equal(readFeedCache('first'),null);
 assert.doesNotThrow(()=>writeFeedCache('first',{posts:[post('1')],savedAt:now}));
 assert.doesNotThrow(()=>clearFeedCache());
 Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:prior});
});
