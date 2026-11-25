// Disposable menu hit testing. Base early-tap proof requires explicit opt-in;
// the completed main observations must not become a repeated collection.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=process.env.APP_URL,out=process.env.MENU_CHECK_OUT,engine=process.env.ONLY_ENGINE,label=process.env.CHECK_LABEL;
const visualOnly=process.env.MENU_VISUAL_ONLY==='1';
const baseRed=label==='base'&&process.env.MENU_BASE_RED==='1';
const labelsOnly=process.env.MENU_LABELS_ONLY==='1',expectLabelRed=process.env.MENU_EXPECT_LABEL_RED==='1';
if(expectLabelRed&&!labelsOnly)throw Error('Label regression expectation is bounded to label-only checks');
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out||!['chromium','webkit'].includes(engine)||!['base','head'].includes(label)||(label==='base'&&!visualOnly&&!baseRed)||(baseRed&&visualOnly))throw Error('Bounded disposable menu proof only');
await fs.mkdir(out,{recursive:true});
const cookies=JSON.parse(await fs.readFile(process.env.TEST_SESSION_FILE,'utf8'));
const locale=process.env.MENU_LOCALE??'en';if(!['en','ja'].includes(locale))throw Error('Known menu locale required');
const words=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8'));
const {chromium,webkit,devices}=await import('/tmp/mfa-f62-browser/node_modules/playwright/index.mjs');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:'/usr/bin/chromium-browser',args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{});
const receipt={engine,label,locale,visualOnly,cases:[],errors:[],limits:['390x844 emulation; synthetic/fake camera, no real iPhone/Safari proof','Requested early delay30ms; actual native-input timing recorded']};
async function context(){
 const c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',...(engine==='chromium'?{permissions:['camera']}:{})});
 await c.addCookies([...cookies.map(v=>({name:v.name,value:v.value,url:app})),{name:'lang',value:locale,url:app}]);
 await c.addInitScript(({engine})=>{
  localStorage.setItem('mfa-camera-mode','app');window.__mediaCalls=[];window.__tapLog=[];window.__entryEvents=[];
  window.addEventListener('open-entry',e=>window.__entryEvents.push(e.detail?.entry));
  const real=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async options=>{window.__mediaCalls.push(performance.now());return engine==='webkit'?new MediaStream():real(options);};
  if(engine==='webkit'){for(const[k,v]of Object.entries({videoWidth:320,videoHeight:240,readyState:4}))Object.defineProperty(HTMLVideoElement.prototype,k,{get:()=>v});HTMLVideoElement.prototype.play=()=>Promise.resolve();}
  for(const type of ['pointerdown','click'])document.addEventListener(type,e=>{const b=e.target.closest?.('button');if(type==='click'&&b?.id==='post-menu-toggle'&&document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true')window.__openedAt=performance.now();window.__tapLog.push({type,at:performance.now(),openedAt:window.__openedAt??null,label:b?.getAttribute('aria-label'),entry:b?.dataset.entry??null,x:e.clientX,y:e.clientY});},true);
 },{engine});
 const p=await c.newPage();p.setDefaultTimeout(10000);p.setDefaultNavigationTimeout(30000);let closing=false;
 p.on('pageerror',e=>receipt.errors.push({message:e.message,at:new Date().toISOString(),url:p.url(),phase:receipt.phase,closing}));
 await p.goto(app,{waitUntil:'load'});await p.waitForFunction(()=>{const b=document.getElementById('post-menu-toggle');return b&&Object.keys(b).some(k=>k.startsWith('__reactFiber'));});await p.evaluate(()=>document.fonts.ready);
 return {c,p,close:async()=>{closing=true;await c.close();}};
}
async function click(p,x,y){if(engine==='webkit')await p.touchscreen.tap(x,y);else await p.mouse.click(x,y);}
async function toggle(p){const r=await p.locator('#post-menu-toggle').boundingBox();await click(p,r.x+r.width/2,r.y+r.height/2);}
async function settled(p){await p.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});}
async function fullyOpen(p){await toggle(p);await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='false');await p.waitForFunction(()=>{const b=document.querySelector('#post-menu button[data-entry="camera"]'),visual=b?.querySelector(':scope > div')??b;return visual&&getComputedStyle(visual).opacity==='1'&&getComputedStyle(visual.querySelector('span')).opacity==='1';});await settled(p);}
async function entryCase(entry,early,labelTarget=false){
 const f=await context(),{p}=f;receipt.phase={entry,early,labelTarget};
 try{
  await fullyOpen(p);const button=p.locator('#post-menu button[data-entry="'+entry+'"]'),r=await(labelTarget?button.locator('span').first():button).boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};
  let labelGeometry;
  if(labelTarget&&!expectLabelRed){
   labelGeometry=await button.evaluate(b=>{const v=b.querySelector('span').getBoundingClientRect(),hit=b.querySelector('[data-entry-label-target]'),h=hit.getBoundingClientRect();return{visual:v.toJSON(),target:h.toJSON(),ariaHidden:hit.getAttribute('aria-hidden'),tabIndex:hit.tabIndex,buttonName:b.getAttribute('aria-label')};});
   for(const key of ['x','y','width','height'])assert.ok(Math.abs(labelGeometry.visual[key]-labelGeometry.target[key])<=0.015,'label target matches visual '+key);
   assert.equal(labelGeometry.ariaHidden,'true');assert.equal(labelGeometry.tabIndex,-1);assert.equal(labelGeometry.buttonName,words.navigation[entry]);
  }
  if(early){await p.keyboard.press('Escape');await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');await settled(p);await p.evaluate(()=>{window.__tapLog=[];window.__openedAt=null;});await toggle(p);await p.waitForTimeout(30);}
  const hit=await p.evaluate(({x,y})=>{const b=document.elementFromPoint(x,y)?.closest('button');return{at:performance.now(),elapsed:performance.now()-window.__openedAt,entry:b?.dataset.entry??null,label:b?.getAttribute('aria-label'),rect:b?.getBoundingClientRect().toJSON()};},point);
  if(expectLabelRed){
   assert.equal(hit.entry,null,'broken head label falls through');assert.equal(hit.label,words.navigation.closeMenu);await click(p,point.x,point.y);await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');await settled(p);assert.equal(await p.evaluate(()=>window.__entryEvents.length),0);assert.equal(await p.evaluate(()=>window.__mediaCalls.length),0);assert.equal(await p.locator('video').count(),0);receipt.cases.push({entry,early,labelTarget,hit,expectedRegression:true,pass:true});return;
  }
  assert.equal(hit.entry,entry,'native target is the requested entry');await click(p,point.x,point.y);
  if(entry==='camera'){await p.waitForFunction(()=>window.__mediaCalls.length>0&&Boolean(document.querySelector('video')));assert.equal(await p.evaluate(()=>window.__mediaCalls.length),1);}
  else if(entry==='text'){await p.locator('#capture-caption:visible').waitFor();assert.equal(await p.locator('video').count(),0);}
  else await p.getByRole('dialog',{name:entry==='saved'?words.postMenu.savedMeals:words.postMenu.drinkTitle,exact:true}).waitFor();
  assert.deepEqual(await p.evaluate(()=>window.__entryEvents),[entry]);
  receipt.cases.push({entry,early,labelTarget,labelGeometry,hit,events:await p.evaluate(()=>window.__entryEvents),mediaCalls:await p.evaluate(()=>window.__mediaCalls.length),pass:true});
 }catch(e){await p.screenshot({path:out+'/failure.png',fullPage:true});await fs.writeFile(out+'/failure.html',await p.content(),{mode:0o600});throw e;}finally{await f.close();}
}
// Run once per engine only when a new base observation is explicitly authorised.
async function baseRedCase(){
 const f=await context(),{p}=f;receipt.phase='base early-camera red';
 try{
  await fullyOpen(p);const r=await p.locator('#post-menu button[data-entry="camera"]').boundingBox(),point={x:r.x+r.width/2,y:r.y+r.height/2};
  await p.keyboard.press('Escape');await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');await settled(p);
  await p.evaluate(()=>{window.__tapLog=[];window.__openedAt=null;});await toggle(p);await p.waitForTimeout(30);
  const hit=await p.evaluate(({x,y})=>{const b=document.elementFromPoint(x,y)?.closest('button');return{elapsed:performance.now()-window.__openedAt,label:b?.getAttribute('aria-label'),entry:b?.dataset.entry??null,rect:b?.getBoundingClientRect().toJSON()};},point);
  assert.equal(hit.label,words.navigation.closeMenu,'base early tap hits the installed scrim label');assert.equal(hit.entry,null);
  await click(p,point.x,point.y);await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');await settled(p);
  assert.equal(await p.evaluate(()=>window.__mediaCalls.length),0);assert.equal(await p.locator('video').count(),0);
  receipt.cases.push({name:'base early-camera red',hit,mediaCalls:0,video:false,menuHidden:true,pass:true});
 }finally{await f.close();}
}
async function keyboardAndScrim(){
 const f=await context(),{p}=f;receipt.phase='keyboard/scrim';
 try{
  await fullyOpen(p);const active=()=>p.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
  await p.waitForFunction(()=>document.activeElement?.getAttribute('data-entry')==='camera');
  const focus=[await active()];await p.keyboard.press('Tab');focus.push(await active());assert.equal(focus.at(-1),words.navigation.text);
  await p.keyboard.press('Shift+Tab');assert.equal(await active(),words.navigation.camera);
  await p.keyboard.press('Shift+Tab');assert.equal(await active(),words.navigation.closeMenu);
  await p.keyboard.press('Shift+Tab');assert.equal(await active(),words.navigation.saved);
  await p.keyboard.press('Tab');assert.equal(await active(),words.navigation.closeMenu);
  await p.keyboard.press('Escape');await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');
  receipt.cases.push({name:'keyboard',firstFocus:focus[0],tab:focus[1],escapeCloses:true,wraps:true,pass:true});
  await settled(p);await fullyOpen(p);const hit=await p.evaluate(()=>document.elementFromPoint(5,5)?.closest('button')?.getAttribute('aria-label'));assert.equal(hit,words.navigation.closeMenu);await click(p,5,5);await p.waitForFunction(()=>document.querySelector('#post-menu')?.getAttribute('aria-hidden')==='true');receipt.cases.push({name:'scrim',hit,closes:true,pass:true});
 }finally{await f.close();}
}
async function visuals(){
 const f=await context(),{p}=f;receipt.phase='visual';
 try{
  await toggle(p);
  await p.waitForFunction(()=>document.getAnimations().some(a=>a.transitionProperty==='transform'&&a.effect?.target?.closest?.('button[data-entry]')));
  await p.evaluate(()=>{window.__menuAnimations=document.getAnimations();for(const a of window.__menuAnimations){a.pause();a.currentTime=0;}});
  const frames=[];
  for(const ms of [0,100,200,400]){
   await p.evaluate(ms=>{for(const a of window.__menuAnimations)a.currentTime=ms;},ms);
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const geometry=await p.locator('#post-menu button[data-entry]').evaluateAll(nodes=>nodes.map(b=>{const v=b.querySelector(':scope > div')??b,span=v.querySelector('span');return{entry:b.dataset.entry,visual:v.getBoundingClientRect().toJSON(),label:span.getBoundingClientRect().toJSON(),opacity:getComputedStyle(v).opacity};}));
   await p.screenshot({path:out+'/menu-'+ms+'.png'});frames.push({ms,geometry});
  }
  receipt.visuals=frames;receipt.cases.push({name:'visual-frames',times:[0,100,200,400],pass:true});
 }finally{await f.close();}
}
try{
 if(baseRed)await baseRedCase();
 else if(!visualOnly){for(const early of [true,false])for(const entry of ['camera','text','drink','coffee','saved']){if(!labelsOnly)await entryCase(entry,early);await entryCase(entry,early,true);}if(!labelsOnly)await keyboardAndScrim();}
 if(!baseRed&&!labelsOnly)await visuals();receipt.functionalPass=true;receipt.pass=receipt.errors.length===0;if(!receipt.pass)process.exitCode=1;
}catch(e){receipt.pass=false;receipt.failure=e.message;process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/menu.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({engine,label,pass:receipt.pass,functionalPass:receipt.functionalPass,cases:receipt.cases.length,errors:receipt.errors.length,phase:receipt.phase,failure:receipt.failure}));}
