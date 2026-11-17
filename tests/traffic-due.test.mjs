import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getTraffic } from '../src/lib/queue/traffic.ts';

test('a queue holding only jobs that are not due yet shows low traffic', async () => {
  // Sixty queued jobs, every one due in three hours. A count of all queued jobs would say "high".
  const due=Date.now()+3*60*60*1000;
  const admin={from(table){assert.equal(table,'jobs');let before=Infinity;return {
    select(){return this;},
    lte(column,value){assert.equal(column,'run_after');before=Date.parse(value);return this;},
    eq(column,value){assert.equal(column,'status');assert.equal(value,'queued');return Promise.resolve({count:due<=before?60:0,error:null});},
  };}};
  assert.equal(await getTraffic(admin),'low');
});

test('the tick and the traffic label read the same due-only count', () => {
  const read=name=>readFileSync(new URL(`../src/lib/queue/${name}`,import.meta.url),'utf8');
  const rule=/\.lte\("run_after"/g;
  assert.equal(read('traffic.ts').match(rule)?.length,1,'the rule is written once, in traffic.ts');
  assert.equal(read('tick.ts').match(rule),null,'tick.ts has no copy of the rule');
  assert.match(read('tick.ts'),/countDueQueued\(admin\)/);
  assert.equal(read('traffic.ts').match(/countDueQueued\(admin\)/g)?.length,1,'the label uses the shared count');
});
