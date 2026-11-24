// Local synthetic wording fault cases. Realtime is a transport fixture only.
import fs from 'node:fs/promises';import assert from 'node:assert/strict';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';
const app=process.env.APP_URL,base=process.env.I18N_BASE_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||![app,base].every(value=>new URL(value).hostname==='127.0.0.1')||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json')),fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json'));
const messages=Object.fromEntries(await Promise.all(['en','ja'].map(async locale=>[locale,JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url)))])));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),receipt={engine,cases:[],errors:[]},snapshots={};
try{
 for(const [build,locale,url]of(engine==='chromium'?[['base','en',base],['head','en',app],['head','ja',app]]:[['head','en',app],['head','ja',app]]))for(const fault of['reconnect','tabs-error']){
  receipt.current={build,locale,fault};const m=messages[locale],context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',serviceWorkers:'block'});
  await context.addCookies([...cookies.map(cookie=>({name:cookie.name,value:cookie.value,url})),{name:'lang',value:locale,url},{name:'time-zone',value:'UTC',url}]);
  const transport=await readingRealtime(context,{fail:fault==='reconnect'});
  if(fault==='tabs-error')await context.addInitScript(()=>{const Original=window.ResizeObserver;window.ResizeObserver=class extends Original{observe(target,options){if(target.closest('[data-home-feed] [data-post-id]'))throw new Error('synthetic-reading-boundary');return super.observe(target,options);}};});
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  try{
   await page.goto(url+'/',{waitUntil:'load'});
   const expected=m.feed[fault==='reconnect'?'updatesReconnectFailed':'pageLoadFailed'];await page.getByText(expected,{exact:true}).waitFor();
   const text=await page.getByText(expected,{exact:true}).innerText();
   if(fault==='tabs-error')await page.getByRole('button',{name:m.feed.tryAgain,exact:true}).waitFor();
   if(build==='head'&&locale==='en'&&engine==='chromium')assert.equal(text,snapshots['base-'+fault]);
   snapshots[build+'-'+fault]=text;
   assert.ok(locale!=='ja'||!/[A-Za-z]/.test(text));
   const unexpected=errors.filter(message=>fault!=='tabs-error'||message!=='synthetic-reading-boundary');assert.deepEqual(unexpected,[]);
   receipt.cases.push({build,locale,fault,text,transport,expectedErrors:errors});
   await page.screenshot({path:out+'/'+engine+'-'+build+'-'+locale+'-'+fault+'.png',fullPage:true});
  }catch(error){await fs.writeFile(out+'/'+engine+'-fault-failure.html',await page.content(),{mode:0o600});await page.screenshot({path:out+'/'+engine+'-fault-failure.png',fullPage:true});throw error;}finally{await context.close();}
 }
 receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=String(error);process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/'+engine+'-faults.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));}
