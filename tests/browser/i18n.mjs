// Local browser acceptance. Use a ledgered disposable account; never production.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=process.env.APP_URL,sessionFile=process.env.TEST_SESSION_FILE,out=process.env.I18N_CHECK_OUT;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!app||new URL(app).hostname!=='127.0.0.1'||!sessionFile||!out)throw Error('Disposable loopback app, session file and output directory required.');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const cookies=JSON.parse(await fs.readFile(sessionFile,'utf8'));
for(const [name,engine] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.ONLY_ENGINE||name===process.env.ONLY_ENGINE)) {
 const browser=await engine.launch(name==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
 const result={engine:name,errors:[],checks:[]};let context,page;
 try {
  context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',locale:'ja-JP'});
  await context.addCookies(cookies.map(c=>({name:c.name,value:c.value,url:app})));
  page=await context.newPage();page.setDefaultTimeout(10000);page.on('pageerror',error=>result.errors.push(error.message));
  const first=await page.goto(app+'/profile',{waitUntil:'load'});
  const html=await first.text();assert.match(html,/<html\b[^>]*\blang="ja"/);
  await page.locator('select[aria-label="言語"]:visible').waitFor();
  assert.equal(await page.locator('select[aria-label="言語"]:visible').inputValue(),'ja');
  assert.equal(await page.locator('html').getAttribute('lang'),'ja');
  result.checks.push('Japanese phone language and first response html');
  const oldSection=await page.locator('section').filter({hasText:"Use the phone's camera app"}).filter({visible:true}).evaluate(e=>e.outerHTML);
  const languageSection=page.locator('section').filter({has:page.locator('select:visible')});
  result.japaneseText=await languageSection.innerText();
  assert.equal(await languageSection.evaluate(e=>e.scrollWidth<=e.clientWidth),true);
  await page.screenshot({path:out+'/'+name+'-ja.png'});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const actionReply=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/profile');
  await page.locator('select[aria-label="言語"]:visible').selectOption('en');
  const saveResponse=await actionReply;
  result.saveDiagnostic={status:saveResponse.status(),cookieSaved:(await context.cookies()).some(c=>c.name==='lang'&&c.value==='en')};
  await page.locator('select[aria-label="Language"]:visible').waitFor();
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  const langCookie=(await context.cookies()).find(c=>c.name==='lang');
  assert.equal(langCookie.value,'en');assert.equal(langCookie.httpOnly,true);
  const newSection=await page.locator('section').filter({hasText:"Use the phone's camera app"}).filter({visible:true}).evaluate(e=>e.outerHTML);
  assert.equal(newSection,oldSection);
  result.checks.push('Explicit English choice overrides phone; cookie is device-only; existing camera row DOM unchanged');
  await page.screenshot({path:out+'/'+name+'-en.png'});
  const reloaded=await page.reload({waitUntil:'load'});assert.match(await reloaded.text(),/<html\b[^>]*\blang="en"/);assert.equal(await page.locator('html').getAttribute('lang'),'en');
  const independent=await browser.newContext({...devices['iPhone 13'],locale:'ja-JP'});
  await independent.addCookies(cookies.map(c=>({name:c.name,value:c.value,url:app})));
  const other=await independent.newPage();await other.goto(app+'/profile',{waitUntil:'load'});
  await other.locator('select[aria-label="言語"]:visible').waitFor();assert.equal(await other.locator('html').getAttribute('lang'),'ja');
  await independent.close();result.checks.push('Fresh device context has phone default for same account');
  await page.locator('select[aria-label="Language"]:visible').selectOption('ja');await page.locator('select[aria-label="言語"]:visible').waitFor();
  // A separate worker-blocked context makes the browser routing fault seam
  // observable in WebKit; its worker network otherwise bypasses page.route.
  const faultContext=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'ja-JP',serviceWorkers:'block'});
  await faultContext.addCookies(cookies.map(c=>({name:c.name,value:c.value,url:app})));
  const faultPage=await faultContext.newPage();await faultPage.goto(app+'/profile',{waitUntil:'load'});
  const faultSelect=faultPage.locator('select[aria-label="言語"]:visible');await faultSelect.waitFor();
  await faultPage.waitForFunction(()=>{const f=Array.from(document.querySelectorAll('select')).find(n=>n.getClientRects().length);return f&&Object.keys(f).some(k=>k.startsWith('__reactFiber'));});
  let posts=0;await faultPage.route('**/profile',route=>{if(route.request().method()==='POST'){posts++;return route.abort('failed');}return route.continue();});
  await faultSelect.selectOption('en');
  await faultPage.getByRole('alert').filter({hasText:'言語を保存できませんでした。もう一度お試しください。'}).waitFor();
  assert.equal(posts,1);
  assert.equal(await faultPage.locator('section').filter({has:faultPage.locator('select:visible')}).evaluate(e=>e.scrollWidth<=e.clientWidth),true);
  await faultPage.screenshot({path:out+'/'+name+'-error.png'});await faultContext.close();
  result.checks.push('Worker-blocked save fault: Japanese visible error, one attempt, error wraps at390px');
  // Anonymous shell override wins even with the other explicit locale cookie.
  for(const locale of ['en','ja']) {
   const response=await context.request.get(app+'/shell?lang='+locale);
   assert.equal(response.status(),200);assert.match(await response.text(),new RegExp('<html\\b[^>]*\\blang="'+locale+'"'));
  }
  await page.goto(app+'/',{waitUntil:'load'});
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const shells=await page.evaluate(async()=>{const c=await caches.open('my-food-ai-shell-v4'),saved=await(await caches.open('mfa-media-control-v1')).match(location.origin+'/__mfa_locale__');return {en:await(await c.match('/shell?lang=en')).text(),ja:await(await c.match('/shell?lang=ja')).text(),saved:saved?await saved.text():null};});
  assert.match(shells.en,/<html\b[^>]*\blang="en"/);assert.match(shells.ja,/<html\b[^>]*\blang="ja"/);assert.equal(shells.saved,'ja');
  await context.setOffline(true);
  const offline=await page.goto(app+'/',{waitUntil:'load',timeout:10000});
  assert.equal(offline.fromServiceWorker(),true);assert.equal(await page.locator('html').getAttribute('lang'),'ja');
  result.checks.push('Offline start serves matching Japanese shell');
  await page.evaluate(async()=>{await(await caches.open('my-food-ai-shell-v4')).delete('/shell?lang=ja');});
  let failed=false;try{await page.goto(app+'/',{waitUntil:'load',timeout:10000});}catch{failed=true;}
  assert.equal(failed,true,'Missing Japanese shell must use the failing network, never English');
  result.checks.push('Missing Japanese shell stays a failed network, never English');
  await context.setOffline(false);result.pass=true;
 } catch(error){result.pass=false;result.failure=String(error);process.exitCode=1;if(page&&!page.isClosed())await page.screenshot({path:out+'/'+name+'-failure.png'}).catch(()=>{});}
 finally{if(context)await context.close();await browser.close();await fs.writeFile(out+'/'+name+'.json',JSON.stringify(result,null,2));console.log(result);}
 if(!result.pass)break;
}
