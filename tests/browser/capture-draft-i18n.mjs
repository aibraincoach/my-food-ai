import fs from'node:fs/promises';import assert from'node:assert/strict';
const app=process.env.APP_URL,out=process.env.CAPTURE_CHECK_OUT,engine=process.env.ONLY_ENGINE;
if(process.env.MFA_TEST_DISPOSABLE!=='1'||new URL(app).hostname!=='127.0.0.1'||!out)throw Error('Loopback disposable only');
const f=JSON.parse(await fs.readFile(out+'/fixture-ledger.json','utf8')),cookies=JSON.parse(await fs.readFile(out+'/session.json','utf8'));
const {chromium,webkit,devices}=await import(process.env.MFA_PLAYWRIGHT_MODULE??'playwright'),b=await(engine==='webkit'?webkit:chromium).launch(engine==='chromium'?{executablePath:process.env.TEST_CHROMIUM_EXECUTABLE,args:['--no-sandbox']}:{}),r={engine,cases:[]};
const c=await b.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},timezoneId:'UTC'});await c.addCookies(cookies.map(x=>({name:x.name,value:x.value,url:app})));const p=await c.newPage();p.setDefaultTimeout(15000);
try{
 await p.goto(app+'/not-a-real-route',{waitUntil:'load'});
 await p.evaluate(async owner=>{await new Promise((resolve,reject)=>{const q=indexedDB.open('mfa-uploads',2);q.onupgradeneeded=()=>{q.result.createObjectStore('drafts',{keyPath:'operationId'});q.result.createObjectStore('intents',{keyPath:'operationId'});};q.onerror=()=>reject(q.error);q.onsuccess=()=>{const d=q.result,t=d.transaction('drafts','readwrite');t.objectStore('drafts').put({operationId:crypto.randomUUID(),ownerId:owner,createdAt:Date.now(),reservedAt:Date.now(),caption:'Synthetic persisted photo',eatenAt:null,location:null,options:{},files:[{name:'synthetic.png',type:'image/png',lastModified:Date.now(),bytes:Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='),c=>c.charCodeAt(0)).buffer}],snapshot:null,posted:true,state:'failed',message:'Legacy English sentence must disappear.',sent:0,total:68});t.oncomplete=()=>{d.close();resolve();};t.onerror=()=>reject(t.error);};});},f.user);
 for(const locale of['en','ja','en']){
  const m=JSON.parse(await fs.readFile(new URL('../../messages/'+locale+'.json',import.meta.url),'utf8'));
  await c.addCookies([{name:'lang',value:locale,url:app}]);await p.goto(app+'/',{waitUntil:'load'});
  await p.getByText(m.capture['saved-before-update'],{exact:true}).first().waitFor();
  await p.getByRole('button',{name:m.capture.try_again,exact:true}).first().waitFor();
  const record=await p.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('mfa-uploads');q.onsuccess=()=>{const d=q.result,t=d.transaction('drafts'),a=t.objectStore('drafts').getAll();a.onsuccess=()=>{resolve({version:d.version,rows:a.result.map(v=>({hasMessage:Object.hasOwn(v,'message'),failure:v.failure,fileCount:v.files.length,caption:v.caption}))});d.close();};};}));
  assert.equal(record.version,3);assert.equal(record.rows.length,1);assert.equal(record.rows[0].hasMessage,false);assert.deepEqual(record.rows[0].failure,{code:'saved-before-update'});assert.equal(record.rows[0].fileCount,1);
  r.cases.push({locale,...record});await p.screenshot({path:out+'/'+engine+'-draft-'+locale+'-'+r.cases.length+'.png'});
 }
 await p.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('mfa-uploads');q.onsuccess=()=>{const d=q.result,t=d.transaction(['drafts','intents'],'readwrite');t.objectStore('drafts').clear();t.objectStore('intents').clear();t.oncomplete=()=>{d.close();resolve();};};}));
 const count=await p.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('mfa-uploads');q.onsuccess=()=>{const d=q.result,a=d.transaction('drafts').objectStore('drafts').count();a.onsuccess=()=>{resolve(a.result);d.close();};};}));assert.equal(count,0);r.cleanupDrafts=count;r.pass=true;
}catch(error){r.pass=false;r.failure=String(error);process.exitCode=1;}
finally{await c.close();await b.close();await fs.writeFile(out+'/'+engine+'-draft.json',JSON.stringify(r,null,2));console.log(JSON.stringify(r));}
