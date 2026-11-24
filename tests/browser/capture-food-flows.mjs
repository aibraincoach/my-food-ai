// Local scripted-provider acceptance; images and replies are synthetic.
import{writeEan13}from'../fixtures/barcode-image.mjs';import sharp from'sharp';import{randomUUID}from'node:crypto';import fs from'node:fs/promises';import assert from'node:assert/strict';import{createTranslator}from'next-intl';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE,model=process.env.LOCAL_MODEL_FIXTURE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||![app,model].every(x=>new URL(x).hostname==='127.0.0.1'))throw Error('Disposable loopback only');
const cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8')),{chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright'),browser=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),receipt={engine,cases:[],errors:[]},ids=[];
const runKind=kind=>!process.env.ONLY_KIND||process.env.ONLY_KIND.split(',').includes(kind);
async function unknownBarcode(){
 const first='959'+String(Math.floor(Math.random()*1e9)).padStart(9,'0'),check=(10-[...first].reduce((sum,n,i)=>sum+Number(n)*(i%2?3:1),0)%10)%10,code=first+check;
 const file=out+'/'+engine+'-'+code+'.png';return writeEan13(code,file);
}
async function open(p){
 if(new URL(p.url()).origin!==app||new URL(p.url()).pathname!=='/')await p.goto(app+'/',{waitUntil:'load'});
 await p.waitForFunction(()=>new Promise(resolve=>{const first=document.querySelector('#post-menu-toggle');requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(!!first&&first===document.querySelector('#post-menu-toggle')&&Object.keys(first).some(k=>k.startsWith('__reactFiber')))));}));await p.locator('#post-menu-toggle:visible').tap();
 await p.waitForFunction(()=>{const b=document.querySelector('#post-menu button[data-entry="camera"]');if(!b)return false;const r=b.getBoundingClientRect();return getComputedStyle(b).opacity==='1'&&getComputedStyle(b.querySelector('span')).opacity==='1'&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===b;});await p.locator('#post-menu button[data-entry="camera"]').tap();
}
async function response(p,path,method,act){
 const wait=p.waitForResponse(r=>new URL(r.url()).pathname===path&&r.request().method()===method,{timeout:30000});await act();const r=await wait,body=await r.json();assert.ok(r.ok(),path+' returned '+r.status());return {response:r,body};
}
async function saved(p,id,locale,kind){
 assert.match(id,/^[a-f0-9-]{36}$/);ids.push(id);await fs.writeFile(out+'/'+engine+'-flow-posts.json',JSON.stringify(ids));
 const deadline=Date.now()+90000;let post;
 do{const r=await p.context().request.get(app+'/api/feed?ids='+id+'&tz=UTC',{timeout:15000});assert.ok(r.ok());post=(await r.json()).posts.find(x=>x.id===id);if(post?.status==='ready')break;await p.waitForTimeout(500);}while(Date.now()<deadline);
 assert.equal(post?.status,'ready');receipt.cases.push({locale,kind,id,status:post.status,items:post.items.map(x=>({name:x.name,calories:x.calories,grams:x.portion_grams})),drink:post.drink});
 await p.waitForFunction(()=>new Promise(resolve=>{const q=indexedDB.open('mfa-uploads');q.onsuccess=()=>{const d=q.result,a=d.transaction('drafts').objectStore('drafts').count();a.onsuccess=()=>{resolve(a.result===0);d.close();};};}),null,{timeout:15000});
}
try{
 for(const locale of['en','ja'].filter(x=>!process.env.ONLY_LOCALE||x===process.env.ONLY_LOCALE)){
  const m=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8')),t=createTranslator({locale,messages:m,namespace:'capture',onError(e){throw e;}}),c=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC'});
  await c.addCookies([...cookies.map(x=>({name:x.name,value:x.value,url:app})),{name:'lang',value:locale,url:app},{name:'time-zone',value:'UTC',url:app}]);
  await c.addInitScript(()=>{localStorage.setItem('mfa-camera-mode','app');Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>{throw new DOMException('Synthetic gallery-only fixture','NotAllowedError');},enumerateDevices:async()=>[]}});});
  const p=await c.newPage();p.setDefaultTimeout(20000);p.on('pageerror',e=>receipt.errors.push(e.message));const pick=file=>p.locator('input[type=file]:not([capture])').setInputFiles(file),photo='/tmp/mfa-f62-browser/water-fixture.jpg';
  try{
   await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'voice-porridge'})});
   if(runKind('gallery')){
   receipt.phase=locale+' gallery';await open(p);await pick(photo);await p.waitForFunction(()=>new Promise(resolve=>{const q=indexedDB.open('mfa-uploads');q.onsuccess=()=>{const d=q.result,a=d.transaction('drafts').objectStore('drafts').getAll();a.onsuccess=()=>{resolve(a.result.some(v=>v.state==='uploaded'&&!v.posted));d.close();};};}));await p.getByRole('textbox',{name:t('caption'),exact:true}).fill('Scripted gallery meal');
   const gallery=await response(p,'/api/posts','PUT',()=>p.getByRole('button',{name:t('post'),exact:true}).tap());await saved(p,gallery.response.request().postDataJSON().postId,locale,'gallery');
   }
   if(runKind('barcode')){
   receipt.phase=locale+' known barcode';await open(p);await p.getByRole('tab',{name:t('modeBarcode'),exact:true}).tap();await pick(out+'/known-ean.png');await p.getByRole('region',{name:t('scanned_product'),exact:true}).getByText('Scripted corn puffs',{exact:true}).waitFor();
   const button=p.getByRole('button',{name:new RegExp('^'+t('post')+' ·')});const known=await response(p,'/api/posts/food','POST',()=>button.tap());await saved(p,known.body.post_id,locale,'barcode');
   }
   if(runKind('label')){
   receipt.phase=locale+' label';await open(p);await p.getByRole('tab',{name:t('modeBarcode'),exact:true}).tap();await pick(await unknownBarcode());await p.getByText(t('not_in_the_database'),{exact:true}).waitFor();await p.getByRole('button',{name:t('photograph_the_nutrition_label'),exact:true}).tap();
   await response(p,'/api/label/read','POST',()=>pick(photo));await p.locator('#label-name').fill('Scripted label food');const labelText=await p.getByRole('region',{name:t('nutrition_label'),exact:true}).innerText();if(locale==='ja')assert.doesNotMatch(labelText,/\b(protein|carbs|fat|per serving|servings?)\b/i);await p.screenshot({path:out+'/'+engine+'-'+locale+'-label.png'});
   const label=await response(p,'/api/posts/food','POST',()=>p.getByRole('button',{name:t('postServings',{count:1}),exact:true}).tap());await saved(p,label.body.post_id,locale,'label');
   }
   if(runKind('drink')){
   await fetch(model+'/__fixture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'water'})});
   receipt.phase=locale+' drink';await open(p);const drinkPhoto=out+'/'+engine+'-'+locale+'-drink-fixture.png';await sharp(Buffer.from('<svg width="320" height="240" xmlns="http://www.w3.org/2000/svg"><rect width="320" height="240" fill="#ccffff"/><rect x="100" y="40" width="90" height="150" fill="#2288dd"/><text x="5" y="225">'+randomUUID()+'</text></svg>')).png().toFile(drinkPhoto);await pick(drinkPhoto);await p.getByRole('button',{name:t('review_drinks'),exact:true}).tap();await p.getByRole('button',{name:t('half'),exact:true}).tap();await p.screenshot({path:out+'/'+engine+'-'+locale+'-drink.png'});
   const drink=await response(p,'/api/drinks/post','POST',()=>p.getByRole('button',{name:t('postDrinkVolume',{amount:'150'}),exact:true}).tap());await saved(p,drink.body.post_id,locale,'drink');
   }
  }catch(e){receipt.screen=await p.locator('body').innerText().catch(()=>'');await p.screenshot({path:out+'/'+engine+'-flow-failure.png',fullPage:true}).catch(()=>{});throw e;}finally{await c.close();}
 }
 receipt.pass=true;
}catch(e){receipt.pass=false;receipt.failure=String(e);process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/'+engine+(process.env.RUN_TAG?'-'+process.env.RUN_TAG:'')+'-food-flows.json',JSON.stringify(receipt,null,2));console.log(JSON.stringify({engine,pass:receipt.pass,phase:receipt.phase,cases:receipt.cases.length,failure:receipt.failure}));}
