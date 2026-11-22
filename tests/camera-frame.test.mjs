import test from 'node:test';
import assert from 'node:assert/strict';
import {grabFrame} from '../src/lib/media/camera.ts';

test('frozen preview receives drawn pixels before full-quality JPEG encoding begins',async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,requestAnimationFrame:globalThis.requestAnimationFrame};
 const calls=[],frames=[];const blob=new Blob(['jpeg'],{type:'image/jpeg'});
 const canvas={width:0,height:0,getContext:()=>({drawImage:()=>calls.push('draw')}),toBlob(callback,type,quality){calls.push('encode');assert.equal(type,'image/jpeg');assert.equal(quality,.95);callback(blob);}};
 globalThis.document={createElement:()=>canvas};globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
 try{
  const pending=grabFrame({readyState:2,videoWidth:1920,videoHeight:1080},frame=>{assert.equal(frame,canvas);assert.deepEqual(calls,['draw']);calls.push('preview');});
  assert.deepEqual(calls,['draw','preview']);assert.equal(canvas.width,1920);assert.equal(canvas.height,1080);
  frames.shift()();assert.deepEqual(calls,['draw','preview']);frames.shift()();
  assert.equal(await pending,blob);assert.deepEqual(calls,['draw','preview','encode']);
  await assert.rejects(grabFrame({readyState:0,videoWidth:0,videoHeight:0},()=>assert.fail('must not show an empty preview')),/not ready/);
 }finally{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});

import {mock} from 'node:test';
for(const blocked of ['paint','encode','still'])test(`one 3-second frame deadline covers a stalled ${blocked}`,async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame,ImageCapture:globalThis.ImageCapture};
 const frames=[];let encodes=0;
 mock.timers.enable({apis:['setTimeout']});
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}}),toBlob(){encodes++;}})};
 globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length;};globalThis.cancelAnimationFrame=()=>{};
 globalThis.ImageCapture=class{takePhoto(){return new Promise(()=>{});}};
 try{
  const pending=grabFrame({readyState:2,videoWidth:320,videoHeight:240,srcObject:{getVideoTracks:()=>[{}]}},blocked==='paint'?()=>{}:undefined,blocked==='still');
  let settled=false;const outcome=pending.then(()=>{settled=true;return 'resolved';},e=>{settled=true;return e.message;});
  mock.timers.tick(2999);await Promise.resolve();assert.equal(settled,false);
  mock.timers.tick(1);await Promise.resolve();await Promise.resolve();assert.equal(settled,true,'a missing callback must not keep the shutter busy forever');
  assert.match(await outcome,/timed out/);assert.equal(encodes,blocked==='encode'?1:0,'no silent fallback encode');
 }finally{mock.timers.reset();for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
test('a failed supported still capture fails visibly without switching to video encoding',async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,ImageCapture:globalThis.ImageCapture};let encodes=0;
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}}),toBlob(callback){encodes++;callback(new Blob(['fallback']));}})};globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.ImageCapture=class{async takePhoto(){throw Error('native capture failed');}};
 try{await assert.rejects(grabFrame({readyState:2,videoWidth:320,videoHeight:240,srcObject:{getVideoTracks:()=>[{}]}},undefined,true),/native capture failed/);assert.equal(encodes,0);}finally{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
test('a supported still capture keeps its image and never starts a second encoder',async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,ImageCapture:globalThis.ImageCapture};const still=new Blob(['native full resolution'],{type:'image/jpeg'});let encodes=0;
 globalThis.document={createElement:()=>({getContext:()=>({drawImage(){}}),toBlob(){encodes++;}})};globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.ImageCapture=class{async takePhoto(){return still;}};
 try{assert.equal(await grabFrame({readyState:2,videoWidth:320,videoHeight:240,srcObject:{getVideoTracks:()=>[{}]}},undefined,true),still);assert.equal(encodes,0);}finally{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
