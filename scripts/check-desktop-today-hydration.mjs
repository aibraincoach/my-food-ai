// Disposable browser regression: required env supplies the local app, session and browser module.
import fs from 'node:fs/promises';
const target=process.env.APP_URL,output=process.env.HYDRATION_CHECK_OUT;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||!target||!['127.0.0.1','localhost','[::1]'].includes(new URL(target).hostname)||!output||!process.env.TEST_SESSION_FILE||!process.env.MFA_PLAYWRIGHT_MODULE)throw Error('Use an explicit disposable loopback app, session file, browser module and fresh output directory.');
await fs.mkdir(output); // Refuse existing output rather than replacing another run.
const {webkit,chromium,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE);
const session=JSON.parse(await fs.readFile(process.env.TEST_SESSION_FILE,'utf8')),results=[];
for(const variant of [{name:'webkit-no-cookie',engine:'webkit'},{name:'webkit-cookie',engine:'webkit',cookie:true},{name:'chromium-no-cookie-6x',engine:'chromium'}]){
 const browser=variant.engine==='webkit'?await webkit.launch():await chromium.launch({executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'Asia/Jakarta'});
  const auth=session.cookie.split('; ').map(part=>{const i=part.indexOf('=');return{name:part.slice(0,i),value:part.slice(i+1),url:target};}).filter(cookie=>cookie.name!=='time-zone');
  await context.addCookies(auth);if(variant.cookie)await context.addCookies([{name:'time-zone',value:'Asia%2FJakarta',url:target}]);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  if(variant.engine==='chromium'){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});}
  const started=Date.now();await page.goto(target,{waitUntil:'commit',timeout:30000});await new Promise(resolve=>setTimeout(resolve,Math.max(0,1000-(Date.now()-started))));
  const tapped=Date.now();await page.touchscreen.tap(195,790);let opened=true;
  try{await page.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='false',undefined,{timeout:3000});}catch{opened=false;}
  const menuMs=Date.now()-tapped;
  const hit=await page.evaluate(()=>{const button=document.querySelector('button[aria-label="Post a meal"]'),r=button?.getBoundingClientRect();return{button:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,atTapPoint:document.elementFromPoint(195,790)?.closest('button')?.getAttribute('aria-label')??null};});
  await page.waitForFunction(()=>document.body.textContent.includes('Synthetic local portion question'),undefined,{timeout:8000});
  await page.screenshot({path:output+'/'+variant.name+'.png'});
  results.push({variant:variant.name,timeZoneCookie:Boolean(variant.cookie),deviceZone:'Asia/Jakarta',cpuRate:variant.engine==='chromium'?6:1,tapSinceNavigationMs:tapped-started,menuMs,opened,hit,errors,hydrationPass:errors.length===0,menuPass:opened&&menuMs<=1000,pass:opened&&menuMs<=1000&&errors.length===0});
  await context.close();
 }finally{await browser.close();}
}
await fs.writeFile(output+'/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results));if(results.some(result=>!result.pass))process.exitCode=1;
