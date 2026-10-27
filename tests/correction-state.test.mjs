import test from 'node:test';
import assert from 'node:assert/strict';
import {correctionWindow,correctionReply} from '../src/lib/pipeline/correction-state.ts';
const c=(id,body,author='user')=>({id,body,author,created_at:'2026-10-27T00:00:00Z'});
test('all pending relative instructions are consumed once across distinct jobs and timestamp ties',()=>{
 const first=[c('b','halve rice'),c('c','halve rice again')];
 assert.deepEqual(correctionWindow(first,[]).pending,first);
 const next=[c('a','double beans'),...first,c('reply','Changed','model'),c('d','halve beans')];
 const progress=[{payload:{correction_sequence:1,correction_pending_ids:['b','c']}}];
 const window=correctionWindow(next,progress);
 assert.equal(window.sequence,1);assert.deepEqual(window.pending.map(x=>x.id),['a','d']);
 assert.deepEqual(window.history.map(x=>x.id),['b','c','reply']);
 assert.deepEqual(correctionWindow(next,[...progress,{payload:{correction_sequence:2,correction_pending_ids:['a','d']}}]).pending,[]);
});
test('reply uses resolved USDA totals and preserves unavailable nutrients',()=>{
 const reply=correctionReply([{name:'rice',portion_grams:100}],[{name:'rice',portion_grams:50}],{calories:430,protein_g:null,carbs_g:0,fat_g:2});
 assert.match(reply,/430 kcal/);assert.doesNotMatch(reply,/600/);assert.match(reply,/unavailable/);
 assert.match(correctionReply([],[],{calories:0,protein_g:0,carbs_g:0,fat_g:0}),/unchanged/);
});
