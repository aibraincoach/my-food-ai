// Local synthetic Days/account/admin wording and flows; no provider calls.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createTranslator} from 'next-intl';
import {readingRealtime} from '../fixtures/reading-realtime.mjs';
const app=process.env.APP_URL,base=process.env.I18N_BASE_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||![app,base].every(v=>v&&new URL(v).hostname==='127.0.0.1')||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback configuration only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json')),cookies=JSON.parse(await fs.readFile(out+'/session.json'));
if(!f.accountReading)throw Error('Extended owned fixture required');
const dict=Object.fromEntries(await Promise.all(['en','ja'].map(async locale=>[locale,JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url)))])));
const t=(locale,namespace,key,values)=>createTranslator({locale,messages:dict[locale][namespace],onError:e=>{throw e;}})(key,values);
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});
const result={engine,cases:[],parity:[],errors:[],limits:['Synthetic loopback accounts/admin only; no real phone proof','English snapshots block workers and acknowledge Realtime joins without data','Japanese uses normal worker','Admin masks only named per-minute clocks and oldest-job age; records originals/counts','Stored/model/server text remains unchanged; no native-speaker review']},snapshots={};
const safe=value=>String(value).replace(/([?&]apikey=)[^&\s'"]+/g,'$1<redacted>').replace(/mfa_live_[A-Za-z0-9]{32}/g,'<synthetic-token>');
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function go(page,url,path){const response=await page.goto(url+path,{waitUntil:'load'});assert.equal(response.status(),200,path);await page.locator('main').first().waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('button,a,input')].some(node=>Object.keys(node).some(key=>key.startsWith('__reactFiber'))));await settle(page);}
async function collect(page,name,locale,build){
 await settle(page);
 const data=await page.evaluate(({name,locale,handle,tokenLabel,clockHeading,ageLabel})=>{
  const masks=[];
  if(name==='admin'&&locale==='en'){
   const heading=[...document.querySelectorAll('h2')].find(n=>n.textContent===clockHeading);if(!heading)throw Error('Missing clock heading');
   let table=heading.nextElementSibling;while(table&&table.tagName!=='TABLE')table=table.nextElementSibling;if(!table)throw Error('Missing clock table');
   for(const [index,node]of [...table.querySelectorAll('time')].entries()){masks.push({field:'minute-clock',index,value:node.textContent});node.textContent='<clock>';}
   const label=[...document.querySelectorAll('dt')].find(n=>n.textContent===ageLabel);if(!label)throw Error('Missing oldest-job label');
   const node=label.parentElement.querySelector('dd');if(!node)throw Error('Missing oldest-job age');
   if(/^\d+ s$/.test(node.textContent)){masks.push({field:'oldest-job-age',index:0,value:node.textContent});node.textContent='<age> s';}
  }
  const token=document.querySelector('textarea[readonly][aria-label="'+tokenLabel+'"]')?.value;
  const redact=value=>token?String(value).split(token).join('<synthetic-token>'):value;
  const snapshot={text:redact(document.body.innerText),aria:[...document.querySelectorAll('[aria-label]')].filter(n=>n.getClientRects().length).map(n=>n.getAttribute('aria-label')),inputs:[...document.querySelectorAll('input:not([type=file]),textarea')].filter(n=>n.getClientRects().length).map(n=>({label:n.getAttribute('aria-label'),placeholder:n.getAttribute('placeholder'),value:redact(n.value)}))};
  const overflow=[...document.querySelectorAll('button,label,p,h1,h2,input,textarea')].filter(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(n).visibility!=='hidden'&&(r.left< -1||r.right>innerWidth+1||n.scrollWidth>n.clientWidth+2);}).map(n=>({tag:n.tagName,text:redact(n.innerText),label:n.getAttribute('aria-label'),rect:{x:n.getBoundingClientRect().x,width:n.getBoundingClientRect().width}}));
  let latin=[];
  if(locale==='ja'){
   const held=name.startsWith('admin')?'main pre,main a[href^="/admin/posts/"],main > p.break-all,main > ol > li > h2':'[data-nutrition-disclosure],[data-day-nutrition-disclosure],main p[class="mt-[6px] text-detail"]';
   const clean=value=>{for(const word of ['My Food AI','Muse Spark Open','Muse Spark 1.3','Muse Voice Transcribe 1.0','SAM 3.1','Meta','Baseten','Claude','Open Food Facts','AI',handle])value=value.split(word).join('');return value.replace(/\b(kcal|ml|mg|g|ms|UTC|FDC|ID)\b/g,'').replace(/\b\d{4}-\d{2}-\d{2}T[0-9:.+-]+Z\b/g,'');};
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(!p||!p.getClientRects().length||p.closest('script,style,kbd,.text-avatar,.text-avatar-sm,[data-i18n-stored],[data-i18n-server-wording],textarea[readonly]')||p.closest(held))continue;const text=clean(n.textContent);if(/[A-Za-z]/.test(text))latin.push({text,tag:p.tagName});}
   for(const n of document.querySelectorAll('[aria-label],input[placeholder]')){if(!n.getClientRects().length)continue;for(const key of ['aria-label','placeholder']){const value=n.getAttribute(key);if(value&&/[A-Za-z]/.test(clean(value)))latin.push({attribute:key,value});}}
  }
  return{snapshot,masks,overflow,latin,lang:document.documentElement.lang};
 },{name,locale,handle:f.handle,tokenLabel:t(locale,'agents','agentToken'),clockHeading:t(locale,'admin','jobsPerMinute'),ageLabel:t(locale,'admin','oldestWaiting')});
 assert.equal(data.lang,locale,'Document locale');
 const key=build+'-'+locale+'-'+name;snapshots[key]=data.snapshot;
 if(build==='head'&&locale==='en'&&engine==='chromium'&&process.env.READING_ACCOUNT_PREFLIGHT!=='1'&&process.env.READING_ACCOUNT_HEAD_ONLY!=='1'){
  assert.deepEqual(data.snapshot,snapshots['base-en-'+name],'English text/aria/input parity '+name);
  const old=result.cases.find(c=>c.build==='base'&&c.name===name);assert.deepEqual(data.masks.map(x=>x.field),old.masks.map(x=>x.field),'Same number and kinds of admin masks');result.parity.push(name);
 }
 if(locale==='ja')assert.deepEqual(data.latin,[],'Japanese literal audit '+name);
 result.cases.push({build,locale,name,masks:data.masks,overflow:data.overflow,latin:data.latin,pass:true});
 await page.screenshot({path:out+'/'+engine+'-'+build+'-'+locale+'-'+name+'.png',fullPage:true,mask:[page.locator('textarea[readonly]')]});
}
try{
 const runs=process.env.READING_ACCOUNT_PREFLIGHT==='1'?[['head','en',app]]:process.env.READING_ACCOUNT_HEAD_ONLY==='1'?[['head','en',app],['head','ja',app]]:engine==='chromium'?[['base','en',base],['head','en',app],['head','ja',app]]:[['head','en',app],['head','ja',app]];
 for(const [build,locale,url]of runs){
  const reset=spawnSync(process.execPath,['tests/fixtures/reading-account-acceptance.mjs','reset'],{env:process.env,encoding:'utf8'});if(reset.status!==0)throw Error('Owned fixture reset failed: '+safe(reset.stderr));
  const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'en-US',timezoneId:'UTC',...(locale==='en'?{serviceWorkers:'block'}:{})});
  const transport=locale==='en'?await readingRealtime(context):null;
  await context.addCookies([...cookies.map(cookie=>({name:cookie.name,value:cookie.value,url})),{name:'lang',value:locale,url},{name:'time-zone',value:'UTC',url}]);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(30000);page.on('pageerror',e=>result.errors.push({build,locale,message:safe(e.message),at:new Date().toISOString(),url:page.url()}));
  const capture=async name=>{result.current={build,locale,name};await collect(page,name,locale,build);};
  try{
   await go(page,url,'/days');await page.locator('[data-day="2026-11-24"]').waitFor();await capture('days-today');
   if(process.env.READING_ACCOUNT_PREFLIGHT!=='1'){
    await page.getByRole('button',{name:'2026',exact:true}).click();await page.getByRole('dialog',{name:t(locale,'days','goToMonth'),exact:true}).waitFor();await capture('months');
    await go(page,url,'/days/2026-10-15?tz=UTC');await page.getByRole('dialog').waitFor();await capture('days-older');
    await go(page,url,'/days/2026-11-24?tz=UTC');await page.getByRole('dialog').waitFor();await capture('story');
    await page.setViewportSize({width:1280,height:900});await go(page,url,'/days');await page.locator('.desktop-days').waitFor();await page.locator('[data-day="2026-11-24"]').click();await page.getByRole('complementary',{name:t(locale,'days','selectedDay'),exact:true}).getByText('検証用のご飯',{exact:true}).waitFor();await capture('desktop-days');
    await go(page,url,'/');const today=page.getByRole('complementary',{name:t(locale,'days','today'),exact:true});await today.getByText('検証用の食事',{exact:true}).waitFor();await capture('desktop-today');
    await page.getByRole('button').filter({hasText:t(locale,'shortcuts','keyboardShortcuts')}).click();await page.getByRole('dialog').waitFor();await capture('shortcuts');await page.getByRole('button',{name:t(locale,'shortcuts','closeKeyboardShortcuts'),exact:true}).click();
    await page.keyboard.press('/');await page.waitForURL('**/search?focus=1');const desktopSearch=page.getByRole('textbox',{name:t(locale,'search','meals'),exact:true});await desktopSearch.waitFor();assert.equal(await desktopSearch.evaluate(n=>document.activeElement===n),true,'Translated sidebar search shortcut focuses input');await desktopSearch.fill('検証用 '+f.handle);await desktopSearch.press('Enter');await page.locator('a[data-desktop-post="'+f.post+'"]:visible').waitFor();await capture('desktop-search-results');await desktopSearch.fill('存在しない検証 '+f.handle);await desktopSearch.press('Enter');await page.getByText(t(locale,'search','noMeals'),{exact:true}).waitFor();await capture('desktop-search-empty');await desktopSearch.press('Escape');assert.equal(await desktopSearch.inputValue(),'','Escape still clears search');
    await page.setViewportSize({width:390,height:844});await go(page,url,'/search');const search=page.getByRole('textbox',{name:t(locale,'search','meals'),exact:true});await search.fill('存在しない検証 '+f.handle);await search.press('Enter');await page.getByText(t(locale,'search','noMeals'),{exact:true}).waitFor();await capture('search-empty');
    await search.fill('検証用 '+f.handle);await search.press('Enter');await page.locator('article[data-post-id="'+f.post+'"]').waitFor();await capture('search-results');
    await go(page,url,'/profile');await page.getByRole('button',{name:t(locale,'profile','picture'),exact:true}).waitFor();await capture('profile');await page.getByRole('button',{name:t(locale,'profile','picture'),exact:true}).click();await page.getByRole('dialog',{name:t(locale,'profile','picture'),exact:true}).waitFor();await capture('avatar-menu');
    await go(page,url,'/profile/agents');await page.getByRole('heading',{name:'検証用のエージェント',exact:true}).waitFor();await capture('agents');
    await page.locator('section').filter({has:page.getByRole('heading',{name:'検証用のエージェント',exact:true})}).getByRole('button',{name:t(locale,'agents','revokeToken'),exact:true}).click();await page.getByRole('dialog').waitFor();await capture('revoke');await page.getByRole('dialog').getByRole('button',{name:t(locale,'agents','revokeToken'),exact:true}).click();await page.getByText(t(locale,'agents','tokenRevoked'),{exact:true}).waitFor();
    await go(page,url,'/profile/agents/new');await page.locator('#agent-name').waitFor();assert.equal(await page.locator('#agent-name').inputValue(),t(locale,'agents','defaultName'));await capture('agent-new');await page.getByRole('button',{name:t(locale,'agents','createToken'),exact:true}).click();await page.getByRole('heading',{name:t(locale,'agents','tokenCreated'),exact:true}).waitFor();await capture('agent-token');await page.getByRole('button',{name:t(locale,'agents','done'),exact:true}).click();await page.getByRole('heading',{name:t(locale,'agents','noTokenAgain'),exact:true}).waitFor();await capture('agent-leave-guard');await page.getByRole('button',{name:t(locale,'agents','leave'),exact:true}).click();await page.waitForURL('**/profile/agents');
    await go(page,url,'/profile/deleted');await page.getByText('検証用の削除した食事',{exact:true}).waitFor();await capture('deleted');await page.getByRole('button',{name:t(locale,'deleted','restore'),exact:true}).click();await page.getByText(t(locale,'deleted','empty'),{exact:true}).waitFor();
    await go(page,url,'/admin');await page.getByRole('heading',{name:t(locale,'admin','title'),exact:true}).waitFor();await capture('admin');
    await go(page,url,'/admin/posts/'+f.post);await page.getByText('検証用リクエスト',{exact:true}).waitFor();await capture('admin-trace');
   }
   if(locale==='en')assert.ok(transport.acknowledgedJoins>0,'Realtime ack fixture actually used');
   result.transports??=[];result.transports.push({build,locale,transport});
  }catch(e){await page.screenshot({path:out+'/'+engine+'-failure.png',fullPage:true,mask:[page.locator('textarea[readonly]')]});await fs.writeFile(out+'/'+engine+'-failure.html',await page.content(),{mode:0o600});throw e;}
  finally{await context.close();}
 }
 result.textAndFlowsPass=true;result.runtimeClean=result.errors.length===0;
 assert.ok(!result.errors.some(e=>/MISSING_MESSAGE|Missing.+namespace|No intl context/.test(e.message)),'Strict translation runtime');
 if(engine==='chromium')assert.equal(result.errors.length,0,'No Chromium runtime errors');
 result.pass=result.textAndFlowsPass&&result.runtimeClean;
}catch(e){result.pass=false;result.failure=safe(e.message);process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/'+engine+'-account.json',JSON.stringify(result,null,2),{mode:0o600});await fs.writeFile(out+'/'+engine+'-snapshots.json',JSON.stringify(snapshots,null,2),{mode:0o600});console.log(JSON.stringify({engine,pass:result.pass,cases:result.cases.length,current:result.current,failure:result.failure,runtimeErrors:result.errors.length}));}
