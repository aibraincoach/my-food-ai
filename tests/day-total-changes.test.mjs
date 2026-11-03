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

test('backdated discovery reuses its SSR contribution, but inserted or edited meals refresh',async()=>{
 const {dayPostReceipt}=await import('../src/lib/posts/days.ts');
 const ready={...meal,items:[{name:'rice',calories:120},{name:'sauce',calories:null}]};
 const receipt=dayPostReceipt(ready.id,ready.eaten_at,ready.items);
 const receipts=new Map([[receipt.id,receipt]]);
 const check=card=>dayTotalRefreshDates(undefined,card,'Asia/Jakarta',known,false,receipts);
 assert.deepEqual(receipt,{id:'meal',eatenAt:meal.eaten_at,kcal:120,missing:['sauce'],known:1});
 assert.deepEqual(check(ready),[]);
 assert.deepEqual(check({...ready,items:[{name:'rice',calories:130},{name:'sauce',calories:null}]}),['2026-11-02']);
 assert.deepEqual(check({...ready,items:[{name:'rice',calories:120},{name:'different unknown',calories:null}]}),['2026-11-02']);
 assert.deepEqual(check({...ready,id:'new meal'}),['2026-11-02']);
 assert.deepEqual(check({...ready,itemsUnavailable:true}),['2026-11-02']);
 assert.deepEqual(check({...ready,eaten_at:'2026-11-03T12:00:00Z'}),['2026-11-03','2026-11-02']);
});

test('the existing owner day query supplies normalized receipts without an extra database read',async()=>{
 const {createClient}=await import('@supabase/supabase-js');
 const {getDayTotals}=await import('../src/lib/posts/days.ts');
 const reads=[];
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input));reads.push(url);
  return Response.json([{id:'meal',eaten_at:meal.eaten_at,current_post_items:[
   {name:'rice',portion_grams:50,item_nutrition:{calories:120,source_ref:{basis:'per_100g'}}},
   {name:'sauce',portion_grams:null,item_nutrition:null},
  ]}]);
 }}});
 const days=await getDayTotals(db,'owned-user','UTC',['2026-11-02']);
 assert.equal(reads.length,1);assert.equal(reads[0].searchParams.get('user_id'),'eq.owned-user');
 assert.equal(days[0].posts.length,1);assert.equal(days[0].posts[0].known,1);assert.deepEqual(days[0].posts[0].missing,['sauce']);
 assert.equal(days[0].posts[0].kcal,days[0].kcal);
 const card={...meal,items:[{name:'rice',calories:days[0].kcal},{name:'sauce',calories:null}]};
 assert.deepEqual(dayTotalRefreshDates(undefined,card,'UTC',known,false,new Map(days[0].posts.map(p=>[p.id,p]))),[]);
});
