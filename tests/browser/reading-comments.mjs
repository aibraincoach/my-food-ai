import fs from'node:fs/promises';import assert from'node:assert/strict';import{sendCommentAboveNavigation}from'./comment-clearance.mjs';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json')),fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json')),{chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const runTag=Date.now();
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),receipt={engine,cases:[],errors:[]};
try{
 for(const locale of(process.env.ONLY_LOCALE?[process.env.ONLY_LOCALE]:['en','ja'])){
  const messages=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url))),context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC'});
  await context.addCookies([...cookies.map(cookie=>({name:cookie.name,value:cookie.value,url:app})),{name:'lang',value:locale,url:app}]);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);page.on('pageerror',error=>receipt.errors.push(error.message));
  try{await page.goto(app+'/posts/'+fixture.post,{waitUntil:'load'});await page.locator('[data-post-detail-ready]').waitFor({state:'attached'});const result=await sendCommentAboveNavigation(page,{postId:fixture.post,body:locale==='en'?'Local reading comment '+runTag:'検証用の読み取りコメント '+runTag,doubleTap:locale==='ja',words:messages.thread});receipt.cases.push({locale,...result,hitTest:await page.evaluate(()=>window.__commentHitTest??null)});await page.screenshot({path:out+'/'+engine+'-'+locale+'-comment.png'});}catch(error){receipt.hitTest=await page.evaluate(()=>window.__commentHitTest??null);await fs.writeFile(out+'/'+engine+'-comment-failure.html',await page.content(),{mode:0o600});await page.screenshot({path:out+'/'+engine+'-comment-failure.png',fullPage:true});throw error;}finally{await context.close();}
 }
 assert.deepEqual(receipt.errors,[]);receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=String(error);process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/'+engine+'-comments'+(process.env.READING_OBSERVATION==='1'?'-observe':process.env.READING_GUARDED==='1'?'-guarded':'')+'.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({engine,pass:receipt.pass,cases:receipt.cases.length,failure:receipt.failure}));}
