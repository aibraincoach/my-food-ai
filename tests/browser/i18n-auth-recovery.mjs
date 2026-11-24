import fs from 'node:fs/promises';import assert from 'node:assert/strict';import {randomUUID}from'node:crypto';
const app=process.env.APP_URL,out=process.env.I18N_CHECK_OUT;if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out)throw Error('Loopback fixture required');
const fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8'));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
for(const[name,engine]of[['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.ONLY_ENGINE||name===process.env.ONLY_ENGINE)){
 const b=await engine.launch(name==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),result={engine:name,cases:[]};
 try{for(const locale of['en','ja']){
 const t=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url))).auth,c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale:'ja-JP'});await c.addCookies([{name:'lang',value:locale,url:app}]);const p=await c.newPage();p.setDefaultTimeout(10000);
 const email=fixture.email.replace('@','-'+name+'-'+locale+'-'+randomUUID().slice(0,6)+'@'),password='Local-'+randomUUID()+'!';await fs.appendFile(out+'/signup-emails.jsonl',JSON.stringify({email,locale,engine:name})+'\n',{mode:0o600});
 await p.goto(app+'/sign-up',{waitUntil:'load'});await p.locator('input[name=email]:visible').fill(email);await p.locator('input[name=handle]:visible').fill(fixture.handle);await p.locator('input[name=password]:visible').fill(password);await p.getByRole('button',{name:t.createAccount,exact:true}).tap();
 await p.waitForURL(u=>u.pathname==='/choose-handle'&&u.searchParams.has('error'));await p.getByText(t.takenHandle,{exact:true}).waitFor();assert.equal(await p.locator('html').getAttribute('lang'),locale);await p.screenshot({path:out+'/'+name+'-'+locale+'-taken-handle.png'});
 await p.locator('input[name=handle]:visible').fill('i18n_'+randomUUID().slice(0,8));await p.getByRole('button',{name:t.continue,exact:true}).tap();await p.waitForURL(app+'/');await p.locator('#post-menu-toggle:visible').waitFor();result.cases.push({locale,takenHandleLocalized:true,chooseHandleRecovery:true,localAuthConfirmation:'off, session issued'});await c.close();
 }result.pass=true;}catch(e){result.pass=false;result.failure=String(e);process.exitCode=1;}finally{await b.close();await fs.writeFile(out+'/'+name+'-auth-recovery.json',JSON.stringify(result,null,2));console.log(result);}if(!result.pass)break;
}
