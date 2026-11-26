import test from 'node:test';
import assert from 'node:assert/strict';
import {staleView} from '../src/lib/posts/readiness-refresh.ts';
const time='2026-11-26T08:00:00+00:00';
const post=(id,status='ready',created_at=time)=>({id,status,created_at});
const rendered=rows=>new Map(rows.map(row=>[row.id,{status:row.status,createdAt:row.created_at}]));
const read=(latest,pending=[])=>({latest,pending:pending===null?null:new Set(pending)});
test('unchanged complete and empty views remain current; a non-listing never uses this comparison',()=>{
 assert.equal(staleView(rendered([post('a')]),read([post('a')]),true),false);
 assert.equal(staleView(rendered([]),read([]),true),false);
 assert.equal(staleView(rendered([]),read([post('new')]),false),false);
});
test('a rendered status transition is stale, including processing becoming ready',()=>{
 assert.equal(staleView(rendered([post('a','processing')]),read([post('a')],['a']),true),true);
 assert.equal(staleView(rendered([post('a')]),read([post('a','needs_input')]),true),true);
});
test('a newly discovered post, including the first post on an empty complete page, is stale',()=>{
 assert.equal(staleView(rendered([post('a')]),read([post('new'),post('a')]),true),true);
 assert.equal(staleView(rendered([]),read([post('new')]),true),true);
});
test('a successful pending seed catches an older-than-window settlement; failed seed makes no inference',()=>{
 const latest=Array.from({length:20},(_,i)=>post(String(100-i)));
 const rows=rendered([...latest,post('old','processing','2026-01-01T00:00:00+00:00')]);
 assert.equal(staleView(rows,read(latest,[]),true),true);
 assert.equal(staleView(rows,read(latest,['old']),true),false);
 assert.equal(staleView(rows,read(latest,null),true),false);
 assert.equal(staleView(rows,{latest:null,pending:new Set()},true),true);
});
test('deletion checks only the known discovery window, with the id tie-break at an equal timestamp',()=>{
 const all=Array.from({length:30},(_,i)=>post(String(100-i).padStart(3,'0'))),latest=all.slice(0,20);
 assert.equal(staleView(rendered(all),read(latest),true),false,'ten tied posts below the tuple cutoff are not deleted');
 assert.equal(staleView(rendered(all),read(latest.filter(p=>p.id!=='095').concat(all[20])),true),true,'missing row within a full window is deleted');
 assert.equal(staleView(rendered(all.slice(0,3)),read(all.slice(0,2)),true),true,'a short latest page covers every rendered row');
 assert.equal(staleView(rendered(all),{latest:null,pending:null},true),false,'failed reads prove no deletion');
});
