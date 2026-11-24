// Navigation/error proof only; never sends reset mail or changes a password.
import fs from'node:fs/promises';import assert from'node:assert/strict';
if(process.env.TEST_ENV_FILE)process.loadEnvFile(process.env.TEST_ENV_FILE);
const app=process.env.APP_URL,out=process.env.FORGOT_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!out||!['chromium','webkit'].includes(engine)||![app,process.env.NEXT_PUBLIC_SUPABASE_URL].every(v=>new URL(v).hostname==='127.0.0.1'))throw Error('Disposable loopback only');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{});const result={engine,syntheticInvalidCredentials:true,cases:[]};let active;
try{
 for(const locale of ['en','ja']){
  const t=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')).auth;
  active=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},locale});await active.addCookies([{name:'lang',value:locale,url:app}]);const p=await active.newPage();p.setDefaultTimeout(10000);let resetPOSTs=0;p.on('request',r=>{if(r.method()==='POST'&&new URL(r.url()).pathname==='/reset-password')resetPOSTs++;});
  await p.goto(app+'/sign-in',{waitUntil:'domcontentloaded'});const link=p.getByRole('link',{name:t.forgotPassword,exact:true});await link.waitFor();assert.equal(await link.getAttribute('href'),'/reset-password');
  const box=await link.boundingBox(),password=await p.locator('input[name=password]:visible').boundingBox();assert.ok(box.y>=password.y+password.height,'link is under password');
  await link.tap();await p.getByRole('heading',{name:t.resetPassword,exact:true}).waitFor();await p.getByRole('button',{name:t.sendReset,exact:true}).waitFor();assert.equal(resetPOSTs,0);await p.screenshot({path:out+'/'+engine+'-'+locale+'-reset.png'});
  // Independent mismatch check starts on a fresh document; retained-route Back is not the feature under test.
  await p.goto(app+'/sign-in',{waitUntil:'domcontentloaded'});await p.locator('input[name=email]:visible').fill('forgot-release-'+engine+'-'+locale+'@example.invalid');await p.locator('input[name=password]:visible').fill('Invalid-fixture-password!');await p.getByRole('button',{name:t.signIn,exact:true}).tap();await p.getByText(t.credentialsMismatch,{exact:true}).waitFor();assert.equal(new URL(p.url()).pathname,'/sign-in');assert.equal(await p.locator('html').getAttribute('lang'),locale);assert.equal(resetPOSTs,0);
  const width=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));assert.ok(width.scroll<=width.viewport,'no horizontal overflow');await p.screenshot({path:out+'/'+engine+'-'+locale+'-wrong-password.png'});
  result.cases.push({locale,linkUnderPassword:true,resetPageReached:true,exactLocalizedMismatch:true,noHorizontalOverflow:true,resetPOSTs:0});await active.close();active=null;
 }
}catch(e){result.error=e.message;process.exitCode=1;if(active)await active.pages()[0]?.screenshot({path:out+'/'+engine+'-failure.png'}).catch(()=>{});}finally{if(active)await active.close();await browser.close();await fs.writeFile(out+'/'+engine+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
