// node --import tsx --test tests/near-viewport.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import {observeNearViewport} from '../src/lib/media/near-viewport.ts';

test('photos reveal once near the viewport and ignore observer callbacks after cleanup',()=>{
 const previous=globalThis.IntersectionObserver;
 let callback,options,observed,disconnections=0,reveals=0;
 globalThis.IntersectionObserver=class {
  constructor(receive,configuration){callback=receive;options=configuration;}
  observe(element){observed=element;}
  disconnect(){disconnections++;}
 };
 try {
  const element={},stop=observeNearViewport(element,()=>reveals++);
  assert.equal(observed,element);assert.equal(options.rootMargin,'100px');
  callback([{isIntersecting:false}]);assert.equal(reveals,0);
  callback([{isIntersecting:true}]);assert.equal(reveals,1);assert.equal(disconnections,1);
  callback([{isIntersecting:true}]);assert.equal(reveals,1);
  stop();
  const cancel=observeNearViewport(element,()=>reveals++);cancel();
  callback([{isIntersecting:true}]);assert.equal(reveals,1);
 } finally {globalThis.IntersectionObserver=previous;}
});

test('browsers without IntersectionObserver can still load meal photos',()=>{
 const previous=globalThis.IntersectionObserver;
 delete globalThis.IntersectionObserver;
 try {let revealed=false;const stop=observeNearViewport({},()=>{revealed=true;});assert.equal(revealed,true);stop();}
 finally {globalThis.IntersectionObserver=previous;}
});
