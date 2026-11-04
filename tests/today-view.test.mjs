import test from 'node:test';import assert from 'node:assert/strict';
import {todayFromPage} from '../src/lib/posts/today-view.ts';import {sumNutrition} from '../src/lib/nutrition/totals.ts';
const now=new Date('2026-11-04T12:00:00Z');const item={name:'rice',calories:100,protein_g:2,carbs_g:20,fat_g:1,fibre_g:0,sugar_g:0,sodium_mg:1};
const post=(id,date,status='ready')=>({id,status,caption:'rice',eaten_at:date+'T01:00:00Z',photoUrl:null,items:[item]});
test('complete first page derives Today from ready posts without manufacturing intake',()=>{
 const posts=[post('a','2026-11-04'),post('b','2026-11-04'),post('c','2026-11-03')];const view=todayFromPage({posts,nextCursor:'next'},'UTC',now);
 assert.deepEqual(view.posts.map(p=>p.id),['a','b']);assert.deepEqual(view.totals,sumNutrition([item,item]));assert.equal('intake' in view,false);
 assert.equal(todayFromPage({posts:posts.slice(0,2),nextCursor:'next'},'UTC',now),null);
 assert.equal(todayFromPage({posts:posts.slice(0,2),nextCursor:null},'UTC',now).posts.length,2);
});
test('unsettled food is not counted and failed item reads retain the server fallback',()=>{
 const queued=post('q','2026-11-04','processing');assert.deepEqual(todayFromPage({posts:[queued],nextCursor:null},'UTC',now).posts,[]);
 assert.equal(todayFromPage({posts:[{...post('a','2026-11-04'),itemsUnavailable:true}],nextCursor:null},'UTC',now),null);
});
