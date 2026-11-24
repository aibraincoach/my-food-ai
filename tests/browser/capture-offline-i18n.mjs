import fs from'node:fs/promises';import assert from'node:assert/strict';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1')throw Error('Disposable loopback only');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright'),b=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{}),c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'ja-JP',...(engine==='chromium'?{permissions:['camera']}: {})}),r={engine,errors:[],console:[],failedRequests:[]};
const cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8'));await c.addCookies([...cookies.map(x=>({name:x.name,value:x.value,url:app})),{name:'lang',value:'ja',url:app}]);let navigationResponse;const pending=new Set();const p=await c.newPage();p.on('console',m=>r.console.push({type:m.type(),text:m.text()}));p.on('request',q=>pending.add(q));p.on('requestfinished',q=>pending.delete(q));p.on('requestfailed',q=>{pending.delete(q);r.failedRequests.push({url:q.url(),error:q.failure()?.errorText});});p.setDefaultTimeout(15000);p.on('pageerror',e=>r.errors.push(e.message));const m=JSON.parse(await fs.readFile(new URL('../../messages/ja.json',import.meta.url),'utf8'));
try{
 await p.goto(app+'/',{waitUntil:'load'});await p.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 await p.waitForFunction(async()=>!!await(await caches.open('my-food-ai-shell-v4')).match('/shell?lang=ja'));
 r.transition=await offlineState(p);r.pendingAtTransition=[...pending].map(q=>({url:q.url(),type:q.resourceType()}));
 await c.setOffline(true);const response=navigationResponse=await p.goto(app+'/',{waitUntil:'load'});assert.equal(response.fromServiceWorker(),true);assert.equal(await p.locator('html').getAttribute('lang'),'ja');
 await p.locator('#post-menu-toggle:visible').tap();
 // Same settled/hittable menu guard used by capture-retry and food-flows.
 await p.waitForFunction(()=>{const b=document.querySelector('#post-menu button[data-entry="camera"]');if(!b)return false;const rect=b.getBoundingClientRect(),label=b.querySelector('span');return getComputedStyle(b).opacity==='1'&&(!label||getComputedStyle(label).opacity==='1')&&document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('button')===b;});
 await p.locator('#post-menu button[data-entry="camera"]').tap();await p.getByRole('button',{name:m.capture.back_to_feed,exact:true}).waitFor();
 const dialog=p.locator('[role="dialog"][aria-labelledby="capture-title"]');await p.getByRole('tab',{name:m.capture.modeBarcode,exact:true}).waitFor();r.text=await dialog.innerText();r.lang=await p.locator('html').getAttribute('lang');assert.ok(r.text.includes(m.capture.modePhoto));r.localeErrors=r.errors.filter(v=>/MISSING_MESSAGE|IntlError|No messages|missing.message/i.test(v));assert.equal(r.localeErrors.length,0);r.pass=true;await p.screenshot({path:out+'/'+engine+'-offline-ja-capture.png'});
}catch(e){
 r.pass=false;r.failure=String(e);process.exitCode=1;
 r.navigation=navigationResponse?{url:navigationResponse.url(),worker:navigationResponse.fromServiceWorker(),status:navigationResponse.status()}:null;
 r.failureState=await offlineState(p).catch(error=>({captureError:String(error)}));r.pendingAtFailure=[...pending].map(q=>({url:q.url(),type:q.resourceType()}));
 await fs.writeFile(out+'/'+engine+'-offline-failure.html',(await p.content().catch(error=>String(error))).slice(0,200000));
 await p.screenshot({path:out+'/'+engine+'-offline-failure.png',fullPage:true,timeout:5000}).catch(error=>{r.screenshotError=String(error);});
}finally{await c.close();await b.close();await fs.writeFile(out+'/'+engine+'-offline-capture.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}


// Inspect cache entries only: never fetch a missing asset to warm the fixture.
async function offlineState(page){
 return page.evaluate(async()=>{
  const toggle=document.querySelector('#post-menu-toggle'),style=toggle?getComputedStyle(toggle):null,names=(await caches.keys()).filter(name=>name.startsWith('my-food-ai-')),entries=[];
  for(const name of names)entries.push({name,keys:(await(await caches.open(name)).keys()).map(request=>request.url)});
  const response=await(await caches.open('my-food-ai-shell-v4')).match('/shell?lang=ja'),html=response?await response.text():null,doc=html?new DOMParser().parseFromString(html,'text/html'):null,assets=[];
  for(const node of doc?.querySelectorAll('script[src],link[rel="stylesheet"][href]')??[]){
   const url=new URL(node.getAttribute('src')??node.getAttribute('href'),location.origin).href,hits=[];
   for(const name of names)if(await(await caches.open(name)).match(url))hits.push(name);
   assets.push({url,caches:hits});
  }
  return{url:location.href,lang:document.documentElement.lang,title:document.title,readyState:document.readyState,onLine:navigator.onLine,toggle:toggle?{display:style.display,visibility:style.visibility,opacity:style.opacity,rect:toggle.getBoundingClientRect().toJSON(),hydrated:Object.keys(toggle).some(key=>key.startsWith('__reactFiber')||key.startsWith('__reactProps'))}:null,worker:navigator.serviceWorker.controller?{url:navigator.serviceWorker.controller.scriptURL,state:navigator.serviceWorker.controller.state}:null,registrations:(await navigator.serviceWorker.getRegistrations()).map(registration=>({scope:registration.scope,active:registration.active?.state,waiting:registration.waiting?.state,installing:registration.installing?.state})),caches:entries,shell:{present:!!response,status:response?.status,title:doc?.title,hasToggle:!!doc?.querySelector('#post-menu-toggle'),assets}};
 });
}
