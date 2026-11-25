// Local synthetic-camera acceptance for #1320; never use an owner account.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const envFile=process.env.TEST_ENV_FILE;
if(envFile)process.loadEnvFile(envFile);
const app=process.env.APP_URL,url=process.env.NEXT_PUBLIC_SUPABASE_URL,out=process.env.HINT_CHECK_OUT;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||![app,url].every(value=>value&&new URL(value).hostname==='127.0.0.1')||!out)throw Error('Disposable loopback configuration required.');
const fixture=JSON.parse(await fs.readFile(process.env.TEST_HINT_FIXTURE,'utf8'));
if(!/^text1287-[a-z0-9]+@example.com$/.test(fixture.email))throw Error('Owned synthetic fixture required.');
const cookies=JSON.parse(await fs.readFile(process.env.TEST_SESSION_FILE,'utf8'));
const {createClient}=await import('@supabase/supabase-js');
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const owner=await admin.auth.admin.getUserById(fixture.user);
if(owner.error||owner.data.user?.email!==fixture.email)throw Error('Fixture ownership failed.');
const ownedPost=await admin.from('posts').select('user_id').eq('id',fixture.post).single();if(ownedPost.error||ownedPost.data.user_id!==fixture.user)throw Error('Fixture post ownership failed.');
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const engine=process.env.ONLY_ENGINE;if(!['chromium','webkit'].includes(engine))throw Error('Choose one engine.');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{});
const result={engine,syntheticCamera:engine==='webkit'?'video dimensions and canvas stub; not WebKit camera acquisition':'Chromium fake camera',cases:[],errors:[]};
async function reset(seen){const {error}=await admin.from('profiles').update({hints_seen:seen}).eq('id',fixture.user);if(error)throw error;}
async function seen(){const {data,error}=await admin.from('profiles').select('hints_seen').eq('id',fixture.user).single();if(error)throw error;return data.hints_seen;}
async function open(){
 const c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',...(engine==='chromium'?{permissions:['camera']}:{} )});
 await c.addCookies(cookies.map(v=>({name:v.name,value:v.value,url:app})));
 if(engine==='webkit')await c.addInitScript(()=>{localStorage.setItem('mfa-camera-mode','app');Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{const stream=new MediaStream();(window.__captureMediaCalls??=[]).push({at:Date.now(),tracks:stream.getTracks().length});return stream;},enumerateDevices:async()=>[]}});for(const[k,v]of Object.entries({videoWidth:320,videoHeight:240,readyState:4}))Object.defineProperty(HTMLVideoElement.prototype,k,{get:()=>v});HTMLVideoElement.prototype.play=()=>Promise.resolve();const original=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLVideoElement){this.fillStyle='#88bb55';this.fillRect(0,0,this.canvas.width,this.canvas.height);}else original.call(this,image,...args);};});
 const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>result.errors.push(e.message));const consoleMessages=[];p.on('console',message=>consoleMessages.push({type:message.type(),text:message.text()}));return {c,p,consoleMessages};
}
async function captureFailure(p,consoleMessages){
 const page=await p.evaluate(()=>({url:location.href,html:document.body.innerHTML.slice(0,200000),htmlTruncated:document.body.innerHTML.length>200000,body:document.body.innerText,dialogs:[...document.querySelectorAll('dialog,[role=dialog]')].map(node=>({label:node.getAttribute('aria-label'),text:node.innerText})),videos:document.querySelectorAll('video').length,cameraMode:localStorage.getItem('mfa-camera-mode'),mediaCalls:window.__captureMediaCalls??[],tapEvents:window.__tapRects??[]})).catch(error=>({captureError:String(error)}));
 result.failureCapture={...page,phase:result.phase,hints:await seen().catch(()=>null),console:consoleMessages,pageErrors:[...result.errors]};
 await fs.writeFile(out+'/'+engine+'-failure-dom.json',JSON.stringify(result.failureCapture,null,2));await p.screenshot({path:out+'/'+engine+'-failure.png',fullPage:true}).catch(()=>{});
}
async function modesCase(){
 const exit=process.env.MODE_EXIT_CASE;if(!['photo','leave','seen'].includes(exit))throw Error('Choose a bounded modes case');
 const expected=process.env.MODE_EXPECT_SEEN==='1';await reset(['capture','thread','thumbs',...(exit==='seen'?['modes']:[])]);
 const {c,p,consoleMessages}=await open();let saveRequests=0,lastNavigation=null,closing=false;
 p.on('request',r=>{if(r.isNavigationRequest())lastNavigation={url:r.url(),at:Date.now()};if(r.method()==='POST'&&r.headers()['next-action']&&r.postData()?.includes('"modes"'))saveRequests++;});
 p.on('pageerror',e=>{(result.modeErrorDetails??=[]).push({message:e.message,at:new Date().toISOString(),url:p.url(),lastNavigation,closing});});
 const camera=async()=>{await p.getByRole('button',{name:'Post a meal',exact:true}).tap();await p.getByRole('button',{name:'Camera',exact:true}).tap();await p.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);};
 try{
  result.phase='modes '+exit;await p.goto(app,{waitUntil:'load'});await camera();
  const tip=p.locator('section[aria-label="Barcode tip"]');
  if(exit==='seen'){
   assert.equal(await tip.count(),0);await p.getByRole('button',{name:'Back to Feed',exact:true}).tap();await p.waitForFunction(()=>!document.querySelector('video'));await camera();assert.equal(await tip.count(),0);assert.equal(saveRequests,0);
   result.cases.push({name:'modes already seen',tipShown:false,saveRequests,hints:await seen(),pass:true});return;
  }
  await tip.waitFor();
  const persisted=expected?p.waitForResponse(r=>r.request().method()==='POST'&&r.request().headers()['next-action']&&r.request().postData()?.includes('"modes"')):null;persisted?.catch(()=>{});
  if(exit==='photo'){
   await p.getByRole('button',{name:'Take a photo',exact:true}).tap();await p.getByRole('button',{name:'Remove photo 1',exact:true}).waitFor();
   await p.getByRole('button',{name:'Remove photo 1',exact:true}).tap();await p.waitForFunction(async()=>await new Promise(resolve=>{const r=indexedDB.open('mfa-uploads');r.onsuccess=()=>{const db=r.result,q=db.transaction('drafts').objectStore('drafts').count();q.onsuccess=()=>{resolve(q.result===0);db.close();};};}));
  }
  await p.getByRole('button',{name:'Back to Feed',exact:true}).tap();await p.waitForFunction(()=>!document.querySelector('video'));
  // Wait for this action's response, rather than starting a second navigation
  // while the save still refreshes the current route.
  if(persisted)assert.equal((await persisted).status(),200);
  await p.waitForLoadState('load');await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  const saved=await seen();assert.equal(saved.includes('modes'),expected,'modes persistence after '+exit);
  await camera();if(expected)assert.equal(await tip.count(),0);else await tip.waitFor();
  assert.equal(saveRequests,expected?1:0,'one save when leaving the shown tip');
  result.cases.push({name:'modes '+exit,hints:saved,shownAgain:!expected,saveRequests,expectedRegression:!expected,pass:true});
 }catch(error){await captureFailure(p,consoleMessages);throw error;}finally{closing=true;await c.close();}
}
try{
 if(process.env.ONLY_CASE==='modes')await modesCase();else {
 for(const fresh of (['feed','thread'].includes(process.env.ONLY_CASE)?[]:process.env.ONLY_CASE==='seen-camera'?[false]:[true,false])){
  await reset(fresh?[]:['capture','modes','thumbs','thread']);
  const {c,p,consoleMessages}=await open();
  try{
   await p.goto(app+'/',{waitUntil:'domcontentloaded'});await p.getByRole('button',{name:'Post a meal',exact:true}).tap();
   await p.waitForFunction(()=>{const button=document.querySelector('#post-menu button[data-entry="camera"]');if(!button)return false;const rect=button.getBoundingClientRect(),target=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);const ready=getComputedStyle(button).opacity==='1'&&getComputedStyle(button.querySelector('span')).opacity==='1'&&target?.closest('button')===button;if(ready)window.__cameraMenuReady={at:performance.now(),rect:rect.toJSON(),opacity:getComputedStyle(button).opacity,hit:target?.closest('button')?.getAttribute('aria-label')};return ready;});
   result.menuReadiness=await p.evaluate(()=>window.__cameraMenuReady);await p.getByRole('button',{name:'Camera',exact:true}).tap();
   result.phase='video ready';await p.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
   result.phase='fresh hint ready';if(fresh){await p.getByText('A caption alone works too',{exact:true}).waitFor();await p.locator('section[aria-label="Barcode tip"]').waitFor();}
   await p.evaluate(()=>{window.__tapRects=[];for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{const button=document.querySelector('button[aria-label="Take a photo"]');if(button)window.__tapRects.push({type,target:e.target.closest?.('button')?.getAttribute('aria-label'),rect:button.getBoundingClientRect().toJSON()});},{capture:true});});
   result.phase='first shutter';await p.getByRole('button',{name:'Take a photo',exact:true}).tap();
   await p.getByRole('button',{name:'Remove photo 1',exact:true}).waitFor();
   result.phase='durable draft count';await p.waitForFunction(async()=>await new Promise(resolve=>{const r=indexedDB.open('mfa-uploads');r.onsuccess=()=>{const db=r.result;const q=db.transaction('drafts').objectStore('drafts').count();q.onsuccess=()=>{resolve(q.result===1);db.close();};};}));
   const events=await p.evaluate(()=>window.__tapRects),down=events.find(e=>e.type==='pointerdown'),up=events.find(e=>e.type==='pointerup');
   assert.deepEqual(up.rect,down.rect,'shutter stays in the same place through pointerup');
   assert.equal(await p.getByText('A caption alone works too',{exact:true}).count(),0);
   // The camera changes to its composer; inspect the changed capture hint's save.
   await p.waitForFunction(()=>!document.querySelector('section[aria-label="Barcode tip"]'));
   await p.screenshot({path:out+'/'+engine+'-'+(fresh?'fresh':'seen')+'.png'});
   result.phase='capture seen saved';const saved=await seen();assert.ok(saved.includes('capture'));
   result.cases.push({name:fresh?'fresh camera':'seen camera',photo:true,drafts:1,events,hints:saved});
   await p.getByRole('button',{name:'Remove photo 1',exact:true}).tap();
   await p.waitForFunction(async()=>await new Promise(resolve=>{const r=indexedDB.open('mfa-uploads');r.onsuccess=()=>{const db=r.result,q=db.transaction('drafts').objectStore('drafts').count();q.onsuccess=()=>{resolve(q.result===0);db.close();};};}));
  }catch(error){await captureFailure(p,consoleMessages);throw error;}finally{await c.close();}
 }
 if(!['camera','seen-camera'].includes(process.env.ONLY_CASE)){
 await reset(process.env.ONLY_CASE==='thread'?['capture','modes','thumbs']:['capture','modes']);
 const cleared=await admin.from('post_feedback').delete().eq('post_id',fixture.post);if(cleared.error)throw cleared.error;
 const {c,p,consoleMessages}=await open();
 try{
  await p.goto(app+'/',{waitUntil:'domcontentloaded'});const card=p.locator('article[data-post-id="'+fixture.post+'"]');
  if(process.env.ONLY_CASE!=='thread'){
  await card.getByText('Was this estimate right?',{exact:true}).waitFor();
  const accept=card.getByRole('button',{name:'Accept analysis',exact:true});assert.equal(await accept.isEnabled(),true);
  const response=p.waitForResponse(r=>new URL(r.url()).pathname==='/api/posts/'+fixture.post+'/feedback'&&r.request().method()==='POST');
  await accept.tap();assert.equal((await response).status(),204);await p.waitForFunction(()=>document.querySelector('button[aria-label="Accept analysis"]')?.getAttribute('aria-pressed')==='true');
  assert.equal(await card.getByText('Was this estimate right?',{exact:true}).count(),0);
  const feedback=await admin.from('post_feedback').select('verdict').eq('post_id',fixture.post).single();assert.equal(feedback.error,null);assert.equal(feedback.data.verdict,'up');
  assert.ok((await seen()).includes('thumbs'));await p.reload({waitUntil:'load'});assert.equal(await p.getByText('Was this estimate right?',{exact:true}).count(),0);
  result.cases.push({name:'thumbs',firstTapSaved:'up',shownAgain:false});
  }
  await p.goto(app+'/posts/'+fixture.post,{waitUntil:'load'});await p.getByText('Reply here to fix the estimate',{exact:true}).waitFor();
  const field=p.locator('#comment-field:visible');
  const savedThread=p.waitForResponse(response=>response.request().method()==='POST'&&Boolean(response.request().headers()['next-action'])&&response.request().postData()?.includes('"thread"'));
  savedThread.catch(()=>{});await field.tap();assert.equal(await field.evaluate(e=>document.activeElement===e),true);
  await field.fill('Local draft text');assert.equal(await field.inputValue(),'Local draft text');await field.fill('');
  assert.equal(await p.getByText('Reply here to fix the estimate',{exact:true}).count(),0);assert.equal((await savedThread).status(),200);assert.ok((await seen()).includes('thread'));
  await p.reload({waitUntil:'load'});assert.equal(await p.getByText('Reply here to fix the estimate',{exact:true}).count(),0);
  result.cases.push({name:'thread',firstTapFocused:true,shownAgain:false});
 }catch(error){await captureFailure(p,consoleMessages);throw error;}finally{await c.close();}
 }
 }
 result.pass=true;
}catch(error){result.pass=false;result.failure=String(error);process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/'+engine+'-'+(process.env.ONLY_CASE??'all')+'.json',JSON.stringify(result,null,2));console.log(result);}

process.exit(result.pass ? 0 : 1); // All assertions, browser closure and evidence writes finished.
