import test from 'node:test';
import assert from 'node:assert/strict';
import {sendFeedback} from '../src/lib/posts/feedback.ts';
for(const verdict of ['up','down'])test(`stale ${verdict} does not vote on the unseen revision; a new deliberate vote can`,async t=>{
 const requests=[],events=[];let current=false;
 t.mock.method(globalThis,'fetch',async(_url,init)=>{requests.push(JSON.parse(init.body));return current?new Response(null,{status:204}):Response.json({revision:{modelCommentId:'new-analysis',fingerprint:'new-foods'}},{status:409});});
 const prior=globalThis.window;globalThis.window={dispatchEvent:event=>events.push(event)};t.after(()=>{globalThis.window=prior;});
 await assert.rejects(sendFeedback('meal',verdict,'old-analysis','old-foods'),/meal changed/i);
 assert.equal(requests.length,1);assert.equal(events.some(e=>e.type==='post-feedback'),false);assert.ok(events.some(e=>e.type==='post-updated'&&e.detail.id==='meal'));
 current=true;await sendFeedback('meal',verdict,'new-analysis','new-foods');assert.equal(requests.length,2);assert.equal(requests[1].modelCommentId,'new-analysis');assert.equal(requests[1].fingerprint,'new-foods');assert.equal(events.filter(e=>e.type==='post-feedback').length,1);
});
