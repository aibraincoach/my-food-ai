import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
// #1095: OutlineOverlay's backoff poll on the meal page was the last quiet reader; it joins the list.
test('the seven readers contain no interval or quiet read timer; only the explicit day boundary remains',()=>{
 for(const name of ['RealtimePost','Feed','QueueTicker','Thread','NeedsInputStrip','PostReadinessListener','OutlineOverlay']){
  const source=readFileSync(new URL('../src/components/'+name+'.tsx',import.meta.url),'utf8');assert.doesNotMatch(source,/\bsetInterval\s*\(/,name);
  const timers=[...source.matchAll(/\bsetTimeout\s*\(/g)];assert.equal(timers.length,name==='PostReadinessListener'?1:0,name);
  if(name==='PostReadinessListener'){assert.match(source,/next\.setHours\(24,0,0,0\)/);assert.match(source,/scheduleDayBoundary/);}
 }
});
