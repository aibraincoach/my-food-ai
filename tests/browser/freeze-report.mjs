// Disposable, explicit-send diagnostics acceptance. No production account or endpoint.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';import ts from 'typescript';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);
const app=process.env.APP_URL,root=process.env.FREEZE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!root||![app,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>new URL(v).hostname==='127.0.0.1')||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback only');
const {chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const {createClient}=await import('@supabase/supabase-js');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const fixture=JSON.parse(await fs.readFile(root+'/fixture-ledger.json','utf8')),cookies=JSON.parse(await fs.readFile(root+'/session.json','utf8'));
if(!['en','ja'].includes(process.env.ONLY_LOCALE))throw Error('Choose ONLY_LOCALE en or ja; host must clear owned reports between cases');
const result={engine,limits:engine==='webkit'?'Synthetic camera stream; Playwright WebKit, not Safari; real phone unproved':'Synthetic Chromium camera; real phone unproved',cases:[]};
const executablePath=process.env.TEST_CHROMIUM_EXECUTABLE;
async function context(dir,locale='en',blocked=false){
 const c=await(engine==='chromium'?chromium:webkit).launchPersistentContext(dir,{...(engine==='chromium'?{executablePath,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],permissions:['camera']}:{}),viewport:{width:390,height:844},hasTouch:true,locale,timezoneId:'UTC',serviceWorkers:blocked?'block':'allow'});
 await c.addCookies([...cookies.map(v=>({name:v.name,value:v.value,url:app})),{name:'lang',value:locale,url:app},{name:'tz',value:'UTC',url:app}]);
 await c.addInitScript(()=>{localStorage.setItem('mfa-camera-mode','app');});
 if(engine==='webkit')await c.addInitScript(()=>{Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>new MediaStream(),enumerateDevices:async()=>[]}});for(const[k,v]of Object.entries({videoWidth:320,videoHeight:240,readyState:4}))Object.defineProperty(HTMLVideoElement.prototype,k,{get:()=>v});HTMLVideoElement.prototype.play=()=>Promise.resolve();});
 const p=c.pages()[0]??await c.newPage();p.setDefaultTimeout(10000);return {c,p};
}
const events=p=>p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('mfa-diagnostics');r.onsuccess=()=>{const db=r.result;if(!db.objectStoreNames.contains('events')){db.close();reject(Error('No history'));return;}const tx=db.transaction('events'),q=tx.objectStore('events').getAll();tx.oncomplete=()=>{db.close();resolve(q.result);};tx.onerror=()=>reject(tx.error);};r.onerror=()=>reject(r.error);}));
async function clear(c,p){await p.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase('mfa-diagnostics');r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);}));await c.close();}
// Run the actual ring implementation, isolated from app-generated events.
let pair;
try{
 if(!process.env.SKIP_RING){
 const dir=root+'/contexts/ring-'+engine;await fs.rm(dir,{recursive:true,force:true});pair=await context(dir,'en',true);await pair.c.route(app+'/ring-fixture',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await pair.p.goto(app+'/ring-fixture');
 const codes=await Promise.all(['schema','recorder'].map(async name=>ts.transpileModule(await fs.readFile(new URL('../../src/lib/diagnostics/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText));
 async function install(p){await p.evaluate(([schema,recorder])=>{const s={};new Function('exports',schema)(s);const r={};new Function('exports','require','process',recorder)(r,()=>s,{env:{NODE_ENV:'development'}});window.recorder=r;},codes);}
 await install(pair.p);
 await pair.p.evaluate(async()=>{for(let i=0;i<25;i++)await window.recorder.record('screen',i%2?'feed':'post');});
 const first=await events(pair.p);assert.equal(first.length,20);assert.equal(first[0].value,'feed');
 assert.equal(await pair.p.evaluate(()=>{try{window.recorder.record('screen','canary-handle');return false;}catch{return true;}}),true);
 await pair.c.close();pair=await context(dir,'en',true);await pair.c.route(app+'/ring-fixture',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await pair.p.goto(app+'/ring-fixture');await install(pair.p);assert.deepEqual(await events(pair.p),first);await clear(pair.c,pair.p);pair=null;result.ring={last20:true,oldestDropped:true,invalidRejected:true,reopenEqual:true};
 }
 for(const locale of [process.env.ONLY_LOCALE]){
  const messages=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')),t=messages.support,nav=messages.navigation;
  const dir=root+'/contexts/'+engine+'-'+locale;await fs.rm(dir,{recursive:true,force:true});pair=await context(dir,locale);let count=0,payload=null;pair.p.on('request',r=>{if(r.url()===app+'/api/freeze-report'){count++;payload=r.postDataJSON();}});
  await pair.p.goto(app+'/posts/'+fixture.post,{waitUntil:'domcontentloaded'});await pair.p.locator('body').waitFor();
  await pair.p.goto(app+'/',{waitUntil:'domcontentloaded'});await pair.p.getByRole('button',{name:nav.postMeal,exact:true}).tap();await pair.p.getByRole('button',{name:nav.camera,exact:true}).tap();await pair.p.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
  await pair.p.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
  // The persisted pre-close events must remain after the whole browser context is killed.
  await pair.p.goto(app+'/profile',{waitUntil:'domcontentloaded'});await pair.p.getByRole('button',{name:t.row,exact:true}).waitFor();let before=await events(pair.p);assert.ok(before.some(e=>e.name==='sheet'&&e.value==='capture-open'));assert.ok(before.some(e=>e.name==='camera'&&e.value==='ready'));assert.equal(count,0);
  await pair.c.close();pair=await context(dir,locale);pair.p.on('request',r=>{if(r.url()===app+'/api/freeze-report'){count++;payload=r.postDataJSON();}});await pair.p.goto(app+'/profile',{waitUntil:'domcontentloaded'});await pair.p.getByRole('button',{name:t.row,exact:true}).waitFor();assert.ok((await events(pair.p)).some(e=>e.t===before[0].t&&e.name===before[0].name));assert.equal(count,0);
  const placement=await pair.p.locator('[data-freeze-report-section]').evaluate(el=>({previous:el.previousElementSibling?.textContent,text:el.textContent}));assert.ok(placement.previous.includes(messages.language.label));
  await pair.p.getByRole('button',{name:t.row,exact:true}).tap();await pair.p.locator('[data-report-preview]').waitFor();await pair.p.getByRole('button',{name:t.cancel,exact:true}).last().tap();assert.equal(count,0);
  // Compare the immutable preview's times and details to the one real POST.
  await pair.p.getByRole('button',{name:t.row,exact:true}).tap();await pair.p.locator('[data-report-preview]').waitFor();
  const preview=await pair.p.locator('[data-report-preview]').evaluate(el=>({times:[...el.querySelectorAll('[data-event-time]')].map(e=>Number(e.dataset.eventTime)),details:[...el.querySelectorAll('dd')].map(e=>e.textContent)}));
  await pair.p.screenshot({path:root+'/'+engine+'-'+locale+'-preview.png'});
  const response=pair.p.waitForResponse(app+'/api/freeze-report');await pair.p.getByRole('button',{name:t.send,exact:true}).tap();const sent=await response;assert.equal(sent.status(),200);await pair.p.getByText(t.sent,{exact:true}).waitFor();assert.equal(count,1);
  assert.deepEqual(payload.events.map(e=>e.t),preview.times);assert.equal(payload.user_agent,preview.details[0]);assert.equal(payload.build,preview.details[1]);assert.doesNotMatch(JSON.stringify(payload),new RegExp(fixture.user+'|'+fixture.post+'|'+fixture.handle+'|porridge-canary-6142|/p/|blob:|data:'));
  const {data:rows,error}=await admin.from('freeze_reports').select('*').eq('user_id',fixture.user);if(error)throw error;assert.equal(rows.length,1);assert.deepEqual(rows[0].events,payload.events);
  await pair.p.getByRole('button',{name:t.cancel,exact:true}).last().tap();await pair.p.getByRole('button',{name:t.row,exact:true}).tap();await pair.p.locator('[data-report-preview]').waitFor();await pair.p.getByRole('button',{name:t.send,exact:true}).tap();await pair.p.getByText(t.rateLimited,{exact:true}).waitFor();assert.equal(count,2);
  await pair.p.getByRole('button',{name:t.cancel,exact:true}).last().tap();
  if(engine==='chromium'){
  // A failed explicit send must not trigger a timer or background resend.
  await pair.c.route(app+'/api/freeze-report',r=>r.fulfill({status:500,contentType:'application/json',body:'{}'}));await pair.p.getByRole('button',{name:t.row,exact:true}).tap();await pair.p.locator('[data-report-preview]').waitFor();await pair.p.getByRole('button',{name:t.send,exact:true}).tap();await pair.p.getByText(t.failed,{exact:true}).waitFor();assert.equal(count,3);await pair.p.screenshot({path:root+'/'+engine+'-'+locale+'-failed.png'});await pair.p.getByRole('button',{name:t.cancel,exact:true}).last().tap();assert.equal(count,3);
  }
  const denied=await pair.p.goto(app+'/admin/freeze-reports');assert.equal(denied.status(),404);
  await clear(pair.c,pair.p);pair=null;
  // The host runner deletes the owned reports between locales (WebKit container has no psql).
  result.cases.push({locale,noAutomaticRequests:0,singleSend:1,previewExact:true,canaryAbsent:true,ringSurvivedContextKill:true,rate429:true,failure500:engine==='chromium',noAutomaticRetry:true,normalUser404:true});
 }
}catch(error){result.error=String(error.stack??error);if(pair)await pair.p.screenshot({path:root+'/'+engine+'-error.png'}).catch(()=>{});process.exitCode=1;}finally{if(pair)await pair.c.close();await fs.writeFile(root+'/'+engine+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
