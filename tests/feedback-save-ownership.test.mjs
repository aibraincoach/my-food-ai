import test from 'node:test';
import assert from 'node:assert/strict';
import {saveFeedbackRevision,feedbackSavePending,hasFeedbackError} from '../src/lib/posts/feedback-errors.ts';
import {saveFeedbackOptimistically} from '../src/lib/posts/feedback-optimistic.ts';
test('a remounted feedback row cannot race a pending vote and a successful retry clears its failure',async()=>{
 const revision=JSON.stringify(['meal','analysis','fingerprint']);let fail,calls=0,visible=null;
 const request=new Promise((_,reject)=>{fail=reject;});
 const first=saveFeedbackRevision(revision,()=>saveFeedbackOptimistically({previous:null,next:'down',select:value=>{visible=value;},isCurrent:()=>false,save:()=>{calls++;return request;}}));
 const failed=assert.rejects(first,/save failed/);
 assert.equal(feedbackSavePending(revision),true);
 assert.equal(await saveFeedbackRevision(revision,async()=>{calls++;visible='up';}),false);
 assert.equal(calls,1);assert.equal(visible,'down');
 fail(Error('save failed'));await failed;
 assert.equal(feedbackSavePending(revision),false);assert.equal(hasFeedbackError(revision),true);
 assert.equal(hasFeedbackError(JSON.stringify(['meal','new analysis','fingerprint'])),false);
 assert.equal(await saveFeedbackRevision(revision,async()=>{calls++;visible='up';}),true);
 assert.equal(calls,2);assert.equal(visible,'up');assert.equal(hasFeedbackError(revision),false);
});
