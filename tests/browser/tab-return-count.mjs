// Local-only served app count proof, retaining app reads and tab prefetches separately.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const app=process.env.APP_URL,out=process.env.TAB_RETURN_OUT,engine=process.env.COUNT_ENGINE??'chromium',locale=process.env.COUNT_LANGUAGE??'en',variant=process.env.COUNT_VARIANT??'head';
assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(app).hostname,'127.0.0.1');
const engines=await import(process.env.MFA_PLAYWRIGHT_MODULE),browser=await engines[engine].launch({executablePath:process.env.COUNT_EXECUTABLE,args:engine==='chromium'?['--no-sandbox']:[]});
const fixture=JSON.parse(await fs.readFile(process.env.TAB_RETURN_FIXTURE)),cookies=JSON.parse(await fs.readFile(process.env.TEST_SESSION_FILE));
const report={engine,locale,variant,cases:[],pageErrors:[],limit:'Local production build,390x844,scripted tab visibility; browser fetch reads only (not server-render reads). Next-Router-Prefetch rows disclosed separately; raw rows retained.'};
try{for(const [screen,pathname]of [['post','/posts/'+fixture.posts[0]],['home','/']]){
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'UTC',serviceWorkers:'block'});
 await context.addCookies([...cookies.map(c=>({...c,url:app})),{name:'lang',value:locale,url:app}]);
 await context.addInitScript(()=>{
  window.__tabReads=[];window.__tabPending=0;window.__tabLast=Date.now();window.addEventListener('post-feedback',event=>{window.__lastFeedback=event.detail;});
  const real=window.fetch.bind(window);
  window.fetch=(input,init)=>{
   const url=new URL(typeof input==='string'?input:input instanceof Request?input.url:String(input),location.href),headers=new Headers(init?.headers??(input instanceof Request?input.headers:undefined));
   if(url.pathname.includes('/rest/v1/')||url.pathname.startsWith('/api/intake/post')||url.pathname.startsWith('/api/feed')||url.searchParams.has('_rsc'))window.__tabReads.push({path:url.pathname,table:url.pathname.split('/').at(-1),method:init?.method??(input instanceof Request?input.method:'GET'),select:url.searchParams.get('select'),ids:url.searchParams.get('post_id')??url.searchParams.get('ids')??url.searchParams.get('post_ids'),prefetch:headers.get('next-router-prefetch')});
   window.__tabPending++;return real(input,init).finally(()=>{window.__tabPending--;window.__tabLast=Date.now();});
  };
 });
 const page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));
 await page.goto(app+pathname,{waitUntil:'networkidle',timeout:30000});if(screen==='home')await page.locator('[data-feed-client-ready]').waitFor();
 const settle=()=>page.waitForFunction(()=>window.__tabPending===0&&Date.now()-window.__tabLast>1200,{},{timeout:20000});await settle();
 const capture=async(phase)=>{
  const allReads=await page.evaluate(()=>{const rows=window.__tabReads;window.__tabReads=[];return rows;});
  const reads=allReads.filter(r=>r.prefetch===null),prefetches=allReads.filter(r=>r.prefetch!==null),feedback=reads.filter(r=>r.table==='post_feedback'&&r.method==='GET');
  const buttons=await page.locator('button[aria-pressed]').evaluateAll(nodes=>nodes.map(n=>({label:n.getAttribute('aria-label'),pressed:n.getAttribute('aria-pressed'),disabled:n.disabled})));
  const row={screen,phase,reads,prefetches,allReads,feedbackReads:feedback.length,buttons};report.cases.push(row);
  if(process.env.TAB_RETURN_OBSERVE!=='1')assert.equal(feedback.length,screen==='post'?(variant==='head'?1:2):variant==='head'?1:5,screen+' '+phase+' feedback count');
 };
 assert.equal(await page.locator('html').getAttribute('lang'),locale);await capture('cold');
 await page.evaluate(()=>{let state='hidden';Object.defineProperty(document,'visibilityState',{get:()=>state,configurable:true});Object.defineProperty(document,'hidden',{get:()=>state==='hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));state='visible';document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
 await settle();await capture('return');
 await page.screenshot({path:out+'.'+screen+'.png',fullPage:true});
 if(variant==='head'&&screen==='home'){
  const card=page.locator('article[data-post-id="'+fixture.posts[0]+'"]'),thumbs=card.locator('button[aria-pressed]');assert.ok(await thumbs.count()>=2);assert.equal(await thumbs.nth(0).isEnabled(),true);
  const states=[];let release=null,started;const requestStarted=new Promise(resolve=>{started=resolve;});
  await page.route('**/api/posts/*/feedback',async route=>{if(route.request().method()!=='POST')return route.continue();await new Promise(resolve=>{release=resolve;started();});await route.fulfill({status:200,contentType:'application/json',body:'{}'});});
  states.push({state:'none',pressed:await thumbs.nth(0).getAttribute('aria-pressed')});await thumbs.nth(0).click();await requestStarted;
  await page.waitForFunction(id=>document.querySelector('article[data-post-id="'+id+'"] button[aria-pressed]')?.getAttribute('aria-busy')==='true',fixture.posts[0]);states.push({state:'saving',busy:true});assert.ok(release);release();
  await page.waitForFunction(id=>document.querySelector('article[data-post-id="'+id+'"] button[aria-pressed]')?.getAttribute('aria-busy')==='false',fixture.posts[0]);assert.equal(await thumbs.nth(0).getAttribute('aria-pressed'),'true');states.push({state:'up',pressed:true});
  await page.evaluate(()=>{const detail=window.__lastFeedback;window.dispatchEvent(new CustomEvent('post-feedback',{detail:{...detail,verdict:'down'}}));});await page.waitForFunction(id=>document.querySelectorAll('article[data-post-id="'+id+'"] button[aria-pressed]')[1]?.getAttribute('aria-pressed')==='true',fixture.posts[0]);assert.equal(await thumbs.nth(1).getAttribute('aria-pressed'),'true');states.push({state:'down',pressed:true});
  await page.unroute('**/api/posts/*/feedback');
  await page.route('**/api/posts/*/feedback',route=>route.fulfill({status:500,contentType:'application/json',body:'{}'}));await thumbs.nth(0).click();await card.getByRole('alert').waitFor();states.push({state:'error',alert:await card.getByRole('alert').textContent()});
  report.uiStates=states;
 }
 await context.close();
 }assert.deepEqual(report.pageErrors,[]);report.pass=true;
}finally{await browser.close();await fs.writeFile(out,JSON.stringify(report,null,2));console.log(JSON.stringify({engine,locale,variant,cases:report.cases.map(r=>({screen:r.screen,phase:r.phase,feedback:r.feedbackReads,appReads:r.reads.length,prefetches:r.prefetches.length})),errors:report.pageErrors}));}
