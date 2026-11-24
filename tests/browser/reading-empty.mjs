// Synthetic account with its fixture meals soft-deleted before this run.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';
const app=process.env.APP_URL,base=process.env.I18N_BASE_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||![app,base].every(value=>new URL(value).hostname==='127.0.0.1')||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json')),messages=Object.fromEntries(await Promise.all(['en','ja'].map(async locale=>[locale,JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url)))])));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),receipt={engine,cases:[],errors:[]};let baseline;
try{
 for(const [build,locale,url]of(engine==='chromium'?[['base','en',base],['head','en',app],['head','ja',app]]:[['head','en',app],['head','ja',app]])){
  receipt.current={build,locale};const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',...(locale==='en'?{serviceWorkers:'block'}:{})});
  const transport=locale==='en'?await readingRealtime(context):null;
  await context.addCookies([...cookies.map(cookie=>({name:cookie.name,value:cookie.value,url})),{name:'lang',value:locale,url},{name:'time-zone',value:'UTC',url}]);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);page.on('pageerror',error=>receipt.errors.push(error.message));
  try{
   await page.goto(url+'/',{waitUntil:'load'});await page.getByText(messages[locale].feed.firstMeal,{exact:true}).waitFor();await page.locator('[data-feed-client-ready]').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   await page.locator('[data-pill] a[href="/profile"] .text-avatar-sm').waitFor();
   assert.equal(await page.locator('article[data-post-id]').count(),0);
   const snapshot=await page.evaluate(()=>({text:document.body.innerText,aria:[...document.querySelectorAll('[aria-label]')].filter(node=>node.getClientRects().length).map(node=>node.getAttribute('aria-label'))}));
   if(build==='base')baseline=snapshot;else if(locale==='en'&&engine==='chromium')assert.deepEqual(snapshot,baseline);
   if(locale==='ja'){const latin=await page.evaluate(()=>{const texts=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode,parent=node.parentElement;if(!parent||!parent.getClientRects().length||parent.closest('script,style,.text-avatar,.text-avatar-sm,[data-i18n-stored],[data-i18n-server-wording]'))continue;texts.push(node.textContent);}return texts.join('\n').replaceAll('My Food AI','');});assert.ok(!/[A-Za-z]/.test(latin),latin);}
   receipt.cases.push({build,locale,snapshot,transport});await page.screenshot({path:out+'/'+engine+'-'+build+'-'+locale+'-empty.png',fullPage:true});
  }finally{await context.close();}
 }
 assert.deepEqual(receipt.errors,[]);receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=String(error);process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/'+engine+'-empty.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({engine,pass:receipt.pass,cases:receipt.cases.length,failure:receipt.failure}));}
