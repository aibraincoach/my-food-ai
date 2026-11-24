import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const app=process.env.APP_URL,out=process.env.I18N_CHECK_OUT;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out)throw Error('Disposable local only');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
for(const [name,engine]of[['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.ONLY_ENGINE||name===process.env.ONLY_ENGINE)){
 const b=await engine.launch(name==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),result={engine:name,cases:[]};
 try{
 for(const locale of['en','ja']){
  const c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'ja-JP'});await c.addCookies([{name:'lang',value:locale,url:app}]);const p=await c.newPage();p.setDefaultTimeout(10000);
  const first=await p.goto(app+'/welcome',{waitUntil:'load'});assert.match(await first.text(),new RegExp('<html[^>]*lang="'+locale+'"'));await p.locator('h1').waitFor();
  await p.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
  await p.waitForFunction(async locale=>{const v=await(await caches.open('mfa-media-control-v1')).match(location.origin+'/__mfa_locale__');return v&&await v.text()===locale;},locale);
  result.cases.push({locale,firstResponse:true});await c.setOffline(true);
  for(const route of['/welcome','/']){const r=await p.goto(app+route,{waitUntil:'load',timeout:10000});assert.equal(r.fromServiceWorker(),true);assert.equal(await p.locator('html').getAttribute('lang'),locale);await p.screenshot({path:out+'/'+name+'-'+locale+'-offline'+(route==='/'?'root':'welcome')+'.png'});result.cases.push({locale,route,offline:true,lang:locale});}
  await p.evaluate(async locale=>{const cache=await caches.open('my-food-ai-shell-v4');for(const route of['/','/welcome','/shell'])await cache.delete(route+'?lang='+locale);},locale);
  let failed=false;try{await p.goto(app+'/welcome',{waitUntil:'load',timeout:10000});}catch{failed=true;}assert.equal(failed,true,'Missing locale must fail network, never use other language');result.cases.push({locale,missingUsesNetwork:true});await c.close();
 }
 result.pass=true;
 }catch(e){result.pass=false;result.failure=String(e);process.exitCode=1;}finally{await b.close();await fs.writeFile(out+'/'+name+'-offline.json',JSON.stringify(result,null,2));console.log(result);}
 if(!result.pass)break;
}
