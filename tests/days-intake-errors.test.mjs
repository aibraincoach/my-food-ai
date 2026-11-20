import assert from 'node:assert/strict';
import test from 'node:test';
import {createClient} from '@supabase/supabase-js';
import {getDays,getMonthSummary} from '../src/lib/posts/days.ts';

const date='2026-11-02',month='2026-11';
const meal={id:'meal',caption:'Rice',status:'ready',eaten_at:date+'T12:00:00Z',post_media:[],current_post_items:[]};
function fixture({failPage=0,withMeal=true,rows=1001,intakeDate=date}={}) {
 let failing=true,reads=0;
 const intake=Array.from({length:rows},()=>({kind:'water',amount:10,logged_at:intakeDate+'T13:00:00Z',post_id:null,post_item_id:null}));
 const db=createClient('https://fixture.invalid','fixture',{global:{fetch:async input=>{
  const url=new URL(input instanceof Request?input.url:String(input));
  if(url.pathname.endsWith('/posts'))return Response.json(withMeal?[meal]:[]);
  assert.ok(url.pathname.endsWith('/intake_logs'));
  const offset=Number(url.searchParams.get('offset')??0);reads++;
  if(failing&&offset===failPage*1000)return Response.json({message:'fixture intake failure'},{status:503});
  return Response.json(intake.slice(offset,offset+1000));
 }}});
 return {db,recover(){failing=false;},reads:()=>reads};
}

for(const failPage of [0,1]) {
 test(`day intake page ${failPage+1} failure is unavailable and explicit reread recovers`,async()=>{
  const f=fixture({failPage});
  const [day]=await getDays(f.db,'owner','UTC',date,date);
  assert.equal(day.posts[0].caption,'Rice');
  assert.equal(day.intake,null);
  const before=f.reads();await new Promise(resolve=>setImmediate(resolve));assert.equal(f.reads(),before,'no automatic retry');
  f.recover();
  const [recovered]=await getDays(f.db,'owner','UTC',date,date);
  assert.deepEqual(recovered.intake,{water:10010,caffeine:0});
 });
 test(`month intake page ${failPage+1} failure rejects with meals but no partial drink days`,async()=>{
  const f=fixture({failPage,intakeDate:'2026-11-03'});
  await assert.rejects(getMonthSummary(f.db,'owner','UTC',month),error=>{
   assert.equal(error.name,'MonthIntakeError');
   assert.equal(error.summary.days[0].posts,1);
   assert.equal(error.summary.days[0].intake,undefined);
   assert.equal(error.summary.days.length,1,'discard earlier intake pages too');
   return true;
  });
  f.recover();
  const recovered=await getMonthSummary(f.db,'owner','UTC',month);
  assert.equal(recovered.days[0].posts,1);
  assert.equal(recovered.days[1].intake,true);
 });
}

test('a day with no readable meal still records unavailable intake rather than disappearing',async()=>{
 const f=fixture({withMeal:false});
 const [day]=await getDays(f.db,'owner','UTC',date,date);
 assert.ok(day,'unavailable drink-only day is represented');assert.deepEqual(day.posts,[]);assert.equal(day.intake,null);
});

test('a successful empty intake read retains the real empty value',async()=>{
 const f=fixture({rows:0});f.recover();
 const [day]=await getDays(f.db,'owner','UTC',date,date);
 assert.deepEqual(day.intake,{water:0,caffeine:0});
 assert.equal((await getMonthSummary(f.db,'owner','UTC',month)).days[0].posts,1);
});
