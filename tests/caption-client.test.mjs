import test from 'node:test';
import assert from 'node:assert/strict';
import {captureEnglish} from './fixtures/capture-wording.mjs';
import {updateCaption} from '../src/lib/posts/caption-client.ts';

test('successful caption update refreshes the existing record without new-post side effects',async()=>{
 const events=new EventTarget();let notificationEnrollments=0,readinessStarts=0;const refreshed=[];const requests=[];
 events.addEventListener('post-created',()=>{notificationEnrollments++;readinessStarts++});
 events.addEventListener('post-updated',event=>refreshed.push(event.detail.id));
 const request=async(url,init)=>{requests.push({url,method:init.method,body:JSON.parse(init.body)});return new Response('{}',{status:200})};
 await updateCaption('post-id','two eggs',request,events);
 assert.deepEqual(requests,[{url:'/api/posts/post-id/caption',method:'PATCH',body:{caption:'two eggs'}}]);
 assert.deepEqual(refreshed,['post-id']);assert.equal(notificationEnrollments,0);assert.equal(readinessStarts,0);
});
test('failed save and invalid text dispatch no refresh or enrollment event',async()=>{
 const events=new EventTarget();let emitted=0,requests=0;
 for(const name of ['post-created','post-updated'])events.addEventListener(name,()=>emitted++);
 const request=async()=>{requests++;return new Response('{}',{status:503})};
 await assert.rejects(updateCaption('post-id','two eggs',request,events),error=>captureEnglish(error.failure.code)==='The caption could not be saved. Try again.');
 await assert.rejects(updateCaption('post-id','a'.repeat(2001),request,events),error=>captureEnglish(error.failure.code)==='Invalid caption.');
 assert.equal(requests,1);assert.equal(emitted,0);
});
test('transport failure preserves the draft path without announcing a successful update',async()=>{
 const events=new EventTarget();let emitted=0;events.addEventListener('post-updated',()=>emitted++);
 await assert.rejects(updateCaption('post-id','two eggs',async()=>{throw Error('offline')},events),/offline/);
 assert.equal(emitted,0);
});
