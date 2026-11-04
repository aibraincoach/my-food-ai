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

const signedCard = expiresAt => `https://local.invalid/storage/v1/object/sign/media/card.png?token=header.${Buffer.from(JSON.stringify({exp:Math.floor(expiresAt/1000)})).toString('base64url')}.signature`;

test('a write-primed snapshot drops expired card slides on its first read', () => {
 clearFeedCache();
 const photo='/api/media/feed/owner/post/photo/v1.webp';
 const card=signedCard(now-1000);
 writeFeedCache('expiry-first',{posts:[{...post('meal'),photoUrl:photo,slides:[{id:'photo',kind:'photo',url:photo},{id:'card',kind:'card',url:card}]}],savedAt:now});
 const value=readFeedCache('expiry-first',now);
 assert.deepEqual(value.posts[0].slides.map(slide=>slide.id),['photo']);
 assert.equal(value.posts[0].photoUrl,photo);
 assert.equal(readFeedCache('expiry-first',now),value);
});

test('unchanged raw cache data is rechecked when card tokens age while snapshots stay stable otherwise', () => {
 clearFeedCache();
 const card=signedCard(now+5*60_000);
 writeFeedCache('expiry-later',{posts:[{...post('meal'),photoUrl:card,slides:[{id:'card',kind:'card',url:card}]}],savedAt:now});
 const fresh=readFeedCache('expiry-later',now);
 assert.equal(fresh.posts[0].slides.length,1);
 assert.equal(readFeedCache('expiry-later',now+60_000),fresh);
 const expired=readFeedCache('expiry-later',now+4*60_000);
 assert.notEqual(expired,fresh);
 assert.deepEqual(expired.posts[0].slides,[]);
 assert.equal(expired.posts[0].photoUrl,null);
 assert.equal(readFeedCache('expiry-later',now+4*60_000),expired);
});
