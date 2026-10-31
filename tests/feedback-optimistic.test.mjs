import test from 'node:test';
import assert from 'node:assert/strict';
import {saveFeedbackOptimistically} from '../src/lib/posts/feedback-optimistic.ts';

test('selection is visible before the save resolves', async () => {
 let finish;let selection=null;
 const saving=saveFeedbackOptimistically({previous:null,next:'up',save:()=>new Promise(r=>{finish=r;}),isCurrent:()=>true,select:v=>{selection=v;}});
 assert.equal(selection,'up');finish();assert.equal(await saving,true);
});
test('failed save restores the previous saved selection',async()=>{
 const selections=[];
 await assert.rejects(saveFeedbackOptimistically({previous:'down',next:'up',save:async()=>{throw Error('unavailable');},isCurrent:()=>true,select:v=>selections.push(v)}));
 assert.deepEqual(selections,['up','down']);
});
test('stale revision failure does not roll back a newer revision',async()=>{
 let reject;let current=true;const selections=[];
 const saving=saveFeedbackOptimistically({previous:'down',next:'up',save:()=>new Promise((_,r)=>{reject=r;}),isCurrent:()=>current,select:v=>selections.push(v)});
 current=false;reject(Error('late failure'));await assert.rejects(saving);
 assert.deepEqual(selections,['up']);
});
test('stale success cannot navigate to the old correction revision',async()=>{
 let finish;let current=true;
 const saving=saveFeedbackOptimistically({previous:null,next:'down',save:()=>new Promise(r=>{finish=r;}),isCurrent:()=>current,select:()=>{}});
 current=false;finish();assert.equal(await saving,false);
});
