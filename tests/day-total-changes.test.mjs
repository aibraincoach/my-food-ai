import test from 'node:test';
import assert from 'node:assert/strict';
import {dayTotalRefreshDates} from '../src/lib/posts/day-total-changes.ts';
const meal={id:'meal',eaten_at:'2026-11-02T12:00:00Z',status:'ready',analysisFingerprint:'verified-revision',items:[],slides:[]};
const known=new Set(['2026-11-02','2026-11-03']);
const dates=(previous,fresh,days=known,force=false)=>dayTotalRefreshDates(previous,fresh,'Asia/Jakarta',days,force);
test('SSR, fresh page and metadata hydration share the known day total',()=>{
 const hydrated={...meal,caption:'Updated caption',slides:[{url:'new signed URL'}],saved_meal_id:'saved',items:[{name:'hydrated rice'}]};
 assert.deepEqual(dates(meal,hydrated),[]);
 assert.deepEqual(dates(hydrated,{...hydrated,photoUrl:'card URL'}),[]);
 assert.deepEqual(dates(meal,meal,new Set()),['2026-11-02']);
});
test('nutrition revision, readiness and forced mutation events invalidate totals',()=>{
 assert.deepEqual(dates(meal,{...meal,analysisFingerprint:'new revision'}),['2026-11-02']);
 assert.deepEqual(dates({...meal,status:'queued'},meal),['2026-11-02']);
 assert.deepEqual(dates(meal,meal,known,true),['2026-11-02']);
 assert.deepEqual(dates(undefined,meal),['2026-11-02']);
});
test('unknown revision never claims unchanged nutrition; moves refresh both local days',()=>{
 assert.deepEqual(dates({...meal,analysisFingerprint:null},{...meal,analysisFingerprint:null}),['2026-11-02']);
 assert.deepEqual(dates(meal,{...meal,eaten_at:'2026-11-03T12:00:00Z'}),['2026-11-03','2026-11-02']);
});
