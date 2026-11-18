import test from 'node:test';
import assert from 'node:assert/strict';
import {firstPhotoCookie,firstPhotoLinkHeader,FIRST_PHOTO_COOKIE} from '../src/lib/posts/first-photo-hint.ts';

const owner='4fd49573-ab87-4385-9e2c-1b2c3d4e5f60',other='00000000-0000-4000-8000-000000000000';
const media='83f14a2c-6212-42de-8360-84772f3bcd7f',secret='50c2af6cade54d10b7bb538ee19b8c8c';
const url=`/p/${media}_${secret}_1080.webp`;
const value=line=>line.split(';')[0].slice(FIRST_PHOTO_COOKIE.length+1);
const photo={id:media,kind:'photo',photo_secret:secret,posts:{user_id:owner,deleted_at:null}};

test('the seven-day cookie contains only the relative photo URL',()=>{
  const cookie=firstPhotoCookie(url,true);
  assert.match(cookie,/max-age=604800; samesite=lax; secure$/);
  assert.equal(decodeURIComponent(value(cookie)),url);
  assert(!cookie.includes(owner));
});
test('Home preloads only a verified current photo owned by the authenticated account',async()=>{
  let reads=0;
  const link=await firstPhotoLinkHeader(value(firstPhotoCookie(url,true)),owner,async(id,key)=>{
    reads++;assert.equal(id,media);assert.equal(key,secret);return{data:photo,error:null};
  });
  assert.equal(reads,1);
  assert.match(link,/^<\/p\/83f14a2c[^>]+_1080\.webp>; rel=preload; as=image; fetchpriority=high; crossorigin=anonymous; imagesrcset="[^"]+_1200\.webp 1200w[^"]*"; imagesizes=/);
});
test('a missing, deleted or foreign photo and ownership lookup failures produce no hint',async()=>{
  for(const data of [null,{...photo,posts:{user_id:other,deleted_at:null}},{...photo,posts:{user_id:owner,deleted_at:'2026-11-18T00:00:00Z'}},{...photo,photo_secret:'wrong'},{...photo,kind:'card'}]){
    assert.equal(await firstPhotoLinkHeader(encodeURIComponent(url),owner,async()=>({data,error:null})),null);
  }
  assert.equal(await firstPhotoLinkHeader(encodeURIComponent(url),owner,async()=>({data:photo,error:Error('unavailable')})),null);
  assert.equal(await firstPhotoLinkHeader(encodeURIComponent(url),owner,async()=>{throw Error('timeout');}),null);
});
test('anything but a photo address is forgotten without an ownership query',async()=>{
  assert.match(firstPhotoCookie(null,false),/^mfa-first-photo=; path=\/; max-age=0; samesite=lax$/);
  assert.match(firstPhotoCookie('/api/media/feed/a/b/c/v2.webp',false),/max-age=0/);
  for(const bad of [undefined,'',`${owner}|${url}`,'/p/x.webp',`${url}>; rel=preload`,'%E0%A4%A','https://evil.example/p.webp']){
    assert.equal(await firstPhotoLinkHeader(bad,owner,()=>{assert.fail('invalid hints must not query');}),null,String(bad));
  }
});
