import fs from 'node:fs/promises';import assert from 'node:assert/strict';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);const app=process.env.APP_URL,engine=process.env.ONLY_ENGINE,root=process.env.FREEZE_CHECK_OUT;if(process.env.MFA_TEST_DISPOSABLE!=='1'||!root||![app,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>new URL(v).hostname==='127.0.0.1'))throw Error('Local only');
const cookies=JSON.parse(await fs.readFile(root+'/session.json','utf8')),{chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});const result={engine,cases:[]};let active;
try{
 for(const locale of ['en','ja'])for(const kind of ['500','offline']){
  const t=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')).support;
  active=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,locale,serviceWorkers:kind==='500'&&engine==='webkit'?'block':'allow'});await active.addCookies([...cookies.map(v=>({name:v.name,value:v.value,url:app})),{name:'lang',value:locale,url:app}]);const p=await active.newPage();p.setDefaultTimeout(10000);let count=0,standInHits=0;p.on('request',r=>{if(r.url()===app+'/api/freeze-report')count++;});
  if(kind==='500')await active.route(app+'/api/freeze-report',r=>{standInHits++;return r.fulfill({status:500,contentType:'application/json',body:'{}'});});
  await p.goto(app+'/profile');await p.getByRole('button',{name:t.row,exact:true}).tap();await p.locator('[data-report-preview]').waitFor();if(kind==='offline')await active.setOffline(true);
  await p.getByRole('button',{name:t.send,exact:true}).tap();await p.getByText(t.failed,{exact:true}).waitFor();assert.equal(count,1);if(kind==='500')assert.equal(standInHits,1);
  await p.screenshot({path:root+'/'+engine+'-'+locale+'-'+kind+'.png'});if(kind==='offline')await active.setOffline(false);await p.getByRole('button',{name:t.cancel,exact:true}).last().tap();await p.getByRole('button',{name:t.row,exact:true}).tap();await p.locator('[data-report-preview]').waitFor();assert.equal(count,1,'Reopening does not resend');
  await p.getByRole('button',{name:t.cancel,exact:true}).last().tap();assert.equal((await p.goto(app+'/admin/freeze-reports')).status(),404);
  await p.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('mfa-diagnostics');r.onsuccess=()=>resolve();}));await active.close();active=null;result.cases.push({locale,kind,requests:1,visibleFailure:true,noResendOnReconnectOrReopen:true,workerBlocked:kind==='500'&&engine==='webkit',normal404:true});
 }
}catch(e){result.error=String(e.stack??e);process.exitCode=1;}finally{if(active)await active.close();await browser.close();await fs.writeFile(root+'/'+engine+'-faults.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
