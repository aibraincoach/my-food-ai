import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium,webkit}=await import('/tmp/mfa-f62-browser/node_modules/playwright-core/index.mjs');
const engine=process.env.ONLY_ENGINE,app=process.env.APP_URL,out=process.env.TEA_CHECK_OUT;
assert.equal(process.env.MFA_TEST_DISPOSABLE,'1');assert.equal(new URL(app).hostname,'127.0.0.1');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='webkit'?{executablePath:process.env.TEST_WEBKIT_EXECUTABLE}:{executablePath:'/home/opc/.cache/ms-playwright/chromium-1248/chrome-linux-arm64/chrome',args:['--no-sandbox']});
const cookies=JSON.parse(await fs.readFile(process.env.TEST_SESSION_FILE,'utf8')),cases=[],errors=[];
try{for(const locale of ['en','ja']){
 const words=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')).postMenu;
 const context=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844},timezoneId:'UTC'});
 try{
 await context.addCookies([...cookies.map(c=>({...c,url:app})),{name:'lang',value:locale,url:app}]);
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 const requests=[];let resolvePosted;const postedRequest=new Promise(resolve=>{resolvePosted=resolve;});
 await page.route('**/api/intake/post**',async route=>{if(route.request().method()==='POST'){requests.push(route.request().postDataJSON());resolvePosted();await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({post_id:'11111111-1111-4111-8111-111111111111'})});}else await route.continue();});
 await page.goto(app);await page.waitForLoadState('networkidle');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('open-entry',{detail:{entry:'drink'}})));
 const tea=page.getByRole('button',{name:new RegExp(words.drinkTea)}).filter({hasText:words.drinkTea}).first();await tea.click();
 const group=page.getByRole('group',{name:words.chooseTea,exact:true});await group.waitFor();assert.equal(requests.length,0,'Parent tea tap must never publish');
 for(const [key]of [['teaBlack','tea-black'],['teaGreen','tea-green'],['teaOolong','tea-oolong']]){
 await group.getByRole('button',{name:words[key],exact:true}).click();assert.equal(await group.getByRole('button',{name:words[key],exact:true}).getAttribute('aria-pressed'),'true');
 }
 await group.getByRole('button',{name:words.teaBlack,exact:true}).click();
 const clipped=await group.evaluate(el=>el.scrollWidth>el.clientWidth+1);assert.equal(clipped,false);
 await page.screenshot({path:out+'/'+engine+'-'+locale+'.png',fullPage:true});
 await page.getByRole('button',{name:new RegExp(words.sizeMug+' · 300 ml')}).click();
 await Promise.race([postedRequest,new Promise((_,reject)=>setTimeout(()=>reject(Error('No drink POST within10s')),10000))]).catch(async error=>{await page.screenshot({path:out+'/'+engine+'-'+locale+'-failure.png',fullPage:true});console.error(JSON.stringify({pageErrors:errors,requests:requests.length,text:await page.locator('body').innerText()}));throw error;});
 assert.ok(requests.length>0);assert.equal(requests[0].tile,3);assert.equal(requests[0].tea_id,'tea-black');assert.equal(requests[0].ml,300);
 await page.getByRole('status').filter({hasText:'Black tea, mug'}).first().waitFor();
 cases.push({parentPublished:false,receiptNamesBlack:true,locale,choices:3,posted:requests[0].tea_id,clipped:false});
 }finally{await context.close();}
 }}finally{await browser.close();}
assert.deepEqual(errors,[]);await fs.writeFile(out+'/'+engine+'.json',JSON.stringify({cases,errors,scope:'390x844 emulation; service workers blocked for deterministic POST interception after the actual upload manager; no meal published'},null,2));
