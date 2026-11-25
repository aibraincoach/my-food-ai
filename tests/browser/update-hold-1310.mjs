// Manual, bounded local measurement. Does not run in the default test suite.
// Reuses #1286's byte-switching proxy approach; all app/worker bytes are real.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {randomUUID} from 'node:crypto';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';

const out=process.env.UPDATE_HOLD_OUT,engine=process.env.ONLY_ENGINE;
const origins=[process.env.UPDATE_BUILD_A,process.env.UPDATE_BUILD_B,process.env.APP_URL].map(value=>new URL(value));
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||!['chromium','webkit'].includes(engine)||origins.some(url=>url.hostname!=='127.0.0.1'||url.protocol!=='http:'))throw Error('Disposable loopback builds only');
const [a,b,front]=origins,fixture=JSON.parse(await fs.readFile(out+'/fixture/fixture-ledger.json')),cookies=JSON.parse(await fs.readFile(out+'/fixture/session.json'));
if(!/^text1287-[a-f0-9]+@example.com$/.test(fixture.email)||!/^[a-f0-9-]{36}$/.test(fixture.post))throw Error('Owned fixture required');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const kind=engine==='webkit'?webkit:chromium;
let upstream=a,activeCase=null;const requests=[];
const proxy=http.createServer((request,response)=>{
 const url=new URL(request.url,front);
 // Version affinity isolates worker discovery from unrelated RSC build skew.
 // A full document uses the deployed build; its flight/action/asset requests
 // keep that build. Worker script checks always see the deployed bytes.
 const affinity=/__1310_build=(A|B)(?:;|$)/.exec(request.headers.cookie??'')?.[1];
 const workerScript=['/sw.js','/build.js'].includes(url.pathname);
 const documentRequest=request.headers['sec-fetch-mode']==='navigate';
 const target=workerScript||documentRequest?upstream:affinity==='A'?a:affinity==='B'?b:upstream;
 // No request body, query, cookie, authorization header or field value is logged.
 if(['/sw.js','/build.js','/manifest.webmanifest'].includes(url.pathname))requests.push({case:activeCase,t:Date.now(),path:url.pathname,build:target===a?'A':'B',destination:request.headers['sec-fetch-dest']??null,mode:request.headers['sec-fetch-mode']??null});
 const headers={...request.headers,host:front.host};delete headers['accept-encoding'];
 const forwarded=http.request({hostname:target.hostname,port:target.port,path:request.url,method:request.method,headers},res=>{
  if(['/build.js','/manifest.webmanifest'].includes(url.pathname))row?.events.push({kind:'public-response',t:Date.now(),path:url.pathname,upstream:target===a?'A':'B',status:res.statusCode,vary:res.headers.vary??null});
  const outgoing={...res.headers};if(documentRequest&&String(res.headers['content-type']).includes('text/html'))outgoing['set-cookie']=[...(Array.isArray(outgoing['set-cookie'])?outgoing['set-cookie']:outgoing['set-cookie']?[outgoing['set-cookie']]:[]),'__1310_build='+(target===a?'A':'B')+'; Path=/; HttpOnly; SameSite=Lax'];if(outgoing.location)outgoing.location=outgoing.location.replace(target.origin,front.origin);
  response.writeHead(res.statusCode,outgoing);res.pipe(response);
 });
 forwarded.on('error',()=>{response.writeHead(502);response.end('Local upstream unavailable');});request.pipe(forwarded);
});
await new Promise((resolve,reject)=>{proxy.once('error',reject);proxy.listen(Number(front.port),front.hostname,resolve);});
const runId=randomUUID(),rows=[],profileRoot=path.join('/tmp','mfa-1310-profiles-'+runId);await fs.mkdir(profileRoot,{recursive:true});
const launch=dir=>kind.launchPersistentContext(dir,{...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',locale:'en-US',...(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{})});
let context,page,row,deadline;
const label=process.env.UPDATE_RUN_LABEL??'';if(!/^[a-zA-Z0-9-]*$/.test(label))throw Error('Invalid receipt label');
const remaining=()=>Math.max(1,deadline-Date.now());
async function instrument(c){
 await readingRealtime(c);
 await c.exposeBinding('__measure1310',(_,event)=>{row.events.push(event);});
 await c.addInitScript(()=>{
  window.__measure1310({kind:'boot',t:Date.now()});
  document.addEventListener('DOMContentLoaded',()=>window.__measure1310({kind:'document-build',t:Date.now(),build:document.documentElement.dataset.build??null,navigationType:performance.getEntriesByType('navigation')[0]?.type}));
  navigator.serviceWorker?.addEventListener('message',event=>{
   if(event.data?.type==='app-update-ready')window.__measure1310({kind:event.source===navigator.serviceWorker.controller?'worker-ready':'worker-ready-source-mismatch',t:Date.now(),build:event.data.build});
  });
 });
}
async function diagnostics(){
 const events=await page.evaluate(async()=>{
  if(!await new Promise(resolve=>{const request=indexedDB.databases?.();if(!request)return resolve(true);request.then(values=>resolve(values.some(v=>v.name==='mfa-diagnostics'))).catch(()=>resolve(false));}))return [];
  return new Promise((resolve,reject)=>{
   const opened=indexedDB.open('mfa-diagnostics',1);opened.onerror=()=>reject(Error('Diagnostic open failed'));
   opened.onsuccess=()=>{const db=opened.result;if(!db.objectStoreNames.contains('events')){db.close();resolve([]);return;}const tx=db.transaction('events','readonly'),store=tx.objectStore('events'),keys=store.getAllKeys(),values=store.getAll();tx.oncomplete=()=>{db.close();resolve(values.result.map((event,index)=>({id:keys.result[index],...event})));};tx.onerror=()=>{db.close();reject(Error('Diagnostic read failed'));};};
  });
 });
 for(const event of events.filter(e=>e.name==='update'))if(!row.diagnostics.some(old=>old.id===event.id&&old.t===event.t))row.diagnostics.push(event);
}
async function snapshot(name){
 await diagnostics();
 const state=await page.evaluate(()=>({documentBuild:document.documentElement.dataset.build??null,controlled:!!navigator.serviceWorker.controller,fields:[...document.querySelectorAll('textarea,input,[contenteditable]')].filter(field=>!field.disabled&&!field.readOnly&&(field.tagName!=='INPUT'||['text','email','password','search','url','tel','number'].includes(field.type))).map(field=>({type:field.tagName==='INPUT'?field.type:field.tagName.toLowerCase(),nonempty:!!(field.value??field.textContent??'').trim(),visible:!!field.getClientRects().length})),dialog:!!document.querySelector('[role="dialog"]'),sheet:document.documentElement.hasAttribute('data-mfa-sheet-open')}));
 row.steps.push({name,t:Date.now(),...state});return state;
}
async function until(predicate){
 while(Date.now()<deadline){await diagnostics();if(predicate())return;await page.waitForTimeout(50);}throw Error('Case bound reached');
}
async function goto(route){await page.goto(front.origin+route,{waitUntil:'load',timeout:Math.min(30000,remaining())});}
async function hydrated(selector){await page.waitForFunction(sel=>{const element=document.querySelector(sel);return element&&Object.keys(element).some(key=>key.startsWith('__reactFiber'));},selector,{timeout:Math.min(15000,remaining())});}
async function controlled(){await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:Math.min(20000,remaining())});}
async function nav(route){
 const before=row.events.filter(e=>e.kind==='boot').length;
 const link=page.locator('a[href="'+route+'"]:visible').first();await link.click({timeout:Math.min(10000,remaining())});await page.waitForURL(front.origin+route,{timeout:Math.min(10000,remaining())});
 await hydrated('main input,main button,a[href="/search"]');
 await snapshot('route');row.lastRouteFullDocument=row.events.filter(e=>e.kind==='boot').length>before;
}
async function visibility(){
 row.safeMoments.push({name:'simulated-hidden',t:Date.now()});
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));});
 await page.waitForTimeout(100);await snapshot('after-hidden');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'));});
}
async function activate(){
 row.action='install-real-update';
 upstream=b;row.changedAt=Date.now();
 await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();if(!registration)throw Error('App did not register a worker');
   const observe=worker=>{if(!worker)return;const report=()=>{window.__measure1310({kind:'worker-state',t:Date.now(),state:worker.state});if(worker.state==='activated')void caches.open('my-food-ai-shell-v4').then(cache=>cache.match('/manifest.webmanifest')).then(response=>window.__measure1310({kind:'activation-manifest',t:Date.now(),build:response?.headers.get('x-mfa-update-build')??null}));};report();worker.addEventListener('statechange',report);};
   registration.addEventListener('updatefound',()=>observe(registration.installing));
   navigator.serviceWorker.addEventListener('controllerchange',()=>window.__measure1310({kind:'controller-change',t:Date.now()}));
   await registration.update();observe(registration.installing);});
 await until(()=>row.events.some(e=>e.kind==='worker-ready'&&e.t>=row.changedAt));
 await until(()=>row.diagnostics.some(e=>e.value==='waiting'&&e.t>=row.changedAt));
 await snapshot('update-waiting');
}
async function cacheState(){return page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration(),names=await caches.keys(),result={active:registration?.active?.state??null,controller:navigator.serviceWorker.controller?.state??null,shellPresent:names.includes('my-food-ai-shell-v4'),manifest:[]};const cache=await caches.open('my-food-ai-shell-v4');for(const key of await cache.keys()){if(new URL(key.url).pathname!=='/manifest.webmanifest')continue;const normal=await cache.match('/manifest.webmanifest'),exact=await cache.match(key),ignoreVary=await cache.match('/manifest.webmanifest',{ignoreVary:true});result.manifest.push({path:new URL(key.url).pathname,normal:!!normal,exact:!!exact,ignoreVary:!!ignoreVary,normalBuild:normal?.headers.get('x-mfa-update-build')??null,exactBuild:exact?.headers.get('x-mfa-update-build')??null,ignoreVaryBuild:ignoreVary?.headers.get('x-mfa-update-build')??null,vary:ignoreVary?.headers.get('vary')??null,requestHeaders:[...key.headers.keys()]});}return result;});}
async function sheet(){
 row.action='open-saved-sheet';
 await page.locator('#post-menu-toggle:visible').first().tap();
 const saved=page.locator('#post-menu[aria-hidden="false"] button[data-entry="saved"]:visible').first();await saved.waitFor({state:'visible'});await saved.tap();
 await page.getByRole('dialog',{name:'Saved meals',exact:true}).waitFor();await snapshot('sheet-open');
 row.safeMoments.push({name:'sheet-close',t:Date.now()});await page.getByRole('button',{name:'Close saved meals',exact:true}).tap();await page.waitForTimeout(100);await snapshot('sheet-closed');
}
const released=()=>row.diagnostics.some(e=>e.value==='reloading')||row.events.some(e=>e.kind==='document-build'&&e.navigationType==='reload'&&e.t>=row.changedAt);
async function clearComments(){
 row.action='clear-visible-comment';
 const comments=page.locator('#comment-field');await comments.waitFor({state:'visible'});await comments.fill('');row.safeMoments.push({name:'clear-comment-then-hidden',t:Date.now()});await visibility();await until(released);
}
async function openComment(){await goto('/posts/'+fixture.post);await hydrated('#comment-field');await page.locator('#comment-field').fill('Synthetic unsent comment');await snapshot('comment-filled');}
async function authFields(password){await hydrated('input[name="email"]');await page.evaluate(({email,password})=>{document.querySelector('input[name="email"]').value=email;document.querySelector('input[name="password"]').value=password;},{email:fixture.email,password});await snapshot('simulated-autofill');}
async function captureCleanup(c){
 if(!c)return;
 for(const current of c.pages())try{await current.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('mfa-diagnostics');request.onsuccess=()=>resolve();request.onerror=()=>reject(Error('Diagnostic cleanup failed'));request.onblocked=()=>reject(Error('Diagnostic cleanup blocked'));}));row.diagnosticsCleared=true;}catch{row.diagnosticsCleared=false;}
 await c.close();
}
try{
 for(const name of (process.env.ONLY_CASE??'M0,M1,M2,M3,M4,M5,M6').split(',')){
  if(!/^M[0-6]$/.test(name)&&!['D2-WK','D2-AUTH'].includes(name))throw Error('Unknown case');
  activeCase=name;upstream=a;row={case:name,engine,startedAt:Date.now(),events:[],diagnostics:[],steps:[],safeMoments:[],visibility:'simulated event, not an OS background transition'};rows.push(row);deadline=Date.now()+120000;
  const dir=path.join(profileRoot,name);
  try{
   context=await launch(dir);await instrument(context);if(!['M3','M4','D2-WK','D2-AUTH'].includes(name))await context.addCookies(cookies.map(cookie=>({name:cookie.name,value:cookie.value,url:front.origin,expires:Math.floor(Date.now()/1000)+3600})));
   await context.addCookies([{name:'lang',value:'en',url:front.origin}]);page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',()=>{row.pageErrors=(row.pageErrors??0)+1;});
   const bounded=async()=>{
    if(name==='D2-WK'){
     await goto('/sign-in');await authFields(fixture.password);await controlled();await snapshot('initial-controlled');
     row.cacheBefore=await cacheState();row.action='cause-only-real-update';upstream=b;row.changedAt=Date.now();
     await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();if(!r?.active)throw Error('Active worker required');window.__measure1310({kind:'pre-update-active',t:Date.now(),state:r.active.state});
      const watch=w=>{if(!w)return;const emit=()=>window.__measure1310({kind:'worker-state',t:Date.now(),state:w.state});emit();w.addEventListener('statechange',emit);};r.addEventListener('updatefound',()=>watch(r.installing));navigator.serviceWorker.addEventListener('controllerchange',()=>window.__measure1310({kind:'controller-change',t:Date.now()}));await r.update();watch(r.installing);});
     await until(()=>row.events.some(e=>e.kind==='worker-state'&&e.state==='activated'&&e.t>=row.changedAt));
     await page.waitForTimeout(250);row.cacheAfter=await cacheState();await snapshot('after-activation');
     row.workerReadyCount=row.events.filter(e=>e.kind==='worker-ready'&&e.t>=row.changedAt).length;
    }else if(name==='D2-AUTH'){
     await goto('/sign-in');await authFields(fixture.password);await controlled();await activate();await visibility();
     row.pendingBeforeSuccess=!released()&&row.diagnostics.some(e=>e.value==='waiting');if(!row.pendingBeforeSuccess)throw Error('Pending update required before success');
     row.safeMoments.push({name:'successful-sign-in',t:Date.now()});await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(front.origin+'/');await snapshot('after-successful-sign-in');await visibility();row.releasedAfterSuccess=released();
    }else if(name==='M0'){
     await goto('/');await hydrated('a[href="/search"]');await controlled();await snapshot('initial');const initialBoots=row.events.filter(e=>e.kind==='boot').length;upstream=b;row.changedAt=Date.now();
     for(let i=0;i<20;i++){row.safeMoments.push({name:'route',t:Date.now()});await nav(i%2?'/':'/search');}
     await visibility();row.openApp={documentBoots:row.events.filter(e=>e.kind==='boot').length-initialBoots,workerReady:row.events.filter(e=>e.kind==='worker-ready'&&e.t>=row.changedAt).length,workerRequests:requests.filter(e=>e.case===name&&e.t>=row.changedAt)};
     row.safeMoments.push({name:'explicit-full-load',t:Date.now()});await page.reload({waitUntil:'load'});await controlled();await page.waitForTimeout(250);await snapshot('full-load');row.afterFullLoadRequests=requests.filter(e=>e.case===name&&e.t>=row.changedAt);
    }else if(['M1','M2','M6'].includes(name)){
     await openComment();await controlled();await activate();
     if(name==='M1'){
      await visibility();row.safeMoments.push({name:'route-away',t:Date.now()});await nav('/');await page.goBack({waitUntil:'load'});await hydrated('#comment-field');await sheet();await clearComments();
     }else if(name==='M2'){
      row.safeMoments.push({name:'route-away',t:Date.now()});await nav('/');row.retainedAfter=[];
      for(let i=0;i<20;i++){await nav(i%2?'/':'/search');const state=await snapshot('retained-check');row.retainedAfter.push({transition:i+1,commentPresent:await page.locator('#comment-field').count()>0,hiddenNonempty:state.fields.some(f=>!f.visible&&f.nonempty),t:Date.now()});if(released())break;}
      if(!released()){for(let back=0;back<21&&!await page.locator('#comment-field:visible').count();back++){await page.goBack({waitUntil:'load'});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}if(await page.locator('#comment-field:visible').count())await clearComments();else {row.clearNotReached=true;throw Error('Comment restoration step not reached');}}
     }else{
      await visibility();await snapshot('before-restart');await context.close();context=await launch(dir);await instrument(context);page=await context.newPage();await goto('/');await controlled();await snapshot('restarted');row.restartAtHome=page.url()===front.origin+'/';row.restartNavigationType=await page.evaluate(()=>performance.getEntriesByType('navigation')[0]?.type);row.restartWorkerManifest=await page.evaluate(async()=>{const response=await(await caches.open('my-food-ai-shell-v4')).match('/manifest.webmanifest');return response?.headers.get('x-mfa-update-build')??null;});
     }
    }else if(name==='M3'){
     await goto('/sign-in');await authFields('Invalid-synthetic-password');await controlled();await activate();await visibility();row.safeMoments.push({name:'failed-sign-in',t:Date.now()});await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(url=>url.pathname==='/sign-in'&&url.searchParams.has('error'));await hydrated('input[name="email"]');await snapshot('after-failed-sign-in');await visibility();row.pendingAlreadyReleasedBeforeSuccess=released();await authFields(fixture.password);row.safeMoments.push({name:'successful-sign-in',t:Date.now()});await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(front.origin+'/');await snapshot('after-successful-sign-in');await visibility();
    }else if(name==='M4'){
     await goto('/sign-up');await hydrated('input[name="handle"]');const email=fixture.email.replace('@','-'+engine+'-en@');await fs.appendFile(out+'/fixture/signup-emails.jsonl',JSON.stringify({email})+'\n');
     await page.locator('input[name="email"]').fill(email);await page.locator('input[name="handle"]').fill(fixture.handle);await page.locator('input[name="password"]').fill(fixture.password);await controlled();await activate();await visibility();row.safeMoments.push({name:'taken-handle-submit',t:Date.now()});await page.locator('form button[type="submit"]').click();await page.waitForURL(url=>url.pathname==='/choose-handle');await hydrated('input[name="handle"]');await snapshot('after-taken-handle');await visibility();await page.locator('input[name="handle"]').fill('');row.safeMoments.push({name:'clear-handle-then-hidden',t:Date.now()});await visibility();
    }else if(name==='M5'){
     await goto('/search');await hydrated('input');await page.getByRole('textbox',{name:'Search meals',exact:true}).fill('Synthetic query');await controlled();await activate();await visibility();row.safeMoments.push({name:'leave-search',t:Date.now()});await nav('/');await snapshot('search-retained');await page.goBack({waitUntil:'load'});await hydrated('input');await page.getByRole('textbox',{name:'Search meals',exact:true}).fill('');row.safeMoments.push({name:'clear-search-then-hidden',t:Date.now()});await visibility();
    }
   };
   let timeout;try{await Promise.race([bounded(),new Promise((_,reject)=>{timeout=setTimeout(()=>{row.boundReachedAt=Date.now();void context?.close();reject(Error('Case bound reached'));},remaining());})]);}finally{clearTimeout(timeout);}
   await diagnostics();row.completed=true;
  }catch(error){row.completed=false;row.failure=error.message==='Case bound reached'?'case-bound':error.name;row.failureStage=row.action??row.steps.at(-1)?.name??'setup';row.failureCategory=/strict mode violation/.test(error.message)?'ambiguous-selector':/Execution context was destroyed|navigation/.test(error.message)?'navigation-interrupted-instrument':/register/.test(error.message)?'worker-registration':/Case bound/.test(error.message)?'case-bound':'other-instrument-or-action-error';process.exitCode=1;}
  finally{
   if(!row.boundReachedAt&&page&&!page.isClosed())try{await snapshot('final');}catch{row.finalSnapshotUnavailable=true;}
   await captureCleanup(context);context=null;
   row.endedAt=Date.now();const waiting=row.diagnostics.find(e=>e.value==='waiting'),reload=row.diagnostics.find(e=>e.value==='reloading'),reloadDocument=row.events.find(e=>e.kind==='document-build'&&e.navigationType==='reload'&&e.t>=row.changedAt);row.reloadDocument=reloadDocument??null;row.reloadingDiagnosticMissing=!!reloadDocument&&!reload;row.heldMs=waiting&&reload?reload.t-waiting.t:null;row.observedMs=waiting?row.endedAt-waiting.t:null;const releaseAt=reload?.t??reloadDocument?.t;row.release=releaseAt?[...row.safeMoments].reverse().find(e=>e.t<=releaseAt)?.name??'other-safe-point':'not released within case';
   await fs.writeFile(out+'/'+engine+(label?'-'+label:'')+'.json',JSON.stringify({engine,runId,caseBoundMs:120000,productSourceChanges:false,syntheticUpdateMessages:false,rows,workerRequests:requests},null,2));console.log(JSON.stringify({engine,case:name,completed:row.completed,heldMs:row.heldMs,release:row.release,failure:row.failure}));
  }
  if(!row.completed)break; // Preserve untouched cases after an instrument failure.
 }
}finally{if(context)await captureCleanup(context);proxy.closeAllConnections();await new Promise(resolve=>proxy.close(resolve));await fs.rm(profileRoot,{recursive:true,force:true});}
