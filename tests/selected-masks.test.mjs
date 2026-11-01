import test from 'node:test';import assert from 'node:assert/strict';
import{uploadSelectedMasks}from'../src/lib/pipeline/selected-masks.ts';
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
const region=(index,selected=true)=>({index,box:{left:0,top:0,right:2,bottom:2},areaFraction:1,confidence:1,raster:new Uint8Array([1,1,1,1]),rasterWidth:2,rasterHeight:2,maskPath:`owner/meal/masks/${index}.png`,item:selected?{name:'food',regionIndex:index,portionGrams:1}:null});
test('only referenced masks are stored and source region indices are preserved',async()=>{
 const stored=[];const db={storage:{from:bucket=>{assert.equal(bucket,'media');return{upload:async(path,png,options)=>{stored.push(path);assert.equal(Buffer.from(png).subarray(1,4).toString(),'PNG');assert.equal(options.upsert,true);return{error:null}}}}}};
 await uploadSelectedMasks(db,[region(3,false),region(7),region(42)],2,2);assert.deepEqual(stored,['owner/meal/masks/7.png','owner/meal/masks/42.png']);
});
test('mask buffers/uploads are bounded and completion waits for every referenced mask',async()=>{
 const releases=Array.from({length:6},deferred);const started=[];let active=0,maximum=0,finished=false;
 const db={storage:{from:()=>({upload:async path=>{const i=Number(path.match(/(\d+)\.png$/)[1]);started.push(i);active++;maximum=Math.max(maximum,active);await releases[i].promise;active--;return{error:null}}})}};
 const run=uploadSelectedMasks(db,Array.from({length:6},(_,i)=>region(i)),2,2).then(()=>finished=true);
 assert.deepEqual(started,[0,1,2,3]);releases[1].resolve();await flush();assert.deepEqual(started,[0,1,2,3,4]);assert.equal(finished,false);releases.forEach(x=>x.resolve());await run;assert.equal(maximum,4);assert.equal(active,0);
});
test('a failed mask prevents publication and drains started peers before returning',async()=>{
 const peer=deferred(),started=[];let finished=false,peers=0;
 const db={storage:{from:()=>({upload:async path=>{const i=Number(path.match(/(\d+)\.png$/)[1]);started.push(i);if(i===0)return{error:{message:'storage unavailable'}};await peer.promise;peers++;return{error:null}}})}};
 const run=uploadSelectedMasks(db,Array.from({length:6},(_,i)=>region(i)),2,2);const rejected=assert.rejects(run,/mask upload failed/).then(()=>finished=true);await flush();assert.equal(finished,false);assert.deepEqual(started,[0,1,2,3]);peer.resolve();await rejected;assert.equal(peers,3);
});
