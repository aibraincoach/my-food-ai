import test from 'node:test';
import assert from 'node:assert/strict';
import {upgradeUploadDraft} from '../src/lib/posts/upload-store.ts';
import {failureFromResponse,captureFailureText,CaptureFailureError} from '../src/lib/posts/capture-failure.ts';

test('v2 draft upgrade preserves photos, identity and retry state while removing old wording',()=>{
 const bytes=new Uint8Array([1,2,3]).buffer;
 const legacy={operationId:'same-operation',ownerId:'same-owner',state:'failed',files:[{bytes}],message:'An old English failure',caption:'A caption the person typed'};
 const upgraded=upgradeUploadDraft(legacy);
 assert.equal(upgraded.operationId,legacy.operationId);
 assert.equal(upgraded.files,legacy.files);
 assert.equal(upgraded.caption,legacy.caption);
 assert.equal(upgraded.state,'failed');
 assert.deepEqual(upgraded.failure,{code:'saved-before-update'});
 assert.equal(Object.hasOwn(upgraded,'message'),false);
 assert.equal(Object.hasOwn(legacy,'message'),true,'the input fixture is not mutated');
 assert.equal(upgradeUploadDraft(upgraded),upgraded,'upgrade is idempotent');
});

test('response wording and semantic retry code never become a saved message',()=>{
 const failure=failureFromResponse({error:'A server sentence',code:'draft_expired',message_code:'photoStorageFailed'});
 assert.deepEqual(failure,{code:'photoStorageFailed'});
 assert.equal(JSON.stringify(failure).includes('server sentence'),false);
 assert.deepEqual(failureFromResponse({error:'A new server sentence',code:'draft_expired',message_code:'unknown'}),{code:'unknownFailure'});
 assert.deepEqual(failureFromResponse(null),{code:'unknownFailure'});
 assert.deepEqual(new CaptureFailureError(failure).failure,failure);
});

test('the same stored code can display in either language without rewriting the draft',()=>{
 const failure={code:'retakeAttachment'};
 const en=code=>({retakeAttachment:'This photo was not kept. Take it again.'})[code];
 const ja=code=>({retakeAttachment:'この写真は保持されていません。もう一度撮影してください。'})[code];
 const before=JSON.stringify(failure);
 assert.equal(captureFailureText(failure,en),'This photo was not kept. Take it again.');
 assert.equal(captureFailureText(failure,ja),'この写真は保持されていません。もう一度撮影してください。');
 assert.equal(captureFailureText(failure,en),'This photo was not kept. Take it again.');
 assert.equal(JSON.stringify(failure),before);
 assert.equal(captureFailureText(undefined,en),undefined);
});
