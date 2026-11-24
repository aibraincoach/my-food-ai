// Local-only screen parity and Japanese front-screen acceptance.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=process.env.APP_URL,base=process.env.I18N_BASE_URL,out=process.env.I18N_CHECK_OUT;
for(const url of [app,base])if(!url||new URL(url).hostname!=='127.0.0.1')throw Error('Loopback apps required');
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out)throw Error('Disposable fixture required');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8'));
const cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8'));
const en=JSON.parse(await fs.readFile(new URL('../../messages/en.json',import.meta.url))),ja=JSON.parse(await fs.readFile(new URL('../../messages/ja.json',import.meta.url)));
const authPaths=['/welcome','/sign-in','/sign-up','/reset-password','/new-password','/not-a-real-route'];
async function snapshot(page){return page.evaluate(()=>({text:document.body.innerText,aria:[...document.querySelectorAll('[aria-label]')].filter(e=>e.getClientRects().length).map(e=>e.getAttribute('aria-label'))}));}
async function ready(page){await page.locator('h1').first().waitFor();}
async function overflow(page){return page.evaluate(()=>[...document.querySelectorAll('p,h1,h2,label,button,a,figcaption')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+1).map(e=>({text:e.textContent,client:e.clientWidth,scroll:e.scrollWidth})));}
for(const [engineName,engine]of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.ONLY_ENGINE||name===process.env.ONLY_ENGINE)){
 const browser=await engine.launch(engineName==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),result={engine:engineName,parity:[],flows:[],overflow:[],errors:[]};
 try{
  // The same fixed local meal and account feed both builds. Disable workers only
  // for the DOM comparison to prevent stale copies contaminating the snapshot.
  for(const signed of [false,true]){
   const contexts=[];for(const url of[base,app]){const c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'en-US',timezoneId:'UTC',serviceWorkers:'block'});await c.addCookies([{name:'lang',value:'en',url},...(signed?cookies.map(x=>({name:x.name,value:x.value,url})):[])]);contexts.push(c);}
   const pages=await Promise.all(contexts.map(c=>c.newPage()));
   for(const path of signed?['/profile/about','/posts/'+fixture.post,'/shell?lang=en']:authPaths){
    const snaps=[];for(let i=0;i<2;i++){await pages[i].goto([base,app][i]+path,{waitUntil:'load'});if(path==='/profile/about')await pages[i].getByRole('heading',{name:en.about.title,exact:true}).waitFor();if(path.startsWith('/shell'))await pages[i].locator('nav[data-pill]').waitFor();else await ready(pages[i]);if(path.startsWith('/posts/'))await pages[i].getByRole('region',{name:'Meal comments'}).waitFor();if(path.startsWith('/posts/')){await pages[i].getByText(fixture.handle,{exact:true}).first().waitFor();await pages[i].getByText('Reply here to fix the estimate',{exact:true}).waitFor();}snaps.push(path.startsWith('/shell')?await pages[i].locator('nav[data-pill]').evaluate(e=>({text:e.innerText,aria:[...e.querySelectorAll('[aria-label]')].map(x=>x.getAttribute('aria-label'))})):await snapshot(pages[i]));}
    assert.deepEqual(snaps[1],snaps[0],engineName+' English parity '+path);result.parity.push(path);
   }
   for(const c of contexts)await c.close();
  }
  for(const locale of['en','ja']){
   const dictionary=locale==='en'?en:ja,c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'ja-JP',timezoneId:'UTC'});await c.addCookies([{name:'lang',value:locale,url:app}]);const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>result.errors.push(e.message));
   let response=await p.goto(app+'/welcome',{waitUntil:'load'});assert.match(await response.text(),new RegExp('<html[^>]*lang="'+locale+'"'));
   await p.getByRole('link',{name:dictionary.auth.emailPath,exact:true}).tap();await p.waitForURL('**/sign-in');
   await p.locator('input[name=email]').fill(fixture.email);await p.locator('input[name=password]').fill('DeliberatelyWrongPassword!');await p.getByRole('button',{name:dictionary.auth.signIn,exact:true}).tap();await p.getByRole('alert').filter({hasText:dictionary.auth.credentialsMismatch}).waitFor();result.flows.push(locale+': welcome/email/wrong-password localized');
   for(const path of authPaths){await p.goto(app+path,{waitUntil:'load'});await ready(p);assert.equal(await p.locator('html').getAttribute('lang'),locale);result.overflow.push({locale,path,findings:await overflow(p)});if(locale==='ja')await p.screenshot({path:out+'/'+engineName+'-ja-'+path.replaceAll('/','_')+'.png',fullPage:true});}
   await p.goto(app+'/welcome',{waitUntil:'load'});await p.getByRole('button',{name:dictionary.auth.providerContinue.replace('{provider}','Google')+' '+dictionary.auth.comingSoon,exact:true}).tap();await p.locator('#google-coming-soon').filter({hasText:dictionary.auth.comingSoon}).waitFor();result.flows.push(locale+': provider Coming soon');
   await p.goto(app+'/reset-password',{waitUntil:'load'});await p.locator('input[name=email]').fill(fixture.email);await p.getByRole('button',{name:dictionary.auth.sendReset,exact:true}).tap();await p.waitForURL(u=>u.pathname==='/reset-password'&&(u.searchParams.has('sent')||u.searchParams.has('error')));const sent=new URL(p.url()).searchParams.get('sent')==='1';await p.getByText(sent?dictionary.auth.resetSent:dictionary.auth.resetFailure,{exact:true}).waitFor();result.flows.push(locale+': local reset '+(sent?'accepted':'visible localized failure')+' (no mail-delivery claim)');
   await c.addCookies(cookies.map(x=>({name:x.name,value:x.value,url:app})));
   for(const path of ['/profile/about','/posts/'+fixture.post]){await p.goto(app+path,{waitUntil:'load'});if(path==='/profile/about')await p.getByRole('heading',{name:dictionary.about.title,exact:true}).waitFor();if(path.includes('/posts/'))await p.getByRole('region',{name:'Meal comments'}).waitFor();else await ready(p);result.overflow.push({locale,path,findings:await overflow(p)});if(locale==='ja')await p.screenshot({path:out+'/'+engineName+'-ja-'+(path.includes('/posts/')?'card':'about')+'.png',fullPage:true});}
   await p.goto(app+'/',{waitUntil:'load'});const plus=p.locator('#post-menu-toggle:visible');await plus.waitFor();await plus.tap();await p.waitForFunction(()=>{const m=document.querySelector('#post-menu'),b=m?.querySelector('button[data-entry="camera"]');return m?.getAttribute('aria-hidden')==='false'&&b&&getComputedStyle(b).opacity==='1';});assert.equal(await p.locator('#post-menu').getAttribute('aria-label'),dictionary.navigation.newPost);result.flows.push(locale+': translated bottom bar and + menu');await p.screenshot({path:out+'/'+engineName+'-'+locale+'-menu.png'});await c.close();
  }
  result.pass=true;
 }catch(error){result.pass=false;result.failure=String(error);process.exitCode=1;}
 finally{await browser.close();await fs.writeFile(out+'/'+engineName+'-screens.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
 if(!result.pass)break;
}
