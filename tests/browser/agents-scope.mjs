// Fails on main's missing postMenu provider; real local create/revoke, no model calls.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';
const url=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE,observe=process.env.EXPECT_MISSING_SCOPE==='1';
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||new URL(url).hostname!=='127.0.0.1'||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json'));
const dictionaries=Object.fromEntries(await Promise.all(['en','ja'].map(async l=>[l,JSON.parse(await fs.readFile(new URL('../../messages/'+l+'.json',import.meta.url)))])));
const {chromium,webkit}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
const result={engine,observe,cases:[]};
const safe=s=>String(s).replace(/([?&]apikey=)[^&\s'"]+/g,'$1<redacted>').replace(/mfa_live_[A-Za-z0-9]+/g,'<synthetic-token>');
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
try{
 for(const locale of (process.env.ONLY_LOCALE?[process.env.ONLY_LOCALE]:['en','ja']))for(const flow of ['revoke','create','freeze']){
  if(process.env.SKIP_FIXTURE_RESET==='1'&&!process.env.ONLY_LOCALE)throw Error('External reset requires one locale per run');
  const reset=process.env.SKIP_FIXTURE_RESET==='1'?{status:0}:spawnSync(process.execPath,['tests/fixtures/agents-scope-acceptance.mjs','reset'],{env:process.env,encoding:'utf8'});assert.equal(reset.status,0,'Owned reset');
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'en-US',timezoneId:'UTC',serviceWorkers:'block'});
  const transport=await readingRealtime(context);
  await context.addCookies([...cookies.map(c=>({name:c.name,value:c.value,url})),{name:'lang',value:locale,url},{name:'time-zone',value:'UTC',url}]);
  const page=await context.newPage();page.setDefaultTimeout(12000);const errors=[];
  page.on('pageerror',e=>errors.push(safe(e.message)));page.on('console',m=>{if(m.type()==='error')errors.push(safe(m.text()));});
  const row={locale,flow,errors};result.cases.push(row);
  try{
   await page.goto(url+(flow==='freeze'?'/profile':flow==='create'?'/profile/agents/new':'/profile/agents'),{waitUntil:'load'});
   if(flow==='revoke')await page.getByRole('button',{name:'Revoke token',exact:true}).click();
   if(flow==='create'){await page.locator('#agent-name').waitFor();await page.getByRole('button',{name:'Create token',exact:true}).click();}
   if(flow==='freeze')await page.getByRole('button',{name:dictionaries[locale].support.row,exact:true}).click();
   if(observe&&flow!=='freeze'){
    if(flow==='create'){await page.getByRole('heading',{name:'Token created',exact:true}).waitFor();await page.getByRole('button',{name:'Done',exact:true}).click();}
    await page.getByRole('alert').filter({hasText:dictionaries[locale].errors.pageFailure}).waitFor();
    assert.ok(errors.some(e=>/MISSING_MESSAGE: postMenu/.test(e)),'Main fails with missing postMenu');row.expectedMainCrash=true;
   }else{
    if(flow==='revoke'){
     const dialog=page.getByRole('dialog',{name:'Revoke "Synthetic agent"?',exact:true});await dialog.waitFor();
     assert.equal(await dialog.locator('p').innerText(),'The agent stops working right away. Posts it made stay in your feed and stay yours.');
     await dialog.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.getByRole('dialog').count(),0);
     await page.getByRole('button',{name:'Revoke token',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Revoke token',exact:true}).click();await page.getByText('Token revoked',{exact:true}).waitFor();
    }else if(flow==='create'){
     await page.getByRole('heading',{name:'Token created',exact:true}).waitFor();assert.match(await page.getByRole('textbox',{name:'Agent token',exact:true}).inputValue(),/^mfa_live_/);
     await page.getByRole('button',{name:'Done',exact:true}).click();const dialog=page.getByRole('dialog',{name:"You won't see this token again",exact:true});await dialog.waitFor();
     await dialog.getByRole('button',{name:'Stay',exact:true}).click();await page.getByRole('button',{name:'Done',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Leave',exact:true}).click();await page.waitForURL('**/profile/agents');
    }else{
     const dialog=page.getByRole('dialog',{name:dictionaries[locale].support.title,exact:true});await dialog.waitFor();
     assert.equal(await dialog.locator('p').first().innerText(),dictionaries[locale].support.explanation);
     await dialog.getByRole('button',{name:dictionaries[locale].support.cancel,exact:true}).last().click();assert.equal(await page.getByRole('dialog').count(),0);
    }
    await settle(page);row.transport=transport;row.browserDiagnostics=errors.filter(e=>e==='Viewport argument key "interactive-widget" not recognized and ignored.');assert.deepEqual(errors.filter(e=>!row.browserDiagnostics.includes(e)),[],'No application console/page errors');row.pass=true;
   }
   await page.screenshot({path:out+'/'+engine+'-'+locale+'-'+flow+'.png',fullPage:true,mask:[page.locator('textarea[readonly]')]});
  }catch(e){row.failure=safe(e.message);await page.screenshot({path:out+'/'+engine+'-'+locale+'-'+flow+'-failure.png',fullPage:true,mask:[page.locator('textarea[readonly]')]});throw e;}
  finally{await context.close();}
 }
 result.pass=true;
}catch(e){result.pass=false;result.failure=safe(e.message);process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/'+engine+(process.env.ONLY_LOCALE?'-'+process.env.ONLY_LOCALE:'')+'-scope.json',JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify({engine,pass:result.pass,cases:result.cases.length,failure:result.failure}));}
