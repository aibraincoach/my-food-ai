import test from 'node:test';
import assert from 'node:assert/strict';
import {seedWeekDates} from '../scripts/lib/seed-week-dates.mjs';
for(const [zone,now] of [['America/Edmonton','2026-10-27T12:00:00Z'],['America/Edmonton','2026-11-03T12:00:00Z'],['America/Edmonton','2026-03-10T12:00:00Z'],['Asia/Tokyo','2026-10-27T23:00:00Z']]){
 test(`seed local breakfast and Saturday ${zone} ${now}`,()=>{
  const rows=seedWeekDates(zone,new Date(now));assert.equal(rows.length,7);assert.equal(rows.filter(r=>r.saturday).length,1);
  for(const row of rows){
   const date=new Date(row.eatenAt);
   const hour=Number(new Intl.DateTimeFormat('en',{timeZone:zone,hour:'numeric',hourCycle:'h23'}).format(date));
   assert.equal(hour,row.bigBreakfast?8:12);
   assert.equal(new Intl.DateTimeFormat('en',{timeZone:zone,weekday:'long'}).format(date)==='Saturday',row.saturday);
  }
 });
}
test('timezone must be explicit and valid',()=>{assert.throws(()=>seedWeekDates());assert.throws(()=>seedWeekDates('not-a-zone'));});
