import test from 'node:test';
import assert from 'node:assert/strict';
import {failureFromResponse,captureFailureText,CaptureFailureError} from '../src/lib/posts/capture-failure.ts';

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
