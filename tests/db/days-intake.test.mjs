import test from 'node:test';
import assert from 'node:assert/strict';
import {tsImport} from 'tsx/esm/api';
import {admin,user,checked} from './helpers.mjs';

test('water without a meal appears in day and month readers',async()=>{
 assert.ok(['localhost','127.0.0.1'].includes(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname),'Disposable local Supabase only');
 const {getDays,getMonthSummary}=await tsImport('../../src/lib/posts/days.ts',import.meta.url);
 const owner=await user(),other=await user(2),db=admin();
 const date='2001-02-17',logged_at=date+'T12:00:00Z';
 const inserted=checked(await db.from('intake_logs').insert({user_id:owner.user.id,kind:'water',amount:375,ml:375,logged_at}).select('id').single());
 try{
  const days=await getDays(owner.client,owner.user.id,'UTC',date,date);
  assert.equal(days.length,1);assert.equal(days[0].date,date);assert.deepEqual(days[0].posts,[]);assert.equal(days[0].intake.water,375);
  const month=await getMonthSummary(owner.client,owner.user.id,'UTC','2001-02');
  const day=month.days.find(day=>day.day===date);assert.ok(day);assert.equal(day.intake,true);assert.equal(day.kcal,null);assert.equal(day.posts,0);
  assert.deepEqual(await getDays(other.client,other.user.id,'UTC',date,date),[]);
 }finally{checked(await db.from('intake_logs').delete().eq('id',inserted.id));}
});
