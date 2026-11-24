import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleMonth} from '../src/lib/posts/visible-month.ts';
const view={headerBottom:122,viewportHeight:844,scrollTop:200,scrollHeight:1515};
const starts=[{month:'2026-09',top:76},{month:'2026-10',top:268},{month:'2026-11',top:508}];
test('short two-month calendar shows current month rather than nearest header start',()=>assert.equal(visibleMonth([{month:'2026-10',top:123},{month:'2026-11',top:363}],{...view,scrollTop:0,scrollHeight:844},'2026-11'),'2026-11'));
test('bottom of long calendar shows current month rather than September',()=>assert.equal(visibleMonth(starts,{...view,scrollTop:671},'2026-11'),'2026-11'));
test('middle position selects the month containing the viewport midpoint',()=>assert.equal(visibleMonth(starts,view,'2026-11'),'2026-10'));
test('top of a scrollable calendar shows first loaded month',()=>assert.equal(visibleMonth(starts,{...view,scrollTop:0},'2026-11'),'2026-09'));
test('bottom tolerance includes exactly one pixel but not more',()=>{
 assert.equal(visibleMonth(starts,{...view,scrollTop:670},'2026-11'),'2026-11');
 assert.equal(visibleMonth(starts,{...view,scrollTop:669.9},'2026-11'),'2026-10');
});
test('a start at the midpoint belongs to its new month',()=>assert.equal(visibleMonth([{month:'2026-10',top:50},{month:'2026-11',top:483}],view,'2026-11'),'2026-11'));
test('empty calendar uses current month',()=>assert.equal(visibleMonth([],view,'2026-11'),'2026-11'));
