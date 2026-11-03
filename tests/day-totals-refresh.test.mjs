// node --import tsx --test tests/day-totals-refresh.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDayTotalsRefresh} from '../src/lib/posts/day-totals-refresh.ts';
const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

test('twenty card refreshes for the same days produce one nutrition read',async()=>{
 const reads=[],committed=[];
 const scheduler=createDayTotalsRefresh({read:async dates=>{reads.push(dates);return dates.map(day=>({day,kcal:600}));},commit:days=>committed.push(days)});
 for(let i=0;i<20;i++)scheduler.request(['2026-11-03','2026-11-02','2026-11-03']);
 await tick();assert.deepEqual(reads,[['2026-11-02','2026-11-03']]);assert.deepEqual(committed,[[{day:'2026-11-02',kcal:600},{day:'2026-11-03',kcal:600}]]);scheduler.cancel();
});

test('an edit during a read supersedes only its day and queues one fresh follow-up',async()=>{
 const first=deferred(),second=deferred(),reads=[],committed=[];
 const scheduler=createDayTotalsRefresh({read:dates=>{reads.push(dates);return reads.length===1?first.promise:second.promise;},commit:days=>committed.push(days)});
 scheduler.request(['2026-11-01','2026-11-02']);await tick();
 for(let i=0;i<20;i++)scheduler.request(['2026-11-02','2026-11-03']);
 first.resolve([{day:'2026-11-01',kcal:100},{day:'2026-11-02',kcal:900}]);await tick();
 assert.deepEqual(committed,[[{day:'2026-11-01',kcal:100}]]);assert.deepEqual(reads,[['2026-11-01','2026-11-02'],['2026-11-02','2026-11-03']]);
 second.resolve([{day:'2026-11-02',kcal:600},{day:'2026-11-03',kcal:200}]);await tick();
 assert.deepEqual(committed.at(-1),[{day:'2026-11-02',kcal:600},{day:'2026-11-03',kcal:200}]);scheduler.cancel();
});

test('failed reads preserve the last totals and another event can retry',async()=>{
 const reads=[],committed=[];
 const scheduler=createDayTotalsRefresh({read:async dates=>{reads.push(dates);if(reads.length===1)throw Error('offline');return [{day:dates[0],kcal:null,missing:['rice']}];},commit:days=>committed.push(days)});
 scheduler.request(['2026-11-03']);await tick();assert.deepEqual(committed,[]);
 scheduler.request(['2026-11-03']);await tick();assert.deepEqual(committed,[[{day:'2026-11-03',kcal:null,missing:['rice']}]]);scheduler.cancel();
});

test('unmount cancels queued work and prevents a late response from publishing',async()=>{
 let calls=0;const pending=deferred(),committed=[];
 const before=createDayTotalsRefresh({read:async()=>{calls++;return [];},commit:()=>{}});before.request(['2026-11-03']);before.cancel();await tick();assert.equal(calls,0);
 const after=createDayTotalsRefresh({read:()=>pending.promise,commit:days=>committed.push(days)});after.request(['2026-11-03']);await tick();after.cancel();pending.resolve([{day:'2026-11-03',kcal:900}]);await tick();assert.deepEqual(committed,[]);
});
