import test from 'node:test';
import assert from 'node:assert/strict';
import {rememberFeedbackError,hasFeedbackError,clearFeedbackError} from '../src/lib/posts/feedback-errors.ts';
test('failed votes survive a remount and never affect a newer analysis revision',()=>{
 const old=JSON.stringify(['meal','comment','old']),current=JSON.stringify(['meal','comment','new']);
 clearFeedbackError(old);clearFeedbackError(current);
 rememberFeedbackError(old);
 assert.equal(hasFeedbackError(old),true);
 assert.equal(hasFeedbackError(current),false);
 clearFeedbackError(current);assert.equal(hasFeedbackError(old),true);
 clearFeedbackError(old);assert.equal(hasFeedbackError(old),false);
});
