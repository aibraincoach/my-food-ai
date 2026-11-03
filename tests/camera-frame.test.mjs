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
