// node --import tsx --test tests/feed-cache-mutations.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFeedCache,writeFeedCache,clearFeedCache} from '../src/lib/posts/feed-cache.ts';
import {installFeedCacheMutationListener,claimFeedCacheEvents} from '../src/lib/posts/feed-cache-mutations.ts';
const OWNER='10000000-0000-4000-8000-000000000001',OTHER='20000000-0000-4000-8000-000000000002';
const POST='30000000-0000-4000-8000-000000000003',MEDIA='40000000-0000-4000-8000-000000000004',SAVED='50000000-0000-4000-8000-000000000005';
const entries=new Map();
globalThis.localStorage={get length(){return entries.size;},key:i=>[...entries.keys()][i]??null,getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)};
globalThis.window=new EventTarget();
const meal=()=>({id:POST,caption:'Original',status:'ready',created_at:'2026-11-03T00:00:00Z',eaten_at:'2026-11-03T00:00:00Z',photoUrl:'https://example.test/photo',slides:[{id:MEDIA,kind:'photo',url:'https://example.test/photo'}],items:[{id:'rice',name:'Rice',calories:100}],analysisFingerprint:'revision',saved_meal_id:null});
const seed=(owner=OWNER)=>writeFeedCache(owner,{posts:[meal()],savedAt:Date.now()});
const posts=(owner=OWNER)=>readFeedCache(owner)?.posts;
function setup(active=()=>OWNER){clearFeedCache();seed();const events=new EventTarget(),detach=installFeedCacheMutationListener(events,active);return{detach,send(type,detail){events.dispatchEvent(new CustomEvent(type,{detail}));}};}
test('known off-feed mutations update caption and saved status, and invalidate stale nutrition',()=>{
 const h=setup();try{
 h.send('post-caption',{id:POST,caption:'Updated'});assert.equal(posts()[0].caption,'Original');
 h.send('post-updated',{id:POST});assert.equal(posts()[0].caption,'Updated');assert.equal(posts()[0].items.length,1);
 h.send('save-meal-result',{postId:POST,savedMealId:SAVED});h.send('post-updated',{id:POST});assert.equal(posts()[0].saved_meal_id,SAVED);assert.equal(posts()[0].items.length,1);
 h.send('save-meal-result',{postId:POST,savedMealId:null,failed:true});assert.equal(posts()[0].saved_meal_id,SAVED);
 h.send('media-removed',{postId:POST,mediaId:MEDIA});assert.equal(posts()[0].slides.length,0);assert.equal(posts()[0].items.length,0);assert.equal(posts()[0].itemsUnavailable,true);
 }finally{h.detach();}
});
test('foreign IDs, wrong owner hints, malformed values and event post payloads cannot inject data',()=>{
 const h=setup();try{seed(OTHER);
 for(const detail of [{id:OTHER,post:meal()},{id:POST,userId:OTHER},{id:POST,userId:'invalid'}])h.send('post-deleted',detail);
 assert.equal(posts().length,1);assert.equal(posts(OTHER).length,1);
 h.send('save-meal-result',{id:POST,savedMealId:'invalid'});assert.equal(posts()[0].saved_meal_id,null);
 h.send('post-caption',{id:POST,caption:'bad\0caption'});h.send('post-updated',{id:POST});assert.equal(posts()[0].caption,'Original');
 h.send('post-restore',{id:OTHER,post:{...meal(),id:OTHER}});assert.equal(posts().length,1);
 }finally{h.detach();}
});
test('bootstrap cannot select ambiguous owners or an owner-mismatched stored envelope',()=>{
 const h=setup(()=>null);try{seed(OTHER);h.send('post-deleted',{id:POST});assert.equal(posts().length,1);assert.equal(posts(OTHER).length,1);
 entries.set('mfa-feed:'+OTHER,entries.get('mfa-feed:'+OWNER));h.send('post-deleted',{id:POST,userId:OTHER});assert.equal(posts().length,1);assert.equal(readFeedCache(OTHER),null);
 }finally{h.detach();}
});
test('rollback restores the captured original and logout invalidates pending rollback',()=>{
 const h=setup();try{
 h.send('post-deleted',{id:POST});assert.equal(posts().length,0);
 h.send('post-restore',{id:POST,post:{...meal(),caption:'Injected'}});assert.equal(posts()[0].caption,'Original');
 h.send('post-deleted',{id:POST});clearFeedCache();writeFeedCache(OWNER,{posts:[],savedAt:Date.now()});
 h.send('post-restore',{id:POST,post:meal()});assert.equal(posts().length,0);
 }finally{h.detach();}
});
test('mounted feed owns writes while root retains rollback for navigation away',()=>{
 const h=setup(),release=claimFeedCacheEvents(OWNER);try{
 h.send('post-deleted',{id:POST});assert.equal(posts().length,1);
 writeFeedCache(OWNER,{posts:[],savedAt:Date.now()});release();
 h.send('post-restore',{id:POST,post:{...meal(),caption:'Injected'}});assert.equal(posts()[0].caption,'Original');
 }finally{h.detach();}
});
