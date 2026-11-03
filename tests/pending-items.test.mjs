import test from 'node:test';
import assert from 'node:assert/strict';
import {readPendingItems,writePendingNames,writePendingKcal} from '../src/lib/pipeline/pending-items.ts';
test('pending names retain order and keep unavailable nutrition unknown',()=>{assert.deepEqual(readPendingItems([{name:'Rice',kcal:null},{name:'Egg',kcal:80},{name:'Unknown',kcal:NaN},{name:''}]),[{name:'Rice',kcal:null},{name:'Egg',kcal:80},{name:'Unknown',kcal:null}]);});
test('progress writes include the owning job fence, and unknown kcal is not zero',async()=>{const calls=[];const db={rpc:async(name,body)=>{calls.push({name,body});return {error:null}}};await writePendingNames(db,'post',['Rice','Egg'],'job');await writePendingKcal(db,'post',1,null,'job');assert.deepEqual(calls[0].body,{p_post_id:'post',p_job_id:'job',p_names:[{name:'Rice',kcal:null},{name:'Egg',kcal:null}]});assert.deepEqual(calls[1].body,{p_post_id:'post',p_job_id:'job',p_index:1,p_kcal:null});});
