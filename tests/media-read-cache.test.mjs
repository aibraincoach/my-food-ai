import test from 'node:test';
import assert from 'node:assert/strict';
import {PrivateMediaUrlCache} from '../src/lib/media/read-cache.ts';

test('repeated reads share one capability before expiry and renew before storage expiry',async()=>{
 const cache=new PrivateMediaUrlCache(300000);let signed=0;const load=async()=>`signed-${++signed}`;
 assert.equal(await cache.get('owner','owner/post/0.feed.jpg',load,0),'signed-1');
 assert.equal(await cache.get('owner','owner/post/0.feed.jpg',load,299999),'signed-1');
 assert.equal(await cache.get('owner','owner/post/0.feed.jpg',load,300000),'signed-2');
});
test('another owner cannot retrieve a cached capability',async()=>{
 const cache=new PrivateMediaUrlCache();await cache.get('first','first/post/0.feed.jpg',async()=>'private');
 await assert.rejects(cache.get('second','first/post/0.feed.jpg',async()=>{throw Error('must not sign');}),/does not belong/);
 await assert.rejects(cache.get('second','second/../first/post.jpg',async()=>''),/does not belong/);
});
test('concurrent reads deduplicate signing and a failed request is retryable',async()=>{
 const cache=new PrivateMediaUrlCache();let calls=0;
 const load=async()=>{calls++;await Promise.resolve();return 'capability';};
 assert.deepEqual(await Promise.all([cache.get('owner','owner/path',load),cache.get('owner','owner/path',load)]),['capability','capability']);assert.equal(calls,1);
 await assert.rejects(cache.get('owner','owner/failure',async()=>{throw Error('offline');}));
 assert.equal(await cache.get('owner','owner/failure',async()=>'retry'),'retry');
});
test('bounded cache evicts old entries and immutable correction paths never alias',async()=>{
 const cache=new PrivateMediaUrlCache(1000,1);let count=0;const load=async()=>String(++count);
 assert.equal(await cache.get('owner','owner/cards/version1/card.png',load),'1');
 assert.equal(await cache.get('owner','owner/cards/version2/card.png',load),'2');
 assert.equal(await cache.get('owner','owner/cards/version1/card.png',load),'3');
});
