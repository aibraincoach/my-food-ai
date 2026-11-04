import test from 'node:test';
import assert from 'node:assert/strict';
import {grabFrame,cameraVideoConstraints} from '../src/lib/media/camera.ts';
test('camera resolution is an ideal and explicit desktop device selection stays exact',()=>{
 assert.deepEqual(cameraVideoConstraints('environment'),{width:{ideal:1920},height:{ideal:1440},facingMode:'environment'});
 assert.deepEqual(cameraVideoConstraints('user','camera2'),{width:{ideal:1920},height:{ideal:1440},deviceId:{exact:'camera2'}});
});
test('shutter prefers native still bytes and falls back to the available video pixels',async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,ImageCapture:globalThis.ImageCapture};
 const track={},still=new Blob(['native high-resolution JPEG'],{type:'image/jpeg'}),fallback=new Blob(['video JPEG'],{type:'image/jpeg'});let fail=false,encodes=0;
 const canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toBlob(done){encodes++;done(fallback);}};
 globalThis.document={createElement:()=>canvas};globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.ImageCapture=class{constructor(t){assert.equal(t,track);}async takePhoto(){if(fail)throw Error('not supported');return still;}};
 try{const video={readyState:2,videoWidth:2560,videoHeight:1920,srcObject:{getVideoTracks:()=>[track]}};
  assert.equal(await grabFrame(video,undefined,true),still);assert.equal(encodes,0);
  fail=true;assert.equal(await grabFrame(video,undefined,true),fallback);assert.equal(encodes,1);assert.equal(canvas.width,2560);assert.equal(canvas.height,1920);
 }finally{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
