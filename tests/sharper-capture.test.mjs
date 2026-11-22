import test from 'node:test';
import assert from 'node:assert/strict';
import {grabFrame,cameraVideoConstraints} from '../src/lib/media/camera.ts';
test('camera resolution is an ideal and explicit desktop device selection stays exact',()=>{
 assert.deepEqual(cameraVideoConstraints('environment'),{width:{ideal:2560},height:{ideal:1920},facingMode:'environment'});
 assert.deepEqual(cameraVideoConstraints('user','camera2'),{width:{ideal:2560},height:{ideal:1920},deviceId:{exact:'camera2'}});
});
test('shutter keeps native still bytes and reports a failed native attempt without a second encode',async()=>{
 const previous={document:globalThis.document,HTMLMediaElement:globalThis.HTMLMediaElement,ImageCapture:globalThis.ImageCapture};
 const track={},still=new Blob(['native high-resolution JPEG'],{type:'image/jpeg'}),videoBlob=new Blob(['video JPEG'],{type:'image/jpeg'});let fail=false,encodes=0;
 const canvas={width:0,height:0,getContext:()=>({drawImage(){}}),toBlob(done){encodes++;done(videoBlob);}};
 globalThis.document={createElement:()=>canvas};globalThis.HTMLMediaElement={HAVE_CURRENT_DATA:2};globalThis.ImageCapture=class{constructor(t){assert.equal(t,track);}async takePhoto(){if(fail)throw Error('not supported');return still;}};
 try{const video={readyState:2,videoWidth:2560,videoHeight:1920,srcObject:{getVideoTracks:()=>[track]}};
  assert.equal(await grabFrame(video,undefined,true),still);assert.equal(encodes,0);
  fail=true;await assert.rejects(grabFrame(video,undefined,true),/not supported/);assert.equal(encodes,0);assert.equal(canvas.width,2560);assert.equal(canvas.height,1920);
 }finally{for(const[k,v]of Object.entries(previous)){if(v===undefined)delete globalThis[k];else globalThis[k]=v;}}
});
