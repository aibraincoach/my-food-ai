// Disposable capture translation acceptance. No owner account or real model.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out||!['chromium','webkit'].includes(engine))throw Error('Disposable loopback configuration required');
const root=new URL('../../',import.meta.url),cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8')),fixture=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8'));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright');
const browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}:{}),receipt={engine,app,cases:[],errors:[],limits:['Emulated iPhone; no real-device or Safari proof','WebKit camera is a canvas/video stand-in']};
async function context(locale,{unavailable=false}={}){
 const c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC',...(engine==='chromium'&&!unavailable?{permissions:['camera']}: {})});
 await c.addCookies([...cookies.map(v=>({name:v.name,value:v.value,url:app})),{name:'lang',value:locale,url:app},{name:'mfa-time-zone',value:'UTC',url:app}]);
 await c.addInitScript(({fake,unavailable})=>{
  localStorage.setItem('mfa-camera-mode','app');
  if(unavailable){Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{throw new DOMException('Synthetic denied','NotAllowedError');},enumerateDevices:async()=>[]}});}
  else if(fake){Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>new MediaStream(),enumerateDevices:async()=>[]}});for(const[k,v]of Object.entries({videoWidth:320,videoHeight:240,readyState:4}))Object.defineProperty(HTMLVideoElement.prototype,k,{get:()=>v});HTMLVideoElement.prototype.play=()=>Promise.resolve();const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(image instanceof HTMLVideoElement){this.fillStyle='#88bb55';this.fillRect(0,0,this.canvas.width,this.canvas.height);}else draw.call(this,image,...args);};}
 },{fake:engine==='webkit',unavailable});
 const p=await c.newPage();p.setDefaultTimeout(15000);p.on('pageerror',e=>receipt.errors.push(e.message));return {c,p};
}
async function open(p,m,entry='camera'){
 await p.locator('#post-menu-toggle:visible').tap();
 await p.waitForFunction(()=>{const b=document.querySelector('#post-menu button[data-entry="camera"]');if(!b)return false;const r=b.getBoundingClientRect();return getComputedStyle(b).opacity==='1'&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b;});
 await p.locator('#post-menu button[data-entry="'+entry+'"]').tap();
 await p.getByRole('button',{name:m.capture.back_to_feed,exact:true}).waitFor();
}
async function snapshot(p,name,locale){
 const dialog=p.locator('[role="dialog"][aria-labelledby="capture-title"]');
 await dialog.evaluate(async e=>{await Promise.all(e.getAnimations({subtree:true}).filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
 const value=await dialog.evaluate(e=>({text:e.innerText,labels:[...e.querySelectorAll('[aria-label]')].map(n=>n.getAttribute('aria-label')),overflow:e.scrollWidth>e.clientWidth,wide:[...e.querySelectorAll('button,input,textarea')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.left<0||r.right>391;}).map(n=>({tag:n.tagName,label:n.getAttribute('aria-label'),text:n.textContent}))}));
 await p.screenshot({path:out+'/'+engine+'-'+locale+'-'+name+'.png'});
 receipt.cases.push({locale,name,...value});if(value.overflow)receipt.cases.push({locale,name:name+'-overflow-finding',finding:true});
 return value;
}
async function db(p,action){return p.evaluate(action);}
try{
 for(const locale of(process.env.BASE_EN_ONLY?['en']:['en','ja'])){
  const m=JSON.parse(await fs.readFile(new URL('messages/'+locale+'.json',root),'utf8')),{c,p}=await context(locale);
  try{
   await p.goto(app+'/',{waitUntil:'load'});await open(p,m);await p.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
   await snapshot(p,'camera',locale);
   await p.getByRole('tab',{name:m.capture.modeBarcode,exact:true}).tap();await snapshot(p,'barcode',locale);
   await p.getByRole('tab',{name:m.capture.modePhoto,exact:true}).tap();await p.waitForFunction(()=>document.querySelector('video')?.videoWidth>0);
   await p.getByRole('button',{name:m.capture.take_a_photo,exact:true}).tap();await p.getByRole('button',{name:m.capture.remove_photo_v0.replace('{v0}','1'),exact:true}).waitFor();
   await p.getByText(m.capture.uploaded,{exact:true}).waitFor();
   await snapshot(p,'composer',locale);
   await p.getByRole('button',{name:m.capture.remove_photo_v0.replace('{v0}','1'),exact:true}).tap();
   receipt.cases.push({locale,name:'draft-cleanup',count:await db(p,()=>new Promise(resolve=>{const r=indexedDB.open('mfa-uploads');r.onsuccess=()=>{const d=r.result,q=d.transaction('drafts').objectStore('drafts').count();q.onsuccess=()=>{resolve(q.result);d.close();};};}))});
   await p.getByRole('button',{name:m.capture.back_to_feed,exact:true}).tap();await open(p,m,'text');
await snapshot(p,'text',locale);
   await p.getByRole('textbox',{name:m.capture.caption,exact:true}).fill('Synthetic caption');
   await snapshot(p,'typed-caption',locale);
  }finally{await c.close();}
  const denied=await context(locale,{unavailable:true});
  try{await denied.p.goto(app+'/',{waitUntil:'load'});await open(denied.p,m);await denied.p.getByRole('button',{name:m.capture.allow_camera,exact:true}).waitFor();await snapshot(denied.p,'camera-unavailable',locale);}finally{await denied.c.close();}
 }
 receipt.pass=true;
}catch(error){receipt.pass=false;receipt.failure=String(error);process.exitCode=1;}
finally{await browser.close();await fs.writeFile(out+'/'+engine+(process.env.BASE_EN_ONLY?'-base':'')+'-capture.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({engine,pass:receipt.pass,cases:receipt.cases.length,failure:receipt.failure}));}
